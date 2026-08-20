import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import Stripe from 'stripe';

export interface StripeCredentials {
  secretKey: string;
  webhookSecret: string;
}

/**
 * Stripe Checkout — one option for the "Debit/Credit Card" payment method,
 * selected via Admin -> Payment Settings -> Card Payment -> provider.
 * Note: Stripe does not support payouts to Pakistani bank accounts, so this
 * is only useful as a demo/proof gateway for this business until a
 * Pakistan-viable card provider is chosen for production.
 *
 * Pure credential-in service — never reads env vars or a cached client, so
 * a credential change in Payment Settings takes effect on the very next
 * request with no restart needed.
 */
@Injectable()
export class StripeService {
  private client(secretKey: string): Stripe {
    return new Stripe(secretKey);
  }

  async createCheckoutSession(
    credentials: Pick<StripeCredentials, 'secretKey'>,
    params: {
      orderId: string;
      orderNumber: string;
      amount: number;
      successUrl: string;
      cancelUrl: string;
    },
  ): Promise<{ url: string; sessionId: string }> {
    const session = await this.client(credentials.secretKey).checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'pkr',
            unit_amount: Math.round(params.amount * 100), // smallest currency unit
            product_data: { name: `Order ${params.orderNumber}` },
          },
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: { orderId: params.orderId },
    });

    if (!session.url) {
      throw new ServiceUnavailableException('Stripe did not return a checkout URL');
    }

    return { url: session.url, sessionId: session.id };
  }

  /** Verifies the webhook signature and returns the parsed event — throws if invalid. */
  constructEvent(
    rawBody: Buffer,
    signature: string,
    credentials: StripeCredentials,
  ): Stripe.Event {
    // Throws Stripe.errors.StripeSignatureVerificationError on a bad/forged
    // signature — the caller must not treat that as success.
    return this.client(credentials.secretKey).webhooks.constructEvent(
      rawBody,
      signature,
      credentials.webhookSecret,
    );
  }
}
