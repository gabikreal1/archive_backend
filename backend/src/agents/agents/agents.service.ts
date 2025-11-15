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

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);
  private readonly openai?: OpenAI;

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

  private async generateSergbotResponse(
    payload: AgentUserMessagePayload,
  ): Promise<SergbotModelResponse> {
    if (!this.openai) {
      return {
        reply: `Я SergBot, но OpenAI токен не настроен (нет OPENAI_API_KEY). Ваш запрос: "${payload.message}"`,
        task: null,
      };
    }

    const systemPrompt =
      'Ты SergBot – внутренний LLM‑агент A2A marketplace. ' +
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
        reply:
          'Не удалось получить ответ от SergBot. Попробуйте переформулировать запрос.',
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

    const sergbot = await this.generateSergbotResponse(payload);

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
