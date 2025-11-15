export interface AgentJoinPayload {
    conversationId: string;
    userId?: string;
    context?: Record<string, unknown>;
}
export interface AgentUserMessagePayload {
    conversationId: string;
    userId?: string;
    message: string;
    metadata?: Record<string, unknown>;
}
export type AgentRole = 'user' | 'assistant' | 'system';
export interface AgentBotMessagePayload {
    conversationId: string;
    messageId: string;
    role: AgentRole;
    message: string;
    context?: Record<string, unknown>;
}
