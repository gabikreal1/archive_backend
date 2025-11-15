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
export declare class OrderBookService {
    private readonly web3Service;
    private readonly logger;
    constructor(web3Service: Web3Service);
    postJob(params: PostJobParams): Promise<{
        jobId: string;
        txHash: string;
    }>;
    getJob(jobId: string): Promise<OnchainJobState>;
    private toBigInt;
}
