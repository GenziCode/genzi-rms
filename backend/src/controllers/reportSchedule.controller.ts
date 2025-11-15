import { Response } from 'express';
import { body, param, query } from 'express-validator';
import { TenantRequest } from '../types';
import { asyncHandler } from '../middleware/error.middleware';
import { successResponse } from '../utils/response';
import { reportScheduleService, UpdateSchedulePayload } from '../services/reportSchedule.service';
import { reportGenerationService } from '../services/reportGeneration.service';
import { BadRequestError } from '../utils/appError';

const allowedFrequencies = ['daily', 'weekly', 'monthly', 'custom'];
const allowedChannels = ['email', 'webhook', 'inbox'];

const scheduleValidations = [
  body('name').notEmpty().withMessage('Schedule name is required'),
  body('templateId').isMongoId().withMessage('Template ID is required'),
  body('reportType').optional().isString(),
  body('description').optional().isString(),
  body('frequency')
    .isIn(allowedFrequencies)
    .withMessage(`Frequency must be one of: ${allowedFrequencies.join(', ')}`),
  body('timezone').optional().isString(),
  body('runAt')
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('runAt must be HH:mm format'),
  body('daysOfWeek')
    .optional()
    .isArray()
    .withMessage('daysOfWeek must be an array of weekday strings'),
  body('daysOfWeek.*')
    .optional()
    .isString()
    .withMessage('Each day must be a string (e.g., monday)'),
  body('dayOfMonth')
    .optional()
    .isInt({ min: 1, max: 31 })
    .withMessage('dayOfMonth must be between 1 and 31'),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('format')
    .isIn(['pdf', 'excel', 'csv'])
    .withMessage('Format must be pdf, excel, or csv'),
  body('delivery.channels')
    .isArray({ min: 1 })
    .withMessage('At least one delivery channel is required'),
  body('delivery.channels.*')
    .isIn(allowedChannels)
    .withMessage(`Channel must be one of: ${allowedChannels.join(', ')}`),
  body('delivery.recipients').optional().isArray(),
  body('delivery.recipients.*')
    .optional()
    .isEmail()
    .withMessage('Recipients must be valid email addresses'),
  body('delivery.webhookUrl').optional().isString(),
  body('filters').optional().isObject(),
  body('isActive').optional().isBoolean(),
];

const updateValidations = scheduleValidations.map((rule) => rule.optional({ nullable: true }));

const idValidation = [param('id').isMongoId().withMessage('Invalid schedule ID')];

export class ReportScheduleController {
  private parseDate(value?: string) {
    return value ? new Date(value) : undefined;
  }

  private mapDayStringsToNumbers(days?: string[]) {
    if (!days) return undefined;
    return days.map((day) => day.toLowerCase());
  }

  getSchedules = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { isActive, reportType, templateId } = req.query;

    const schedules = await reportScheduleService.listSchedules(tenantId, {
      isActive:
        typeof isActive === 'string' ? isActive === 'true' : undefined,
      reportType: typeof reportType === 'string' ? reportType : undefined,
      templateId: typeof templateId === 'string' ? templateId : undefined,
    });

