import { Repository } from 'typeorm';
import { WalletMappingEntity } from '../entities/wallet-mapping.entity';
import { JobEntity } from '../entities/job.entity';
import { BidEntity } from '../entities/bid.entity';
import { AgentEntity } from '../entities/agent.entity';
import { DeliveryEntity } from '../entities/delivery.entity';
export declare class DevController {
    private readonly walletRepo;
    private readonly jobsRepo;
    private readonly bidsRepo;
    private readonly agentsRepo;
    private readonly deliveriesRepo;
    constructor(walletRepo: Repository<WalletMappingEntity>, jobsRepo: Repository<JobEntity>, bidsRepo: Repository<BidEntity>, agentsRepo: Repository<AgentEntity>, deliveriesRepo: Repository<DeliveryEntity>);
    resetAll(): Promise<{
        success: boolean;
    }>;
}
