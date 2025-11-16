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
var AgentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = __importDefault(require("openai"));
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const job_entity_1 = require("../../entities/job.entity");
let AgentsService = AgentsService_1 = class AgentsService {
    configService;
    jobsRepo;
    logger = new common_1.Logger(AgentsService_1.name);
    openai;
    conversations = new Map();
    constructor(configService, jobsRepo) {
        this.configService = configService;
        this.jobsRepo = jobsRepo;
        const apiKey = this.configService.get('OPENAI_API_KEY');
        if (!apiKey) {
            this.logger.warn('OPENAI_API_KEY is not set – LLM ответы будут fallback-заглушкой.');
            return;
        }
        this.openai = new openai_1.default({
            apiKey,
        });
    }
    getConversationMessages(conversationId) {
        if (!this.conversations.has(conversationId)) {
            this.conversations.set(conversationId, []);
        }
        return this.conversations.get(conversationId);
    }
    pushConversationMessage(conversationId, message) {
        const messages = this.getConversationMessages(conversationId);
        messages.push(message);
        if (messages.length > 20) {
            messages.splice(0, messages.length - 20);
        }
    }
    async generateSergbotResponse(payload) {
        if (!this.openai) {
            return {
                reply: `I am SergBot, but OPENAI_API_KEY is not configured. Your request was: "${payload.message}"`,
                task: null,
            };
        }
        const systemPrompt = 'You are SergBot – an internal LLM agent of the A2A marketplace. ' +
            'Your goal is to help the user formulate a task that can be executed by downstream agents. ' +
            'Always respond in the SAME language as the user\'s latest message (if the user writes in Russian – answer in Russian, if in English – answer in English, etc.). ' +
            'You conduct a dialog, clarify details (goal, constraints, success criteria, deadlines, budget, etc.). ' +
            'When the task is clearly defined and can be handed off to execution, you MUST mark it as a ready task. ' +
            'If the user explicitly confirms that the formulation is correct or asks you to proceed / start / submit the task (e.g. "yes", "correct", "go ahead", "please plan it", "sounds good"), you MUST treat the task as ready and output a non-null task object exactly once for this conversation. ' +
            'IMPORTANT: always respond STRICTLY in JSON with NO extra text: ' +
            '{"reply":"<natural language reply for the user>",' +
            '"task":null} OR ' +
            '{"reply":"<natural language reply for the user>",' +
            '"task":{"description":"<concise final task description based on the ENTIRE conversation>","tags":["tag1","tag2"],"deadline":null}}. ' +
            'The field task.description MUST reflect the whole accumulated context of the conversation, not just the last user message. ' +
            'If you think it is too early to form a task, set "task": null. ' +
            'If the task is ready – fill in the task object and in your reply clearly tell the user that the task is fixed and will now be processed by the system, so they should wait for executor agents to respond. ' +
            'You MAY suggest tags based on the conversation. ' +
            'The field deadline may be null or an ISO date if the user explicitly provided a deadline.';
        const history = this.getConversationMessages(payload.conversationId);
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.map((m) => ({
                role: m.role,
                content: m.content,
            })),
            {
                role: 'user',
                content: payload.message,
            },
        ];
        const response = await this.openai.chat.completions.create({
            model: 'gpt-4.1',
            messages,
            temperature: 0.3,
            response_format: {
                type: 'json_schema',
                json_schema: {
                    name: 'sergbot_response',
                    strict: true,
                    schema: {
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                            reply: { type: 'string' },
                            task: {
                                anyOf: [
                                    { type: 'null' },
                                    {
                                        type: 'object',
                                        additionalProperties: false,
                                        properties: {
                                            description: { type: 'string' },
                                            tags: {
                                                type: 'array',
                                                items: { type: 'string' },
                                            },
                                            deadline: {
                                                anyOf: [{ type: 'string' }, { type: 'null' }],
                                            },
                                        },
                                        required: ['description', 'tags', 'deadline'],
                                    },
                                ],
                            },
                        },
                        required: ['reply', 'task'],
                    },
                },
            },
        });
        const content = response.choices[0]?.message?.content;
        if (!content) {
            this.logger.warn('Empty response from OpenAI, falling back to stub.');
            return {
                reply: 'SergBot could not generate a response. Please try rephrasing your request.',
                task: null,
            };
        }
        try {
            const parsed = JSON.parse(content);
            if (typeof parsed.reply === 'string' &&
                (parsed.task === null ||
                    (parsed.task && typeof parsed.task.description === 'string'))) {
                return parsed;
            }
            this.logger.warn('SergBot response JSON shape is invalid, using fallback.');
        }
        catch (e) {
            this.logger.warn('Failed to parse SergBot JSON response', e);
        }
        return {
            reply: content,
            task: null,
        };
    }
    async handleUserMessage(payload) {
        this.logger.debug(`User message in conversation ${payload.conversationId} from ${payload.userId ?? 'anonymous'}: ${payload.message}`);
        if (payload.userId) {
            const existingJob = await this.jobsRepo.findOne({
                where: {
                    conversationId: payload.conversationId,
                    createdByUserId: payload.userId,
                    status: job_entity_1.JobStatus.OPEN,
                },
            });
            if (existingJob) {
                return {
                    conversationId: payload.conversationId,
                    messageId: `agent-msg-${Date.now()}`,
                    role: 'assistant',
                    message: 'Your task has already been submitted to the system. Please wait while executor agents review it and place their bids.',
                    context: {
                        taskStatus: existingJob.status,
                    },
                };
            }
        }
        this.pushConversationMessage(payload.conversationId, {
            role: 'user',
            content: payload.message,
        });
        const sergbot = await this.generateSergbotResponse(payload);
        this.pushConversationMessage(payload.conversationId, {
            role: 'assistant',
            content: sergbot.reply,
        });
        let context;
        if (sergbot.task && payload.userId) {
            const deadlineDate = sergbot.task.deadline != null
                ? new Date(sergbot.task.deadline)
                : null;
            const jobId = `job_${Date.now()}`;
            const job = this.jobsRepo.create({
                id: jobId,
                posterWallet: '0xSYSTEM_SERGBOT',
                createdByUserId: payload.userId,
                conversationId: payload.conversationId,
                description: sergbot.task.description,
                metadataUri: null,
                tags: sergbot.task.tags ?? null,
                deadline: deadlineDate,
                status: job_entity_1.JobStatus.OPEN,
            });
            const saved = await this.jobsRepo.save(job);
            context = {
                taskStatus: saved.status,
            };
        }
        return {
            conversationId: payload.conversationId,
            messageId: `agent-msg-${Date.now()}`,
            role: 'assistant',
            message: sergbot.reply,
            context,
        };
    }
};
exports.AgentsService = AgentsService;
exports.AgentsService = AgentsService = AgentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(job_entity_1.JobEntity)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository])
], AgentsService);
//# sourceMappingURL=agents.service.js.map