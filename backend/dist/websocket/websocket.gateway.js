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
var WebsocketGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const agents_service_1 = require("../agents/agents/agents.service");
let WebsocketGateway = WebsocketGateway_1 = class WebsocketGateway {
    agentsService;
    logger = new common_1.Logger(WebsocketGateway_1.name);
    server;
    constructor(agentsService) {
        this.agentsService = agentsService;
    }
    handleConnection(client) {
        this.logger.debug(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.debug(`Client disconnected: ${client.id}`);
    }
    broadcastNewJob(job) {
        this.server.emit('new_job', job);
    }
    broadcastNewBid(bid) {
        this.server.emit('new_bid', bid);
    }
    notifyJobAwarded(job, bid) {
        this.server.emit('job_awarded', { job, bid });
    }
    notifyDeliverySubmitted(job, payload) {
        this.server.emit('delivery_submitted', { job, payload });
    }
    notifyPaymentReleased(job, bid) {
        this.server.emit('payment_released', { job, bid });
    }
    emitBlockchainEvent(event, payload) {
        this.server.emit(`chain:${event}`, payload);
    }
    handlePing(data) {
        return { event: 'pong', data };
    }
    getConversationRoom(conversationId) {
        return `conversation:${conversationId}`;
    }
    handleAgentJoin(client, payload) {
        if (!payload?.conversationId) {
            client.emit('agent_error', {
                message: 'conversationId is required',
            });
            return;
        }
        const room = this.getConversationRoom(payload.conversationId);
        client.join(room);
        this.logger.debug(`Client ${client.id} joined conversation ${payload.conversationId}`);
    }
    async handleAgentUserMessage(client, payload) {
        if (!payload?.conversationId || !payload?.message) {
            client.emit('agent_error', {
                message: 'conversationId and message are required',
            });
            return;
        }
        const room = this.getConversationRoom(payload.conversationId);
        const botReply = await this.agentsService.handleUserMessage(payload);
        this.server.to(room).emit('agent_bot_message', botReply);
    }
};
exports.WebsocketGateway = WebsocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], WebsocketGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('ping'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WebsocketGateway.prototype, "handlePing", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('agent_join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], WebsocketGateway.prototype, "handleAgentJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('agent_user_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleAgentUserMessage", null);
exports.WebsocketGateway = WebsocketGateway = WebsocketGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [agents_service_1.AgentsService])
], WebsocketGateway);
//# sourceMappingURL=websocket.gateway.js.map