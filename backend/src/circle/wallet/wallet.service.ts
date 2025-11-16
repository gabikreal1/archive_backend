import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Wallet } from 'ethers';
import { Repository } from 'typeorm';
import { WalletMappingEntity } from '../../entities/wallet-mapping.entity';
import { CircleService } from '../circle/circle.service';

@Injectable()
export class WalletService {
  private readonly agentKeyPrefix = 'agent:';
  private readonly logger = new Logger(WalletService.name);
  private readonly devAgentWalletAddress?: string;
  private readonly devAgentCircleWalletId: string;

  constructor(
    @InjectRepository(WalletMappingEntity)
    private readonly walletRepo: Repository<WalletMappingEntity>,
    private readonly circleService: CircleService,
  ) {
    this.devAgentCircleWalletId =
      process.env.DEV_AGENT_CIRCLE_WALLET_ID ?? 'dev-agent-circle-wallet';
    this.devAgentWalletAddress = this.deriveDevAgentWalletAddress();

    if (this.devAgentWalletAddress) {
      this.logger.warn(
        `DEV agent wallet override is ON – all executors share ${this.devAgentWalletAddress}`,
      );
    }
  }

  /**
   * For MVP we simply ensure there is a mapping and return a deterministic
   * pseudo-address based on user id. Integrate real Circle wallet here later.
   */
  async getOrCreateUserWallet(userId: string): Promise<string> {
    let mapping = await this.walletRepo.findOne({ where: { userId } });
    if (!mapping) {
      const { circleWalletId, walletAddress } =
        await this.circleService.createWalletForUser(userId);
      mapping = this.walletRepo.create({
        userId,
        circleWalletId,
        walletAddress,
      });
      await this.walletRepo.save(mapping);
    }
    return mapping.walletAddress;
  }

  async getOrCreateMapping(userId: string): Promise<WalletMappingEntity> {
    let mapping = await this.walletRepo.findOne({ where: { userId } });
    if (mapping) {
      return mapping;
    }

    if (this.shouldUseDevAgentWallet(userId)) {
      mapping = this.walletRepo.create({
        userId,
        circleWalletId: this.devAgentCircleWalletId,
        walletAddress: this.devAgentWalletAddress as string,
      });
      return this.walletRepo.save(mapping);
    }

    const { circleWalletId, walletAddress } =
      await this.circleService.createWalletForUser(userId);
    mapping = this.walletRepo.create({
      userId,
      circleWalletId,
      walletAddress,
    });
    await this.walletRepo.save(mapping);
    return mapping;
  }

  private buildAgentOwner(agentId: string): string {
    return `${this.agentKeyPrefix}${agentId}`;
  }

  async getOrCreateAgentWallet(agentId: string): Promise<string> {
    const ownerId = this.buildAgentOwner(agentId);
    const mapping = await this.getOrCreateMapping(ownerId);
    return mapping.walletAddress;
  }

  async getAgentMapping(agentId: string): Promise<WalletMappingEntity> {
    return this.getOrCreateMapping(this.buildAgentOwner(agentId));
  }

  async getUserBalance(userId: string): Promise<{
    walletAddress: string;
    usdcBalance: string;
  }> {
    const mapping = await this.getOrCreateMapping(userId);
    const usdcBalance = await this.circleService.getWalletBalance(
      mapping.circleWalletId,
    );
    return {
      walletAddress: mapping.walletAddress,
      usdcBalance,
    };
  }

  async createDepositSession(params: {
    userId: string;
    amount: string;
    paymentMethod?: string;
  }): Promise<{ depositUrl: string }> {
    const { userId, amount, paymentMethod } = params;
    const mapping = await this.getOrCreateMapping(userId);
    const depositUrl = await this.circleService.createDepositSession({
      circleWalletId: mapping.circleWalletId,
      amount,
      paymentMethod,
    });
    return { depositUrl };
  }

  async approveEscrowSpend(userId: string, amount: string): Promise<void> {
    const mapping = await this.getOrCreateMapping(userId);
    await this.circleService.approveEscrowSpend({
      circleWalletId: mapping.circleWalletId,
      amount,
    });
  }

  private shouldUseDevAgentWallet(userId: string): boolean {
    return (
      !!this.devAgentWalletAddress && userId.startsWith(this.agentKeyPrefix)
    );
  }

  private deriveDevAgentWalletAddress(): string | undefined {
    const explicit = process.env.DEV_AGENT_WALLET_ADDRESS;
    if (explicit?.trim()) {
      return explicit.trim();
    }

    const privateKey =
      process.env.DEV_AGENT_WALLET_PRIVATE_KEY ??
      process.env.WEB3_OPERATOR_PRIVATE_KEY;

    if (privateKey?.trim()) {
      try {
        return new Wallet(privateKey.trim()).address;
      } catch (error) {
        this.logger.warn(
          'Failed to derive DEV agent wallet address from private key',
          error as Error,
        );
      }
    }

    return undefined;
  }
}
