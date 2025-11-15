import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IpfsMetadataService } from './metadata.service';
import type {
  AgentProfileMetadataInput,
  BidMetadataInput,
  BidResponseMetadataInput,
  DeliveryProofMetadataInput,
  DisputeEvidenceMetadataInput,
  DisputeResolutionMetadataInput,
  JobMetadataInput,
} from './metadata.types';

@Controller('ipfs/metadata')
export class MetadataController {
  constructor(private readonly metadataService: IpfsMetadataService) {}

  private decodeCid(cid: string): string {
    try {
      return decodeURIComponent(cid);
    } catch {
      return cid;
    }
  }

  @Post('jobs')
  publishJob(@Body() body: JobMetadataInput) {
    return this.metadataService.publishJobMetadata(body);
  }

  @Get('jobs/:cid')
  fetchJob(@Param('cid') cid: string) {
    return this.metadataService.fetchJobMetadata(this.decodeCid(cid));
  }

  @Post('bids')
  publishBid(@Body() body: BidMetadataInput) {
    return this.metadataService.publishBidMetadata(body);
  }

  @Get('bids/:cid')
  fetchBid(@Param('cid') cid: string) {
    return this.metadataService.fetchBidMetadata(this.decodeCid(cid));
  }

  @Post('bid-responses')
  publishBidResponse(@Body() body: BidResponseMetadataInput) {
    return this.metadataService.publishBidResponse(body);
  }

  @Get('bid-responses/:cid')
  fetchBidResponse(@Param('cid') cid: string) {
    return this.metadataService.fetchBidResponseMetadata(this.decodeCid(cid));
  }

  @Post('deliveries')
  publishDelivery(@Body() body: DeliveryProofMetadataInput) {
    return this.metadataService.publishDeliveryProof(body);
  }

  @Get('deliveries/:cid')
  fetchDelivery(@Param('cid') cid: string) {
    return this.metadataService.fetchDeliveryProof(this.decodeCid(cid));
  }

  @Post('disputes/evidence')
  publishDisputeEvidence(@Body() body: DisputeEvidenceMetadataInput) {
    return this.metadataService.publishDisputeEvidence(body);
  }

  @Get('disputes/evidence/:cid')
  fetchDisputeEvidence(@Param('cid') cid: string) {
    return this.metadataService.fetchDisputeEvidence(this.decodeCid(cid));
  }

  @Post('disputes/resolution')
  publishDisputeResolution(@Body() body: DisputeResolutionMetadataInput) {
    return this.metadataService.publishDisputeResolution(body);
  }

  @Get('disputes/resolution/:cid')
  fetchDisputeResolution(@Param('cid') cid: string) {
    return this.metadataService.fetchDisputeResolution(this.decodeCid(cid));
  }

  @Post('agents/profile')
  publishAgentProfile(@Body() body: AgentProfileMetadataInput) {
    return this.metadataService.publishAgentProfile(body);
  }

  @Get('agents/profile/:cid')
  fetchAgentProfile(@Param('cid') cid: string) {
    return this.metadataService.fetchAgentProfile(this.decodeCid(cid));
  }
}
