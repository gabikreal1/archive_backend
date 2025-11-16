import { Injectable, Logger } from '@nestjs/common';
import { ContractTransactionResponse, ethers } from 'ethers';
import { IpfsMetadataService } from '../ipfs/metadata.service';
import type {
  BidMetadataInput,
  BidResponseMetadataInput,
  DeliveryProofMetadataInput,
} from '../ipfs/metadata.types';
import { ContractBundle, Web3Service } from '../web3.service';

interface RawBidStruct {
  id: bigint;
  jobId: bigint;
  bidder: string;
  price: bigint;
  deliveryTime: bigint;
  reputation: bigint;
  metadataURI: string;
  accepted: boolean;
  createdAt: bigint;
}

interface RawJobState {
  poster: string;
  status: number | bigint;
  acceptedBidId: bigint;
  deliveryProof: string;
  hasDispute: boolean;
}

interface RawDisputeStruct {
  disputeId: bigint;
  jobId: bigint;
  initiator: string;
  reason: string;
  evidence: string[];
  status: number | bigint;
  resolutionMessage: string;
  createdAt: bigint;
  resolvedAt: bigint;
}

interface OrderBookReadContract {
  getJob(jobId: bigint): Promise<[RawJobState, RawBidStruct[]]>;
  getDispute(disputeId: bigint): Promise<RawDisputeStruct>;
  getJobDispute(jobId: bigint): Promise<RawDisputeStruct>;
}

interface OrderBookWriteContract {
  postJob(
    description: string,
    metadataUri: string,
    tags: string[],
    deadline: bigint,
  ): Promise<ContractTransactionResponse>;
  placeBid(
    jobId: bigint,
    price: bigint,
    deliveryTimeSeconds: bigint,
    metadataUri: string,
  ): Promise<ContractTransactionResponse>;
  acceptBid(
    jobId: bigint,
    bidId: bigint,
    responseUri: string,
  ): Promise<ContractTransactionResponse>;
  submitDelivery(
    jobId: bigint,
    proofHash: string,
  ): Promise<ContractTransactionResponse>;
  approveDelivery(jobId: bigint): Promise<ContractTransactionResponse>;
  raiseDispute(
    jobId: bigint,
    reasonUri: string,
    evidenceUri: string,
  ): Promise<ContractTransactionResponse>;
  submitEvidence(
    disputeId: bigint,
    evidenceUri: string,
  ): Promise<ContractTransactionResponse>;
  resolveDispute(
    disputeId: bigint,
    resolution: number,
    messageUri: string,
  ): Promise<ContractTransactionResponse>;
  refundJob(jobId: bigint): Promise<ContractTransactionResponse>;
}

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

export interface OnchainDispute {
  disputeId: string;
  jobId: string;
  initiator: string;
  reason: string;
  evidence: string[];
  status: number;
  resolutionMessage: string;
  createdAt: string;
  resolvedAt: string;
}

export interface PlaceBidParams {
  jobId: string | number | bigint;
  price: string | number | bigint;
  deliveryTimeSeconds: string | number | bigint;
  metadataUri: string;
}

export interface PlaceBidWithMetadataParams {
  jobId: string | number | bigint;
  price: string | number | bigint;
  deliveryTimeSeconds: string | number | bigint;
  metadata: Omit<BidMetadataInput, 'jobId'>;
}

export interface AcceptBidParams {
  jobId: string | number | bigint;
  bidId: string | number | bigint;
  responseUri?: string;
  responseMetadata?: Omit<BidResponseMetadataInput, 'jobId' | 'bidId'>;
}

export interface SubmitDeliveryParams {
  jobId: string | number | bigint;
  proofHash?: string;
  deliveryMetadata?: Omit<DeliveryProofMetadataInput, 'jobId'>;
}

export interface RaiseDisputeParams {
  jobId: string | number | bigint;
  reasonUri: string;
  evidenceUri: string;
}

export interface SubmitEvidenceParams {
  disputeId: string | number | bigint;
  evidenceUri: string;
}

export interface ResolveDisputeParams {
  disputeId: string | number | bigint;
  resolution: number;
  messageUri: string;
}

@Injectable()
export class OrderBookService {
  private readonly logger = new Logger(OrderBookService.name);

  constructor(
    private readonly web3Service: Web3Service,
    private readonly metadataService: IpfsMetadataService,
  ) {}

  private get orderBookContract(): ContractBundle {
    return this.web3Service.orderBook;
  }

  private get orderBookRead(): OrderBookReadContract {
    return this.orderBookContract.read as unknown as OrderBookReadContract;
  }

  private get orderBookWrite(): OrderBookWriteContract {
    return this.orderBookContract.write as unknown as OrderBookWriteContract;
  }

