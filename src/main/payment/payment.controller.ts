import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { AuthGuard } from 'src/guard/auth.guard';
import { CreateCheckoutDto } from './payment.dto';
import { Request } from 'express';

@Controller('payment')
export class PaymentController {
  constructor(private stripeService: StripeService) {}

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
    console.log('⚡️ Webhook HIT!');
    return this.stripeService.handleWebhook(req);
  }

  @Get('details/:sessionId')
  async getPaymentDetails(@Param('sessionId') sessionId: string) {
    return this.stripeService.getCheckoutSessionDetails(sessionId);
  }
} 
