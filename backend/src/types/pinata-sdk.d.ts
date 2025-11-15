declare module '@pinata/sdk' {
  import { Readable } from 'node:stream';

  interface PinataMetadata {
    name?: string;
    keyvalues?: Record<string, string>;
  }

  interface PinJSONToIPFSOptions {
    pinataMetadata?: PinataMetadata;
  }

  interface PinFileToIPFSOptions {
    pinataMetadata?: PinataMetadata;
  }

  interface PinataPinResponse {
    IpfsHash: string;
    PinSize: number;
    Timestamp: string;
  }

  interface PinataClient {
    pinJSONToIPFS(
      body: unknown,
      options?: PinJSONToIPFSOptions,
    ): Promise<PinataPinResponse>;
    pinFileToIPFS(
      stream: Readable,
      options?: PinFileToIPFSOptions,
    ): Promise<PinataPinResponse>;
  }

  function pinataSDK(apiKey: string, secretApiKey: string): PinataClient;

  export = pinataSDK;
}
