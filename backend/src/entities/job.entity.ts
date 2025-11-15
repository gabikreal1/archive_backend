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
