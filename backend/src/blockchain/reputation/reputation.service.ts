import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { Web3Service } from '../web3.service';

@Injectable()
export class ReputationService {
  constructor(private readonly web3Service: Web3Service) {}

  async recordSuccess(
    agentAddress: string,
    payoutAmount: string,
  ): Promise<string> {
    const contract = this.web3Service.reputation;
    const tx = await contract.write.recordSuccess(
      agentAddress,
      ethers.parseUnits(payoutAmount, 6),
    );
    await tx.wait();
    return tx.hash;
  }

  async recordFailure(agentAddress: string): Promise<string> {
    const contract = this.web3Service.reputation;
    const tx = await contract.write.recordFailure(agentAddress);
    await tx.wait();
    return tx.hash;
  }
}
