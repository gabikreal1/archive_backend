import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import {
  initiateDeveloperControlledWalletsClient,
  generateEntitySecretCiphertext,
} from '@circle-fin/developer-controlled-wallets';

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

  async getWalletBalance(_circleWalletId: string): Promise<string> {
    try {
      // SDK должен иметь метод получения балансов; если его нет в текущей версии,
      // можно оставить тут HTTP-вызов. Для MVP возвращаем 0.0, чтобы не ломать фронт.
      // TODO: заменить на client.getWalletBalances(…) когда он доступен.
      // const balancesResponse = await this.client.getWalletBalances({ walletId: _circleWalletId });
      // ...
      return '0.0';
    } catch (err) {
      console.error('[Circle] getWalletBalance error', err);
      // Для стабильности фронта в MVP возвращаем 0.0 при ошибке.
      return '0.0';
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
    // Для dev-controlled кошельков Circle SDK работает на уровне транзакций,
    // а "approve escrow" будет частью отдельного флоу инициирования транзакции.
    // На уровне MVP оставляем этот метод пустым, чтобы не блокировать флоу.
    console.warn(
      '[Circle] approveEscrowSpend is a no-op stub; integrate real escrow approval flow later',
    );
    return;
  }
}
