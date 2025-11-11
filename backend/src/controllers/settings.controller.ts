import { Request, Response, NextFunction } from 'express';
import { SettingsService } from '../services/settings.service';
import { successResponse } from '../utils/response';

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
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;

      const settings = await this.settingsService.updateStoreSettings(tenantId, userId, req.body);

      res.json(successResponse(settings, 'Store settings updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update business settings
   * PUT /api/settings/business
   */
  updateBusinessSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;

      const settings = await this.settingsService.updateBusinessSettings(
        tenantId,
        userId,
        req.body
      );

      res.json(successResponse(settings, 'Business settings updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update tax settings
   * PUT /api/settings/tax
   */
  updateTaxSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;

      const settings = await this.settingsService.updateTaxSettings(tenantId, userId, req.body);

      res.json(successResponse(settings, 'Tax settings updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update receipt settings
   * PUT /api/settings/receipt
   */
  updateReceiptSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;

      const settings = await this.settingsService.updateReceiptSettings(tenantId, userId, req.body);

      res.json(successResponse(settings, 'Receipt settings updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update POS settings
   * PUT /api/settings/pos
   */
  updatePOSSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;

      const settings = await this.settingsService.updatePOSSettings(tenantId, userId, req.body);

      res.json(successResponse(settings, 'POS settings updated successfully'));
    } catch (error) {
      next(error);
    }
  };
}
