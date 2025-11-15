import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentUserEntity } from './agent-user.entity';
import { AgentAuthService } from './agent-auth.service';
import { AgentAuthController } from './agent-auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AgentUserEntity]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.AGENT_JWT_SECRET ?? 'agent-dev-secret-change-me',
      }),
    }),
  ],
  controllers: [AgentAuthController],
  providers: [AgentAuthService],
  exports: [AgentAuthService],
})
export class AgentAuthModule {}


