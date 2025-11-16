import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import { AgentEntity } from '../../entities/agent.entity';
import { JobEntity } from '../../entities/job.entity';
import { ExecutorService } from './executor.service';
import { Web3Service } from '../../blockchain/web3.service';
import { IpfsMetadataService } from '../../blockchain/ipfs/metadata.service';

export type AuctionBidTier = 'PREMIUM' | 'ECONOMY';

export interface AutopilotBidCandidate {
  id: string;
  jobId: string;
  agentId: string;
  agentName: string;
  summary: string;
  reasoning: string;
  priceUsd: number;
  etaMinutes: number;
  confidence: number;
  tierHint?: AuctionBidTier;
  metadata?: Record<string, unknown>;
}

export interface JobExecutionOutput {
  agentId: string;
  jobId: string;
  deliverable: string;
  keyFindings: string[];
  methodology: string;
  cautions: string[];
  estimatedHours: number;
  raw?: Record<string, unknown>;
}

interface AutopilotCallbacks {
  onBid?: (candidate: AutopilotBidCandidate) => void;
  onError?: (agentId: string, error: Error) => void;
}

interface BidDecision {
  shouldBid: boolean;
  summary?: string;
  reasoning?: string;
  proposedPriceUsd?: number;
  etaMinutes?: number;
  confidence?: number;
  tierHint?: AuctionBidTier;
  metadata?: Record<string, unknown>;
}

interface ExecutionDecision {
  deliverable: string;
  keyFindings: string[];
  methodology: string;
  cautions: string[];
  estimatedHours: number;
  raw?: Record<string, unknown>;
}

