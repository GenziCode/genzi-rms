import mongoose from 'mongoose';
import moment from 'moment-timezone';
import { getMasterConnection } from '../config/database';
import {
  IReportSchedule,
  ReportScheduleSchema,
  ReportDeliveryChannel,
} from '../models/reportSchedule.model';
import { IReportExecution, ReportExecutionSchema } from '../models/reportExecution.model';
import { BadRequestError, NotFoundError } from '../utils/appError';
import { logger } from '../utils/logger';
import { reportGenerationService } from './reportGeneration.service';

type Frequency = 'daily' | 'weekly' | 'monthly' | 'custom';

interface SchedulePayload {
  templateId: string;
  name: string;
  description?: string;
  reportType?: string;
  frequency: Frequency;
  timezone: string;
  runAt: string;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  startDate?: Date;
  endDate?: Date;
  format: 'pdf' | 'excel' | 'csv';
  deliveryChannels: ReportDeliveryChannel[];
  recipients: string[];
  webhookUrl?: string;
  filters?: Record<string, unknown>;
  cron?: string;
  isActive?: boolean;
}

export interface UpdateSchedulePayload extends Partial<SchedulePayload> {
  reason?: string;
}

const DAY_NAME_TO_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const INDEX_TO_DAY_NAME = Object.keys(DAY_NAME_TO_INDEX).reduce<Record<number, string>>(
  (acc, key) => {
    acc[DAY_NAME_TO_INDEX[key]] = key;
    return acc;
  },
  {}
);

export interface ReportScheduleResponse {
  _id: string;
  name: string;
  description?: string;
  reportType: string;
  templateId: string;
  format: 'pdf' | 'excel' | 'csv';
  frequency: Frequency;
  timezone: string;
  runAt: string;
  daysOfWeek: string[];
  dayOfMonth?: number;
  startDate?: string;
  endDate?: string;
  nextRun?: string;
  lastRun?: string;
  delivery: {
    channels: ReportDeliveryChannel[];
    recipients: string[];
    webhookUrl?: string;
  };
  filters: Record<string, unknown>;
  isActive: boolean;
  stats: {
    successCount: number;
    failureCount: number;
    lastStatus: 'success' | 'failed' | 'pending';
  };
  createdAt?: string;
  updatedAt?: string;
}

export class ReportScheduleService {
  private async getModels() {
    const masterConn = await getMasterConnection();
    return {
      ReportSchedule:
        masterConn.models.ReportSchedule ||
        masterConn.model<IReportSchedule>('ReportSchedule', ReportScheduleSchema),
      ReportExecution:
        masterConn.models.ReportExecution ||
        masterConn.model<IReportExecution>('ReportExecution', ReportExecutionSchema),
    };
  }

