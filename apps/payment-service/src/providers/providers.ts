export interface CreateCheckoutSessionData {
  orderId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

export interface PaymentProvider {
  createCheckoutSession(
    data: CreateCheckoutSessionData,
  ): Promise<CheckoutSessionResult>;

  constructWebhookEvent(
    rawBody: string | Buffer,
    signature: string,
  ): Promise<unknown>;
}
