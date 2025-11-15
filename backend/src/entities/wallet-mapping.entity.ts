import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'wallet_mappings' })
export class WalletMappingEntity {
  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @Column({ name: 'circle_wallet_id' })
  circleWalletId: string;

  @Column({ name: 'wallet_address' })
  walletAddress: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
