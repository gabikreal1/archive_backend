import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentUserEntity } from './agent-user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

interface AgentLoginPayload {
  agentUserId: string;
  email: string;
  scope: 'agent_frontend';
}

@Injectable()
export class AgentAuthService {
  constructor(
    @InjectRepository(AgentUserEntity)
    private readonly usersRepo: Repository<AgentUserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, password: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.usersRepo.findOne({
      where: { email: normalizedEmail },
    });

    if (existing) {
      // Идёмпо безопасному пути: не раскрываем, что пользователь существует
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = this.usersRepo.create({
      email: normalizedEmail,
      passwordHash,
    });

    await this.usersRepo.save(user);
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; agentUserId: string; email: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.usersRepo.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: AgentLoginPayload = {
      agentUserId: user.id,
      email: user.email,
      scope: 'agent_frontend',
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      agentUserId: user.id,
      email: user.email,
    };
  }
}
