import { Injectable, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error(
        'STRIPE_SECRET_KEY is not defined in the environment variables',
      );
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-05-28.basil',
    });
  }

  async createCheckoutSession({
    userId,
    programId,
    title,
    amount,
    successUrl,
    cancelUrl,
  }: {
    userId: string;
    programId: string;
    title: string;
    amount: number;
    successUrl: string;
    cancelUrl: string;
  }) {
    // Create Stripe Checkout Session with the (possibly) discounted amount
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Subscription for Program: ${title}`,
            },
            unit_amount: Math.round(amount * 100), // amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        programId,
      },
    });
    return session.url;
  }

  async constructWebhookEvent(payload: Buffer, signature: string) {
    const endpointSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    if (!endpointSecret) {
      throw new Error(
        'STRIPE_WEBHOOK_SECRET is not defined in environment variables',
      );
    }

    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      endpointSecret,
    );
  }

  async getPaymentIntent(paymentIntentId: string): Promise<
    Stripe.PaymentIntent & {
      charges: Stripe.ApiList<
        Stripe.Charge & { invoice?: string | Stripe.Invoice }
      >;
    }
  > {
    const response = await this.stripe.paymentIntents.retrieve(
      paymentIntentId,
      {
        expand: ['charges.data.invoice'],
      },
    );

    return response as unknown as Stripe.PaymentIntent & {
      charges: Stripe.ApiList<
        Stripe.Charge & { invoice?: string | Stripe.Invoice }
      >;
    };
  }

  async getCheckoutSessionDetails(sessionId: string) {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      throw new Error('Checkout session not found');
    }

    const paymentIntent = session.payment_intent
      ? await this.stripe.paymentIntents.retrieve(
          session.payment_intent as string,
        )
      : null;

    return {
      amountTotal: session.amount_total ? session.amount_total / 100 : null, // convert from cents to dollars
      currency: session.currency,
      status: session.payment_status,
      promoCode: session.metadata?.promoCode || null,
      originalAmount: session.metadata?.originalAmount || null,
      discountedAmount: session.metadata?.discountedAmount || null,
      userId: session.metadata?.userId || null,
      planId: session.metadata?.planId || null,
      paymentIntentId: session.payment_intent,
      created: session.created,
      paymentDetails: paymentIntent || null,
    };
  }

  async getInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    return await this.stripe.invoices.retrieve(invoiceId);
  }
}
