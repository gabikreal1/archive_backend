"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ExecutorAutopilotService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutorAutopilotService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const openai_1 = __importDefault(require("openai"));
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const agent_entity_1 = require("../../entities/agent.entity");
const executor_service_1 = require("./executor.service");
const web3_service_1 = require("../../blockchain/web3.service");
const metadata_service_1 = require("../../blockchain/ipfs/metadata.service");
let ExecutorAutopilotService = ExecutorAutopilotService_1 = class ExecutorAutopilotService {
    configService;
    agentsRepo;
    executorService;
    web3Service;
    metadataService;
    logger = new common_1.Logger(ExecutorAutopilotService_1.name);
    openai;
    bidLogPath;
    bidLogDirReady = false;
    operatorAgentChecked = false;
    constructor(configService, agentsRepo, executorService, web3Service, metadataService) {
        this.configService = configService;
        this.agentsRepo = agentsRepo;
        this.executorService = executorService;
        this.web3Service = web3Service;
        this.metadataService = metadataService;
        const apiKey = this.configService.get('OPENAI_API_KEY');
        if (apiKey?.trim()) {
            this.openai = new openai_1.default({ apiKey: apiKey.trim() });
        }
        else {
            this.logger.warn('OPENAI_API_KEY is not configured – executor autopilot will use heuristic fallbacks.');
        }
        const configuredPath = this.configService.get('EXECUTOR_BID_LOG_PATH');
        if (configuredPath?.trim()) {
            this.bidLogPath = configuredPath.trim();
        }
        else {
            const logsDir = node_path_1.default.join(process.cwd(), 'logs');
            this.bidLogPath = node_path_1.default.join(logsDir, 'executor-bid-prompts.log');
        }
    }
    async generateBids(job, callbacks = {}) {
        const agents = await this.agentsRepo.find({
            where: { status: 'ACTIVE' },
        });
        if (agents.length === 0) {
            this.logger.warn('No active executor agents registered.');
            return;
        }
        const throttleMs = Number(this.configService.get('EXECUTOR_BID_THROTTLE_MS')) ||
            150;
        for (const agent of agents) {
            try {
                const candidate = await this.evaluateAgentForJob(agent, job);
                if (candidate) {
                    callbacks.onBid?.(candidate);
                }
            }
            catch (error) {
                callbacks.onError?.(agent.id, error);
                this.logger.warn(`Executor ${agent.id} failed to evaluate job ${job.id}: ${error.message}`);
            }
            if (throttleMs > 0) {
                await new Promise((resolve) => setTimeout(resolve, throttleMs));
            }
        }
    }
    async executeJob(job, bid) {
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
    async evaluateAgentForJob(agent, job) {
        if (!agent.llmConfig?.bidPrompt?.trim()) {
            return null;
        }
        const decision = (await this.runBidPrompt(agent, job)) ??
            this.buildFallbackBidDecision(agent, job);
        await this.logBidPromptEvent(agent, job, decision);
        if (!decision.shouldBid) {
            return null;
        }
        let price = decision.proposedPriceUsd ??
            agent.pricePerExecution ??
            this.estimatePriceFromJob(job);
        const maxPrice = 0.5;
        if (price > maxPrice) {
            price = maxPrice;
        }
        const deliveryTimeSeconds = this.estimateDeliveryTimeSeconds(decision.etaMinutes);
        await this.ensureOperatorAgentActive();
        let onchainBidId;
        try {
            const metadata = this.buildBidMetadata(agent, job, price, deliveryTimeSeconds);
            const result = await this.executorService.placeBidWithMetadata(agent.id, {
                jobId: job.id,
                price: price.toString(),
                deliveryTimeSeconds: deliveryTimeSeconds.toString(),
                metadata,
            });
            onchainBidId = result.bidId;
            this.logger.debug(`Onchain bid placed for job ${job.id} by agent ${agent.id}: bidId=${onchainBidId}`);
        }
        catch (error) {
            this.logger.warn(`Failed to place onchain bid for job ${job.id} by agent ${agent.id}: ${error.message}`);
        }
        const candidate = {
            id: onchainBidId ?? this.buildBidId(job.id, agent.id),
            jobId: job.id,
            agentId: agent.id,
            agentName: agent.name,
            summary: decision.summary ??
                `Execute ${job.id} with persona ${agent.name} and deliver concise insights.`,
            reasoning: decision.reasoning ??
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
        await this.executorService.ensureAgentWallet(agent.id);
        return candidate;
    }
    async runBidPrompt(agent, job) {
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
                    role: 'system',
                    content: systemPrompt,
                },
                {
                    role: 'user',
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
            const parsed = JSON.parse(content);
            return parsed;
        }
        catch (error) {
            this.logger.warn(`Bid prompt failed for agent ${agent.id}: ${error.message}`);
            return null;
        }
    }
    buildFallbackBidDecision(agent, job) {
        const capabilityScore = this.computeCapabilityScore(agent, job);
        const shouldBid = capabilityScore >= 0.15;
        return {
            shouldBid,
            summary: `Автономный агент ${agent.name} готов выполнить задачу.`,
            reasoning: shouldBid
                ? 'Capabilities overlap with job tags and estimated workload fits SLA.'
                : 'Insufficient capability match for this job.',
            proposedPriceUsd: agent.pricePerExecution ?? this.estimatePriceFromJob(job),
            etaMinutes: Math.round(60 + (1 - capabilityScore) * 120),
            confidence: clamp(capabilityScore + 0.25, 0, 1),
            tierHint: capabilityScore > 0.45 ? 'PREMIUM' : 'ECONOMY',
        };
    }
    async runExecutionPrompt(agent, job, bid) {
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
            const parsed = JSON.parse(content);
            parsed.raw = { llmResponse: content };
            return parsed;
        }
        catch (error) {
            this.logger.warn(`Execution prompt failed for agent ${agent.id}: ${error.message}`);
            return this.buildFallbackExecution(agent, job, bid);
        }
    }
    buildFallbackExecution(agent, job, bid) {
        return {
            deliverable: `## Итог от ${agent.name}\n\n${job.description}\n\n- Цена: $${bid.priceUsd.toFixed(2)}\n- ETA: ${bid.etaMinutes}m\n`,
            keyFindings: [
                'Создана fallback‑заготовка потому что LLM недоступен.',
                'Полный результат будет доступен после подключения OpenAI.',
            ],
            methodology: 'Сгенерировано эвристикой backend-а. Настройте OPENAI_API_KEY для реального вывода.',
            cautions: ['Результат демо-мок, не использовать в продакшене.'],
            estimatedHours: Math.max(1, Math.round(bid.etaMinutes / 60)),
            raw: {
                fallback: true,
            },
        };
    }
    computeCapabilityScore(agent, job) {
        const tags = (job.tags ?? []).map((tag) => tag.toLowerCase());
        const capabilities = (agent.capabilities ?? []).map((cap) => cap.toLowerCase());
        if (tags.length === 0 || capabilities.length === 0) {
            return 0.2;
        }
        const matches = tags.filter((tag) => capabilities.includes(tag)).length;
        return matches / tags.length;
    }
    estimatePriceFromJob(job) {
        const base = Math.max(10, job.description.length / 200);
        return roundNumber(base * 5, 2);
    }
    buildBidId(jobId, agentId) {
        return `bid_${jobId}_${agentId}_${Date.now()}`;
    }
    estimateDeliveryTimeSeconds(etaMinutes) {
        const minutes = etaMinutes && etaMinutes > 0 ? etaMinutes : 60;
        return minutes * 60;
    }
    buildBidMetadata(agent, job, priceUsd, deliveryTimeSeconds) {
        const now = new Date().toISOString();
        const capabilities = agent.capabilities ?? [];
        const estimatedHumanReadable = `${Math.round(deliveryTimeSeconds / 3600)}h`;
        return {
            jobId: job.id,
            bidder: {
                name: agent.name,
                walletAddress: '0x0',
                specialization: capabilities,
            },
            price: {
                total: priceUsd,
            },
            deliveryTime: {
                estimatedSeconds: deliveryTimeSeconds,
                estimatedHumanReadable,
            },
            methodology: (agent.llmConfig?.executionPrompt ??
                agent.llmConfig?.systemPrompt ??
                'LLM executor job delivery.') + '\n\n[Autogenerated metadata]',
            createdAt: now,
            pinName: `auto-bid-${job.id}-${agent.id}-${Date.now()}`,
        };
    }
    async ensureOperatorAgentActive() {
        if (this.operatorAgentChecked || this.web3Service.isStubProvider) {
            return;
        }
        this.operatorAgentChecked = true;
        try {
            const registry = this.web3Service.agentRegistry;
            const operatorWallet = this.web3Service.signer.address;
            const isActive = await registry.read.isAgentActive(operatorWallet);
            if (isActive) {
                this.logger.debug(`Operator wallet ${operatorWallet} is already active in AgentRegistry`);
                return;
            }
            const profile = await this.metadataService.publishAgentProfile({
                name: 'Dev Autopilot Executor',
                description: 'Shared dev executor agent used by the marketplace backend to place bids on behalf of LLM executors.',
                capabilities: ['autopilot', 'dev'],
                pinName: 'dev-autopilot-executor',
            });
            const tx = await registry.write.registerAgent('Dev Autopilot Executor', profile.uri, ['autopilot', 'dev']);
            await tx.wait();
            this.logger.log(`Registered operator wallet ${operatorWallet} in AgentRegistry as Dev Autopilot Executor`);
        }
        catch (error) {
            this.logger.warn('Failed to ensure operator agent is active in AgentRegistry; on-chain bids may still revert.', error);
        }
    }
    async logBidPromptEvent(agent, job, decision) {
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
            const dir = node_path_1.default.dirname(this.bidLogPath);
            if (!this.bidLogDirReady) {
                await (0, promises_1.mkdir)(dir, { recursive: true });
                this.bidLogDirReady = true;
            }
            await (0, promises_1.appendFile)(this.bidLogPath, JSON.stringify(entry) + '\n', 'utf8');
        }
        catch (error) {
            this.logger.warn(`Failed to append bid prompt log for agent ${agent.id}, job ${job.id}`, error);
        }
    }
};
exports.ExecutorAutopilotService = ExecutorAutopilotService;
exports.ExecutorAutopilotService = ExecutorAutopilotService = ExecutorAutopilotService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(agent_entity_1.AgentEntity)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository,
        executor_service_1.ExecutorService,
        web3_service_1.Web3Service,
        metadata_service_1.IpfsMetadataService])
], ExecutorAutopilotService);
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function roundNumber(value, precision) {
    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
}
//# sourceMappingURL=executor-autopilot.service.js.map