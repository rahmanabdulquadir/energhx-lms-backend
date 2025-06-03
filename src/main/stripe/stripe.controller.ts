// import { Controller, Post, Headers, Req, Res } from '@nestjs/common';
// import { StripeService } from './stripe.service';
// import { Request, Response } from 'express';
// import { PrismaService } from 'src/prisma/prisma.service';
// import Stripe from 'stripe';
// import { PaymentStatus } from '@prisma/client';

// @Controller('webhook/stripe')
// export class StripeController {
//   constructor(
//     private readonly stripeService: StripeService,
//     private readonly prisma: PrismaService,
//   ) {}

//   @Post()
//   async handleWebhook(
//     @Req() request: Request,
//     @Res() response: Response,
//     @Headers('stripe-signature') signature: string,
//   ) {
//     let event: Stripe.Event;
//     try {
//       event = await this.stripeService.constructWebhookEvent(
//         request.body,
//         signature,
//       );
//     } catch (err) {
//       console.error('❌ Webhook signature verification failed.', err.message);
//       return response.status(400).send(`Webhook Error: ${err.message}`);
//     }

//     console.log('Here is the event', event);

//     // Handle checkout.session.completed
//     if (event.type === 'checkout.session.completed') {
//       const session = event.data.object as Stripe.Checkout.Session;
//       const userId = session.metadata?.userId;
//       const programId = session.metadata?.programId;
//       const paymentIntentId = session.payment_intent as string;

//       if (!userId || !programId || !paymentIntentId) {
//         console.warn('⚠️ Missing metadata in session. Skipping.');
//         return response.status(400).send({ message: 'Missing metadata' });
//       }
//       try {
//         const existing = await this.prisma.userProgram.findFirst({
//           where: { paymentIntentId },
//         });
//         if (existing) {
//           console.log('ℹ️ Subscription already exists. Skipping duplicate.');
//           return response.status(200).send('Duplicate event handled');
//         }

//         // Try fetching payment intent and invoice
//         let invoiceUrl: string | null = null;
//         try {
//           const paymentIntent =
//             await this.stripeService.getPaymentIntent(paymentIntentId);
//           const charge = paymentIntent?.charges?.data?.[0];
//           if (charge?.invoice && typeof charge.invoice === 'string') {
//             const invoice = await this.stripeService.getInvoice(charge.invoice);
//             invoiceUrl = invoice?.hosted_invoice_url || null;
//           }
//         } catch (err) {
//           console.error('❌ Failed to fetch invoice:', err.message);
//         }
//         console.log('🚀 Starting DB transaction...', userId, programId);
//         const result = await this.prisma.userProgram.create({
//           data: {
//             userId,
//             programId,
//             paymentStatus: PaymentStatus.SUCCESS,
//             paymentIntentId,
//             paymentMethod: 'card',
//             invoiceUrl,
//           },
//         });

//         console.log('📦 Transaction result:', JSON.stringify(result, null, 2));
//       } catch (error) {
//         console.error('❌ Failed to save subscription:', error.message);
//         return response
//           .status(500)
//           .send({ message: 'Failed to save subscription' });
//       }
//     } else {
//       console.log('📌 Received unhandled event type:', event.type);
//     }
//     return response.status(200).send('Webhook received');
//   }
// }

