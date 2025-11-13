import { Response, NextFunction } from 'express';
import { TenantRequest } from '../types';
import { notificationService } from '../services/notification.service';
import { emailService } from '../utils/email';
import { smsService } from '../utils/sms';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';
import { SettingsService } from '../services/settings.service';
import { monitoringService } from '../utils/monitoring';

export class NotificationController {
  private settingsService = new SettingsService();

  /**
   * Get all notifications for current user
   * GET /api/notifications
   */
  getAll = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    const { type, read, page, limit } = req.query;

    const filters = {
      type: type as any,
      read: read === 'true' ? true : read === 'false' ? false : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    };

    const result = await notificationService.getAll(tenantId, userId, filters);

    sendSuccess(res, result, 'Notifications retrieved successfully');
  });

  /**
   * Get notification by ID
   * GET /api/notifications/:id
   */
  getById = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const notification = await notificationService.getById(tenantId, id);

    sendSuccess(res, { notification }, 'Notification retrieved successfully');
  });

  /**
   * Create notification
   * POST /api/notifications
   */
  create = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;

    const notification = await notificationService.create(tenantId, {
      ...req.body,
      createdBy: userId,
    });

    sendSuccess(res, { notification }, 'Notification created successfully', 201);
  });

  /**
   * Mark notification as read
   * PATCH /api/notifications/:id/read
   */
  markAsRead = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const notification = await notificationService.markAsRead(tenantId, id);

    sendSuccess(res, { notification }, 'Notification marked as read');
  });

  /**
   * Mark all notifications as read
   * PATCH /api/notifications/read-all
   */
  markAllAsRead = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;

    const count = await notificationService.markAllAsRead(tenantId, userId);

    sendSuccess(res, { count }, `${count} notifications marked as read`);
  });

  /**
   * Delete notification
   * DELETE /api/notifications/:id
   */
  delete = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    await notificationService.delete(tenantId, id);

    sendSuccess(res, null, 'Notification deleted successfully');
  });

  /**
   * Send email
   * POST /api/notifications/email
   */
  sendEmail = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const { to, subject, html, text } = req.body;

    const settings = await this.settingsService.getSettings(tenantId, req.tenant?.name || 'Store');
    const emailConfig = settings.notifications?.emailConfig;

    if (
      !settings.notifications?.emailNotifications ||
      !emailConfig?.enabled ||
      !emailConfig.host ||
      !emailConfig.user ||
      !emailConfig.password
    ) {
      return sendSuccess(
        res,
        { sent: false },
        'Email configuration is disabled or incomplete. Please update communication settings.'
      );
    }

    const success = await emailService.sendEmail({
      to,
      subject,
      html,
      text,
      transportOverride: {
        host: emailConfig.host,
        port: emailConfig.port ?? 587,
        secure: emailConfig.secure ?? false,
        auth: {
          user: emailConfig.user,
          pass: emailConfig.password,
        },
        from: emailConfig.fromEmail,
        replyTo: emailConfig.replyTo,
      },
    });

    sendSuccess(
      res,
      { sent: success },
      success ? 'Email sent successfully' : 'Failed to send email'
    );
  });

  /**
   * Send SMS
   * POST /api/notifications/sms
   */
  sendSMS = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const { to, message } = req.body;

    const settings = await this.settingsService.getSettings(tenantId, req.tenant?.name || 'Store');
    const smsConfig = settings.notifications?.smsConfig;

    if (
      !settings.notifications?.smsNotifications ||
      !smsConfig?.enabled ||
      !smsConfig.accountSid ||
      !smsConfig.authToken ||
      !smsConfig.fromNumber
    ) {
      return sendSuccess(
        res,
        { sent: false },
        'SMS configuration is disabled or incomplete. Please update communication settings.'
      );
    }

    const success = await smsService.sendSMS(to, message, {
      provider: smsConfig.provider || 'twilio',
      accountSid: smsConfig.accountSid,
      authToken: smsConfig.authToken,
      fromNumber: smsConfig.fromNumber,
    });

    sendSuccess(res, { sent: success }, success ? 'SMS sent successfully' : 'Failed to send SMS');
  });

  /**
   * Broadcast notification
   * POST /api/notifications/broadcast
   */
  broadcast = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;

    const { title, message, type, channels, actionUrl } = req.body;

    const result = await notificationService.broadcast(tenantId, {
      title,
      message,
      type,
      channels,
      actionUrl,
      createdBy: userId,
    });

    sendSuccess(
      res,
      result,
      `Broadcast queued: ${result.queued} message(s) across ${result.targetCount} users`
    );
  });

  /**
   * Test email configuration
   * POST /api/notifications/test-email
   */
  testEmail = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    const { email } = req.body;

    const settings = await this.settingsService.getSettings(tenantId, req.tenant?.name || 'Store');
    const emailConfig = settings.notifications?.emailConfig;

    if (
      !settings.notifications?.emailNotifications ||
      !emailConfig?.enabled ||
      !emailConfig.host ||
      !emailConfig.user ||
      !emailConfig.password
    ) {
      monitoringService.trackNotificationTest({
        tenantId,
        channel: 'email',
        success: false,
        target: email,
        errorMessage: 'config_incomplete',
      });
      return sendSuccess(
        res,
        { success: false },
        'Email configuration is disabled or incomplete. Please update communication settings.'
      );
    }

    const success = await emailService.sendEmail({
      to: email,
      subject: 'Test Email - Genzi RMS',
      html: '<h1>✅ Email Configuration Test Successful!</h1><p>Your email settings are working correctly.</p>',
      transportOverride: {
        host: emailConfig.host,
        port: emailConfig.port ?? 587,
        secure: emailConfig.secure ?? false,
        auth: {
          user: emailConfig.user,
          pass: emailConfig.password,
        },
        from: emailConfig.fromEmail,
        replyTo: emailConfig.replyTo,
      },
    });

    emailConfig.lastTestedAt = new Date();
    emailConfig.lastTestResult = success ? 'success' : 'failure';
    settings.updatedBy = userId as any;
    settings.markModified?.('notifications');
    await settings.save();

    monitoringService.trackNotificationTest({
      tenantId,
      channel: 'email',
      success,
      target: email,
      errorMessage: success ? undefined : 'delivery_failed',
    });

    sendSuccess(
      res,
      { success },
      success ? 'Test email sent successfully' : 'Failed to send test email'
    );
  });

  /**
   * Test SMS configuration
   * POST /api/notifications/test-sms
   */
  testSMS = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    const { phone } = req.body;

    const settings = await this.settingsService.getSettings(tenantId, req.tenant?.name || 'Store');
    const smsConfig = settings.notifications?.smsConfig;

    if (
      !settings.notifications?.smsNotifications ||
      !smsConfig?.enabled ||
      !smsConfig.accountSid ||
      !smsConfig.authToken ||
      !smsConfig.fromNumber
    ) {
      monitoringService.trackNotificationTest({
        tenantId,
        channel: 'sms',
        success: false,
        target: phone,
        errorMessage: 'config_incomplete',
      });
      return sendSuccess(
        res,
        { success: false },
        'SMS configuration is disabled or incomplete. Please update communication settings.'
      );
    }

    const success = await smsService.sendSMS(
      phone,
      '✅ SMS Test: Your SMS configuration is working! - Genzi RMS',
      {
        provider: smsConfig.provider || 'twilio',
        accountSid: smsConfig.accountSid,
        authToken: smsConfig.authToken,
        fromNumber: smsConfig.fromNumber,
      }
    );

    smsConfig.lastTestedAt = new Date();
    smsConfig.lastTestResult = success ? 'success' : 'failure';
    settings.updatedBy = userId as any;
    settings.markModified?.('notifications');
    await settings.save();

    monitoringService.trackNotificationTest({
      tenantId,
      channel: 'sms',
      success,
      target: phone,
      errorMessage: success ? undefined : 'delivery_failed',
    });

    sendSuccess(res, { success }, success ? 'Test SMS sent successfully' : 'Failed to send test SMS');
  });

  /**
   * Get notification preferences (placeholder)
   * GET /api/notifications/preferences
   */
  getPreferences = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;

    const preferences = await notificationService.getPreferences(tenantId, userId);

    sendSuccess(res, { preferences }, 'Preferences retrieved successfully');
  });

  /**
   * Update notification preferences (placeholder)
   * PUT /api/notifications/preferences
   */
  updatePreferences = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;

    const preferences = await notificationService.updatePreferences(tenantId, userId, req.body);

    sendSuccess(res, { preferences }, 'Preferences updated successfully');
  });
}

export const notificationController = new NotificationController();

