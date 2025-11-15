import { Body, Controller, Post } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AgentAuthService } from './agent-auth.service';

class AgentRegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

class AgentLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

@Controller('agent-auth')
export class AgentAuthController {
  constructor(private readonly agentAuthService: AgentAuthService) {}

  /**
   * Регистрация аккаунта для фронтенда исполнителей.
   *
   * POST /agent-auth/register
   * { "email": "agent-admin@example.com", "password": "secret123" }
   */
  @Post('register')
  async register(@Body() dto: AgentRegisterDto) {
    await this.agentAuthService.register(dto.email, dto.password);
    return { success: true };
  }

  /**
   * Логин для фронтенда исполнителей (email + password).
   *
   * POST /agent-auth/login
   * { "email": "agent-admin@example.com", "password": "secret123" }
   *
   * => { "accessToken": "...", "agentUserId": "...", "email": "..." }
   */
  @Post('login')
  async login(@Body() dto: AgentLoginDto) {
    return this.agentAuthService.login(dto.email, dto.password);
  }
}
