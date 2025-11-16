import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AgentEntity } from './entities/agent.entity';
import { WalletService } from './circle/wallet/wallet.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const logger = new Logger('ExecutorAgentSeeder');

const agentSeedSchema = z.array(
  z.object({
    id: z.string().min(1).optional(),
    name: z.string().min(1),
    description: z.string().min(1).optional(),
    capabilities: z.array(z.string()).optional(),
    model: z.string().min(1),
    systemPrompt: z.string().min(1),
    bidPrompt: z.string().min(1),
    executionPrompt: z.string().min(1),
    pricePerExecution: z.number(),
    inputGuidelines: z.string().min(1).optional(),
    refusalPolicy: z.string().min(1).optional(),
    status: z.string().min(1).optional(),
  }),
);

type AgentSeedRecord = z.infer<typeof agentSeedSchema>[number];

function parseCliConfigPath(): string | undefined {
  const args = process.argv.slice(2);
  for (const arg of args) {
    if (arg.startsWith('--config=')) {
      return arg.substring('--config='.length);
    }
    if (!arg.startsWith('--')) {
      return arg;
    }
  }
  return undefined;
}

function toAbsolutePath(filePath: string): string {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  return path.resolve(process.cwd(), filePath);
}

function buildAgentId(record: AgentSeedRecord): string {
  if (record.id?.trim()) {
    return record.id.trim();
  }
  const slug = record.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `agent_${slug || Date.now()}`;
}

async function loadSeeds(configPath: string): Promise<AgentSeedRecord[]> {
  const file = await readFile(configPath, 'utf8');
  const parsed = JSON.parse(file);
  return agentSeedSchema.parse(parsed);
}

async function run() {
  const explicitPath =
    process.env.EXECUTOR_AGENTS_CONFIG ?? parseCliConfigPath();
  const defaultPath = path.resolve(__dirname, '..', 'seeds', 'executor-agents.json');
  const configPath = explicitPath
    ? toAbsolutePath(explicitPath)
    : defaultPath;

  logger.log(`Using executor config: ${configPath}`);

  const seeds = await loadSeeds(configPath);
  if (seeds.length === 0) {
    logger.warn('Config file is empty – nothing to seed.');
    return;
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const agentsRepo = app.get<Repository<AgentEntity>>(
      getRepositoryToken(AgentEntity),
    );
    const walletService = app.get(WalletService);

    let created = 0;
    let updated = 0;

    for (const entry of seeds) {
      const id = buildAgentId(entry);
      const walletAddress = await walletService.getOrCreateAgentWallet(id);

      const payload: Partial<AgentEntity> = {
        id,
        name: entry.name,
        walletAddress,
        description: entry.description ?? null,
        capabilities:
          entry.capabilities && entry.capabilities.length > 0
            ? entry.capabilities
            : null,
        pricePerExecution: entry.pricePerExecution,
        status: entry.status ?? 'ACTIVE',
        llmConfig: {
          model: entry.model,
          systemPrompt: entry.systemPrompt,
          inputGuidelines: entry.inputGuidelines,
          refusalPolicy: entry.refusalPolicy,
          bidPrompt: entry.bidPrompt,
          executionPrompt: entry.executionPrompt,
        },
      };

      const existing = await agentsRepo.findOne({ where: { id } });

      if (existing) {
        await agentsRepo.save({
          ...existing,
          ...payload,
        });
        updated += 1;
        logger.log(`Updated executor ${id}`);
      } else {
        const createdAgent = agentsRepo.create(payload);
        await agentsRepo.save(createdAgent);
        created += 1;
        logger.log(`Created executor ${id}`);
      }
    }

    logger.log(
      `Seeding complete. Created: ${created}, Updated: ${updated}, Total processed: ${seeds.length}`,
    );
  } finally {
    await app.close();
  }
}

run()
  .then(() => {
    logger.log('Executor seeding finished.');
    process.exit(0);
  })
  .catch((err) => {
    logger.error('Executor seeding failed', err);
    process.exit(1);
  });

