import mongoose from 'mongoose';
import moment from 'moment-timezone';
import { getTenantConnection } from '../../config/database';
import { SaleSchema, ISale } from '../../models/sale.model';
import { InvoiceSchema, IInvoice } from '../../models/invoice.model';
import { PaymentSchema, IPayment } from '../../models/payment.model';

interface FinancialFilters {
  startDate?: Date;
  endDate?: Date;
  storeId?: string;
}

interface ProfitLossResult {
  revenue: number;
  costOfGoods: number;
  tax: number;
  discounts: number;
  grossProfit: number;
  netRevenue: number;
  netIncome: number;
  period: { startDate: Date; endDate: Date };
}

interface CashFlowResult {
  summary: {
    totalInflow: number;
    averageDaily: number;
  };
  methods: Array<{ _id: string; totalAmount: number; count: number }>;
  distribution: Array<{ date: string; amount: number }>;
  period: { startDate: Date; endDate: Date };
}

interface AccountsReceivableResult {
  summary: Record<string, number>;
  invoices: Array<{
    _id: mongoose.Types.ObjectId;
    customer: mongoose.Types.ObjectId;
    total: number;
    paidAmount: number;
    balance: number;
    dueDate?: Date;
    status: string;
    agingCategory: string;
  }>;
}

export class FinancialReportsService {
  private async getModels(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return {
      Sale: connection.model<ISale>('Sale', SaleSchema),
      Invoice: connection.model<IInvoice>('Invoice', InvoiceSchema),
      Payment: connection.model<IPayment>('Payment', PaymentSchema),
    };
  }

  async getProfitLoss(tenantId: string, filters: FinancialFilters): Promise<ProfitLossResult> {
    const { Sale } = await this.getModels(tenantId);

    const startDate = filters.startDate || moment().startOf('month').toDate();
    const endDate = filters.endDate || moment().endOf('month').toDate();

    const matchStage: Record<string, unknown> = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['completed', 'paid'] },
    };

    if (filters.storeId) {
      matchStage.store = new mongoose.Types.ObjectId(filters.storeId);
    }

    const summary = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$total' },
          costOfGoods: { $sum: '$cost' },
          tax: { $sum: '$tax' },
          discounts: { $sum: '$discount' },
          grossProfit: { $sum: { $subtract: ['$total', '$cost'] } },
        },
      },
    ]);

    const data = summary[0] || {
      revenue: 0,
      costOfGoods: 0,
      tax: 0,
      discounts: 0,
      grossProfit: 0,
    };

    return {
      ...data,
      netRevenue: data.revenue - data.discounts,
      netIncome: data.grossProfit - data.tax,
      period: { startDate, endDate },
    };
  }

  async getCashFlow(tenantId: string, filters: FinancialFilters): Promise<CashFlowResult> {
    const { Payment } = await this.getModels(tenantId);

    const startDate = filters.startDate || moment().subtract(30, 'days').startOf('day').toDate();
    const endDate = filters.endDate || moment().endOf('day').toDate();

    const matchStage: Record<string, unknown> = {
      createdAt: { $gte: startDate, $lte: endDate },
    };

    const payments = await Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$method',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const distribution = await Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          date: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { date: 1 } },
    ]);

    const totalInflow = payments.reduce((sum, payment) => sum + payment.totalAmount, 0);

    return {
      summary: {
        totalInflow,
        averageDaily: distribution.length > 0 ? totalInflow / distribution.length : 0,
      },
      methods: payments,
      distribution,
      period: { startDate, endDate },
    };
  }

  async getAccountsReceivable(
    tenantId: string,
    filters: FinancialFilters
  ): Promise<AccountsReceivableResult> {
    const { Invoice } = await this.getModels(tenantId);

    const matchStage: Record<string, unknown> = {
      status: { $in: ['issued', 'partial', 'overdue'] },
    };

    if (filters.startDate || filters.endDate) {
      matchStage.createdAt = {
        ...(filters.startDate ? { $gte: filters.startDate } : {}),
        ...(filters.endDate ? { $lte: filters.endDate } : {}),
      };
    }

    const invoices = await Invoice.aggregate([
      { $match: matchStage },
      {
        $project: {
          _id: 1,
          customer: 1,
          total: 1,
          paidAmount: { $ifNull: ['$paidAmount', 0] },
          balance: { $subtract: ['$total', { $ifNull: ['$paidAmount', 0] }] },
          dueDate: 1,
          status: 1,
          agingCategory: {
            $switch: {
              branches: [
                { case: { $lte: ['$dueDate', moment().subtract(30, 'days').toDate()] }, then: '30+' },
                { case: { $lte: ['$dueDate', moment().subtract(60, 'days').toDate()] }, then: '60+' },
              ],
              default: 'current',
            },
          },
        },
      },
    ]);

    const summary = invoices.reduce(
      (acc, invoice) => {
        acc.total += invoice.balance;
        acc[invoice.agingCategory] = (acc[invoice.agingCategory] || 0) + invoice.balance;
        return acc;
      },
      { total: 0 } as Record<string, number>
    );

    return {
      summary,
      invoices,
    };
  }
}

export const financialReportsService = new FinancialReportsService();


