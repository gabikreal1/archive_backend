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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var IpfsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpfsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sdk_1 = __importDefault(require("@pinata/sdk"));
const axios_1 = __importDefault(require("axios"));
const node_stream_1 = require("node:stream");
let IpfsService = IpfsService_1 = class IpfsService {
    configService;
    logger = new common_1.Logger(IpfsService_1.name);
    pinata;
    gatewayBase;
    constructor(configService) {
        this.configService = configService;
        const apiKey = this.configService.get('PINATA_API_KEY');
        const secretKey = this.configService.get('PINATA_SECRET_KEY');
        if (!apiKey || !secretKey) {
            this.logger.warn('Pinata credentials (PINATA_API_KEY & PINATA_SECRET_KEY) are not set. IpfsService is running in DEV/STUB mode.');
            this.pinata = {
                pinJSONToIPFS: async () => ({
                    IpfsHash: `FAKE_JSON_CID_${Date.now()}`,
                }),
                pinFileToIPFS: async () => ({
                    IpfsHash: `FAKE_FILE_CID_${Date.now()}`,
                }),
            };
        }
        else {
            this.pinata = new sdk_1.default(apiKey, secretKey);
        }
        this.gatewayBase =
            this.configService.get('IPFS_GATEWAY_URL') ??
                'https://gateway.pinata.cloud/ipfs/';
    }
    buildUri(cid) {
        return `ipfs://${cid}`;
    }
    getGatewayUrl(cidOrUri) {
        if (cidOrUri.startsWith('ipfs://')) {
            return `${this.gatewayBase}${cidOrUri.replace('ipfs://', '')}`;
        }
        return `${this.gatewayBase}${cidOrUri}`;
    }
    async uploadJson(payload, name) {
        const response = await this.pinata.pinJSONToIPFS(payload, {
            pinataMetadata: {
                name: name ?? `a2a-json-${Date.now()}`,
            },
        });
        const cid = response.IpfsHash;
        const uri = this.buildUri(cid);
        return {
            cid,
            uri,
            gatewayUrl: this.getGatewayUrl(uri),
        };
    }
    async uploadFile(stream, fileName) {
        const response = await this.pinata.pinFileToIPFS(stream, {
            pinataMetadata: {
                name: fileName,
            },
        });
        const cid = response.IpfsHash;
        const uri = this.buildUri(cid);
        return {
            cid,
            uri,
            gatewayUrl: this.getGatewayUrl(uri),
        };
    }
    async fetchJson(cidOrUri) {
        const url = this.getGatewayUrl(cidOrUri);
        const { data } = await axios_1.default.get(url, { timeout: 10_000 });
        return data;
    }
    bufferToStream(buffer) {
        return typeof buffer === 'string'
            ? node_stream_1.Readable.from([buffer])
            : node_stream_1.Readable.from(buffer);
    }
};
exports.IpfsService = IpfsService;
exports.IpfsService = IpfsService = IpfsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], IpfsService);
//# sourceMappingURL=ipfs.service.js.map