  async postJob(
    params: PostJobParams,
  ): Promise<{ jobId: string; txHash: string }> {
    const contract = this.orderBookContract;
    const writer = this.orderBookWrite;
    const deadline = BigInt(params.deadline ?? 0);
    const tags = params.tags ?? [];

    const tx = await writer.postJob(
      params.description,
      params.metadataUri,
      tags,
      deadline,
    );
    const receipt = await tx.wait();
    const parsed = this.web3Service.parseEvent(contract, receipt, 'JobPosted');
    const jobPostedArgs = parsed?.args as { jobId?: bigint } | undefined;
    const jobId = jobPostedArgs?.jobId?.toString();

    if (!jobId) {
      throw new Error('Unable to determine jobId from JobPosted event.');
    }

    return { jobId, txHash: tx.hash };
  }

  async getJob(jobId: string): Promise<OnchainJobState> {
    const id = this.toBigInt(jobId);
    const [jobState, bids] = await this.orderBookRead.getJob(id);

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

  async placeBid(
    params: PlaceBidParams,
  ): Promise<{ bidId: string; txHash: string; metadataUri: string }> {
    const contract = this.orderBookContract;
    const tx = await this.orderBookWrite.placeBid(
      this.toBigInt(params.jobId),
      this.parsePrice(params.price),
      this.toBigInt(params.deliveryTimeSeconds),
      params.metadataUri,
    );
    const receipt = await tx.wait();
    const parsed = this.web3Service.parseEvent(contract, receipt, 'BidPlaced');
    const bidPlacedArgs = parsed?.args as { bidId?: bigint } | undefined;
    const bidId = bidPlacedArgs?.bidId?.toString();
    if (!bidId) {
      throw new Error('Unable to determine bidId from BidPlaced event.');
    }
    return { bidId, txHash: tx.hash, metadataUri: params.metadataUri };
  }

  async placeBidWithMetadata(params: PlaceBidWithMetadataParams): Promise<
    { bidId: string; txHash: string } & {
      metadataUri: string;
      metadataCid: string;
    }
  > {
    const metadataUpload = await this.metadataService.publishBidMetadata({
      ...params.metadata,
      jobId: this.toBigInt(params.jobId).toString(),
      pinName: params.metadata.pinName ?? `bid-${Date.now()}`,
    });

    const { bidId, txHash } = await this.placeBid({
      jobId: params.jobId,
      price: params.price,
      deliveryTimeSeconds: params.deliveryTimeSeconds,
      metadataUri: metadataUpload.uri,
    });

    return {
      bidId,
      txHash,
      metadataUri: metadataUpload.uri,
      metadataCid: metadataUpload.cid,
    };
  }

  async acceptBid(
    params: AcceptBidParams,
  ): Promise<{
    txHash: string;
    responseUri?: string;
    responseCid?: string;
  }> {
    const jobId = this.toBigInt(params.jobId);
    const bidId = this.toBigInt(params.bidId);

    let responseUpload: Awaited<
      ReturnType<typeof this.metadataService.publishBidResponse>
    > | null = null;

    if (params.responseMetadata) {
      responseUpload = await this.metadataService.publishBidResponse({
        ...params.responseMetadata,
        jobId: jobId.toString(),
        bidId: bidId.toString(),
        pinName:
          params.responseMetadata.pinName ??
          `bid-response-${jobId.toString()}-${bidId.toString()}-${Date.now()}`,
      });
    }

    const finalResponseUri =
      params.responseUri ?? responseUpload?.uri ?? '';

    const tx = await this.orderBookWrite.acceptBid(
      jobId,
      bidId,
      finalResponseUri,
    );
    await tx.wait();

    return {
      txHash: tx.hash,
      ...(finalResponseUri && { responseUri: finalResponseUri }),
      ...(responseUpload && { responseCid: responseUpload.cid }),
    };
  }

  async submitDelivery(params: SubmitDeliveryParams): Promise<{
    txHash: string;
    proofHash: string;
    metadataUri?: string;
    metadataCid?: string;
  }> {
    const contract = this.orderBookContract;
    const jobId = this.toBigInt(params.jobId);

    let metadataUpload: Awaited<
      ReturnType<typeof this.metadataService.publishDeliveryProof>
    > | null = null;

    if (params.deliveryMetadata) {
      metadataUpload = await this.metadataService.publishDeliveryProof({
        ...params.deliveryMetadata,
        jobId: jobId.toString(),
        pinName:
          params.deliveryMetadata.pinName ??
          `delivery-${jobId.toString()}-${Date.now()}`,
      });
    }

    let proofHash = params.proofHash;
    if (!proofHash && metadataUpload) {
      proofHash = this.hashUri(metadataUpload.uri);
    }

    if (!proofHash) {
      throw new Error(
        'submitDelivery requires either a proofHash or deliveryMetadata.',
      );
    }

    const tx = await this.orderBookWrite.submitDelivery(jobId, proofHash);
    const receipt = await tx.wait();
    const parsed = this.web3Service.parseEvent(
      contract,
      receipt,
      'DeliverySubmitted',
    );
    const deliveryArgs = parsed?.args as { proofHash?: string } | undefined;
    const finalProofHash = deliveryArgs?.proofHash ?? proofHash;

    return {
      txHash: tx.hash,
      proofHash: finalProofHash,
      ...(metadataUpload && {
        metadataUri: metadataUpload.uri,
        metadataCid: metadataUpload.cid,
      }),
    };
  }

  async approveDelivery(
    jobId: string | number | bigint,
  ): Promise<{ txHash: string }> {
    const tx = await this.orderBookWrite.approveDelivery(this.toBigInt(jobId));
    await tx.wait();
    return { txHash: tx.hash };
  }

  async raiseDispute(
    params: RaiseDisputeParams,
  ): Promise<{ disputeId: string; txHash: string }> {
    const contract = this.orderBookContract;
    const tx = await this.orderBookWrite.raiseDispute(
      this.toBigInt(params.jobId),
      params.reasonUri,
      params.evidenceUri,
    );
    const receipt = await tx.wait();
    const parsed = this.web3Service.parseEvent(
      contract,
      receipt,
      'DisputeRaised',
    );
    const disputeArgs = parsed?.args as { disputeId?: bigint } | undefined;
    const disputeId = disputeArgs?.disputeId?.toString();
    if (!disputeId) {
      throw new Error('Unable to parse DisputeRaised event.');
    }
    return { disputeId, txHash: tx.hash };
  }

  async submitEvidence(
    params: SubmitEvidenceParams,
  ): Promise<{ txHash: string }> {
    const tx = await this.orderBookWrite.submitEvidence(
      this.toBigInt(params.disputeId),
      params.evidenceUri,
    );
    await tx.wait();
    return { txHash: tx.hash };
  }

  async resolveDispute(
    params: ResolveDisputeParams,
  ): Promise<{ txHash: string }> {
    const tx = await this.orderBookWrite.resolveDispute(
      this.toBigInt(params.disputeId),
      params.resolution,
      params.messageUri,
    );
    await tx.wait();
    return { txHash: tx.hash };
  }

  async refundJob(
    jobId: string | number | bigint,
  ): Promise<{ txHash: string }> {
    const tx = await this.orderBookWrite.refundJob(this.toBigInt(jobId));
    await tx.wait();
    return { txHash: tx.hash };
  }

  async getDispute(
    disputeId: string | number | bigint,
  ): Promise<OnchainDispute> {
    const dispute = await this.orderBookRead.getDispute(
      this.toBigInt(disputeId),
    );
    return this.formatDispute(dispute);
  }

  async getJobDispute(
    jobId: string | number | bigint,
  ): Promise<OnchainDispute | null> {
    const dispute = await this.orderBookRead.getJobDispute(
      this.toBigInt(jobId),
    );
    const formatted = this.formatDispute(dispute);
    if (formatted.disputeId === '0') {
      return null;
    }
    return formatted;
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

  private parsePrice(value: string | number | bigint): bigint {
    if (typeof value === 'bigint') {
      return value;
    }
    if (typeof value === 'number') {
      return ethers.parseUnits(value.toString(), 6);
    }
    if (/^0x/i.test(value)) {
      return BigInt(value);
    }
    if (value.includes('.')) {
      return ethers.parseUnits(value, 6);
    }
    return ethers.parseUnits(value, 6);
  }

  private formatDispute(dispute: RawDisputeStruct): OnchainDispute {
    return {
      disputeId: dispute.disputeId?.toString?.() ?? '0',
      jobId: dispute.jobId?.toString?.() ?? '0',
      initiator: dispute.initiator ?? ethers.ZeroAddress,
      reason: dispute.reason ?? '',
      evidence: Array.isArray(dispute.evidence) ? dispute.evidence : [],
      status:
        typeof dispute.status === 'number'
          ? dispute.status
          : Number(dispute.status ?? 0),
      resolutionMessage: dispute.resolutionMessage ?? '',
      createdAt: dispute.createdAt?.toString?.() ?? '0',
      resolvedAt: dispute.resolvedAt?.toString?.() ?? '0',
    };
  }

  private hashUri(uri: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(uri));
  }
}
