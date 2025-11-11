import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customer.service';
import { successResponse } from '../utils/response';
import { AppError } from '../utils/appError';

export class CustomerController {
  private customerService: CustomerService;

  constructor() {
    this.customerService = new CustomerService();
  }

  /**
   * Create customer
   * POST /api/customers
   */
  createCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;

      const customer = await this.customerService.createCustomer(
        tenantId,
        userId,
        req.body
      );

      res
        .status(201)
        .json(successResponse(customer, 'Customer created successfully', 201));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all customers
   * GET /api/customers
   */
  getCustomers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { search, loyaltyTier, isActive, sortBy, sortOrder, page, limit } =
        req.query;

      const result = await this.customerService.getCustomers(tenantId, {
        search: search as string,
        loyaltyTier: loyaltyTier as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json(
        successResponse(result, 'Customers retrieved successfully', 200, {
          pagination: {
            page: result.page,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
            total: result.total,
            totalPages: result.totalPages,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get customer by ID
   * GET /api/customers/:id
   */
  getCustomerById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { id } = req.params;

      const customer = await this.customerService.getCustomerById(tenantId, id);

      res.json(successResponse(customer, 'Customer retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update customer
   * PUT /api/customers/:id
   */
  updateCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { id } = req.params;

      const customer = await this.customerService.updateCustomer(
        tenantId,
        id,
        userId,
        req.body
      );

      res.json(successResponse(customer, 'Customer updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete customer
   * DELETE /api/customers/:id
   */
  deleteCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { id } = req.params;

      await this.customerService.deleteCustomer(tenantId, id, userId);

      res.json(successResponse(null, 'Customer deleted successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get purchase history
   * GET /api/customers/:id/history
   */
  getPurchaseHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { id } = req.params;
      const { page, limit } = req.query;

      const result = await this.customerService.getPurchaseHistory(
        tenantId,
        id,
        page ? parseInt(page as string) : undefined,
        limit ? parseInt(limit as string) : undefined
      );

      res.json(
        successResponse(result, 'Purchase history retrieved successfully', 200, {
          pagination: {
            page: result.page,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
            total: result.total,
            totalPages: result.totalPages,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add/Redeem loyalty points
   * POST /api/customers/:id/points
   */
  adjustLoyaltyPoints = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { id } = req.params;
      const { points, reason } = req.body;

      if (!points || points === 0) {
        throw new AppError('Points value is required and cannot be zero', 400);
      }

      if (!reason) {
        throw new AppError('Reason is required', 400);
      }

      const customer = await this.customerService.adjustLoyaltyPoints(
        tenantId,
        id,
        userId,
        points,
        reason
      );

      res.json(
        successResponse(customer, 'Loyalty points adjusted successfully')
      );
    } catch (error) {
      next(error);
    }
  };
}

