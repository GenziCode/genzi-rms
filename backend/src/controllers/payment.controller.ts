import { Response, NextFunction, Request } from 'express';
import { TenantRequest } from '../types';
import { paymentService } from '../services/payment.service';
import { stripeService } from '../utils/stripe';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import { SettingsService } from '../services/settings.service';
import { monitoringService } from '../utils/monitoring';

export class PaymentController {
  private settingsService = new SettingsService();

  /**
   * Create payment intent
   * POST /api/payments/intent
   */
  createIntent = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;

    const result = await paymentService.createIntent(tenantId, userId, req.body);

    sendSuccess(res, result, 'Payment intent created successfully', 201);
  });

  /**
   * Confirm payment
   * POST /api/payments/confirm
   */
  confirmPayment = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const { paymentIntentId } = req.body;

    const payment = await paymentService.confirmPayment(tenantId, paymentIntentId);

    sendSuccess(res, { payment }, 'Payment confirmed successfully');
  });

  /**
   * Get all payments
   * GET /api/payments
   */
  getAll = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const { status, method, customerId, startDate, endDate, page, limit } = req.query;

    const filters = {
      status: status as any,
      method: method as string,
      customerId: customerId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    };

    const result = await paymentService.getAll(tenantId, filters);

    sendSuccess(res, result, 'Payments retrieved successfully');
  });

  /**
   * Get payment by ID
   * GET /api/payments/:id
   */
  getById = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const payment = await paymentService.getById(tenantId, id);

    sendSuccess(res, { payment }, 'Payment retrieved successfully');
  });

  /**
   * Process refund
   * POST /api/payments/:id/refund
   */
  refund = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const { amount, reason } = req.body;

    const payment = await paymentService.refund(tenantId, id, amount, reason);

    sendSuccess(res, { payment }, 'Refund processed successfully');
  });

  /**
   * Stripe webhook handler
   * POST /webhooks/stripe
   */
  stripeWebhook = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      res.status(400).send('Missing stripe-signature header');
      return;
    }

    const event = stripeService.verifyWebhookSignature(req.body, signature);

    if (!event) {
      res.status(400).send('Invalid signature');
      return;
    }

    // Handle different event types
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          logger.info(`PaymentIntent succeeded: ${event.data.object.id}`);
          // Auto-confirm payment (alternative to manual confirm endpoint)
          // const paymentIntent = event.data.object as any;
          // await paymentService.confirmPayment(tenantId, paymentIntent.id);
          break;

        case 'payment_intent.payment_failed':
          logger.warn(`PaymentIntent failed: ${event.data.object.id}`);
          break;

        case 'charge.refunded':
          logger.info(`Charge refunded: ${event.data.object.id}`);
          break;

        default:
          logger.debug(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      logger.error('Webhook handler error:', error);
      res.status(500).send('Webhook handler failed');
    }
  });

  /**
   * Test Stripe connection
   * POST /api/payments/test-stripe
   */
  testStripe = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    const success = await stripeService.testConnection();

    await this.settingsService.recordStripeTestResult(tenantId, userId, success);

    monitoringService.trackPaymentTest({
      tenantId,
      provider: 'stripe',
      success,
    });

    sendSuccess(
      res,
      { connected: success },
      success ? 'Stripe connection successful' : 'Stripe connection failed'
    );
  });
}

export const paymentController = new PaymentController();

