import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Contract,
  ContractTransactionReceipt,
  Interface,
  InterfaceAbi,
  JsonRpcProvider,
  LogDescription,
  Wallet,
} from 'ethers';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type ContractKey =
  | 'orderBook'
  | 'escrow'
  | 'jobRegistry'
  | 'agentRegistry'
  | 'reputation'
  | 'usdc';

export interface ContractBundle {
  address: string;
  read: Contract;
  write: Contract;
  iface: Interface;
}

@Injectable()
export class Web3Service {
  private readonly logger = new Logger(Web3Service.name);
  readonly provider: JsonRpcProvider;
  readonly signer: Wallet;
  readonly isStubProvider: boolean;

  private readonly abiBasePath: string;
  private readonly abiCache = new Map<string, InterfaceAbi>();
  private readonly contracts: Record<ContractKey, ContractBundle>;

  private static readonly ERC20_ABI: InterfaceAbi = [
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
  ];

  constructor(private readonly configService: ConfigService) {
    // --- DEV‑friendly bootstrap: do not hard‑fail when envs are missing ---

    const defaultRpcUrl = 'https://arc-testnet-rpc.placeholder';
    const rpcUrl =
      this.configService.get<string>('ARC_RPC_URL') ?? defaultRpcUrl;
    this.isStubProvider = rpcUrl === defaultRpcUrl;

    const chainId = Number(
      this.configService.get<string>('ARC_CHAIN_ID') ?? 5042002,
    );
    this.provider = new JsonRpcProvider(rpcUrl, chainId);

    // Ethers v6 will attempt to use ENS resolution (resolveName -> getEnsAddress)
    // whenever something that looks like a name (e.g. "foo.eth") is passed in.
    //
    // Our ARC network (chainId 5042002) does not support ENS, so these calls
    // surface as unhandled `UNSUPPORTED_OPERATION: network does not support ENS`
    // errors. This started happening after dependency updates, even though our
    // code does not intentionally use ENS.
    //
    // To make the backend robust on non‑ENS networks, we wrap `resolveName`
    // for *this* provider instance and gracefully fall back to `null` when
    // ENS is not available. Any callers that truly require ENS can still
    // detect the `null` return value and handle it explicitly.
    const originalResolveName = this.provider.resolveName.bind(this.provider);
    this.provider.resolveName = (async (name: string) => {
      try {
        return await originalResolveName(name);
      } catch (error: any) {
        if (
          error &&
          typeof error === 'object' &&
          (error as { code?: string }).code === 'UNSUPPORTED_OPERATION' &&
          (error as { operation?: string }).operation === 'getEnsAddress'
        ) {
          this.logger.warn(
            `ENS resolution attempted on a non‑ENS network for "${name}". Returning null instead.`,
          );
          return null;
        }
        throw error;
      }
    }) as (typeof this.provider)['resolveName'];
    // Уменьшаем частоту поллинга, чтобы не спамить RPC (особенно на dev RPC с лимитами).
    // Значение в миллисекундах; 15000 ≈ 1 запрос в 15 секунд.
    (this.provider as any).pollingInterval = Number(
      this.configService.get<string>('WEB3_POLLING_INTERVAL_MS') ?? 15000,
    );
    if (this.isStubProvider) {
      this.suppressRpcNoise();
    }

    let privateKey = this.configService.get<string>(
      'WEB3_OPERATOR_PRIVATE_KEY',
    );
    if (!privateKey) {
      this.logger.warn(
        'WEB3_OPERATOR_PRIVATE_KEY is not set. Web3Service is running in DEV/STUB mode; real blockchain transactions may fail.',
      );
      // Генерируем временный in‑memory ключ, чтобы не падать на старте.
      privateKey = Wallet.createRandom().privateKey;
    }
    this.signer = new Wallet(privateKey, this.provider);

    this.abiBasePath =
      this.configService.get<string>('ABIS_BASE_PATH') ??
      join(process.cwd(), '..', 'ABIS');

    this.contracts = {
      orderBook: this.bootstrapContract('ORDERBOOK_ADDRESS', 'OrderBook'),
      escrow: this.bootstrapContract('ESCROW_ADDRESS', 'Escrow'),
      jobRegistry: this.bootstrapContract(
        'JOB_REGISTRY_ADDRESS',
        'JobRegistry',
      ),
      agentRegistry: this.bootstrapContract(
        'AGENT_REGISTRY_ADDRESS',
        'AgentRegistry',
      ),
      reputation: this.bootstrapContract(
        'REPUTATION_TOKEN_ADDRESS',
        'IReputationEmitter',
      ),
      usdc: this.bootstrapContract(
        'USDC_TOKEN_ADDRESS',
        'ERC20',
        Web3Service.ERC20_ABI,
      ),
    } as Record<ContractKey, ContractBundle>;
  }