@Injectable()
export class ExecutorAutopilotService {
  private readonly logger = new Logger(ExecutorAutopilotService.name);
  private readonly openai?: OpenAI;
  private readonly bidLogPath?: string;
  private bidLogDirReady = false;
  private operatorAgentChecked = false;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(AgentEntity)
    private readonly agentsRepo: Repository<AgentEntity>,
    private readonly executorService: ExecutorService,
    private readonly web3Service: Web3Service,
    private readonly metadataService: IpfsMetadataService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey?.trim()) {
      this.openai = new OpenAI({ apiKey: apiKey.trim() });
    } else {
      this.logger.warn(
        'OPENAI_API_KEY is not configured – executor autopilot will use heuristic fallbacks.',
      );
    }

    const configuredPath =
      this.configService.get<string>('EXECUTOR_BID_LOG_PATH');
    if (configuredPath?.trim()) {
      this.bidLogPath = configuredPath.trim();
    } else {
      const logsDir = path.join(process.cwd(), 'logs');
      this.bidLogPath = path.join(logsDir, 'executor-bid-prompts.log');
    }
  }

  async generateBids(
    job: JobEntity,
    callbacks: AutopilotCallbacks = {},
  ): Promise<void> {
    const agents = await this.agentsRepo.find({
      where: { status: 'ACTIVE' },
    });

    if (agents.length === 0) {
      this.logger.warn('No active executor agents registered.');
      return;
    }

    const throttleMs =
      Number(this.configService.get<string>('EXECUTOR_BID_THROTTLE_MS')) ||
      150;

    for (const agent of agents) {
      try {
        const candidate = await this.evaluateAgentForJob(agent, job);
        if (candidate) {
          callbacks.onBid?.(candidate);
        }
      } catch (error) {
        callbacks.onError?.(agent.id, error as Error);
        this.logger.warn(
          `Executor ${agent.id} failed to evaluate job ${job.id}: ${
            (error as Error).message
          }`,
        );
      }

      if (throttleMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, throttleMs));
      }
    }
  }

  async executeJob(
    job: JobEntity,
    bid: AutopilotBidCandidate,
  ): Promise<JobExecutionOutput> {
    const agent = await this.agentsRepo.findOne({
      where: { id: bid.agentId },
    });
    if (!agent) {
      throw new Error(`Executor agent ${bid.agentId} not found`);
    }

    const execution = await this.runExecutionPrompt(agent, job, bid);
    return {
      agentId: bid.agentId,
      jobId: job.id,
      deliverable: execution.deliverable,
      keyFindings: execution.keyFindings,
      methodology: execution.methodology,
      cautions: execution.cautions,
      estimatedHours: execution.estimatedHours,
      raw: execution.raw,
    };
  }

  private async evaluateAgentForJob(
    agent: AgentEntity,
    job: JobEntity,
  ): Promise<AutopilotBidCandidate | null> {
    if (!agent.llmConfig?.bidPrompt?.trim()) {
      return null;
    }

    const decision =
      (await this.runBidPrompt(agent, job)) ??
      this.buildFallbackBidDecision(agent, job);

    await this.logBidPromptEvent(agent, job, decision);

    if (!decision.shouldBid) {
      return null;
    }

    // Base price decision from LLM / agent config
    let price =
      decision.proposedPriceUsd ??
      agent.pricePerExecution ??
      this.estimatePriceFromJob(job);

    // Hard‑cap executor price per job in USDC (dev safety guard)
    const maxPrice = 0.5; // 0.5 USDC
    if (price > maxPrice) {
      price = maxPrice;
    }

    const deliveryTimeSeconds = this.estimateDeliveryTimeSeconds(
      decision.etaMinutes,
    );

    // --- Ensure operator wallet is registered in AgentRegistry before bidding ---
    await this.ensureOperatorAgentActive();

    // --- On-chain bid placement via OrderBookService through ExecutorService ---
    let onchainBidId: string | undefined;
    try {
      const metadata = this.buildBidMetadata(agent, job, price, deliveryTimeSeconds);
      const result = await this.executorService.placeBidWithMetadata(agent.id, {
        jobId: job.id,
        price: price.toString(),
        deliveryTimeSeconds: deliveryTimeSeconds.toString(),
        metadata,
      });
      onchainBidId = result.bidId;
      this.logger.debug(
        `Onchain bid placed for job ${job.id} by agent ${agent.id}: bidId=${onchainBidId}`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to place onchain bid for job ${job.id} by agent ${agent.id}: ${
          (error as Error).message
        }`,
      );
    }

    const candidate: AutopilotBidCandidate = {
      id: onchainBidId ?? this.buildBidId(job.id, agent.id),
      jobId: job.id,
      agentId: agent.id,
      agentName: agent.name,
      summary:
        decision.summary ??
        `Execute ${job.id} with persona ${agent.name} and deliver concise insights.`,
      reasoning:
        decision.reasoning ??
        'Matched capabilities and deadline window – confident in delivering within SLA.',
      priceUsd: Math.max(5, roundNumber(price, 2)),
      etaMinutes: Math.max(30, decision.etaMinutes ?? 90),
      confidence: clamp(decision.confidence ?? 0.55, 0, 1),
      tierHint: decision.tierHint,
      metadata: {
        ...decision.metadata,
        capabilityScore: this.computeCapabilityScore(agent, job),
        ...(onchainBidId && { onchainBidId }),
      },
    };

    const debugOnchainId =
      ((candidate.metadata ?? {}) as Record<string, unknown>)
        .onchainBidId ?? null;
    this.logger.debug(
      `[Autopilot] Built candidate for job ${job.id}: ` +
        `agentId=${agent.id}, candidateId=${candidate.id}, onchainBidId=${debugOnchainId}`,
    );

    // Ensure the agent wallet exists ahead of time so that a future onchain bid
    // or delivery submission can be executed without additional latency.
    await this.executorService.ensureAgentWallet(agent.id);

    return candidate;
  }

  private async runBidPrompt(
    agent: AgentEntity,
    job: JobEntity,
  ): Promise<BidDecision | null> {
    if (!this.openai || !agent.llmConfig?.bidPrompt) {
      return null;
    }

    try {
      const systemPrompt = [
        agent.llmConfig.systemPrompt ?? '',
        'You are evaluating whether to bid on a user job.',
        'Respond strictly in JSON following the required schema.',
      ]
        .filter(Boolean)
        .join('\n\n');

      const bidPrompt = agent.llmConfig.bidPrompt;
      const conversation = [
        {
          role: 'system' as const,
          content: systemPrompt,
        },
        {
          role: 'user' as const,
          content: [
            bidPrompt,
            '',
            'Job description:',
            job.description,
            '',
            `Tags: ${(job.tags ?? []).join(', ')}`,
          ].join('\n'),
        },
      ];

      const response = await this.openai.chat.completions.create({
        model: agent.llmConfig.model ?? 'gpt-4.1-mini',
        temperature: 0.2,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'executor_bid_decision',
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                shouldBid: { type: 'boolean' },
                summary: { type: 'string' },
                reasoning: { type: 'string' },
                proposedPriceUsd: { type: 'number' },
                etaMinutes: { type: 'number' },
                confidence: { type: 'number' },
                tierHint: {
                  anyOf: [
                    { type: 'string', enum: ['PREMIUM', 'ECONOMY'] },
                    { type: 'null' },
                  ],
                },
              },
              required: ['shouldBid', 'summary', 'reasoning'],
            },
          },
        },
        messages: conversation,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return null;
      }
      const parsed = JSON.parse(content) as BidDecision;
      return parsed;
    } catch (error) {
      this.logger.warn(
        `Bid prompt failed for agent ${agent.id}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  private buildFallbackBidDecision(
    agent: AgentEntity,
    job: JobEntity,
  ): BidDecision {
    const capabilityScore = this.computeCapabilityScore(agent, job);
    const shouldBid = capabilityScore >= 0.15;
    return {
      shouldBid,
      summary: `Автономный агент ${agent.name} готов выполнить задачу.`,
      reasoning: shouldBid
        ? 'Capabilities overlap with job tags and estimated workload fits SLA.'
        : 'Insufficient capability match for this job.',
      proposedPriceUsd:
        agent.pricePerExecution ?? this.estimatePriceFromJob(job),
      etaMinutes: Math.round(60 + (1 - capabilityScore) * 120),
      confidence: clamp(capabilityScore + 0.25, 0, 1),
      tierHint: capabilityScore > 0.45 ? 'PREMIUM' : 'ECONOMY',
    };
  }

  private async runExecutionPrompt(
    agent: AgentEntity,
    job: JobEntity,
    bid: AutopilotBidCandidate,
  ): Promise<ExecutionDecision> {
    if (!this.openai || !agent.llmConfig?.executionPrompt) {
      return this.buildFallbackExecution(agent, job, bid);
    }

    try {
      const system = [
        agent.llmConfig.systemPrompt ?? '',
        agent.llmConfig.executionPrompt ?? '',
        'Return strict JSON deliverable per schema.',
      ]
        .filter(Boolean)
        .join('\n\n');

      const response = await this.openai.chat.completions.create({
        model: agent.llmConfig.model ?? 'gpt-4.1-mini',
        temperature: 0.3,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'executor_delivery',
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                deliverable: { type: 'string' },
                keyFindings: {
                  type: 'array',
                  items: { type: 'string' },
                },
                methodology: { type: 'string' },
                cautions: {
                  type: 'array',
                  items: { type: 'string' },
                },
                estimatedHours: { type: 'number' },
              },
              required: [
                'deliverable',
                'keyFindings',
                'methodology',
                'cautions',
                'estimatedHours',
              ],
            },
          },
        },
        messages: [
          { role: 'system', content: system },
          {
            role: 'user',
            content: [
              `Job ID: ${job.id}`,
              `Description: ${job.description}`,
              `Winning bid summary: ${bid.summary}`,
              `Price (USD): ${bid.priceUsd}`,
            ].join('\n'),
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return this.buildFallbackExecution(agent, job, bid);
      }
      const parsed = JSON.parse(content) as ExecutionDecision;
      parsed.raw = { llmResponse: content };
      return parsed;
    } catch (error) {
      this.logger.warn(
        `Execution prompt failed for agent ${agent.id}: ${
          (error as Error).message
        }`,
      );
      return this.buildFallbackExecution(agent, job, bid);
    }
  }

  private buildFallbackExecution(
    agent: AgentEntity,
    job: JobEntity,
    bid: AutopilotBidCandidate,
  ): ExecutionDecision {
    return {
      deliverable: `## Итог от ${agent.name}\n\n${job.description}\n\n- Цена: $${bid.priceUsd.toFixed(
        2,
      )}\n- ETA: ${bid.etaMinutes}m\n`,
      keyFindings: [
        'Создана fallback‑заготовка потому что LLM недоступен.',
        'Полный результат будет доступен после подключения OpenAI.',
      ],
      methodology:
        'Сгенерировано эвристикой backend-а. Настройте OPENAI_API_KEY для реального вывода.',
      cautions: ['Результат демо-мок, не использовать в продакшене.'],
      estimatedHours: Math.max(1, Math.round(bid.etaMinutes / 60)),
      raw: {
        fallback: true,
      },
    };
  }

  private computeCapabilityScore(agent: AgentEntity, job: JobEntity): number {
    const tags = (job.tags ?? []).map((tag) => tag.toLowerCase());
    const capabilities = (agent.capabilities ?? []).map((cap) =>
      cap.toLowerCase(),
    );
    if (tags.length === 0 || capabilities.length === 0) {
      return 0.2;
    }
    const matches = tags.filter((tag) => capabilities.includes(tag)).length;
    return matches / tags.length;
  }

  private estimatePriceFromJob(job: JobEntity): number {
    const base = Math.max(10, job.description.length / 200);
    return roundNumber(base * 5, 2);
  }

  private buildBidId(jobId: string, agentId: string): string {
    return `bid_${jobId}_${agentId}_${Date.now()}`;
  }

  private estimateDeliveryTimeSeconds(
    etaMinutes?: number,
  ): number {
    const minutes = etaMinutes && etaMinutes > 0 ? etaMinutes : 60;
    return minutes * 60;
  }

  private buildBidMetadata(
    agent: AgentEntity,
    job: JobEntity,
    priceUsd: number,
    deliveryTimeSeconds: number,
  ): import('../../blockchain/ipfs/metadata.types').BidMetadataInput {
    const now = new Date().toISOString();
    const capabilities = agent.capabilities ?? [];

    const estimatedHumanReadable = `${Math.round(
      deliveryTimeSeconds / 3600,
    )}h`;

    return {
      jobId: job.id,
      bidder: {
        name: agent.name,
        walletAddress: '0x0', // будет перезаписан ExecutorService.ensureAgentWallet
        specialization: capabilities,
      },
      price: {
        total: priceUsd,
      },
      deliveryTime: {
        estimatedSeconds: deliveryTimeSeconds,
        estimatedHumanReadable,
      },
      methodology:
        (agent.llmConfig?.executionPrompt ??
          agent.llmConfig?.systemPrompt ??
          'LLM executor job delivery.') + '\n\n[Autogenerated metadata]',
      createdAt: now,
      pinName: `auto-bid-${job.id}-${agent.id}-${Date.now()}`,
    };
  }

  /**
   * Ensures the dev/operator wallet (Web3Service.signer) is registered
   * and active in the on-chain AgentRegistry, so that OrderBook
   * accepts bids from this address.
   *
   * In dev this represents a shared "router" agent for all executors.
   */
  private async ensureOperatorAgentActive(): Promise<void> {
    if (this.operatorAgentChecked || this.web3Service.isStubProvider) {
      return;
    }
    this.operatorAgentChecked = true;

    try {
      const registry = this.web3Service.agentRegistry;
      const operatorWallet = this.web3Service.signer.address;

      const isActive: boolean = await registry.read.isAgentActive(
        operatorWallet,
      );
      if (isActive) {
        this.logger.debug(
          `Operator wallet ${operatorWallet} is already active in AgentRegistry`,
        );
        return;
      }

      const profile = await this.metadataService.publishAgentProfile({
        name: 'Dev Autopilot Executor',
        description:
          'Shared dev executor agent used by the marketplace backend to place bids on behalf of LLM executors.',
        capabilities: ['autopilot', 'dev'],
        pinName: 'dev-autopilot-executor',
      });

      const tx = await registry.write.registerAgent(
        'Dev Autopilot Executor',
        profile.uri,
        ['autopilot', 'dev'],
      );
      await tx.wait();

      this.logger.log(
        `Registered operator wallet ${operatorWallet} in AgentRegistry as Dev Autopilot Executor`,
      );
    } catch (error) {
      this.logger.warn(
        'Failed to ensure operator agent is active in AgentRegistry; on-chain bids may still revert.',
        error as Error,
      );
    }
  }

  private async logBidPromptEvent(
    agent: AgentEntity,
    job: JobEntity,
    decision: BidDecision,
  ): Promise<void> {
    if (!this.bidLogPath) {
      return;
    }

    const entry = {
      ts: new Date().toISOString(),
      jobId: job.id,
      agentId: agent.id,
      agentName: agent.name,
      jobTags: job.tags ?? [],
      agentCapabilities: agent.capabilities ?? [],
      usedOpenAI: !!this.openai,
      bidPromptPreview: agent.llmConfig?.bidPrompt?.slice(0, 300) ?? null,
      jobDescriptionPreview: job.description.slice(0, 300),
      decision: {
        shouldBid: decision.shouldBid,
        proposedPriceUsd: decision.proposedPriceUsd,
        etaMinutes: decision.etaMinutes,
        confidence: decision.confidence,
        tierHint: decision.tierHint,
        summaryPreview: decision.summary?.slice(0, 300),
        reasoningPreview: decision.reasoning?.slice(0, 300),
      },
    };

    try {
      const dir = path.dirname(this.bidLogPath);
      if (!this.bidLogDirReady) {
        await mkdir(dir, { recursive: true });
        this.bidLogDirReady = true;
      }
      await appendFile(this.bidLogPath, JSON.stringify(entry) + '\n', 'utf8');
    } catch (error) {
      this.logger.warn(
        `Failed to append bid prompt log for agent ${agent.id}, job ${job.id}`,
        error as Error,
      );
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function roundNumber(value: number, precision: number) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

