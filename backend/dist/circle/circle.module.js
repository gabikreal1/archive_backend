"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircleModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const circle_service_1 = require("./circle/circle.service");
const wallet_service_1 = require("./wallet/wallet.service");
const wallet_mapping_entity_1 = require("../entities/wallet-mapping.entity");
let CircleModule = class CircleModule {
};
exports.CircleModule = CircleModule;
exports.CircleModule = CircleModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([wallet_mapping_entity_1.WalletMappingEntity])],
        providers: [circle_service_1.CircleService, wallet_service_1.WalletService],
        exports: [wallet_service_1.WalletService],
    })
], CircleModule);
//# sourceMappingURL=circle.module.js.map