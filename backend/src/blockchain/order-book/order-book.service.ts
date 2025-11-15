import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

interface PostJobParams {
  poster: string;
  description: string;
  tags: string[];
  deadline?: number;
}

@Injectable()
export class OrderBookService {
  private readonly provider: ethers.JsonRpcProvider;
  // For hackathon-level MVP we keep contract as generic ethers Contract
  private readonly orderBookContract: ethers.Contract;

  constructor(private readonly configService: ConfigService) {
    const rpcUrl =
      this.configService.get<string>('ARC_RPC_URL') ??
      'https://arc-testnet-rpc.placeholder';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    const contractAddress =
      this.configService.get<string>('ORDERBOOK_CONTRACT_ADDRESS') ??
      '0xOrderBookContractAddress';

    // ABI должно быть подставлено реальным контрактом; временный минимальный ABI-заглушка
    const abi = [
      'event JobPosted(string jobId, address poster, string description)',
      'function postJob(string description, string[] tags, uint256 deadline) returns (string jobId)',
    ];

    this.orderBookContract = new ethers.Contract(
      contractAddress,
      abi,
      this.provider,
    );
  }

  async postJob(params: PostJobParams): Promise<{ jobId: string; txHash: string }> {
    // Здесь должен использоваться signer с приватным ключом бэкенда
    // Для hackathon-заглушки просто генерируем jobId локально
    const jobId = `job_${Date.now()}`;
    const txHash = `0xJOB_TX_${Date.now()}`;

    // TODO: вызвать this.orderBookContract.connect(signer).postJob(...)
    console.log('Posting job onchain (stub)', params);

    return { jobId, txHash };
  }
}

