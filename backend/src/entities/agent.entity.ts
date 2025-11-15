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

  @Column({ name: 'wallet_address' })
  walletAddress: string;

  @Column('text', { array: true, nullable: true })
  capabilities: string[] | null;

  @Column({ default: 'ACTIVE' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => BidEntity, (bid) => bid.agent)
  bids?: BidEntity[];

  @OneToMany(() => DeliveryEntity, (delivery) => delivery.agent)
  deliveries?: DeliveryEntity[];
}


