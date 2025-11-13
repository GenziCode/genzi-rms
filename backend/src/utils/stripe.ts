import Stripe from 'stripe';
import { logger } from './logger';

class StripeService {
  private stripe: Stripe | null = null;

  constructor() {
    this.initializeStripe();
  }

  private initializeStripe() {
    try {
      const secretKey = process.env.STRIPE_SECRET_KEY;

      if (!secretKey) {
        logger.warn('Stripe secret key not configured. Payment functionality will be disabled.');
        return;
      }

      this.stripe = new Stripe(secretKey, {
        apiVersion: '2024-06-20',
        typescript: true,
      });

      logger.info('Stripe client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Stripe client:', error);
    }
  }

  /**
   * Create payment intent
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    metadata?: Record<string, string>
  ): Promise<Stripe.PaymentIntent | null> {
    if (!this.stripe) {
      logger.warn('Stripe not initialized');
      return null;
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        metadata,
      });

      logger.info(`Payment intent created: ${paymentIntent.id} - Amount: ${amount} ${currency}`);

      return paymentIntent;
    } catch (error) {
      logger.error('Failed to create payment intent:', error);
      throw error;
    }
  }

  /**
   * Confirm payment intent
   */
  async confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent | null> {
    if (!this.stripe) {
      return null;
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);
      
      logger.info(`Payment intent confirmed: ${paymentIntentId}`);
      
      return paymentIntent;
    } catch (error) {
      logger.error(`Failed to confirm payment intent ${paymentIntentId}:`, error);
      throw error;
    }
  }

  /**
   * Get payment intent
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent | null> {
    if (!this.stripe) {
      return null;
    }

    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      logger.error(`Failed to retrieve payment intent ${paymentIntentId}:`, error);
      throw error;
    }
  }

  /**
   * Create refund
   */
  async createRefund(
    chargeId: string,
    amount?: number,
    reason?: string
  ): Promise<Stripe.Refund | null> {
    if (!this.stripe) {
      return null;
    }

    try {
      const refund = await this.stripe.refunds.create({
        charge: chargeId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason: reason as Stripe.RefundCreateParams.Reason,
      });

      logger.info(`Refund created: ${refund.id} for charge: ${chargeId}`);

      return refund;
    } catch (error) {
      logger.error(`Failed to create refund for ${chargeId}:`, error);
      throw error;
    }
  }

  /**
   * Create customer
   */
  async createCustomer(
    email: string,
    name: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.Customer | null> {
    if (!this.stripe) {
      return null;
    }

    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata,
      });

      logger.info(`Stripe customer created: ${customer.id}`);

      return customer;
    } catch (error) {
      logger.error('Failed to create Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string
  ): Stripe.Event | null {
    if (!this.stripe) {
      return null;
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.warn('Stripe webhook secret not configured');
      return null;
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      logger.info(`Webhook verified: ${event.type}`);

      return event;
    } catch (error) {
      logger.error('Webhook signature verification failed:', error);
      return null;
    }
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.stripe) {
      return false;
    }

    try {
      await this.stripe.balance.retrieve();
      logger.info('Stripe connection test successful');
      return true;
    } catch (error) {
      logger.error('Stripe connection test failed:', error);
      return false;
    }
  }

  /**
   * Get Stripe instance (for advanced usage)
   */
  getClient(): Stripe | null {
    return this.stripe;
  }
}

export const stripeService = new StripeService();

