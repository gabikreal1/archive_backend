import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { BidEntity } from './bid.entity';
import { DeliveryEntity } from './delivery.entity';

export enum JobStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
}

@Entity({ name: 'jobs' })
export class JobEntity {
  @PrimaryColumn()
  id: string; // onchain job id, e.g. "job_123"

  @Column({ name: 'poster_wallet' })
  posterWallet: string;

  /**
   * Опционально: кто создал задачу в системе (userId из auth).
   * Для задач, созданных через SergBot, здесь будет идентификатор пользователя.
   */
  @Column({ name: 'created_by_user_id', type: 'text', nullable: true })
  createdByUserId: string | null;

  /**
   * Опционально: conversationId диалога с SergBot, в рамках которого была создана задача.
   * Нужен, чтобы не создавать дубль job для одного и того же диалога.
   */
  @Column({ name: 'conversation_id', type: 'text', nullable: true })
  conversationId: string | null;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'metadata_uri', type: 'text', nullable: true })
  metadataUri: string | null;

  @Column('text', { array: true, nullable: true })
  tags: string[] | null;

  @Column({ type: 'timestamptz', nullable: true })
  deadline: Date | null;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.OPEN,
  })
  status: JobStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => BidEntity, (bid) => bid.job)
  bids?: BidEntity[];

  @OneToMany(() => DeliveryEntity, (delivery) => delivery.job)
  deliveries?: DeliveryEntity[];
}
