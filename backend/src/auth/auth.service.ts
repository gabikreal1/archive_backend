import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';

interface LoginPayload {
  userId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Примитивный, но настоящий логин: мы принимаем email (или любой userId),
   * генерируем для него JWT и дальше все запросы фронта должны передавать
   * этот токен в Authorization: Bearer <token>.
   *
   * Можно легко заменить на пароль/OTP/соцсети позже, не меняя остальной код.
   */
  async loginWithEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const userId = normalizedEmail;

    const payload: LoginPayload = { userId };
    const token = await this.jwtService.signAsync<LoginPayload>(payload, {});

    return {
      accessToken: token,
      userId,
    };
  }

  async verifyToken(token: string): Promise<LoginPayload> {
    return this.jwtService.verifyAsync<LoginPayload>(token, {
      secret: this.getJwtSecret(),
    });
  }

  private getJwtSecret(): string {
    return (
      this.configService.get<string>('JWT_SECRET') ?? 'dev-secret-change-me'
    );
  }

  private getJwtExpiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN') ?? '7d';
  }

  /**
   * Возвращает URL, на который фронт должен редиректить пользователя
   * для прохождения Circle Auth (OAuth2 / OIDC‑подобный флоу).
   *
   * Все реальные значения client_id, redirect_uri и пр. задаём через env.
   */
  getCircleAuthUrl(providedState?: string) {
    const baseUrl =
      this.configService.get<string>('CIRCLE_AUTH_BASE_URL') ??
      'https://auth.circle.com'; // заглушка, подставь реальный base URL из доки Circle

    const clientId = this.configService.get<string>('CIRCLE_AUTH_CLIENT_ID');
    const redirectUri = this.configService.get<string>(
      'CIRCLE_AUTH_REDIRECT_URI',
    );
    const scope =
      this.configService.get<string>('CIRCLE_AUTH_SCOPE') ??
      'openid offline_access';

    if (!clientId || !redirectUri) {
      throw new Error(
        'CIRCLE_AUTH_CLIENT_ID или CIRCLE_AUTH_REDIRECT_URI не заданы в env',
      );
    }

    const state = providedState || randomUUID();

    const url = new URL('/oauth2/authorize', baseUrl);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', scope);
    url.searchParams.set('state', state);

    return {
      url: url.toString(),
      state,
    };
  }
}
