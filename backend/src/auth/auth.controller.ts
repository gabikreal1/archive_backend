import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { IsEmail } from 'class-validator';

class LoginDto {
  @IsEmail()
  email: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Реальный login‑эндпоинт для фронта.
   * Фронт шлёт email, бэкенд отвечает JWT и userId.
   *
   * POST /auth/login
   * { "email": "user@example.com" }
   *
   * => { "accessToken": "...", "userId": "user@example.com" }
   */
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.loginWithEmail(dto.email);
  }

  /**
   * Старт авторизации через Circle Auth.
   *
   * Фронт вызывает:
   *   GET /auth/circle/start
   * Получает:
   *   { url, state }
   * и дальше открывает этот url (WebView / браузер) для прохождения авторизации.
   */
  @Get('circle/start')
  getCircleAuthUrl(@Query('state') state?: string) {
    return this.authService.getCircleAuthUrl(state);
  }
}


