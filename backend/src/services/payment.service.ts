import { getTenantConnection } from '../config/database';
import { PaymentSchema, IPayment, PaymentStatus } from '../models/payment.model';
import { InvoiceSchema } from '../models/invoice.model';
import { NotFoundError, BadRequestError } from '../utils/appError';
import { logger } from '../utils/logger';
import { stripeService } from '../utils/stripe';

export class PaymentService {
  /**
   * Create payment intent (Stripe)
   */
  async createIntent(
    tenantId: string,
    userId: string,
    data: {
      amount: number;
      currency?: string;
      invoiceId?: string;
      customerId?: string;
      description?: string;
    }
  ): Promise<any> {
    const currency = data.currency || 'USD';

    // Create Stripe payment intent
    const paymentIntent = await stripeService.createPaymentIntent(
      data.amount,
      currency,
      {
        tenantId,
        invoiceId: data.invoiceId || '',
        customerId: data.customerId || '',
      }
    );

    if (!paymentIntent) {
      throw new BadRequestError('Failed to create payment intent');
    }

    // Create payment record
    const tenantConn = await getTenantConnection(tenantId);
    const Payment = tenantConn.model<IPayment>('Payment', PaymentSchema);

    const payment = new Payment({
      tenantId,
      invoiceId: data.invoiceId,
      customerId: data.customerId,
      amount: data.amount,
      currency: currency.toUpperCase(),
      method: 'card',
      gateway: 'stripe',
      status: 'pending',
      stripePaymentIntentId: paymentIntent.id,
      description: data.description,
      createdBy: userId,
    });

    await payment.save();

    logger.info(`Payment intent created: ${paymentIntent.id} - Amount: ${data.amount} ${currency}`);

    return {
      paymentId: payment._id,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: data.amount,
      currency,
    };
  }

  /**
   * Confirm payment (after Stripe confirmation)
   */
  async confirmPayment(
    tenantId: string,
    paymentIntentId: string
  ): Promise<IPayment> {
    const tenantConn = await getTenantConnection(tenantId);
    const Payment = tenantConn.model<IPayment>('Payment', PaymentSchema);

    const payment = await Payment.findOne({ tenantId, stripePaymentIntentId: paymentIntentId });

    if (!payment) {
      throw new NotFoundError('Payment');
    }

    // Get payment intent from Stripe
    const paymentIntent = await stripeService.getPaymentIntent(paymentIntentId);

    if (!paymentIntent) {
      throw new BadRequestError('Failed to retrieve payment intent from Stripe');
    }

    // Update payment status
    if (paymentIntent.status === 'succeeded') {
      payment.status = 'completed';
      payment.processedAt = new Date();
      
      // Extract card details if available
      if (paymentIntent.charges?.data[0]) {
        const charge = paymentIntent.charges.data[0];
        payment.stripeChargeId = charge.id;
        payment.receiptUrl = charge.receipt_url || undefined;
        
        if (charge.payment_method_details?.card) {
          payment.cardLast4 = charge.payment_method_details.card.last4;
          payment.cardBrand = charge.payment_method_details.card.brand;
        }
      }
      
      await payment.save();

      // Update invoice if linked
      if (payment.invoiceId) {
        await this.updateInvoicePayment(tenantId, payment);
      }

      logger.info(`Payment confirmed: ${payment._id} - Stripe: ${paymentIntentId}`);
    } else {
      payment.status = 'failed';
      await payment.save();
      throw new BadRequestError(`Payment ${paymentIntent.status}`);
    }

    return payment;
  }

  /**
   * Get all payments
   */
  async getAll(
    tenantId: string,
    filters: {
      status?: PaymentStatus;
      method?: string;
      customerId?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const tenantConn = await getTenantConnection(tenantId);
    const Payment = tenantConn.model<IPayment>('Payment', PaymentSchema);

    const query: any = { tenantId };

    if (filters.status) query.status = filters.status;
    if (filters.method) query.method = filters.method;
    if (filters.customerId) query.customerId = filters.customerId;

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('customerId', 'name email phone')
        .populate('invoiceId', 'invoiceNumber total')
        .lean(),
      Payment.countDocuments(query),
    ]);

    return {
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get payment by ID
   */
  async getById(tenantId: string, paymentId: string): Promise<IPayment> {
    const tenantConn = await getTenantConnection(tenantId);
    const Payment = tenantConn.model<IPayment>('Payment', PaymentSchema);

    const payment = await Payment.findOne({ _id: paymentId, tenantId })
      .populate('customerId', 'name email phone')
      .populate('invoiceId', 'invoiceNumber total')
      .populate('createdBy', 'firstName lastName email');

    if (!payment) {
      throw new NotFoundError('Payment');
    }

    return payment;
  }

  /**
   * Process refund
   */
  async refund(
    tenantId: string,
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<IPayment> {
    const tenantConn = await getTenantConnection(tenantId);
    const Payment = tenantConn.model<IPayment>('Payment', PaymentSchema);

    const payment = await Payment.findOne({ _id: paymentId, tenantId });

    if (!payment) {
      throw new NotFoundError('Payment');
    }

    if (payment.status !== 'completed') {
      throw new BadRequestError('Can only refund completed payments');
    }

    const refundAmount = amount || payment.amount;

    if (refundAmount > (payment.amount - (payment.refundedAmount || 0))) {
      throw new BadRequestError('Refund amount exceeds available amount');
    }

    // Process Stripe refund
    if (payment.gateway === 'stripe' && payment.stripeChargeId) {
      const refund = await stripeService.createRefund(
        payment.stripeChargeId,
        refundAmount,
        reason
      );

      if (!refund) {
        throw new BadRequestError('Failed to process refund with Stripe');
      }
    }

    // Update payment record
    payment.refundedAmount = (payment.refundedAmount || 0) + refundAmount;
    payment.refundReason = reason;
    payment.refundedAt = new Date();

    if (payment.refundedAmount >= payment.amount) {
      payment.status = 'refunded';
    } else {
      payment.status = 'partially_refunded';
    }

    await payment.save();

    logger.info(`Refund processed: ${payment._id} - Amount: ${refundAmount}`);

    return payment;
  }

  /**
   * Update invoice when payment is confirmed
   */
  private async updateInvoicePayment(tenantId: string, payment: IPayment): Promise<void> {
    if (!payment.invoiceId) return;

    const tenantConn = await getTenantConnection(tenantId);
    const Invoice = tenantConn.model('Invoice', InvoiceSchema);

    const invoice = await Invoice.findById(payment.invoiceId);
    if (!invoice) return;

    // Add payment to invoice
    if (!invoice.payments) {
      invoice.payments = [];
    }

    invoice.payments.push({
      method: payment.method,
      amount: payment.amount,
      reference: payment.stripeChargeId || payment.reference,
      date: payment.processedAt || new Date(),
    });

    invoice.amountPaid += payment.amount;
    invoice.amountDue = invoice.total - invoice.amountPaid;

    if (invoice.amountDue <= 0) {
      invoice.status = 'paid';
    } else {
      invoice.status = 'partial';
    }

    await invoice.save();

    logger.info(`Invoice updated with payment: ${invoice.invoiceNumber}`);
  }
}

export const paymentService = new PaymentService();

