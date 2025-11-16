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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const jwt_1 = require("@nestjs/jwt");
const wallet_service_1 = require("../circle/wallet/wallet.service");
let AuthService = class AuthService {
    configService;
    jwtService;
    walletService;
    constructor(configService, jwtService, walletService) {
        this.configService = configService;
        this.jwtService = jwtService;
        this.walletService = walletService;
    }
    async loginWithEmail(email) {
        const normalizedEmail = email.trim().toLowerCase();
        const userId = normalizedEmail;
        await this.walletService.getOrCreateMapping(userId);
        const payload = { userId };
        const token = await this.jwtService.signAsync(payload, {});
        return {
            accessToken: token,
            userId,
        };
    }
    async verifyToken(token) {
        return this.jwtService.verifyAsync(token, {
            secret: this.getJwtSecret(),
        });
    }
    getJwtSecret() {
        return (this.configService.get('JWT_SECRET') ?? 'dev-secret-change-me');
    }
    getJwtExpiresIn() {
        return this.configService.get('JWT_EXPIRES_IN') ?? '7d';
    }
    getCircleAuthUrl(providedState) {
        const baseUrl = this.configService.get('CIRCLE_AUTH_BASE_URL') ??
            'https://auth.circle.com';
        const clientId = this.configService.get('CIRCLE_AUTH_CLIENT_ID');
        const redirectUri = this.configService.get('CIRCLE_AUTH_REDIRECT_URI');
        const scope = this.configService.get('CIRCLE_AUTH_SCOPE') ??
            'openid offline_access';
        if (!clientId || !redirectUri) {
            throw new Error('CIRCLE_AUTH_CLIENT_ID или CIRCLE_AUTH_REDIRECT_URI не заданы в env');
        }
        const state = providedState || (0, crypto_1.randomUUID)();
        const url = new URL('/oauth2/authorize', baseUrl);
        url.searchParams.set('client_id', clientId);
        url.searchParams.set('redirect_uri', redirectUri);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('scope', scope);
        url.searchParams.set('state', state);
        return {
            url: url.toString(),
            state,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        jwt_1.JwtService,
        wallet_service_1.WalletService])
], AuthService);
//# sourceMappingURL=auth.service.js.map