import { ConfigService } from '@nestjs/config';
import { Readable } from 'node:stream';
export interface IpfsUploadResult {
    cid: string;
    uri: string;
    gatewayUrl: string;
}
export declare class IpfsService {
    private readonly configService;
    private readonly logger;
    private readonly pinata;
    private readonly gatewayBase;
    constructor(configService: ConfigService);
    private buildUri;
    getGatewayUrl(cidOrUri: string): string;
    uploadJson<T extends object>(payload: T, name?: string): Promise<IpfsUploadResult>;
    uploadFile(stream: Readable, fileName: string): Promise<IpfsUploadResult>;
    fetchJson<T = unknown>(cidOrUri: string): Promise<T>;
    bufferToStream(buffer: Buffer | string): Readable;
}
