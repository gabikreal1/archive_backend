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
    const rpcUrl = this.configService.get<string>('ARC_RPC_URL');
    if (!rpcUrl) {
      throw new Error('ARC_RPC_URL is required to bootstrap Web3Service.');
    }

    const chainId = Number(
      this.configService.get<string>('ARC_CHAIN_ID') ?? 5042002,
    );
    this.provider = new JsonRpcProvider(rpcUrl, chainId);

    const privateKey = this.configService.get<string>(
      'WEB3_OPERATOR_PRIVATE_KEY',
    );
    if (!privateKey) {
      throw new Error(
        'WEB3_OPERATOR_PRIVATE_KEY is required to sign blockchain transactions.',
      );
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
    const address = this.configService.get<string>(addressKey);
    if (!address) {
      throw new Error(`Missing contract address env: ${addressKey}`);
    }

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
}
