"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BlockchainListenerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainListenerService = void 0;
const common_1 = require("@nestjs/common");
const web3_service_1 = require("../web3.service");
const websocket_gateway_1 = require("../../websocket/websocket.gateway");
const job_orchestration_service_1 = require("../../jobs/job-orchestration.service");
let BlockchainListenerService = BlockchainListenerService_1 = class BlockchainListenerService {
    web3Service;
    websocketGateway;
    jobOrchestration;
    logger = new common_1.Logger(BlockchainListenerService_1.name);
    subscriptions = [];
    constructor(web3Service, websocketGateway, jobOrchestration) {
        this.web3Service = web3Service;
        this.websocketGateway = websocketGateway;
        this.jobOrchestration = jobOrchestration;
    }
    onModuleInit() {
        if (this.listenersDisabled()) {
            if (this.web3Service.isStubProvider) {
                this.logger.log('Blockchain listeners are disabled because ARC_RPC_URL is not configured (using placeholder RPC). Set ARC_RPC_URL and DISABLE_BLOCKCHAIN_LISTENERS=false to enable.');
            }
            else {
                this.logger.log('Blockchain listeners are disabled (set DISABLE_BLOCKCHAIN_LISTENERS=false to enable).');
            }
            return;
        }
        this.logger.log('Starting blockchain listener subscriptions...');
        try {
            this.subscribeOrderBookEvents();
            this.subscribeEscrowEvents();
        }
        catch (error) {
            this.logger.error('Failed to start blockchain listeners', error);
        }
    }
    onModuleDestroy() {
        for (const sub of this.subscriptions) {
            try {
                sub.off();
            }
            catch (error) {
                this.logger.error('Failed to detach blockchain listener', error);
            }
        }
    }
    subscribeOrderBookEvents() {
        const contract = this.web3Service.orderBook.read;
        const jobPosted = (jobId, poster) => {
            const payload = { jobId: jobId.toString(), poster };
            this.logger.debug(`JobPosted #${payload.jobId}`);
            this.websocketGateway.emitBlockchainEvent('orderbook.jobPosted', payload);
            void this.jobOrchestration?.launchAuction(payload.jobId);
        };
        const bidPlaced = (jobId, bidId, bidder, price) => {
            const payload = {
                jobId: jobId.toString(),
                bidId: bidId.toString(),
                bidder,
                price: price.toString(),
            };
            this.logger.debug(`BidPlaced #${payload.bidId} for job ${payload.jobId}`);
            this.websocketGateway.emitBlockchainEvent('orderbook.bidPlaced', payload);
        };
        const bidAccepted = (jobId, bidId, poster, agent) => {
            const payload = {
                jobId: jobId.toString(),
                bidId: bidId.toString(),
                poster,
                agent,
            };
            this.logger.debug(`BidAccepted job ${payload.jobId}`);
            this.websocketGateway.emitBlockchainEvent('orderbook.bidAccepted', payload);
        };
        const bidResponseSubmitted = (jobId, bidId, responseURI) => {
            const payload = {
                jobId: jobId.toString(),
                bidId: bidId.toString(),
                responseUri: responseURI,
            };
            this.logger.debug(`BidResponseSubmitted job ${payload.jobId} bid ${payload.bidId}`);
            this.websocketGateway.emitBlockchainEvent('orderbook.bidResponseSubmitted', payload);
        };
        const deliverySubmitted = (jobId, bidId, proofHash) => {
            const payload = {
                jobId: jobId.toString(),
                bidId: bidId.toString(),
                proofHash,
            };
            this.logger.debug(`DeliverySubmitted for job ${payload.jobId}`);
            this.websocketGateway.emitBlockchainEvent('orderbook.deliverySubmitted', payload);
        };
        const jobApproved = (jobId, bidId) => {
            const payload = {
                jobId: jobId.toString(),
                bidId: bidId.toString(),
            };
            this.logger.debug(`JobApproved ${payload.jobId}`);
            this.websocketGateway.emitBlockchainEvent('orderbook.jobApproved', payload);
        };
        contract.on('JobPosted', jobPosted);
        contract.on('BidPlaced', bidPlaced);
        contract.on('BidAccepted', bidAccepted);
        contract.on('DeliverySubmitted', deliverySubmitted);
        contract.on('BidResponseSubmitted', bidResponseSubmitted);
        contract.on('JobApproved', jobApproved);
        this.subscriptions.push({ off: () => contract.off('JobPosted', jobPosted) }, { off: () => contract.off('BidPlaced', bidPlaced) }, { off: () => contract.off('BidAccepted', bidAccepted) }, { off: () => contract.off('DeliverySubmitted', deliverySubmitted) }, { off: () => contract.off('BidResponseSubmitted', bidResponseSubmitted) }, { off: () => contract.off('JobApproved', jobApproved) });
    }
    subscribeEscrowEvents() {
        const contract = this.web3Service.escrow.read;
        const escrowCreated = (jobId, user, agent, amount) => {
            const payload = {
                jobId: jobId.toString(),
                user,
                agent,
                amount: amount.toString(),
            };
            this.logger.debug(`EscrowCreated job ${payload.jobId}`);
            this.websocketGateway.emitBlockchainEvent('escrow.created', payload);
        };
        const paymentReleased = (jobId, agent, payout, fee) => {
            const payload = {
                jobId: jobId.toString(),
                agent,
                payout: payout.toString(),
                fee: fee.toString(),
            };
            this.logger.debug(`PaymentReleased job ${payload.jobId}`);
            this.websocketGateway.emitBlockchainEvent('escrow.paymentReleased', payload);
        };
        const paymentRefunded = (jobId, user, amount) => {
            const payload = {
                jobId: jobId.toString(),
                user,
                amount: amount.toString(),
            };
            this.logger.debug(`PaymentRefunded job ${payload.jobId}`);
            this.websocketGateway.emitBlockchainEvent('escrow.paymentRefunded', payload);
        };
        contract.on('EscrowCreated', escrowCreated);
        contract.on('PaymentReleased', paymentReleased);
        contract.on('PaymentRefunded', paymentRefunded);
        this.subscriptions.push({ off: () => contract.off('EscrowCreated', escrowCreated) }, { off: () => contract.off('PaymentReleased', paymentReleased) }, { off: () => contract.off('PaymentRefunded', paymentRefunded) });
    }
    listenersDisabled() {
        if (this.web3Service.isStubProvider) {
            return true;
        }
        const flag = process.env.DISABLE_BLOCKCHAIN_LISTENERS ??
            process.env.BLOCKCHAIN_LISTENERS_DISABLED;
        if (!flag) {
            return false;
        }
        return ['1', 'true', 'yes'].includes(flag.toLowerCase());
    }
};
exports.BlockchainListenerService = BlockchainListenerService;
exports.BlockchainListenerService = BlockchainListenerService = BlockchainListenerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => job_orchestration_service_1.JobOrchestrationService))),
    __metadata("design:paramtypes", [web3_service_1.Web3Service,
        websocket_gateway_1.WebsocketGateway,
        job_orchestration_service_1.JobOrchestrationService])
], BlockchainListenerService);
//# sourceMappingURL=blockchain-listener.service.js.map