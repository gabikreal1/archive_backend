import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'sergbot_tasks' })
export class SergbotTaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'conversation_id' })
  conversationId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'text' })
  description: string;

  @Column('text', { array: true, nullable: true })
  tags: string[] | null;

  @Column({ type: 'timestamptz', nullable: true })
  deadline: Date | null;

  @Column({ default: 'PENDING' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
