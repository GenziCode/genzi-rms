import { Router, Request, Response } from 'express';
import { paymentController } from '../controllers/payment.controller';
import express from 'express';

const router = Router();

/**
 * POST /webhooks/stripe
 * Stripe webhook handler
 * Note: This route needs raw body, so it's configured differently
 */
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  paymentController.stripeWebhook
);

export default router;

