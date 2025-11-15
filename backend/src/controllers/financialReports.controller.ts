import { Response } from 'express';
import moment from 'moment-timezone';
import { TenantRequest } from '../types';
import { asyncHandler } from '../middleware/error.middleware';
import { successResponse } from '../utils/response';
import { financialReportsService } from '../services/reports/financialReports.service';

export class FinancialReportsController {
  getProfitLoss = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { startDate, endDate, storeId } = req.query;

    const result = await financialReportsService.getProfitLoss(tenantId, {
      startDate: startDate ? moment(startDate as string).toDate() : undefined,
      endDate: endDate ? moment(endDate as string).toDate() : undefined,
      storeId: storeId as string | undefined,
    });

    res.json(successResponse(result, 'Profit & loss report retrieved successfully'));
  });

  getCashFlow = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { startDate, endDate } = req.query;

    const result = await financialReportsService.getCashFlow(tenantId, {
      startDate: startDate ? moment(startDate as string).toDate() : undefined,
      endDate: endDate ? moment(endDate as string).toDate() : undefined,
    });

    res.json(successResponse(result, 'Cash flow report retrieved successfully'));
  });

  getAccountsReceivable = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { startDate, endDate } = req.query;

    const result = await financialReportsService.getAccountsReceivable(tenantId, {
      startDate: startDate ? moment(startDate as string).toDate() : undefined,
      endDate: endDate ? moment(endDate as string).toDate() : undefined,
    });

    res.json(successResponse(result, 'Accounts receivable report retrieved successfully'));
  });
}

export const financialReportsController = new FinancialReportsController();


