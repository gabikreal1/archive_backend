import { OrderBookService } from './order-book.service';
import { IpfsMetadataService } from '../ipfs/metadata.service';
import { ContractBundle, Web3Service } from '../web3.service';

const buildContractBundle = (
  acceptBidMock: jest.Mock,
): ContractBundle => ({
  address: '0xorderbook',
  read: {} as never,
  write: { acceptBid: acceptBidMock } as never,
  iface: {} as never,
});

describe('OrderBookService', () => {
  const buildService = () => {
    const wait = jest.fn().mockResolvedValue({});
    const acceptBidMock = jest
      .fn()
      .mockResolvedValue({ hash: '0xhash', wait });
    const contract = buildContractBundle(acceptBidMock);
    const web3ServiceMock = {
      orderBook: contract,
      parseEvent: jest.fn(),
    } as unknown as Web3Service;
    const metadataMock = {
      publishBidResponse: jest.fn(),
    };

    const service = new OrderBookService(
      web3ServiceMock,
      metadataMock as unknown as IpfsMetadataService,
    );

    return { service, acceptBidMock, metadataMock };
  };

  it('uploads response metadata and forwards URI to the contract', async () => {
    const { service, acceptBidMock, metadataMock } = buildService();
    metadataMock.publishBidResponse.mockResolvedValue({
      uri: 'ipfs://response',
      cid: 'cid123',
      metadata: {} as never,
    });

    const result = await service.acceptBid({
      jobId: '1',
      bidId: '2',
      responseMetadata: {
        answeredBy: '0xposter',
        answers: {
          q1: { question: 'How?', answer: 'Carefully' },
        },
      },
    });

    expect(metadataMock.publishBidResponse).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: '1', bidId: '2' }),
    );
    expect(acceptBidMock).toHaveBeenCalledWith(
      BigInt(1),
      BigInt(2),
      'ipfs://response',
    );
    expect(result).toMatchObject({
      txHash: '0xhash',
      responseUri: 'ipfs://response',
      responseCid: 'cid123',
    });
  });

  it('uses provided response URI when no metadata is supplied', async () => {
    const { service, acceptBidMock, metadataMock } = buildService();

    const result = await service.acceptBid({
      jobId: 3,
      bidId: 4,
      responseUri: 'ipfs://prebuilt',
    });

    expect(metadataMock.publishBidResponse).not.toHaveBeenCalled();
    expect(acceptBidMock).toHaveBeenCalledWith(
      BigInt(3),
      BigInt(4),
      'ipfs://prebuilt',
    );
    expect(result).toMatchObject({
      txHash: '0xhash',
      responseUri: 'ipfs://prebuilt',
    });
  });
});
