import { Web3Service } from '../web3.service';
export declare class ReputationService {
    private readonly web3Service;
    constructor(web3Service: Web3Service);
    recordSuccess(agentAddress: string, payoutAmount: string): Promise<string>;
    recordFailure(agentAddress: string): Promise<string>;
}
