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
const sergbot_task_entity_1 = require("../../entities/sergbot-task.entity");
let AgentsService = AgentsService_1 = class AgentsService {
    configService;
    tasksRepo;
    logger = new common_1.Logger(AgentsService_1.name);
    openai;
    constructor(configService, tasksRepo) {
        this.configService = configService;
        this.tasksRepo = tasksRepo;
        const apiKey = this.configService.get('OPENAI_API_KEY');
        if (!apiKey) {
            this.logger.warn('OPENAI_API_KEY is not set – LLM ответы будут fallback-заглушкой.');
            return;
        }
        this.openai = new openai_1.default({
            apiKey,
        });
    }
    async generateSergbotResponse(payload) {
        if (!this.openai) {
            return {
                reply: `Я SergBot, но OpenAI токен не настроен (нет OPENAI_API_KEY). Ваш запрос: "${payload.message}"`,
                task: null,
            };
        }
        const systemPrompt = 'Ты SergBot – внутренний LLM‑агент A2A marketplace. ' +
            'Твоя цель: помочь пользователю сформулировать задачу для исполнения агентами. ' +
            'Всегда отвечай на том же языке, на котором с тобой разговаривает пользователь (если запрос на русском – отвечай по‑русски, если на английском – по‑английски и т.д.). ' +
            'Ты ведёшь диалог, уточняешь детали (цель, ограничения, критерии успеха, дедлайны, бюджет и т.п.). ' +
            'Когда задача сформулирована достаточно чётко и ее уже можно отдавать в работу, ' +
            'ты помечаешь это как готовую задачу. ' +
            'ВАЖНО: всегда отвечай СТРОГО в формате JSON БЕЗ лишнего текста: ' +
            '{"reply":"<текст ответа пользователю на естественном языке>",' +
            '"task":null} ИЛИ ' +
            '{"reply":"<текст ответа пользователю>",' +
            '"task":{"description":"<краткое итоговое описание задачи по всему диалогу>","tags":["tag1","tag2"],"deadline":null}}. ' +
            'Описание в поле task.description должно отражать всю накопленную информацию из диалога, а не только последнее сообщение. ' +
            'Если ты считаешь, что ещё рано формировать задачу, ставь "task": null. ' +
            'Если задача готова – заполняй объект task. ' +
            'Поле deadline можешь оставить null либо указать ISO‑дату, если пользователь явно задал срок.';
        const response = await this.openai.chat.completions.create({
            model: 'gpt-4.1-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: payload.message,
                },
            ],
            temperature: 0.3,
        });
        const content = response.choices[0]?.message?.content;
        if (!content) {
            this.logger.warn('Empty response from OpenAI, falling back to stub.');
            return {
                reply: 'Не удалось получить ответ от SergBot. Попробуйте переформулировать запрос.',
                task: null,
            };
        }
        try {
            const parsed = JSON.parse(content);
            if (typeof parsed.reply === 'string' &&
                (parsed.task === null ||
                    (parsed.task &&
                        typeof parsed.task.description === 'string'))) {
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
        const sergbot = await this.generateSergbotResponse(payload);
        let context;
        if (sergbot.task && payload.userId) {
            const deadlineDate = sergbot.task.deadline != null
                ? new Date(sergbot.task.deadline)
                : null;
            const task = this.tasksRepo.create({
                conversationId: payload.conversationId,
                userId: payload.userId,
                description: sergbot.task.description,
                tags: sergbot.task.tags ?? null,
                deadline: deadlineDate,
                status: 'PENDING',
            });
            const saved = await this.tasksRepo.save(task);
            context = {
                sergbotTaskId: saved.id,
                sergbotTaskStatus: saved.status,
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
    __param(1, (0, typeorm_1.InjectRepository)(sergbot_task_entity_1.SergbotTaskEntity)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository])
], AgentsService);
//# sourceMappingURL=agents.service.js.map