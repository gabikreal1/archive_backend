import { BlockchainListenerService } from './blockchain-listener.service';
import { WebsocketGateway } from '../../websocket/websocket.gateway';
import { ContractBundle, Web3Service } from '../web3.service';
import { JobOrchestrationService } from '../../jobs/job-orchestration.service';

describe('BlockchainListenerService', () => {
  const buildService = () => {
    const contract = {
      on: jest.fn(),
      off: jest.fn(),
    };

    const orderBookBundle: ContractBundle = {
      address: '0xorderbook',
      read: contract as never,
      write: {} as never,
      iface: {} as never,
    };

    const web3ServiceMock = {
      orderBook: orderBookBundle,
    } as unknown as Web3Service;

    const websocketGatewayMock = {
      emitBlockchainEvent: jest.fn(),
    } as unknown as WebsocketGateway;

    const jobOrchestrationMock = {
      launchAuction: jest.fn(),
    } as unknown as JobOrchestrationService;

    const service = new BlockchainListenerService(
      web3ServiceMock,
      websocketGatewayMock,
      jobOrchestrationMock,
    );

    return { service, contract, websocketGatewayMock };
  };

  it('emits BidResponseSubmitted payload over websockets', () => {
    const { service, contract, websocketGatewayMock } = buildService();

    (service as unknown as { subscribeOrderBookEvents: () => void }).subscribeOrderBookEvents();

    const bidResponseCall = contract.on.mock.calls.find(
      ([event]) => event === 'BidResponseSubmitted',
    );
    expect(bidResponseCall).toBeDefined();

    const handler = bidResponseCall![1] as (
      jobId: bigint,
      bidId: bigint,
      responseURI: string,
    ) => void;
    handler(BigInt(5), BigInt(6), 'ipfs://answers');

    expect(websocketGatewayMock.emitBlockchainEvent).toHaveBeenCalledWith(
      'orderbook.bidResponseSubmitted',
      { jobId: '5', bidId: '6', responseUri: 'ipfs://answers' },
    );
  });
});
