import { AgentAuthService } from './agent-auth.service';
declare class AgentRegisterDto {
    email: string;
    password: string;
}
declare class AgentLoginDto {
    email: string;
    password: string;
}
export declare class AgentAuthController {
    private readonly agentAuthService;
    constructor(agentAuthService: AgentAuthService);
    register(dto: AgentRegisterDto): Promise<{
        success: boolean;
    }>;
    login(dto: AgentLoginDto): Promise<{
        accessToken: string;
        agentUserId: string;
        email: string;
    }>;
}
export {};