  private normalizeDays(days?: string[] | number[]): number[] | undefined {
    if (!days || days.length === 0) {
      return undefined;
    }

    return days
      .map((day) => {
        if (typeof day === 'number') return day;
        return DAY_NAME_TO_INDEX[day.toLowerCase()];
      })
      .filter((day): day is number => typeof day === 'number')
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => a - b);
  }

  private getRunTimeParts(runAt?: string) {
    const [hour, minute] = (runAt || '00:00').split(':').map((value) => parseInt(value, 10));
    if (
      Number.isNaN(hour) ||
      Number.isNaN(minute) ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      throw new BadRequestError('Invalid runAt time. Expected HH:mm format.');
    }
    return { hour, minute };
  }

  private calculateNextRun(
    options: {
      frequency: Frequency;
      timezone: string;
      runAt?: string;
      daysOfWeek?: number[];
      dayOfMonth?: number;
      startDate?: Date;
      cron?: string;
    },
    fromDate?: Date
  ): Date {
    const timezone = options.timezone || 'UTC';
    const reference = options.startDate
      ? moment.tz(options.startDate, timezone)
      : moment.tz(fromDate || new Date(), timezone);
    const now = moment.tz(fromDate || new Date(), timezone);
    const { hour, minute } = this.getRunTimeParts(options.runAt);

    const buildCandidate = (base: moment.Moment) =>
      base.clone().set({ hour, minute, second: 0, millisecond: 0 });

    let candidate = buildCandidate(reference.isAfter(now) ? reference : now);

    switch (options.frequency) {
      case 'daily': {
        if (candidate.isSameOrBefore(now)) {
          candidate = candidate.add(1, 'day');
          candidate = buildCandidate(candidate);
        }
        break;
      }
      case 'weekly': {
        const allowedDays = options.daysOfWeek && options.daysOfWeek.length > 0
          ? options.daysOfWeek
          : [candidate.day()];
        let safety = 0;
        while (safety < 14) {
          if (allowedDays.includes(candidate.day()) && candidate.isAfter(now)) {
            break;
          }
          candidate = candidate.add(1, 'day');
          candidate = buildCandidate(candidate);
          safety += 1;
        }
        break;
      }
      case 'monthly': {
        const targetDay = options.dayOfMonth ?? 1;
        candidate = candidate.date(Math.min(targetDay, candidate.daysInMonth()));
        if (candidate.isSameOrBefore(now)) {
          candidate = candidate.add(1, 'month');
          candidate = candidate.date(Math.min(targetDay, candidate.daysInMonth()));
          candidate = buildCandidate(candidate);
        }
        break;
      }
      case 'custom': {
        throw new BadRequestError('Custom schedules are not supported yet.');
      }
      default:
        throw new BadRequestError(`Unsupported frequency: ${options.frequency}`);
    }

    return candidate.toDate();
  }

  private mapRecipients(emails: string[], format: 'pdf' | 'excel' | 'csv') {
    return emails
      .filter(Boolean)
      .map((email) => ({
        email: email.toLowerCase().trim(),
        format,
      }));
  }

  async listSchedules(
    tenantId: string,
    filters?: { isActive?: boolean; reportType?: string; templateId?: string }
  ): Promise<IReportSchedule[]> {
    const { ReportSchedule } = await this.getModels();
    const query: Record<string, unknown> = {
      tenantId: new mongoose.Types.ObjectId(tenantId),
    };

    if (typeof filters?.isActive === 'boolean') {
      query.isActive = filters.isActive;
    }

    if (filters?.reportType) {
      query.reportKey = filters.reportType;
    }

    if (filters?.templateId) {
      query.templateId = new mongoose.Types.ObjectId(filters.templateId);
    }

    return ReportSchedule.find(query).sort({ nextRun: 1, name: 1 });
  }

  async getScheduleById(tenantId: string, scheduleId: string): Promise<IReportSchedule> {
    const { ReportSchedule } = await this.getModels();
    const schedule = await ReportSchedule.findOne({
      _id: new mongoose.Types.ObjectId(scheduleId),
      tenantId: new mongoose.Types.ObjectId(tenantId),
    });

    if (!schedule) {
      throw new NotFoundError('Report schedule not found');
    }

    return schedule;
  }

  async createSchedule(
    tenantId: string,
    payload: SchedulePayload,
    createdBy: string
  ): Promise<IReportSchedule> {
    if (!payload.templateId) {
      throw new BadRequestError('Template ID is required to create a schedule');
    }

    const { ReportSchedule } = await this.getModels();
    const normalizedDays = this.normalizeDays(payload.daysOfWeek);

    const nextRun = this.calculateNextRun(
      {
        frequency: payload.frequency,
        timezone: payload.timezone,
        runAt: payload.runAt,
        daysOfWeek: normalizedDays,
        dayOfMonth: payload.dayOfMonth,
        startDate: payload.startDate,
        cron: payload.cron,
      },
      payload.startDate
    );

    const schedule = new ReportSchedule({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      templateId: new mongoose.Types.ObjectId(payload.templateId),
      name: payload.name,
      description: payload.description,
      reportKey: payload.reportType,
      frequency: payload.frequency,
      schedule: {
        time: payload.runAt,
        daysOfWeek: normalizedDays,
        dayOfMonth: payload.dayOfMonth,
      },
      timezone: payload.timezone,
      startDate: payload.startDate,
      endDate: payload.endDate,
      format: payload.format,
      deliveryChannels: payload.deliveryChannels,
      deliveryPreferences: {
        webhookUrl: payload.webhookUrl,
      },
      recipients: this.mapRecipients(payload.recipients, payload.format),
      filterOverrides: payload.filters || {},
      nextRun,
      runCount: 0,
      successCount: 0,
      failureCount: 0,
      isActive: payload.isActive ?? true,
      createdBy: new mongoose.Types.ObjectId(createdBy),
    });

    await schedule.save();
    logger.info(`Report schedule created: ${schedule.name} (${schedule._id})`);
    return schedule;
  }

  async updateSchedule(
    tenantId: string,
    scheduleId: string,
    updates: UpdateSchedulePayload,
    updatedBy: string
  ): Promise<IReportSchedule> {
    const schedule = await this.getScheduleById(tenantId, scheduleId);
    let requiresNextRunRecalc = false;

    if (updates.name !== undefined) schedule.name = updates.name;
    if (updates.description !== undefined) schedule.description = updates.description;
    if (updates.reportType !== undefined) schedule.reportKey = updates.reportType;
    if (updates.frequency && updates.frequency !== schedule.frequency) {
      schedule.frequency = updates.frequency;
      requiresNextRunRecalc = true;
    }
    if (updates.runAt) {
      schedule.schedule.time = updates.runAt;
      requiresNextRunRecalc = true;
    }
    if (updates.daysOfWeek) {
      schedule.schedule.daysOfWeek = this.normalizeDays(updates.daysOfWeek);
      requiresNextRunRecalc = true;
    }
    if (updates.dayOfMonth !== undefined) {
      schedule.schedule.dayOfMonth = updates.dayOfMonth;
      requiresNextRunRecalc = true;
    }
    if (updates.timezone && updates.timezone !== schedule.timezone) {
      schedule.timezone = updates.timezone;
      requiresNextRunRecalc = true;
    }
    if (updates.startDate !== undefined) {
      schedule.startDate = updates.startDate;
      requiresNextRunRecalc = true;
    }
    if (updates.endDate !== undefined) {
      schedule.endDate = updates.endDate;
    }
    if (updates.format) {
      schedule.format = updates.format;
      if (updates.recipients) {
        schedule.recipients = this.mapRecipients(updates.recipients, updates.format);
      }
    } else if (updates.recipients) {
      schedule.recipients = this.mapRecipients(updates.recipients, schedule.format);
    }
    if (updates.deliveryChannels) {
      schedule.deliveryChannels = updates.deliveryChannels;
    }
    if (updates.webhookUrl !== undefined) {
      schedule.deliveryPreferences = {
        ...(schedule.deliveryPreferences || {}),
        webhookUrl: updates.webhookUrl,
      };
    }
    if (updates.filters) {
      schedule.filterOverrides = updates.filters;
    }

    schedule.updatedBy = new mongoose.Types.ObjectId(updatedBy);

    if (requiresNextRunRecalc && schedule.isActive) {
      schedule.nextRun = this.calculateNextRun(
        {
          frequency: schedule.frequency,
          timezone: schedule.timezone,
          runAt: schedule.schedule.time,
          daysOfWeek: schedule.schedule.daysOfWeek,
          dayOfMonth: schedule.schedule.dayOfMonth,
          startDate: schedule.startDate,
        },
        new Date()
      );
    }

    await schedule.save();
    return schedule;
  }

  async deleteSchedule(tenantId: string, scheduleId: string): Promise<void> {
    const { ReportSchedule } = await this.getModels();
    const { deletedCount } = await ReportSchedule.deleteOne({
      _id: new mongoose.Types.ObjectId(scheduleId),
      tenantId: new mongoose.Types.ObjectId(tenantId),
    });

    if (!deletedCount) {
      throw new NotFoundError('Report schedule not found');
    }
  }

  async toggleScheduleStatus(
    tenantId: string,
    scheduleId: string,
    isActive: boolean,
    updatedBy: string
  ): Promise<IReportSchedule> {
    const schedule = await this.getScheduleById(tenantId, scheduleId);
    schedule.isActive = isActive;
    schedule.updatedBy = new mongoose.Types.ObjectId(updatedBy);

    if (isActive) {
      schedule.nextRun = this.calculateNextRun(
        {
          frequency: schedule.frequency,
          timezone: schedule.timezone,
          runAt: schedule.schedule.time,
          daysOfWeek: schedule.schedule.daysOfWeek,
          dayOfMonth: schedule.schedule.dayOfMonth,
          startDate: schedule.startDate,
        },
        new Date()
      );
    }

    await schedule.save();
    return schedule;
  }

  async runNow(
    tenantId: string,
    scheduleId: string,
    userId: string
  ): Promise<{ executionId: string }> {
    const schedule = await this.getScheduleById(tenantId, scheduleId);

    if (!schedule.isActive) {
      throw new BadRequestError('Schedule is paused. Resume it before triggering.');
    }

    try {
      const result = await reportGenerationService.generateReport(
        tenantId,
        schedule.templateId.toString(),
        schedule.filterOverrides || {},
        userId,
        {
          scheduleId: schedule._id.toString(),
          reportType: 'scheduled',
          suppressData: true,
        }
      );

      schedule.lastRun = new Date();
      schedule.lastRunStatus = 'success';
      schedule.lastRunError = undefined;
      schedule.runCount += 1;
      schedule.successCount = (schedule.successCount || 0) + 1;
      schedule.nextRun = this.calculateNextRun(
        {
          frequency: schedule.frequency,
          timezone: schedule.timezone,
          runAt: schedule.schedule.time,
          daysOfWeek: schedule.schedule.daysOfWeek,
          dayOfMonth: schedule.schedule.dayOfMonth,
          startDate: schedule.startDate,
        },
        schedule.lastRun
      );
      await schedule.save();

      return { executionId: result.executionId };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      schedule.lastRun = new Date();
      schedule.lastRunStatus = 'failed';
      schedule.lastRunError = message;
      schedule.runCount += 1;
      schedule.failureCount = (schedule.failureCount || 0) + 1;
      schedule.nextRun = this.calculateNextRun(
        {
          frequency: schedule.frequency,
          timezone: schedule.timezone,
          runAt: schedule.schedule.time,
          daysOfWeek: schedule.schedule.daysOfWeek,
          dayOfMonth: schedule.schedule.dayOfMonth,
          startDate: schedule.startDate,
        },
        schedule.lastRun
      );
      await schedule.save();
      logger.error(`Scheduled report run failed (${schedule._id}): ${message}`);
      throw error;
    }
  }

  formatScheduleForResponse(schedule: IReportSchedule): ReportScheduleResponse {
    const rawDays =
      (schedule.schedule?.daysOfWeek && schedule.schedule.daysOfWeek.length > 0
        ? schedule.schedule.daysOfWeek
        : schedule.schedule?.dayOfWeek !== undefined
        ? [schedule.schedule.dayOfWeek]
        : []) || [];

    return {
      _id: schedule._id.toString(),
      name: schedule.name,
      description: schedule.description,
      reportType: schedule.reportKey || 'custom',
      templateId: schedule.templateId.toString(),
      format: schedule.format,
      frequency: schedule.frequency,
      timezone: schedule.timezone,
      runAt: schedule.schedule?.time || '00:00',
      daysOfWeek: rawDays
        .map((day) => INDEX_TO_DAY_NAME[day])
        .filter(Boolean),
      dayOfMonth: schedule.schedule?.dayOfMonth,
      startDate: schedule.startDate ? schedule.startDate.toISOString() : undefined,
      endDate: schedule.endDate ? schedule.endDate.toISOString() : undefined,
      nextRun: schedule.nextRun ? schedule.nextRun.toISOString() : undefined,
      lastRun: schedule.lastRun ? schedule.lastRun.toISOString() : undefined,
      delivery: {
        channels: schedule.deliveryChannels && schedule.deliveryChannels.length > 0
          ? schedule.deliveryChannels
          : ['email'],
        recipients: schedule.recipients?.map((recipient) => recipient.email) || [],
        webhookUrl: schedule.deliveryPreferences?.webhookUrl,
      },
      filters: schedule.filterOverrides || {},
      isActive: schedule.isActive,
      stats: {
        successCount: schedule.successCount || 0,
        failureCount: schedule.failureCount || 0,
        lastStatus: schedule.lastRunStatus === 'success'
          ? 'success'
          : schedule.lastRunStatus === 'failed'
          ? 'failed'
          : 'pending',
      },
      createdAt: schedule.createdAt ? schedule.createdAt.toISOString() : undefined,
      updatedAt: schedule.updatedAt ? schedule.updatedAt.toISOString() : undefined,
    };
  }
}

export const reportScheduleService = new ReportScheduleService();


