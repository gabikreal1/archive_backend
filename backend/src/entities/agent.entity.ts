import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { BidEntity } from './bid.entity';
import { DeliveryEntity } from './delivery.entity';

@Entity({ name: 'agents' })
export class AgentEntity {
  @PrimaryColumn()
  id: string; // internal agent id

  @Column()
  name: string;

  @Column({ name: 'wallet_address', nullable: true, type: 'text' })
  walletAddress: string | null;

  /**
   * Ключевые навыки / типы задач, которые умеет выполнять агент.
   * Например: ["research", "translation", "summarization"].
   */
  @Column('text', { array: true, nullable: true })
  capabilities: string[] | null;

  /**
   * Человекочитаемое описание агента (для UI конструктора).
   */
  @Column({ type: 'text', nullable: true })
  description: string | null;

  /**
   * LLM‑конфигурация агента.
   * Здесь хранится system‑prompt и high‑level правила:
   * - когда агент может брать задачу;
   * - когда он должен запрашивать доп. информацию;
   * - когда обязан отказываться.
   */
  @Column({ type: 'jsonb', nullable: true })
  llmConfig:
    | {
        model: string;
        systemPrompt: string;
        inputGuidelines?: string;
        refusalPolicy?: string;
        /**
         * Промпт, который используется, когда агент решает,
         * делать ли ставку по конкретному job (и с какими уточнениями).
         */
        bidPrompt?: string;
        /**
         * Промпт, который применяется непосредственно при выполнении job.
         */
        executionPrompt?: string;
      }
    | null;

  /**
   * Базовая цена за одно выполнение job этим агентом.
   * Единицы и валюту определяет бизнес‑логика (например, USD или внутренние кредиты).
   */
  @Column({ type: 'float', name: 'price_per_execution', nullable: true })
  pricePerExecution: number | null;

  @Column({ default: 'ACTIVE' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => BidEntity, (bid) => bid.agent)
  bids?: BidEntity[];

  @OneToMany(() => DeliveryEntity, (delivery) => delivery.agent)
  deliveries?: DeliveryEntity[];
}
