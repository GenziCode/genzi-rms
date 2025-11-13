import twilio from 'twilio';
import { logger } from './logger';

class SMSService {
  private client: any = null;
  private fromNumber: string = '';

  constructor() {
    this.initializeTwilio();
  }

  private initializeTwilio() {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

      if (!accountSid || !authToken || !this.fromNumber) {
        logger.warn('Twilio credentials not configured. SMS functionality will be disabled.');
        return;
      }

      this.client = twilio(accountSid, authToken);
      logger.info('Twilio client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Twilio client:', error);
    }
  }

  async sendSMS(
    to: string,
    message: string,
    override?: {
      provider: 'twilio';
      accountSid: string;
      authToken: string;
      fromNumber: string;
    }
  ): Promise<boolean> {
    if (override) {
      try {
        const overrideClient = twilio(override.accountSid, override.authToken);
        const result = await overrideClient.messages.create({
          body: message,
          from: override.fromNumber,
          to,
        });
        logger.info(`SMS sent via override config to ${to}. SID: ${result.sid}`);
        return true;
      } catch (error) {
        logger.error(`Failed to send SMS via override config to ${to}:`, error);
        return false;
      }
    }

    if (!this.client) {
      logger.warn('Twilio client not initialized. Skipping SMS send.');
      return false;
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: to,
      });

      logger.info(`SMS sent successfully to ${to}. SID: ${result.sid}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send SMS to ${to}:`, error);
      return false;
    }
  }

  async sendOrderConfirmation(
    phone: string,
    orderNumber: string,
    amount: number,
    customerName: string
  ): Promise<boolean> {
    const message = `Hi ${customerName}, your order #${orderNumber} for $${amount.toFixed(2)} has been confirmed. Thank you for your business! - Genzi RMS`;
    return this.sendSMS(phone, message);
  }

  async sendPaymentReceipt(
    phone: string,
    invoiceNumber: string,
    amount: number,
    customerName: string
  ): Promise<boolean> {
    const message = `Hi ${customerName}, payment of $${amount.toFixed(2)} received for invoice ${invoiceNumber}. Thank you! - Genzi RMS`;
    return this.sendSMS(phone, message);
  }

  async sendLowStockAlert(
    phone: string,
    productName: string,
    currentStock: number,
    minStock: number
  ): Promise<boolean> {
    const message = `ALERT: ${productName} is running low! Current stock: ${currentStock}, Min: ${minStock}. Please reorder. - Genzi RMS`;
    return this.sendSMS(phone, message);
  }

  async sendShippingNotification(
    phone: string,
    trackingNumber: string,
    customerName: string
  ): Promise<boolean> {
    const message = `Hi ${customerName}, your order has shipped! Tracking #: ${trackingNumber}. Track at: [URL] - Genzi RMS`;
    return this.sendSMS(phone, message);
  }

  async testConnection(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      // Validate credentials by fetching account info
      await this.client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      logger.info('Twilio connection test successful');
      return true;
    } catch (error) {
      logger.error('Twilio connection test failed:', error);
      return false;
    }
  }

  isConfigured(): boolean {
    return Boolean(this.client);
  }
}

export const smsService = new SMSService();

