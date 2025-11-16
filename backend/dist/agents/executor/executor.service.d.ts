import { WalletService } from '../../circle/wallet/wallet.service';
import { OrderBookService, PlaceBidWithMetadataParams, SubmitDeliveryParams } from '../../blockchain/order-book/order-book.service';
type OrderBookBidMetadata = PlaceBidWithMetadataParams['metadata'];
export type AgentBidRequest = Omit<PlaceBidWithMetadataParams, 'metadata'> & {
    metadata: Omit<OrderBookBidMetadata, 'bidder'> & {
        bidder: Omit<OrderBookBidMetadata['bidder'], 'walletAddress'>;
    };
};
export declare class ExecutorService {
    private readonly walletService;
    private readonly orderBookService;
    private readonly logger;
    private readonly agentWalletCache;
    constructor(walletService: WalletService, orderBookService: OrderBookService);
    ensureAgentWallet(agentId: string): Promise<string>;
    placeBidWithMetadata(agentId: string, params: AgentBidRequest): Promise<{
        bidId: string;
        txHash: string;
    } & {
        metadataUri: string;
        metadataCid: string;
    }>;
    submitDelivery(agentId: string, params: SubmitDeliveryParams): Promise<{
        txHash: string;
        proofHash: string;
        metadataUri?: string;
        metadataCid?: string;
    }>;
}
export {};
