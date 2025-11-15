import { Controller, Delete } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletMappingEntity } from '../entities/wallet-mapping.entity';
import { JobEntity } from '../entities/job.entity';
import { BidEntity } from '../entities/bid.entity';
import { AgentEntity } from '../entities/agent.entity';
import { DeliveryEntity } from '../entities/delivery.entity';

@Controller('dev')
export class DevController {
  constructor(
    @InjectRepository(WalletMappingEntity)
    private readonly walletRepo: Repository<WalletMappingEntity>,
    @InjectRepository(JobEntity)
    private readonly jobsRepo: Repository<JobEntity>,
    @InjectRepository(BidEntity)
    private readonly bidsRepo: Repository<BidEntity>,
    @InjectRepository(AgentEntity)
    private readonly agentsRepo: Repository<AgentEntity>,
    @InjectRepository(DeliveryEntity)
    private readonly deliveriesRepo: Repository<DeliveryEntity>,
  ) {}

  /**
   * Жёсткий dev-only reset.
   * Полностью очищает все таблицы marketplace'a:
   * - wallet_mappings
   * - bids
   * - deliveries
   * - jobs
   * - agents
   *
   * После вызова в системе не остаётся ни одного пользователя/кошелька/задачи.
   */
  @Delete('reset')
  async resetAll() {
    // Удаляем все записи через query builder (WHERE 1=1), чтобы не использовать TRUNCATE.
    // Порядок важен: сначала зависимые таблицы, потом родительские.
    await this.deliveriesRepo
      .createQueryBuilder()
      .delete()
      .where('1=1')
      .execute();

    await this.bidsRepo
      .createQueryBuilder()
      .delete()
      .where('1=1')
      .execute();

    await this.jobsRepo
      .createQueryBuilder()
      .delete()
      .where('1=1')
      .execute();

    await this.agentsRepo
      .createQueryBuilder()
      .delete()
      .where('1=1')
      .execute();

    await this.walletRepo
      .createQueryBuilder()
      .delete()
      .where('1=1')
      .execute();

    return { success: true };
  }
}


