import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  RawBodyRequest,
} from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { Request } from 'express';
import { UserProgramStatus } from '@prisma/client';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new HttpException(
        'STRIPE_SECRET_KEY is not defined in the environment variables',
        HttpStatus.BAD_REQUEST,
      );
    }
    console.log(stripeSecretKey);
    this.stripe = new Stripe(stripeSecretKey);
  }

  async createCheckoutSession(
    body: { programId: string },
    userId: string,
    useremail: string,
  ) {
    const { programId } = body;

    const program = await this.prisma.program.findFirst({
      where: { id: programId },
    });
    if (!program) throw new HttpException('Program not found!', 404);

    console.log("userId and programId before creating session in createCheckoutSession -> ", userId, programId);
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: useremail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Instant Payment',
            },
            unit_amount: program.price * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:3000/payment/success',
      cancel_url: 'http://localhost:3000/payment/success',
      payment_intent_data: {
        metadata: {
          userId,
          programId,
        },
      },
    });

    if (!session?.url)
      throw new BadRequestException('Stripe session creation failed');
    return session.url;
  }

  async handleWebhook(req: RawBodyRequest<Request>) {
    const signature = req.headers['stripe-signature'] as string;
    const rawBody = req.rawBody;
  
    if (!rawBody) {
      console.error('❌ No rawBody found in request');
      throw new BadRequestException('No webhook payload was provided.');
    }
  
    let event: Stripe.Event;
  
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        'whsec_24a924834485446726efd0eaeb8659641ab104ca62b6c1833664dc1a3665baf0',
      );
    } catch (err) {
      console.error('❌ Stripe signature verification failed:', err.message);
      throw new BadRequestException('Invalid Stripe signature');
    }
  
    console.log('✅ Stripe event received:', event.type);
  
    const data = event.data.object as Stripe.PaymentIntent;
    const metadata = data.metadata;
  
    console.log('📦 Metadata:', metadata);
    console.log('🔎 PaymentIntent ID:', data.id);
  
    const userId = metadata.userId;
    const programId = metadata.programId;
  
    if (event.type === 'payment_intent.succeeded') {
      if (!userId || !programId) {
        console.warn('⚠️ Missing metadata fields:', { userId, programId });
        return { received: true, warning: 'Missing metadata' };
      }
  
      const existing = await this.prisma.userProgram.findUnique({
        where: {
          userId_programId: {
            userId,
            programId,
          },
        },
      });
  
      if (!existing) {
        console.warn('⚠️ No userProgram found for:', { userId, programId });
        return { received: true, warning: 'No matching userProgram found' };
      }
  
      await this.prisma.userProgram.update({
        where: {
          userId_programId: {
            userId,
            programId,
          },
        },
        data: {
          paymentIntentId: data.id,
          status: UserProgramStatus.STANDARD,
        },
      });
  
      console.log('✅ userProgram updated:', { userId, programId, paymentIntentId: data.id });
    }
  
    if (event.type === 'payment_intent.payment_failed') {
      console.warn('⚠️ Payment failed for:', { userId, programId });
      // Optional: mark it failed in DB
    }
  
    return { received: true, type: event.type };
  }
  

  // async constructWebhookEvent(payload: Buffer, signature: string) {
  //   const endpointSecret = this.configService.get<string>(
  //     'STRIPE_WEBHOOK_SECRET',
  //   );
  //   if (!endpointSecret) {
  //     throw new Error(
  //       'STRIPE_WEBHOOK_SECRET is not defined in environment variables',
  //     );
  //   }

  //   return this.stripe.webhooks.constructEvent(
  //     payload,
  //     signature,
  //     endpointSecret,
  //   );
  // }

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
      throw new HttpException('Checkout session not found', 404);
    }

    const paymentIntent = session.payment_intent
      ? await this.stripe.paymentIntents.retrieve(
          session.payment_intent as string,
        )
      : null;

      console.log("Metadata inside getCheckoutSessionDetails -> ", session.metadata)
    return {
      amountTotal: session.amount_total ? session.amount_total / 100 : null, // convert from cents to dollars
      currency: session.currency,
      status: session.payment_status,
      promoCode: session.metadata?.promoCode || null,
      originalAmount: session.metadata?.originalAmount || null,
      discountedAmount: session.metadata?.discountedAmount || null,
      userId: session.metadata?.userId || null,
      programId: session.metadata?.programId || null,
      paymentIntentId: session.payment_intent,
      created: session.created,
      paymentDetails: paymentIntent || null,
    };
  }

  async getInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    return await this.stripe.invoices.retrieve(invoiceId);
  }
}
