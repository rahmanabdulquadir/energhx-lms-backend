import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  Param,
  Post,
  RawBodyRequest,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { AuthGuard } from 'src/guard/auth.guard';
import { CreateCheckoutDto } from './payment.dto';
import { Request, Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('w/payment')
export class PaymentController {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
  ) {}

  @Post('checkout')
  @UseGuards(AuthGuard)
  async createCheckout(@Req() req: Request, @Body() body: CreateCheckoutDto) {
    const userId = req.user?.id;
    const useremail = req.user?.email;

    const checkoutSession = await this.stripeService.createCheckoutSession(
      body,
      userId,
      useremail,
    );

    return { checkoutSession };
  }

  @Post('webhook')
  async webhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.stripeService.handleWebhook(req);
  }

  // @Get('/success')
  // getSuccess(@Res() res: Response) {
  //   return res.status(200).json({ message: 'Payment successful!!' });
  // }

  // @Get('/cancel')
  // getCancel(@Res() res: Response) {
  //   return res.status(200).json({ message: 'Payment cancelled!' });
  // }

  @Get('details/:sessionId')
  async getPaymentDetails(@Param('sessionId') sessionId: string) {
    return this.stripeService.getCheckoutSessionDetails(sessionId);
  }
}
