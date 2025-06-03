import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { AuthGuard } from 'src/guard/auth.guard';
import { CreateCheckoutDto } from './payment.dto';
import { Request, Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('payment')
export class PaymentController {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
  ) {}

  @Post('checkout')
  @UseGuards(AuthGuard)
  async createCheckout(@Req() req: Request, @Body() body: CreateCheckoutDto) {
    const { programId, amount } = body;
    const userId = req.user?.id;

    const program = await this.prisma.program.findFirst({
      where: { id: programId },
    });
    if (!program) throw new HttpException('Program not found!', 404);
    const title = program.title;

    const successUrl = 'http://localhost:3000/payment/success';
    const cancelUrl = 'http://localhost:3000/payment/cancel';

    const checkoutSession = await this.stripeService.createCheckoutSession({
      userId,
      programId,
      title,
      amount,
      successUrl,
      cancelUrl,
    });

    return { checkoutSession };
  }

  @Get('/success')
  getSuccess(@Res() res: Response) {
    return res.status(200).json({ message: 'Payment successful!!' });
  }

  @Get('/cancel')
  getCancel(@Res() res: Response) {
    return res.status(200).json({ message: 'Payment cancelled!' });
  }

  @Get('details/:sessionId')
  async getPaymentDetails(@Param('sessionId') sessionId: string) {
    return this.stripeService.getCheckoutSessionDetails(sessionId);
  }
}
