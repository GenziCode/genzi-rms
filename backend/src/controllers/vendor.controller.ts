import { Request, Response, NextFunction } from 'express';
import { VendorService } from '../services/vendor.service';
import { successResponse } from '../utils/response';

export class VendorController {
  private vendorService: VendorService;

  constructor() {
    this.vendorService = new VendorService();
  }

  createVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendor = await this.vendorService.createVendor(req.tenant!.id, req.user!.id, req.body);
      res.status(201).json(successResponse(vendor, 'Vendor created successfully', 201));
    } catch (error) {
      next(error);
    }
  };

  getVendors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { search, isActive, sortBy, sortOrder, page, limit } = req.query;
      const result = await this.vendorService.getVendors(req.tenant!.id, {
        search: search as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(successResponse(result, 'Vendors retrieved successfully', 200, {
        pagination: { page: result.page, limit: req.query.limit ? parseInt(req.query.limit as string) : 50, total: result.total, totalPages: result.totalPages },
      }));
    } catch (error) {
      next(error);
    }
  };

  getVendorById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendor = await this.vendorService.getVendorById(req.tenant!.id, req.params.id);
      res.json(successResponse(vendor, 'Vendor retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  updateVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendor = await this.vendorService.updateVendor(req.tenant!.id, req.params.id, req.user!.id, req.body);
      res.json(successResponse(vendor, 'Vendor updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  deleteVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.vendorService.deleteVendor(req.tenant!.id, req.params.id, req.user!.id);
      res.json(successResponse(null, 'Vendor deleted successfully'));
    } catch (error) {
      next(error);
    }
  };

  getVendorStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.vendorService.getVendorStats(req.tenant!.id, req.params.id);
      res.json(successResponse(stats, 'Vendor stats retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };
}

