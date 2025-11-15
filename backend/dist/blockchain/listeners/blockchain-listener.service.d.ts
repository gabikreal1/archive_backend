import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Web3Service } from '../web3.service';
import { WebsocketGateway } from '../../websocket/websocket.gateway';
export declare class BlockchainListenerService implements OnModuleInit, OnModuleDestroy {
    private readonly web3Service;
    private readonly websocketGateway;
    private readonly logger;
    private readonly subscriptions;
    constructor(web3Service: Web3Service, websocketGateway: WebsocketGateway);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private subscribeOrderBookEvents;
    private subscribeEscrowEvents;
}
