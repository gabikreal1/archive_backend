import { Repository } from 'typeorm';
import { AgentUserEntity } from './agent-user.entity';
import { JwtService } from '@nestjs/jwt';
export declare class AgentAuthService {
    private readonly usersRepo;
    private readonly jwtService;
    constructor(usersRepo: Repository<AgentUserEntity>, jwtService: JwtService);
    register(email: string, password: string): Promise<void>;
    login(email: string, password: string): Promise<{
        accessToken: string;
        agentUserId: string;
        email: string;
    }>;
}
