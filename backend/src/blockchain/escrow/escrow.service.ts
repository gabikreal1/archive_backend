import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { Web3Service } from '../web3.service';

interface CreateEscrowParams {
  jobId: string;
  poster: string;
  agent: string;
  amount: string; // USDC amount (6 decimals) as string
}

interface ReleasePaymentParams {
  jobId: string;
  agent: string;
  amount: string;
}

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(private readonly web3Service: Web3Service) {}

  async createEscrow(
    params: CreateEscrowParams,
  ): Promise<{ escrowTxHash: string }> {
    const contract = this.web3Service.escrow;
    const tx = await contract.write.lockFunds(
      this.toBigInt(params.jobId),
      params.poster,
      params.agent,
      this.parseAmount(params.amount),
    );
    const receipt = await tx.wait();
    const parsed = this.web3Service.parseEvent(
      contract,
      receipt,
      'EscrowCreated',
    );
    if (!parsed) {
      this.logger.warn(`EscrowCreated event not found for job ${params.jobId}`);
    }
    return { escrowTxHash: tx.hash };
  }

  async releasePayment(
    params: ReleasePaymentParams,
  ): Promise<{ paymentTxHash: string }> {
    const contract = this.web3Service.escrow;
    const tx = await contract.write.releasePayment(this.toBigInt(params.jobId));
    await tx.wait();
    return { paymentTxHash: tx.hash };
  }

  async getEscrow(jobId: string) {
    const contract = this.web3Service.escrow;
    const result = await contract.read.getEscrow(this.toBigInt(jobId));
    return {
      user: result.user,
      agent: result.agent,
      amount: result.amount.toString(),
      funded: result.funded,
      released: result.released,
      refunded: result.refunded,
    };
  }

  private parseAmount(amount: string): bigint {
    return ethers.parseUnits(amount, 6);
  }

  private toBigInt(value: string | number | bigint): bigint {
    if (typeof value === 'bigint') {
      return value;
    }
    if (typeof value === 'number') {
      return BigInt(value);
    }
    if (/^0x/i.test(value)) {
      return BigInt(value);
    }
    if (!/^\d+$/.test(value)) {
      throw new Error(`Value ${value} is not a valid uint256.`);
    }
    return BigInt(value);
  }
}
