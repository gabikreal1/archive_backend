import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Web3Service } from '../web3.service';
import { WebsocketGateway } from '../../websocket/websocket.gateway';

interface EventSubscription {
  off: () => void;
}

@Injectable()
export class BlockchainListenerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(BlockchainListenerService.name);
  private readonly subscriptions: EventSubscription[] = [];

  constructor(
    private readonly web3Service: Web3Service,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  onModuleInit() {
    // Для текущего DEV‑сетапа блокчейн‑листенеры полностью отключены,
    // чтобы не требовать реальный ABI/контракты.
    this.logger.log(
      'Blockchain listeners are disabled in this environment (no onchain events will be consumed).',
    );
  }

  onModuleDestroy() {
    for (const sub of this.subscriptions) {
      try {
        sub.off();
      } catch (error) {
        this.logger.error(
          'Failed to detach blockchain listener',
          error as Error,
        );
      }
    }
  }

  private subscribeOrderBookEvents() {
    const contract = this.web3Service.orderBook.read;

    const jobPosted = (jobId: bigint, poster: string) => {
      const payload = { jobId: jobId.toString(), poster };
      this.logger.debug(`JobPosted #${payload.jobId}`);
      this.websocketGateway.emitBlockchainEvent('orderbook.jobPosted', payload);
    };

    const bidPlaced = (
      jobId: bigint,
      bidId: bigint,
      bidder: string,
      price: bigint,
    ) => {
      const payload = {
        jobId: jobId.toString(),
        bidId: bidId.toString(),
        bidder,
        price: price.toString(),
      };
      this.logger.debug(`BidPlaced #${payload.bidId} for job ${payload.jobId}`);
      this.websocketGateway.emitBlockchainEvent('orderbook.bidPlaced', payload);
    };

    const bidAccepted = (
      jobId: bigint,
      bidId: bigint,
      poster: string,
      agent: string,
    ) => {
      const payload = {
        jobId: jobId.toString(),
        bidId: bidId.toString(),
        poster,
        agent,
      };
      this.logger.debug(`BidAccepted job ${payload.jobId}`);
      this.websocketGateway.emitBlockchainEvent(
        'orderbook.bidAccepted',
        payload,
      );
    };

    const bidResponseSubmitted = (
      jobId: bigint,
      bidId: bigint,
      responseURI: string,
    ) => {
      const payload = {
        jobId: jobId.toString(),
        bidId: bidId.toString(),
        responseUri: responseURI,
      };
      this.logger.debug(
        `BidResponseSubmitted job ${payload.jobId} bid ${payload.bidId}`,
      );
      this.websocketGateway.emitBlockchainEvent(
        'orderbook.bidResponseSubmitted',
        payload,
      );
    };

    const deliverySubmitted = (
      jobId: bigint,
      bidId: bigint,
      proofHash: string,
    ) => {
      const payload = {
        jobId: jobId.toString(),
        bidId: bidId.toString(),
        proofHash,
      };
      this.logger.debug(`DeliverySubmitted for job ${payload.jobId}`);
      this.websocketGateway.emitBlockchainEvent(
        'orderbook.deliverySubmitted',
        payload,
      );
    };

    const jobApproved = (jobId: bigint, bidId: bigint) => {
      const payload = {
        jobId: jobId.toString(),
        bidId: bidId.toString(),
      };
      this.logger.debug(`JobApproved ${payload.jobId}`);
      this.websocketGateway.emitBlockchainEvent(
        'orderbook.jobApproved',
        payload,
      );
    };

    contract.on('JobPosted', jobPosted);
    contract.on('BidPlaced', bidPlaced);
    contract.on('BidAccepted', bidAccepted);
    contract.on('DeliverySubmitted', deliverySubmitted);
    contract.on('BidResponseSubmitted', bidResponseSubmitted);
    contract.on('JobApproved', jobApproved);

    this.subscriptions.push(
      { off: () => contract.off('JobPosted', jobPosted) },
      { off: () => contract.off('BidPlaced', bidPlaced) },
      { off: () => contract.off('BidAccepted', bidAccepted) },
      { off: () => contract.off('DeliverySubmitted', deliverySubmitted) },
      { off: () => contract.off('BidResponseSubmitted', bidResponseSubmitted) },
      { off: () => contract.off('JobApproved', jobApproved) },
    );
  }

  private subscribeEscrowEvents() {
    const contract = this.web3Service.escrow.read;

    const escrowCreated = (
      jobId: bigint,
      user: string,
      agent: string,
      amount: bigint,
    ) => {
      const payload = {
        jobId: jobId.toString(),
        user,
        agent,
        amount: amount.toString(),
      };
      this.logger.debug(`EscrowCreated job ${payload.jobId}`);
      this.websocketGateway.emitBlockchainEvent('escrow.created', payload);
    };

    const paymentReleased = (
      jobId: bigint,
      agent: string,
      payout: bigint,
      fee: bigint,
    ) => {
      const payload = {
        jobId: jobId.toString(),
        agent,
        payout: payout.toString(),
        fee: fee.toString(),
      };
      this.logger.debug(`PaymentReleased job ${payload.jobId}`);
      this.websocketGateway.emitBlockchainEvent(
        'escrow.paymentReleased',
        payload,
      );
    };

    const paymentRefunded = (jobId: bigint, user: string, amount: bigint) => {
      const payload = {
        jobId: jobId.toString(),
        user,
        amount: amount.toString(),
      };
      this.logger.debug(`PaymentRefunded job ${payload.jobId}`);
      this.websocketGateway.emitBlockchainEvent(
        'escrow.paymentRefunded',
        payload,
      );
    };

    contract.on('EscrowCreated', escrowCreated);
    contract.on('PaymentReleased', paymentReleased);
    contract.on('PaymentRefunded', paymentRefunded);

    this.subscriptions.push(
      { off: () => contract.off('EscrowCreated', escrowCreated) },
      { off: () => contract.off('PaymentReleased', paymentReleased) },
      { off: () => contract.off('PaymentRefunded', paymentRefunded) },
    );
  }
}
