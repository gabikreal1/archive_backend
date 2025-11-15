import { Injectable, Logger } from '@nestjs/common';
import { Web3Service } from '../web3.service';

export interface PostJobParams {
  description: string;
  metadataUri: string;
  tags: string[];
  deadline?: number;
}

export interface OnchainBid {
  id: string;
  jobId: string;
  bidder: string;
  price: string;
  deliveryTime: string;
  reputation: string;
  metadataURI: string;
  accepted: boolean;
  createdAt: string;
}

export interface OnchainJobState {
  jobId: string;
  poster: string;
  status: number;
  acceptedBidId: string;
  deliveryProof: string;
  hasDispute: boolean;
  bids: OnchainBid[];
}

@Injectable()
export class OrderBookService {
  private readonly logger = new Logger(OrderBookService.name);

  constructor(private readonly web3Service: Web3Service) {}

  async postJob(
    params: PostJobParams,
  ): Promise<{ jobId: string; txHash: string }> {
    const contract = this.web3Service.orderBook;
    const deadline = BigInt(params.deadline ?? 0);
    const tags = params.tags ?? [];

    const tx = await contract.write.postJob(
      params.description,
      params.metadataUri,
      tags,
      deadline,
    );
    const receipt = await tx.wait();
    const parsed = this.web3Service.parseEvent(contract, receipt, 'JobPosted');
    const jobId = parsed?.args?.jobId?.toString();

    if (!jobId) {
      throw new Error('Unable to determine jobId from JobPosted event.');
    }

    return { jobId, txHash: tx.hash };
  }

  async getJob(jobId: string): Promise<OnchainJobState> {
    const contract = this.web3Service.orderBook;
    const id = this.toBigInt(jobId);
    const [jobState, bids] = await contract.read.getJob(id);

    return {
      jobId: jobId.toString(),
      poster: jobState.poster,
      status: Number(jobState.status),
      acceptedBidId: jobState.acceptedBidId?.toString() ?? '0',
      deliveryProof: jobState.deliveryProof,
      hasDispute: jobState.hasDispute,
      bids: bids.map((bid) => ({
        id: bid.id.toString(),
        jobId: bid.jobId.toString(),
        bidder: bid.bidder,
        price: bid.price.toString(),
        deliveryTime: bid.deliveryTime.toString(),
        reputation: bid.reputation.toString(),
        metadataURI: bid.metadataURI,
        accepted: bid.accepted,
        createdAt: bid.createdAt.toString(),
      })),
    };
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