  getContract(key: ContractKey): ContractBundle {
    return this.contracts[key];
  }

  get orderBook() {
    return this.getContract('orderBook');
  }

  get escrow() {
    return this.getContract('escrow');
  }

  get jobRegistry() {
    return this.getContract('jobRegistry');
  }

  get agentRegistry() {
    return this.getContract('agentRegistry');
  }

  get reputation() {
    return this.getContract('reputation');
  }

  get usdc() {
    return this.getContract('usdc');
  }

  parseEvent(
    contract: ContractBundle,
    receipt: ContractTransactionReceipt | null,
    eventName: string,
  ): LogDescription | null {
    if (!receipt) {
      return null;
    }
    for (const log of receipt.logs ?? []) {
      try {
        const parsed = contract.iface.parseLog(log);
        if (parsed && parsed.name === eventName) {
          return parsed;
        }
      } catch {
        // ignore unrelated logs
      }
    }
    return null;
  }

  private bootstrapContract(
    addressKey: string,
    abiName: string,
    abiOverride?: InterfaceAbi,
  ): ContractBundle {
    const address =
      this.configService.get<string>(addressKey) ??
      '0x0000000000000000000000000000000000000000';

    if (!this.configService.get<string>(addressKey)) {
      this.logger.warn(
        `Missing contract address env: ${addressKey}. Using stub address ${address} (DEV mode).`,
      );
    }

    // If no ABI override is provided (e.g. for ERC20), load the ABI from the ABIS folder.
    // This "re‑enables" full onchain functionality – contracts will expose their methods
    // like postJob / placeBid / etc. instead of being empty stubs.
    const abi = abiOverride ?? this.loadAbi(abiName);
    const iface = new Interface(abi);
    const read = new Contract(address, abi, this.provider);
    const write = new Contract(address, abi, this.signer);
    this.logger.verbose(`Bootstrapped contract ${abiName} @ ${address}`);

    return { address, read, write, iface };
  }

  private loadAbi(contractName: string): InterfaceAbi {
    if (this.abiCache.has(contractName)) {
      return this.abiCache.get(contractName)!;
    }

    const filePath = join(this.abiBasePath, `${contractName}.json`);
    const raw = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    const abiCandidate =
      parsed && typeof parsed === 'object' && 'abi' in parsed
        ? (parsed as { abi?: InterfaceAbi }).abi
        : (parsed as InterfaceAbi);
    if (!abiCandidate) {
      throw new Error(`ABI missing in ${filePath}`);
    }
    this.abiCache.set(contractName, abiCandidate);
    return abiCandidate;
  }

  private suppressRpcNoise() {
    const noopFilterMethods = new Set([
      'eth_newFilter',
      'eth_newBlockFilter',
      'eth_newPendingTransactionFilter',
      'eth_getFilterChanges',
      'eth_getFilterLogs',
      'eth_uninstallFilter',
    ]);

    const originalSend = this.provider.send.bind(this.provider);

    this.provider.send = (async (
      method: string,
      params: Array<unknown>,
    ): Promise<any> => {
      if (!noopFilterMethods.has(method)) {
        return originalSend(method, params);
      }

      switch (method) {
        case 'eth_newFilter':
        case 'eth_newBlockFilter':
        case 'eth_newPendingTransactionFilter':
          return '0x0';
        case 'eth_uninstallFilter':
          return true;
        default:
          return [];
      }
    }) as typeof this.provider.send;

    this.logger.verbose(
      'Stub Web3 provider detected – RPC filter calls will be no-oped to keep logs clean.',
    );
  }
}
