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
exports.WalletMappingEntity = void 0;
const typeorm_1 = require("typeorm");
let WalletMappingEntity = class WalletMappingEntity {
    userId;
    circleWalletId;
    walletAddress;
    createdAt;
};
exports.WalletMappingEntity = WalletMappingEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'user_id' }),
    __metadata("design:type", String)
], WalletMappingEntity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'circle_wallet_id' }),
    __metadata("design:type", String)
], WalletMappingEntity.prototype, "circleWalletId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'wallet_address' }),
    __metadata("design:type", String)
], WalletMappingEntity.prototype, "walletAddress", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], WalletMappingEntity.prototype, "createdAt", void 0);
exports.WalletMappingEntity = WalletMappingEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'wallet_mappings' })
], WalletMappingEntity);
//# sourceMappingURL=wallet-mapping.entity.js.map