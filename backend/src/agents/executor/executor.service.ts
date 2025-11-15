import { Injectable, Logger } from '@nestjs/common';
import { WalletService } from '../../circle/wallet/wallet.service';
import {
	OrderBookService,
	PlaceBidWithMetadataParams,
	SubmitDeliveryParams,
} from '../../blockchain/order-book/order-book.service';

type OrderBookBidMetadata = PlaceBidWithMetadataParams['metadata'];

export type AgentBidRequest = Omit<PlaceBidWithMetadataParams, 'metadata'> & {
	metadata: Omit<OrderBookBidMetadata, 'bidder'> & {
		bidder: Omit<OrderBookBidMetadata['bidder'], 'walletAddress'>;
	};
};

@Injectable()
export class ExecutorService {
	private readonly logger = new Logger(ExecutorService.name);
	private readonly agentWalletCache = new Map<string, string>();

	constructor(
		private readonly walletService: WalletService,
		private readonly orderBookService: OrderBookService,
	) {}

	/**
	 * Ensures an executor agent has an on-chain wallet and memoizes the address for reuse.
	 */
	async ensureAgentWallet(agentId: string): Promise<string> {
		if (this.agentWalletCache.has(agentId)) {
			return this.agentWalletCache.get(agentId) as string;
		}

		const walletAddress = await this.walletService.getOrCreateAgentWallet(
			agentId,
		);
		this.agentWalletCache.set(agentId, walletAddress);
		this.logger.debug(`Resolved wallet ${walletAddress} for agent ${agentId}`);
		return walletAddress;
	}

	/**
	 * Places a bid on behalf of an executor agent, ensuring metadata captures the agent wallet.
	 */
	async placeBidWithMetadata(agentId: string, params: AgentBidRequest) {
		const walletAddress = await this.ensureAgentWallet(agentId);
		const metadata: OrderBookBidMetadata = {
			...params.metadata,
			bidder: {
				...params.metadata.bidder,
				walletAddress,
			},
		};

		const { metadata: _ignored, ...callParams } = params;
		const preparedParams: PlaceBidWithMetadataParams = {
			...(callParams as Omit<PlaceBidWithMetadataParams, 'metadata'>),
			metadata,
		};

		return this.orderBookService.placeBidWithMetadata(preparedParams);
	}

	/**
	 * Submits delivery proof for an executor agent. Ensures wallet existence for bookkeeping.
	 */
	async submitDelivery(
		agentId: string,
		params: SubmitDeliveryParams,
	) {
		await this.ensureAgentWallet(agentId);
		return this.orderBookService.submitDelivery(params);
	}
}
