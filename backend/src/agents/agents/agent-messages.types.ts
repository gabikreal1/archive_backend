export interface AgentJoinPayload {
  conversationId: string;
  /**
   * Идентификатор пользователя (email / userId из auth) – опционально.
   */
  userId?: string;
  /**
   * Доп. контекст (например, jobId, роль и т.п.).
   */
  context?: Record<string, unknown>;
}

export interface AgentUserMessagePayload {
  conversationId: string;
  /**
   * Отправитель сообщения (обычно userId из JWT / фронта).
   */
  userId?: string;
  /**
   * Свободный текст запроса пользователя.
   */
  message: string;
  /**
   * Доп. структурированные данные (jobId, escrow‑параметры и т.д.).
   */
  metadata?: Record<string, unknown>;
}

export type AgentRole = 'user' | 'assistant' | 'system';

export interface AgentBotMessagePayload {
  conversationId: string;
  messageId: string;
  role: AgentRole;
  /**
   * Текстовый ответ бота / LLM.
   */
  message: string;
  /**
   * Доп. данные – например, результаты вызова смарт‑контракта.
   */
  context?: Record<string, unknown>;
}
