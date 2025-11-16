import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import {
  initiateDeveloperControlledWalletsClient,
  generateEntitySecretCiphertext,
} from '@circle-fin/developer-controlled-wallets';
import { Contract, JsonRpcProvider, Wallet, ethers } from 'ethers';

@Injectable()
export class CircleService {
  private readonly apiKey: string | undefined;
  private readonly client: ReturnType<
    typeof initiateDeveloperControlledWalletsClient
  >;
  // Dev-controlled wallets per Circle docs:
  // https://developers.circle.com/interactive-quickstarts/dev-controlled-wallets
  // entitySecret хранится в env и используется SDK для генерации ciphertext.
  private readonly entitySecret: string | undefined;
  private readonly walletSetId: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('CIRCLE_API_KEY');
    if (!this.apiKey) {
      throw new Error('CIRCLE_API_KEY is not configured');
    }

    this.entitySecret = this.configService.get<string>('CIRCLE_ENTITY_SECRET');
    this.walletSetId = this.configService.get<string>('CIRCLE_WALLET_SET_ID');

    // Инициализируем официальный SDK Dev-Controlled Wallets.
    // По доке: https://developers.circle.com/sdk-explorer/developer-controlled-wallets/Node.js/getting-started
    this.client = initiateDeveloperControlledWalletsClient({
      apiKey: this.apiKey,
      entitySecret: this.entitySecret ?? '',
      baseUrl:
        this.configService.get<string>('CIRCLE_BASE_URL') ??
        'https://api-sandbox.circle.com',
    });
  }

  async createWalletForUser(userId: string): Promise<{
    circleWalletId: string;
    walletAddress: string;
  }> {
    if (!this.entitySecret) {
      throw new Error('CIRCLE_ENTITY_SECRET is not configured');
    }
    if (!this.walletSetId) {
      throw new Error('CIRCLE_WALLET_SET_ID is not configured');
    }

    try {
      // На каждый вызов генерируем новый entitySecretCiphertext через SDK,
      // как рекомендует quickstart (для ротации и безопасности).
      // Сам SDK использует entitySecret для подписи запросов, но helper
      // generateEntitySecretCiphertext дополнительно подтверждает, что
      // конфигурация корректна и готова к использованию.
      const entitySecretCiphertext = await generateEntitySecretCiphertext({
        apiKey: this.apiKey as string,
        entitySecret: this.entitySecret,
      });
      // Можно залогировать при отладке, но не сохраняем его:
      // console.debug('Generated entitySecretCiphertext', entitySecretCiphertext);

      const idempotencyKey = randomUUID();

      // Шаг 1: создаём кошелёк(ки) через SDK.
      // По SDK-примеру: client.createWallets({ blockchains, count, walletSetId })
      // Здесь blockchains нужно заменить на реальный идентификатор Arc Testnet.
      const blockchains = ['ARC-TESTNET'] as any; // TODO: реальный код сети из Circle docs, тип Blockchain[]

      const walletsResponse = await this.client.createWallets({
        idempotencyKey,
        walletSetId: this.walletSetId,
        blockchains,
        count: 1,
        accountType: 'SCA',
      });

      const walletsData: any = walletsResponse.data;
      const createdWallet =
        walletsData?.wallets?.[0] ?? walletsData?.data?.wallets?.[0];

      const circleWalletId: string =
        createdWallet?.id ?? createdWallet?.walletId;
      const walletAddress: string =
        createdWallet?.address ??
        createdWallet?.addressOnNetwork ??
        createdWallet?.addresses?.[0]?.address;

      if (!circleWalletId || !walletAddress) {
        throw new Error(
          `Unexpected Circle create wallet response: ${JSON.stringify(
            walletsData,
          )}`,
        );
      }

      return { circleWalletId, walletAddress };
    } catch (err: any) {
      console.error('[Circle] createWalletForUser error', err);
      // Без stub-кошельков: любые ошибки Circle пробрасываем наверх,
      // чтобы явно видеть проблемы конфигурации/окружения.
      throw err;
    }
  }

  async getWalletBalance(circleWalletId: string): Promise<string> {
    const usdcAddressEnv =
      this.configService.get<string>('CIRCLE_USDC_TOKEN_ADDRESS') ??
      this.configService.get<string>('USDC_TOKEN_ADDRESS');

    try {
      const response = await this.client.getWalletTokenBalance({
        id: circleWalletId,
        // Если известен адрес токена USDC, сузим выборку по нему.
        ...(usdcAddressEnv && { tokenAddresses: [usdcAddressEnv] }),
        includeAll: !usdcAddressEnv,
      } as any);

      const payload: any = (response as any).data ?? response;
      const tokenBalances: any[] =
        payload?.tokenBalances ??
        payload?.data?.tokenBalances ??
        payload?.balances ??
        [];

      if (Array.isArray(tokenBalances) && tokenBalances.length > 0) {
        // Ищем именно USDC по адресу токена, а если он не настроен – по символу.
        const match =
          tokenBalances.find((b) =>
            usdcAddressEnv
              ? b?.token?.tokenAddress?.toLowerCase() ===
                usdcAddressEnv.toLowerCase()
              : b?.token?.symbol === 'USDC',
          ) ?? tokenBalances[0];

        const amount = match?.amount;
        if (typeof amount === 'string' && amount.trim()) {
          return amount;
        }
      }

      // Если Circle не дал нам явный баланс (или он 0), для дев-окружения
      // пробуем показать реальный onchain USDC-баланс операторского кошелька,
      // с которого сейчас фактически уходят средства в escrow.
      const onchainFallback = await this.getOperatorOnchainUsdcBalance().catch(
        () => '0.0',
      );
      return onchainFallback;
    } catch (err) {
      console.error('[Circle] getWalletBalance error', err);
      const onchainFallback = await this.getOperatorOnchainUsdcBalance().catch(
        () => '0.0',
      );
      return onchainFallback;
    }
  }

  async createDepositSession(params: {
    circleWalletId: string;
    amount: string;
    paymentMethod?: string;
  }): Promise<string> {
    // Сейчас Dev-controlled SDK не занимается CPN/fiat on-ramp напрямую,
    // поэтому оставляем этот метод как заглушку, возвращающую фиктивный URL.
    // TODO: интегрировать Circle Payments / CPN при необходимости.
    console.warn(
      '[Circle] createDepositSession is using a stub URL; integrate Circle Payments for real deposits',
    );
    return `https://pay.circle.com/checkout/mock?walletId=${encodeURIComponent(
      params.circleWalletId,
    )}&amount=${encodeURIComponent(params.amount)}`;
  }

  async approveEscrowSpend(params: {
    circleWalletId: string;
    amount: string;
  }): Promise<void> {
  /**
   * Реальный onchain‑approve USDC для Escrow контракта через Dev‑controlled wallet пользователя.
   *
   * Поток:
   * 1. Берём адреса USDC и Escrow из env (`USDC_TOKEN_ADDRESS`, `ESCROW_ADDRESS`);
   * 2. Конвертируем amount (строка в человеко‑читаемом USDC) в минимальные единицы (6 знаков);
   * 3. Через Circle SDK инициируем контрактную транзакцию `USDC.approve(escrow, amountRaw)`
   *    от имени developer‑controlled кошелька пользователя (`walletId = circleWalletId`);
   * 4. Circle возвращает id транзакции; финальный статус отслеживается вебхуками / polling'ом.
   */
  const usdcAddress =
    this.configService.get<string>('USDC_TOKEN_ADDRESS') ??
    this.configService.get<string>('CIRCLE_USDC_TOKEN_ADDRESS');
  const escrowAddress =
    this.configService.get<string>('ESCROW_ADDRESS') ??
    this.configService.get<string>('CIRCLE_ESCROW_ADDRESS');

  if (!usdcAddress) {
    throw new Error(
      'USDC_TOKEN_ADDRESS (or CIRCLE_USDC_TOKEN_ADDRESS) is not configured – cannot perform Circle escrow approve',
    );
  }
  if (!escrowAddress) {
    throw new Error(
      'ESCROW_ADDRESS (or CIRCLE_ESCROW_ADDRESS) is not configured – cannot perform Circle escrow approve',
    );
  }

  const decimals = 6;
  const amountBigInt = BigInt(
    Math.round(Number(params.amount) * 10 ** decimals),
  );
  const amountRaw = amountBigInt.toString(10);

  const idempotencyKey = randomUUID();

  try {
    const response = await this.client.createContractExecutionTransaction({
      idempotencyKey,
      walletId: params.circleWalletId,
      contractAddress: usdcAddress,
      abiFunctionSignature: 'approve(address,uint256)',
      abiParameters: [escrowAddress, amountRaw],
      fee: {
        type: 'level',
        config: {
          feeLevel: 'MEDIUM',
        },
      },
    } as any);

    const data: any = response.data;
    const txId =
      data?.id ??
      data?.transaction?.id ??
      data?.transactions?.[0]?.id ??
      data?.transactions?.[0]?.transaction?.id;

    console.log(
      '[Circle] approveEscrowSpend submitted',
      txId ? `txId=${txId}` : '(no tx id in response)',
    );
  } catch (err) {
    console.error('[Circle] approveEscrowSpend error', err);
    throw err;
  }
  }

  /**
   * DEV helper: получить фактический onchain USDC-баланс операторского кошелька,
   * с которого сейчас уходят средства в escrow. Используется как fallback для
   * отображения баланса в /wallet/balance, когда Circle-кошелёк не отражает
   * реальные движения средств.
   */
  private async getOperatorOnchainUsdcBalance(): Promise<string> {
    const rpcUrl =
      this.configService.get<string>('ARC_RPC_URL') ??
      'https://arc-testnet-rpc.placeholder';
    const chainId = Number(
      this.configService.get<string>('ARC_CHAIN_ID') ?? 5042002,
    );

    const usdcAddress =
      this.configService.get<string>('USDC_TOKEN_ADDRESS') ??
      this.configService.get<string>('CIRCLE_USDC_TOKEN_ADDRESS');
    const operatorPrivateKey = this.configService.get<string>(
      'WEB3_OPERATOR_PRIVATE_KEY',
    );

    if (!usdcAddress || !operatorPrivateKey) {
      return '0.0';
    }

    const provider = new JsonRpcProvider(rpcUrl, chainId);
    const owner = new Wallet(operatorPrivateKey, provider).address;

    const erc20Abi = [
      'function balanceOf(address owner) view returns (uint256)',
      'function decimals() view returns (uint8)',
    ];

    const token = new Contract(usdcAddress, erc20Abi, provider);
    const [rawBalance, decimals] = await Promise.all([
      token.balanceOf(owner),
      token.decimals().catch(() => 6),
    ]);

    return ethers.formatUnits(rawBalance, decimals);
  }
}
