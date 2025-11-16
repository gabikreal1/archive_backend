"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const agent_entity_1 = require("./entities/agent.entity");
const wallet_service_1 = require("./circle/wallet/wallet.service");
const typeorm_1 = require("@nestjs/typeorm");
const zod_1 = require("zod");
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const logger = new common_1.Logger('ExecutorAgentSeeder');
const agentSeedSchema = zod_1.z.array(zod_1.z.object({
    id: zod_1.z.string().min(1).optional(),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1).optional(),
    capabilities: zod_1.z.array(zod_1.z.string()).optional(),
    model: zod_1.z.string().min(1),
    systemPrompt: zod_1.z.string().min(1),
    bidPrompt: zod_1.z.string().min(1),
    executionPrompt: zod_1.z.string().min(1),
    pricePerExecution: zod_1.z.number(),
    inputGuidelines: zod_1.z.string().min(1).optional(),
    refusalPolicy: zod_1.z.string().min(1).optional(),
    status: zod_1.z.string().min(1).optional(),
}));
function parseCliConfigPath() {
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
function toAbsolutePath(filePath) {
    if (node_path_1.default.isAbsolute(filePath)) {
        return filePath;
    }
    return node_path_1.default.resolve(process.cwd(), filePath);
}
function buildAgentId(record) {
    if (record.id?.trim()) {
        return record.id.trim();
    }
    const slug = record.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return `agent_${slug || Date.now()}`;
}
async function loadSeeds(configPath) {
    const file = await (0, promises_1.readFile)(configPath, 'utf8');
    const parsed = JSON.parse(file);
    return agentSeedSchema.parse(parsed);
}
async function run() {
    const explicitPath = process.env.EXECUTOR_AGENTS_CONFIG ?? parseCliConfigPath();
    const defaultPath = node_path_1.default.resolve(__dirname, '..', 'seeds', 'executor-agents.json');
    const configPath = explicitPath
        ? toAbsolutePath(explicitPath)
        : defaultPath;
    logger.log(`Using executor config: ${configPath}`);
    const seeds = await loadSeeds(configPath);
    if (seeds.length === 0) {
        logger.warn('Config file is empty – nothing to seed.');
        return;
    }
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, {
        logger: ['error', 'warn'],
    });
    try {
        const agentsRepo = app.get((0, typeorm_1.getRepositoryToken)(agent_entity_1.AgentEntity));
        const walletService = app.get(wallet_service_1.WalletService);
        let created = 0;
        let updated = 0;
        for (const entry of seeds) {
            const id = buildAgentId(entry);
            const walletAddress = await walletService.getOrCreateAgentWallet(id);
            const payload = {
                id,
                name: entry.name,
                walletAddress,
                description: entry.description ?? null,
                capabilities: entry.capabilities && entry.capabilities.length > 0
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
            }
            else {
                const createdAgent = agentsRepo.create(payload);
                await agentsRepo.save(createdAgent);
                created += 1;
                logger.log(`Created executor ${id}`);
            }
        }
        logger.log(`Seeding complete. Created: ${created}, Updated: ${updated}, Total processed: ${seeds.length}`);
    }
    finally {
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
//# sourceMappingURL=seed-executor-agents.js.map