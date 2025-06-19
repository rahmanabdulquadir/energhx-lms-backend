import {
  Body,
  Controller,
  Get,
  Headers,
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
import { Request } from 'express';
import { RoleGuardWith } from 'src/utils/RoleGuardWith';
import { UserRole } from '@prisma/client';
import { Response } from 'express';

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

  @Get('all')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
  async getAllPayments(@Res() res: Response) {
    const result = await this.stripeService.getAllPaymentsFromDB();

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'All payment records fetched successfully',
      data: result,
    });
  }
} 
