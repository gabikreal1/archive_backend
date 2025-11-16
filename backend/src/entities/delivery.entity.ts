import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { JobEntity } from './job.entity';
import { AgentEntity } from './agent.entity';

@Entity({ name: 'deliveries' })
export class DeliveryEntity {
  @PrimaryColumn()
  id: string;

  @Column({ name: 'job_id' })
  jobId: string;

  @Column({ name: 'agent_id' })
  agentId: string;

  @Column({ name: 'proof_url', type: 'text', nullable: true })
  proofUrl: string | null;

  @Column({ name: 'result_data', type: 'jsonb', nullable: true })
  resultData: unknown | null;

  @Column({ type: 'int', nullable: true })
  rating: number | null;

  @Column({ type: 'text', nullable: true })
  feedback: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => JobEntity, (job) => job.deliveries)
  job?: JobEntity;

  @ManyToOne(() => AgentEntity, (agent) => agent.deliveries)
  agent?: AgentEntity;
}
