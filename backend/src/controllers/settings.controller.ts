import { Request, Response, NextFunction } from 'express';
import { SettingsService } from '../services/settings.service';
import { sendSuccess, successResponse } from '../utils/response';

export class SettingsController {
  private settingsService: SettingsService;

  constructor() {
    this.settingsService = new SettingsService();
  }

  /**
   * Get settings
   * GET /api/settings
   */
  getSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const storeName = req.tenant?.name || 'Store';

      const settings = await this.settingsService.getSettings(tenantId, storeName);

      res.json(successResponse(settings, 'Settings retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update store settings
   * PUT /api/settings/store
   */
  updateStoreSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId.toString();
      const userId = req.user!.id;

      const store = await this.settingsService.updateStoreSettings(tenantId, userId, req.body);
      sendSuccess(res, store, 'Store settings updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update business settings
   * PUT /api/settings/business
   */
  getBusinessSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const business = await this.settingsService.getBusinessSettings(tenantId);
      sendSuccess(res, business, 'Business settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  updateBusinessSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;

      const business = await this.settingsService.updateBusinessSettings(
        tenantId,
        userId,
        req.body
      );

      sendSuccess(res, business, 'Business settings updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update tax settings
   * PUT /api/settings/tax
   */
  getTaxSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const tax = await this.settingsService.getTaxSettings(tenantId);
      sendSuccess(res, tax, 'Tax settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  updateTaxSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;

      const tax = await this.settingsService.updateTaxSettings(tenantId, userId, req.body);
      sendSuccess(res, tax, 'Tax settings updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update receipt settings
   * PUT /api/settings/receipt
   */
  getReceiptSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const receipt = await this.settingsService.getReceiptSettings(tenantId);
      sendSuccess(res, receipt, 'Receipt settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  updateReceiptSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;

      const receipt = await this.settingsService.updateReceiptSettings(tenantId, userId, req.body);
      sendSuccess(res, receipt, 'Receipt settings updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update POS settings
   * PUT /api/settings/pos
   */
  getPOSSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const pos = await this.settingsService.getPOSSettings(tenantId);
      sendSuccess(res, pos, 'POS settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  updatePOSSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId.toString();
      const userId = req.user!.id;

      const pos = await this.settingsService.updatePOSSettings(tenantId, userId, req.body);
      sendSuccess(res, pos, 'POS settings updated successfully');
    } catch (error) {
      next(error);
    }
  };

  getPaymentSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const payments = await this.settingsService.getPaymentSettings(tenantId);
      sendSuccess(res, payments, 'Payment settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  updatePaymentSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;

      const payments = await this.settingsService.updatePaymentSettings(tenantId, userId, req.body);

      sendSuccess(res, payments, 'Payment settings updated successfully');
    } catch (error) {
      next(error);
    }
  };

  getIntegrationSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const integrations = await this.settingsService.getIntegrationSettings(tenantId);
      sendSuccess(res, integrations, 'Integration settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  updateIntegrationSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;

      const integrations = await this.settingsService.updateIntegrationSettings(
        tenantId,
        userId,
        req.body
      );

      sendSuccess(res, integrations, 'Integration settings updated successfully');
    } catch (error) {
      next(error);
    }
  };

  getComplianceSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const compliance = await this.settingsService.getComplianceSettings(tenantId);
      sendSuccess(res, compliance, 'Compliance settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  updateComplianceSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;

      const compliance = await this.settingsService.updateComplianceSettings(
        tenantId,
        userId,
        req.body
      );

      sendSuccess(res, compliance, 'Compliance settings updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get communication (email/SMS) settings
   * GET /api/settings/communications
   */
  getCommunicationSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;

      const payload = await this.settingsService.getCommunicationSettings(tenantId);

      res.json(successResponse(payload, 'Communication settings retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update communication (email/SMS) settings
   * PUT /api/settings/communications
   */
  updateCommunicationSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;

      const payload = await this.settingsService.updateCommunicationSettings(
        tenantId,
        userId,
        req.body
      );

      res.json(successResponse(payload, 'Communication settings updated successfully'));
    } catch (error) {
      next(error);
    }
  };
}