    const data = schedules.map((schedule) =>
      reportScheduleService.formatScheduleForResponse(schedule)
    );
    res.json(successResponse(data, 'Report schedules retrieved successfully'));
  });

  createSchedule = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const body = req.body;

    const payload = {
      templateId: body.templateId,
      name: body.name,
      description: body.description,
      reportType: body.reportType,
      frequency: body.frequency,
      timezone: body.timezone || 'UTC',
      runAt: body.runAt,
      daysOfWeek: this.mapDayStringsToNumbers(body.daysOfWeek),
      dayOfMonth: body.dayOfMonth,
      startDate: this.parseDate(body.startDate),
      endDate: this.parseDate(body.endDate),
      format: body.format,
      deliveryChannels: body.delivery.channels,
      recipients: body.delivery.recipients || [],
      webhookUrl: body.delivery.webhookUrl,
      filters: body.filters,
      isActive: body.isActive,
    };

    const schedule = await reportScheduleService.createSchedule(
      tenantId,
      payload,
      userId
    );

    res.status(201).json(
      successResponse(
        reportScheduleService.formatScheduleForResponse(schedule),
        'Report schedule created successfully'
      )
    );
  });

  getSchedule = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id } = req.params;
    const schedule = await reportScheduleService.getScheduleById(tenantId, id);
    res.json(
      successResponse(
        reportScheduleService.formatScheduleForResponse(schedule),
        'Report schedule retrieved successfully'
      )
    );
  });

  updateSchedule = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id } = req.params;
    const { id: userId } = req.user!;
    const body = req.body;

    const payload: UpdateSchedulePayload = {
      templateId: body.templateId,
      name: body.name,
      description: body.description,
      reportType: body.reportType,
      frequency: body.frequency,
      timezone: body.timezone,
      runAt: body.runAt,
      daysOfWeek: this.mapDayStringsToNumbers(body.daysOfWeek),
      dayOfMonth: body.dayOfMonth,
      startDate: this.parseDate(body.startDate),
      endDate: this.parseDate(body.endDate),
      format: body.format,
      deliveryChannels: body.delivery?.channels,
      recipients: body.delivery?.recipients,
      webhookUrl: body.delivery?.webhookUrl,
      filters: body.filters,
      isActive: body.isActive,
      reason: body.reason,
    };

    const schedule = await reportScheduleService.updateSchedule(
      tenantId,
      id,
      payload,
      userId
    );

    res.json(
      successResponse(
        reportScheduleService.formatScheduleForResponse(schedule),
        'Report schedule updated successfully'
      )
    );
  });

  deleteSchedule = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id } = req.params;

    await reportScheduleService.deleteSchedule(tenantId, id);
    res.json(successResponse(null, 'Report schedule deleted successfully'));
  });

  toggleStatus = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id } = req.params;
    const { id: userId } = req.user!;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      throw new BadRequestError('isActive must be a boolean');
    }

    const schedule = await reportScheduleService.toggleScheduleStatus(
      tenantId,
      id,
      isActive,
      userId
    );

    res.json(
      successResponse(
        reportScheduleService.formatScheduleForResponse(schedule),
        'Schedule status updated'
      )
    );
  });

  runNow = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id } = req.params;
    const { id: userId } = req.user!;

    const result = await reportScheduleService.runNow(tenantId, id, userId);
    res.json(successResponse(result, 'Schedule execution started'));
  });

  getExecutions = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id } = req.params;

    const schedule = await reportScheduleService.getScheduleById(tenantId, id);
    const executions = await reportGenerationService.getExecutionHistory(tenantId, {
      scheduleId: schedule._id.toString(),
      limit: 20,
    });

    const data = executions.map((execution) => ({
      _id: execution._id.toString(),
      scheduleId: schedule._id.toString(),
      reportType: execution.reportType,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      status:
        execution.status === 'completed'
          ? 'success'
          : execution.status === 'failed'
          ? 'failed'
          : execution.status,
      format: execution.fileFormat || schedule.format,
      durationMs: execution.duration,
      recipients: schedule.recipients?.map((recipient) => recipient.email) || [],
      downloadUrl: execution.fileUrl,
      error: execution.error?.message,
    }));

    res.json(successResponse(data, 'Execution history retrieved successfully'));
  });
}

export const reportScheduleController = new ReportScheduleController();

export const listSchedulesValidation = [
  query('isActive').optional().isBoolean().withMessage('isActive must be true or false'),
  query('reportType').optional().isString(),
  query('templateId').optional().isMongoId(),
];

export const createScheduleValidation = scheduleValidations;
export const updateScheduleValidation = updateValidations;
export const scheduleIdValidation = idValidation;


