import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pinataSDK from '@pinata/sdk';
import axios from 'axios';
import { Readable } from 'node:stream';
type PinataClient = ReturnType<typeof pinataSDK>;

export interface IpfsUploadResult {
  cid: string;
  uri: string;
  gatewayUrl: string;
}

@Injectable()
export class IpfsService {
  private readonly logger = new Logger(IpfsService.name);
  private readonly pinata: PinataClient;
  private readonly gatewayBase: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('PINATA_API_KEY');
    const secretKey = this.configService.get<string>('PINATA_SECRET_KEY');

    if (!apiKey || !secretKey) {
      this.logger.warn(
        'Pinata credentials (PINATA_API_KEY & PINATA_SECRET_KEY) are not set. IpfsService is running in DEV/STUB mode.',
      );
      // Stub‑клиент: генерируем фиктивные CID, чтобы не ломать остальные флоу.
      this.pinata = {
        pinJSONToIPFS: async () => ({
          IpfsHash: `FAKE_JSON_CID_${Date.now()}`,
        }),
        pinFileToIPFS: async () => ({
          IpfsHash: `FAKE_FILE_CID_${Date.now()}`,
        }),
      } as unknown as PinataClient;
    } else {
      this.pinata = pinataSDK(apiKey, secretKey);
    }

    this.gatewayBase =
      this.configService.get<string>('IPFS_GATEWAY_URL') ??
      'https://gateway.pinata.cloud/ipfs/';
  }

  private buildUri(cid: string): string {
    return `ipfs://${cid}`;
  }

  getGatewayUrl(cidOrUri: string): string {
    if (cidOrUri.startsWith('ipfs://')) {
      return `${this.gatewayBase}${cidOrUri.replace('ipfs://', '')}`;
    }
    return `${this.gatewayBase}${cidOrUri}`;
  }

  async uploadJson<T extends object>(
    payload: T,
    name?: string,
  ): Promise<IpfsUploadResult> {
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

  async uploadFile(
    stream: Readable,
    fileName: string,
  ): Promise<IpfsUploadResult> {
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

  async fetchJson<T = unknown>(cidOrUri: string): Promise<T> {
    const url = this.getGatewayUrl(cidOrUri);
    const { data } = await axios.get<T>(url, { timeout: 10_000 });
    return data;
  }

  bufferToStream(buffer: Buffer | string): Readable {
    return typeof buffer === 'string'
      ? Readable.from([buffer])
      : Readable.from(buffer);
  }
}
