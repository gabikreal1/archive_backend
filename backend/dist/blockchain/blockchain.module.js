"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainModule = void 0;
const common_1 = require("@nestjs/common");
const order_book_service_1 = require("./order-book/order-book.service");
const escrow_service_1 = require("./escrow/escrow.service");
const reputation_service_1 = require("./reputation/reputation.service");
const web3_service_1 = require("./web3.service");
const ipfs_service_1 = require("./ipfs/ipfs.service");
const metadata_service_1 = require("./ipfs/metadata.service");
const metadata_controller_1 = require("./ipfs/metadata.controller");
const blockchain_listener_service_1 = require("./listeners/blockchain-listener.service");
const websocket_module_1 = require("../websocket/websocket.module");
const jobs_module_1 = require("../jobs/jobs.module");
let BlockchainModule = class BlockchainModule {
};
exports.BlockchainModule = BlockchainModule;
exports.BlockchainModule = BlockchainModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => websocket_module_1.WebsocketModule), (0, common_1.forwardRef)(() => jobs_module_1.JobsModule)],
        controllers: [metadata_controller_1.MetadataController],
        providers: [
            web3_service_1.Web3Service,
            ipfs_service_1.IpfsService,
            metadata_service_1.IpfsMetadataService,
            order_book_service_1.OrderBookService,
            escrow_service_1.EscrowService,
            reputation_service_1.ReputationService,
            blockchain_listener_service_1.BlockchainListenerService,
        ],
        exports: [
            web3_service_1.Web3Service,
            ipfs_service_1.IpfsService,
            metadata_service_1.IpfsMetadataService,
            order_book_service_1.OrderBookService,
            escrow_service_1.EscrowService,
            reputation_service_1.ReputationService,
        ],
    })
], BlockchainModule);
//# sourceMappingURL=blockchain.module.js.map