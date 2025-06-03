import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { StripeModule } from '../stripe/stripe.module';

@Module({
  imports: [StripeModule],
  controllers: [PaymentController],
  providers: []
})
export class PaymentModule {}
