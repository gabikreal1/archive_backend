import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { WalletService } from '../circle/wallet/wallet.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @UseGuards(JwtAuthGuard)
  @Get('balance')
  async getBalance(@Req() req: Request) {
    const userId = (req as any).user.userId as string;
    return this.walletService.getUserBalance(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('deposit')
  async createDeposit(
    @Req() req: Request,
    @Body() dto: CreateDepositDto,
  ) {
    const userId = (req as any).user.userId as string;
    return this.walletService.createDepositSession({
      userId,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
    });
  }
}
