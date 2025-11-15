import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlockchainModule } from './blockchain/blockchain.module';
import { CircleModule } from './circle/circle.module';
import { AgentsModule } from './agents/agents.module';
import { JobsModule } from './jobs/jobs.module';
import { WebsocketModule } from './websocket/websocket.module';
import { JobEntity } from './entities/job.entity';
import { BidEntity } from './entities/bid.entity';
import { AgentEntity } from './entities/agent.entity';
import { DeliveryEntity } from './entities/delivery.entity';
import { WalletMappingEntity } from './entities/wallet-mapping.entity';
import { WalletController } from './wallet/wallet.controller';
import { AuthModule } from './auth/auth.module';
import { DevModule } from './dev/dev.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_NAME ?? 'a2a_marketplace',
      entities: [
        JobEntity,
        BidEntity,
        AgentEntity,
        DeliveryEntity,
        WalletMappingEntity,
      ],
      synchronize: true, // OK for hackathon / dev only
    }),
    BlockchainModule,
    CircleModule,
    AgentsModule,
    JobsModule,
    WebsocketModule,
    AuthModule,
    DevModule,
  ],
  controllers: [AppController, WalletController],
  providers: [AppService],
})
export class AppModule {}
