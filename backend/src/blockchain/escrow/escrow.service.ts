import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

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
  private readonly provider: ethers.JsonRpcProvider;
  private readonly escrowContract: ethers.Contract;

  constructor(private readonly configService: ConfigService) {
    const rpcUrl =
      this.configService.get<string>('ARC_RPC_URL') ??
      'https://arc-testnet-rpc.placeholder';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    const contractAddress =
      this.configService.get<string>('ESCROW_CONTRACT_ADDRESS') ??
      '0xEscrowContractAddress';

    const abi = [
      'event EscrowCreated(string jobId, address poster, address agent, uint256 amount)',
      'event PaymentReleased(string jobId, address agent, uint256 amount)',
      'function createEscrow(string jobId, address poster, address agent, uint256 amount)',
      'function releasePayment(string jobId)',
    ];

    this.escrowContract = new ethers.Contract(
      contractAddress,
      abi,
      this.provider,
    );
  }

  async createEscrow(
    params: CreateEscrowParams,
  ): Promise<{ escrowTxHash: string }> {
    const escrowTxHash = `0xESCROW_TX_${Date.now()}`;
    console.log('Creating escrow onchain (stub)', params);
    // TODO: вызвать escrowContract.createEscrow(...) через signer
    return { escrowTxHash };
  }

  async releasePayment(
    params: ReleasePaymentParams,
  ): Promise<{ paymentTxHash: string }> {
    const paymentTxHash = `0xPAYMENT_TX_${Date.now()}`;
    console.log('Releasing payment onchain (stub)', params);
    // TODO: вызвать escrowContract.releasePayment(...)
    return { paymentTxHash };
  }
}

