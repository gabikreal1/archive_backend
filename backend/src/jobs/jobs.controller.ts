import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { AcceptBidDto } from './dto/accept-bid.dto';
import { SelectExecutorDto } from './dto/select-executor.dto';
import { SubmitRatingDto } from './dto/submit-rating.dto';
import { JobStatus } from '../entities/job.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createJob(@Req() req: Request, @Body() dto: CreateJobDto) {
    const userId = (req as any).user.userId as string;
    return this.jobsService.createJob(userId, dto);
  }

  @Get(':jobId')
  getJob(@Param('jobId') jobId: string) {
    return this.jobsService.findJob(jobId);
  }

  @Get()
  listJobs(
    @Query('status') status?: JobStatus,
    @Query('tags') tagsRaw?: string,
  ) {
    const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()) : undefined;
    return this.jobsService.listJobs(status, tags);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':jobId/accept')
  acceptBid(
    @Req() req: Request,
    @Param('jobId') jobId: string,
    @Body() dto: AcceptBidDto,
  ) {
    const userId = (req as any).user.userId as string;
    return this.jobsService.acceptBid(userId, jobId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':jobId/select-executor')
  selectExecutor(
    @Param('jobId') jobId: string,
    @Body() dto: SelectExecutorDto,
  ) {
    return this.jobsService.selectExecutor(jobId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':jobId/rating')
  submitRating(
    @Param('jobId') jobId: string,
    @Body() dto: SubmitRatingDto,
  ) {
    return this.jobsService.submitRating(jobId, dto);
  }

  @Post(':jobId/approve')
  approveJob(@Param('jobId') jobId: string) {
    return this.jobsService.approveJob(jobId);
  }
}
