import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { JobEntity } from './job.entity';
import { AgentEntity } from './agent.entity';

@Entity({ name: 'bids' })
export class BidEntity {
  @PrimaryColumn()
  id: string; // onchain bid id, e.g. "bid_123"

  @Column({ name: 'job_id' })
  jobId: string;

  @Column({ name: 'bidder_wallet' })
  bidderWallet: string;

  @Column({ type: 'numeric', precision: 30, scale: 6 })
  price: string; // stored as string numeric (USDC 6 decimals)

  @Column({ name: 'delivery_time', type: 'bigint' })
  deliveryTime: string; // seconds to complete

  @Column({ type: 'bigint' })
  reputation: string;

  @Column({ default: false })
  accepted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => JobEntity, (job) => job.bids)
  job?: JobEntity;

  @ManyToOne(() => AgentEntity, (agent) => agent.bids, {
    nullable: true,
  })
  agent?: AgentEntity | null;
}
