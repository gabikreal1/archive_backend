import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentEntity } from '../../entities/agent.entity';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { WalletService } from '../../circle/wallet/wallet.service';

class CreateExecutorAgentDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @MinLength(3)
  description?: string;

  @IsOptional()
  @IsArray()
  capabilities?: string[];

  @IsString()
  @MinLength(3)
  model: string;

  @IsString()
  @MinLength(10)
  systemPrompt: string;

  /**
   * Промпт, который используется для принятия решения,
   * делать ли ставку по конкретному job (и с какими уточняющими вопросами).
   */
  @IsString()
  @MinLength(10)
  bidPrompt: string;

  /**
   * Промпт, который применяется при непосредственном выполнении job.
   */
  @IsString()
  @MinLength(10)
  executionPrompt: string;

  /**
   * Цена за одно выполнение job этим агентом.
   * Единицы и валюту определяет бизнес‑логика (например, USD или внутренние кредиты).
   */
  @IsNumber()
  @Min(0)
  pricePerExecution: number;

  @IsOptional()
  @IsString()
  inputGuidelines?: string;

  @IsOptional()
  @IsString()
  refusalPolicy?: string;
}

@Controller('executor-agents')
export class ExecutorAgentsController {
  constructor(
    @InjectRepository(AgentEntity)
    private readonly agentsRepo: Repository<AgentEntity>,
    private readonly jwtService: JwtService,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Создание LLM‑агента‑исполнителя.
   *
   * Этот эндпоинт предполагается вызывать из "второго" фронтенда
   * (после авторизации по email+password, с собственным JWT).
   *
   * POST /executor-agents
   * Authorization: Bearer <agent-frontend-JWT>
   *
   * Тело:
   * {
   *   "name": "Research Agent",
   *   "description": "...",
   *   "capabilities": ["research", "london_restaurants"],
   *   "model": "gpt-4.1-mini",
   *   "systemPrompt": "Ты агент, который делает ...",
   *   "inputGuidelines": "Перед началом работы требуется ...",
   *   "refusalPolicy": "Отказывайся, если ..."
   * }
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async createExecutorAgent(@Body() dto: CreateExecutorAgentDto) {
    // id агента пока генерируем простым способом, позже можно перейти на UUID
    const id = `agent_${Date.now()}`;

    const walletAddress = await this.walletService.getOrCreateAgentWallet(id);

    const agent = this.agentsRepo.create({
      id,
      name: dto.name,
      walletAddress,
      capabilities: dto.capabilities ?? null,
      description: dto.description ?? null,
      status: 'ACTIVE',
      llmConfig: {
        model: dto.model,
        systemPrompt: dto.systemPrompt,
        inputGuidelines: dto.inputGuidelines,
        refusalPolicy: dto.refusalPolicy,
        bidPrompt: dto.bidPrompt,
        executionPrompt: dto.executionPrompt,
      },
      pricePerExecution: dto.pricePerExecution,
    });

    await this.agentsRepo.save(agent);

    return {
      id: agent.id,
      name: agent.name,
      capabilities: agent.capabilities,
      description: agent.description,
      llmConfig: agent.llmConfig,
      status: agent.status,
    };
  }
}
