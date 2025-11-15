import { Injectable, Logger } from '@nestjs/common';
import {
  AgentBotMessagePayload,
  AgentUserMessagePayload,
} from './agent-messages.types';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SergbotTaskEntity } from '../../entities/sergbot-task.entity';

interface SergbotTaskDraft {
  description: string;
  tags?: string[];
  deadline?: string | null;
}

interface SergbotModelResponse {
  reply: string;
  task: SergbotTaskDraft | null;
}

type SergbotChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);
  private readonly openai?: OpenAI;
  private readonly conversations = new Map<string, SergbotChatMessage[]>();

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(SergbotTaskEntity)
    private readonly tasksRepo: Repository<SergbotTaskEntity>,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY is not set – LLM ответы будут fallback-заглушкой.',
      );
      return;
    }

    this.openai = new OpenAI({
      apiKey,
    });
  }

  private getConversationMessages(conversationId: string): SergbotChatMessage[] {
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, []);
    }
    return this.conversations.get(conversationId) as SergbotChatMessage[];
  }

  private pushConversationMessage(
    conversationId: string,
    message: SergbotChatMessage,
  ) {
    const messages = this.getConversationMessages(conversationId);
    messages.push(message);

    // Простое ограничение длины истории, чтобы не раздувать контекст
    if (messages.length > 20) {
      messages.splice(0, messages.length - 20);
    }
  }

  private async generateSergbotResponse(
    payload: AgentUserMessagePayload,
  ): Promise<SergbotModelResponse> {
    if (!this.openai) {
      return {
        reply: `I am SergBot, but OPENAI_API_KEY is not configured. Your request was: "${payload.message}"`,
        task: null,
      };
    }

    const systemPrompt =
      'You are SergBot – an internal LLM agent of the A2A marketplace. ' +
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

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
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
      // Use a model that supports structured JSON responses
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
                    // With strict JSON schema, required must include all properties.
                    // tags can be an empty array, deadline can be null, but both are present.
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
      const parsed = JSON.parse(content) as SergbotModelResponse;
      if (
        typeof parsed.reply === 'string' &&
        (parsed.task === null ||
          (parsed.task && typeof parsed.task.description === 'string'))
      ) {
        return parsed;
      }
      this.logger.warn(
        'SergBot response JSON shape is invalid, using fallback.',
      );
    } catch (e) {
      this.logger.warn('Failed to parse SergBot JSON response', e as Error);
    }

    return {
      reply: content,
      task: null,
    };
  }

  /**
   * Главная точка входа для WebSocket‑диалога.
   * Получает сообщение пользователя и возвращает ответ бота.
   *
   * Внутри этого метода вы можете:
   * - вызывать LLM (OpenAI / внутренний сервис),
   * - решать, нужно ли трогать смартконтракты,
   * - дергать Escrow/OrderBook/Reputation и т.д.
   */
  async handleUserMessage(
    payload: AgentUserMessagePayload,
  ): Promise<AgentBotMessagePayload> {
    this.logger.debug(
      `User message in conversation ${payload.conversationId} from ${payload.userId ?? 'anonymous'}: ${payload.message}`,
    );

    // Если для этой conversation уже есть созданная таска – SergBot
    // переходит в режим ожидания и больше не уточняет задачу.
    if (payload.userId) {
      const existingTask = await this.tasksRepo.findOne({
        where: {
          conversationId: payload.conversationId,
          userId: payload.userId,
          status: 'PENDING',
        },
      });

      if (existingTask) {
        return {
          conversationId: payload.conversationId,
          messageId: `agent-msg-${Date.now()}`,
          role: 'assistant',
          message:
            'Your task has already been submitted to the system. Please wait while executor agents review it and place their bids.',
          context: {
            sergbotTaskId: existingTask.id,
            sergbotTaskStatus: existingTask.status,
          },
        };
      }
    }

    // 1. Добавляем пользовательское сообщение в историю диалога
    this.pushConversationMessage(payload.conversationId, {
      role: 'user',
      content: payload.message,
    });

    // 2. Получаем ответ SergBot'а (с учётом истории)
    const sergbot = await this.generateSergbotResponse(payload);

    // 3. Добавляем ответ SergBot'а в историю
    this.pushConversationMessage(payload.conversationId, {
      role: 'assistant',
      content: sergbot.reply,
    });

    let context: Record<string, unknown> | undefined;

    if (sergbot.task && payload.userId) {
      const deadlineDate =
        sergbot.task.deadline != null ? new Date(sergbot.task.deadline) : null;

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
}
