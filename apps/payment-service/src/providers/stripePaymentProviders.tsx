import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Stripe from 'stripe';

import {
  CreateCheckoutSessionData,
  CheckoutSessionResult,
  PaymentProvider,
} from './payment.provider';

@Injectable()
export class StripePaymentProvider implements PaymentProvider {
  private readonly stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(secretKey);
  }

  async createCheckoutSession(
    data: CreateCheckoutSessionData,
  ): Promise<CheckoutSessionResult> {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      data.items.map((item) => ({
        price_data: {
          currency: process.env.STRIPE_CURRENCY ?? 'brl',
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.unitPrice * 100),
        },
        quantity: item.quantity,
      }));

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',

      payment_method_types: ['card'],

      line_items: lineItems,

      success_url: data.successUrl,
      cancel_url: data.cancelUrl,

      metadata: {
        orderId: data.orderId,
        userId: data.userId,
      },
    });

    if (!session.url) {
      throw new InternalServerErrorException(
        'Stripe did not return a checkout URL',
      );
    }

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  constructWebhookEvent(
    rawBody: string | Buffer,
    signature: string,
  ): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  }
}
