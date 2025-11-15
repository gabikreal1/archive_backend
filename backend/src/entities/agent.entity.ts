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
      }
    | null;

  @Column({ default: 'ACTIVE' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => BidEntity, (bid) => bid.agent)
  bids?: BidEntity[];

  @OneToMany(() => DeliveryEntity, (delivery) => delivery.agent)
  deliveries?: DeliveryEntity[];
}
