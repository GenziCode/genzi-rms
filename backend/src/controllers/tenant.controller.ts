import { Request, Response, NextFunction } from 'express';
import { tenantService } from '../services/tenant.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export class TenantController {
  /**
   * Register new tenant
   * POST /api/tenants/register
   */
  register = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { name, subdomain, email, password, firstName, lastName, phone } = req.body;

    const result = await tenantService.register({
      name,
      subdomain,
      email,
      password,
      firstName,
      lastName,
      phone,
    });

    sendSuccess(
      res,
      {
        tenant: {
          id: result.tenant._id,
          name: result.tenant.name,
          subdomain: result.tenant.subdomain,
          url: `https://${result.tenant.subdomain}.${process.env.APP_DOMAIN || 'genzirms.com'}`,
        },
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      'Tenant registered successfully. Welcome to Genzi RMS!',
      201
    );
  });

  /**
   * Check subdomain availability
   * GET /api/tenants/check-subdomain/:subdomain
   */
  checkSubdomain = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { subdomain } = req.params;

    const available = await tenantService.checkSubdomainAvailability(subdomain);

    sendSuccess(res, { available, subdomain });
  });
}

export const tenantController = new TenantController();

