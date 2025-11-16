import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Wallet, ethers } from 'ethers';
import { Repository } from 'typeorm';
import { WalletMappingEntity } from '../../entities/wallet-mapping.entity';
import { CircleService } from '../circle/circle.service';
import { Web3Service } from '../../blockchain/web3.service';

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
    private readonly web3Service: Web3Service,
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
   * For MVP we now treat the shared WEB3 operator wallet as the "user wallet"
   * for posting jobs and paying escrows. This keeps the onchain view consistent
   * with what the contracts actually use as `poster`.
   */
  async getOrCreateUserWallet(userId: string): Promise<string> {
    // Все пользователи в DEV разделяют один onchain‑кошелёк оператора.
    return this.web3Service.signer.address;
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
    // Показываем фактический onchain‑баланс USDC оператора на ARC testnet.
    const walletAddress = this.web3Service.signer.address;
    const usdc = this.web3Service.usdc;
    const raw: bigint = await usdc.read.balanceOf(walletAddress);
    const usdcBalance = ethers.formatUnits(raw, 6);
    return {
      walletAddress,
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
    // no-op: onchain allowance for Escrow is managed via EscrowService.ensureOnchainAllowance
    // using Web3Service.signer (operator wallet). We keep this method for backwards
    // compatibility with JobsService, but it no longer touches Circle in DEV.
    this.logger.debug(
      `approveEscrowSpend(${userId}, ${amount}) noop – using operator onchain allowance instead`,
    );
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
