import mongoose from 'mongoose';
import Handlebars from 'handlebars';
import { getTenantConnection } from '../config/database';
import {
  INotificationTemplate,
  INotificationTemplateVersion,
  NotificationTemplateSchema,
} from '../models/notificationTemplate.model';
import { NotificationChannel } from '../models/notification.model';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/appError';
import { logger } from '../utils/logger';

export interface CreateTemplatePayload {
  name: string;
  key: string;
  description?: string;
  category?: string;
  tags?: string[];
  channels: NotificationChannel[];
  subject?: string;
  content: string;
  samplePayload?: Record<string, unknown>;
  changeSummary?: string;
}

export interface UpdateTemplatePayload extends Partial<CreateTemplatePayload> {
  content?: string;
  subject?: string;
  changeSummary?: string;
}

export interface ListTemplateFilters {
  search?: string;
  channel?: NotificationChannel;
  page?: number;
  limit?: number;
}

export class NotificationTemplateService {
  private async getModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<INotificationTemplate>(
      'NotificationTemplate',
      NotificationTemplateSchema
    );
  }

  async listTemplates(
    tenantId: string,
    filters: ListTemplateFilters = {}
  ): Promise<{
    records: INotificationTemplate[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const Template = await this.getModel(tenantId);
    const query: Record<string, unknown> = {
      tenantId: new mongoose.Types.ObjectId(tenantId),
    };

    if (filters.channel) {
      query.channels = filters.channel;
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { key: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const limit = Math.min(filters.limit ?? 25, 100);
    const page = Math.max(filters.page ?? 1, 1);
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      Template.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
      Template.countDocuments(query),
    ]);

    return {
      records,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTemplateById(tenantId: string, id: string): Promise<INotificationTemplate> {
    const Template = await this.getModel(tenantId);
    const template = await Template.findOne({
      _id: id,
      tenantId: new mongoose.Types.ObjectId(tenantId),
    }).lean();
    if (!template) {
      throw new NotFoundError('Notification template not found');
    }
    return template;
  }

  async createTemplate(
    tenantId: string,
    userId: string,
    payload: CreateTemplatePayload
  ): Promise<INotificationTemplate> {
    const Template = await this.getModel(tenantId);

    const existing = await Template.findOne({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      key: payload.key.trim().toLowerCase(),
    }).lean();

    if (existing) {
      throw new ConflictError(`Template with key '${payload.key}' already exists`);
    }

    const versionEntry = this.buildVersionEntry({
      version: 1,
      channels: payload.channels,
      subject: payload.subject,
      content: payload.content,
      changeSummary: payload.changeSummary || 'Initial version',
      userId,
    });

    const template = await Template.create({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      name: payload.name,
      key: payload.key.trim().toLowerCase(),
      description: payload.description,
      category: payload.category,
      tags: payload.tags ?? [],
      channels: payload.channels,
      defaultSubject: payload.subject,
      samplePayload: payload.samplePayload ?? {},
      currentVersion: 1,
      versions: [versionEntry],
      createdBy: new mongoose.Types.ObjectId(userId),
      updatedBy: new mongoose.Types.ObjectId(userId),
    });

    logger.info(`Notification template created: ${template.key} (${tenantId})`);
    return template;
  }

  async updateTemplate(
    tenantId: string,
    id: string,
    userId: string,
    payload: UpdateTemplatePayload
  ): Promise<{ template: INotificationTemplate; createdVersion?: INotificationTemplateVersion }> {
    const Template = await this.getModel(tenantId);
    const template = await Template.findOne({
      _id: id,
      tenantId: new mongoose.Types.ObjectId(tenantId),
    });

    if (!template) {
      throw new NotFoundError('Notification template not found');
    }

    if (payload.name !== undefined) template.name = payload.name;
    if (payload.description !== undefined) template.description = payload.description;
    if (payload.category !== undefined) template.category = payload.category;
    if (payload.tags !== undefined) template.tags = payload.tags;
    if (payload.samplePayload !== undefined) template.samplePayload = payload.samplePayload;

    let createdVersion: INotificationTemplateVersion | undefined;

    if (payload.content || payload.subject || payload.channels) {
      const nextVersion = template.currentVersion + 1;
      createdVersion = this.buildVersionEntry({
        version: nextVersion,
        channels: payload.channels ?? template.channels,
        subject: payload.subject ?? template.defaultSubject,
        content: payload.content ?? template.versions[template.versions.length - 1].content,
        changeSummary: payload.changeSummary || 'Updated template version',
        userId,
      });
      template.versions.push(createdVersion);
      template.currentVersion = nextVersion;
      if (payload.channels) template.channels = payload.channels;
      if (payload.subject) template.defaultSubject = payload.subject;
    }

    template.updatedBy = new mongoose.Types.ObjectId(userId);
    await template.save();

    return {
      template,
      createdVersion,
    };
  }

  async deleteTemplate(tenantId: string, id: string): Promise<void> {
    const Template = await this.getModel(tenantId);
    const result = await Template.deleteOne({
      _id: id,
      tenantId: new mongoose.Types.ObjectId(tenantId),
    });
    if (result.deletedCount === 0) {
      throw new NotFoundError('Notification template not found');
    }
  }

  async createVersion(
    tenantId: string,
    id: string,
    userId: string,
    payload: {
      content: string;
      subject?: string;
      channels?: NotificationChannel[];
      changeSummary?: string;
    }
  ): Promise<INotificationTemplate> {
    if (!payload.content) {
      throw new BadRequestError('Template content is required for a new version');
    }

    const Template = await this.getModel(tenantId);
    const template = await Template.findOne({
      _id: id,
      tenantId: new mongoose.Types.ObjectId(tenantId),
    });

    if (!template) {
      throw new NotFoundError('Notification template not found');
    }

    const nextVersion = template.currentVersion + 1;
    const versionEntry = this.buildVersionEntry({
      version: nextVersion,
      channels: payload.channels ?? template.channels,
      subject: payload.subject ?? template.defaultSubject,
      content: payload.content,
      changeSummary: payload.changeSummary || 'New version created',
      userId,
    });

    template.versions.push(versionEntry);
    template.currentVersion = nextVersion;
    if (payload.channels) template.channels = payload.channels;
    if (payload.subject) template.defaultSubject = payload.subject;
    template.updatedBy = new mongoose.Types.ObjectId(userId);

    await template.save();
    return template;
  }

  async previewTemplate(
    tenantId: string,
    payload: {
      templateId?: string;
      subject?: string;
      content?: string;
      data?: Record<string, unknown>;
    }
  ): Promise<{ subject?: string; content: string; variables: string[] }> {
    let subjectTemplate = payload.subject;
    let contentTemplate = payload.content;
    let variables: string[] = [];
    const data = payload.data ?? {};

    if (payload.templateId) {
      const Template = await this.getModel(tenantId);
      const template = await Template.findOne({
        _id: payload.templateId,
        tenantId: new mongoose.Types.ObjectId(tenantId),
      }).lean();
      if (!template) {
        throw new NotFoundError('Notification template not found');
      }
      const currentVersion = template.versions.find(
        (v) => v.version === template.currentVersion
      );
      if (!currentVersion) {
        throw new NotFoundError('Template version not found');
      }
      subjectTemplate = currentVersion.subject ?? template.defaultSubject;
      contentTemplate = currentVersion.content;
      variables = currentVersion.variables;
    }

    if (!contentTemplate) {
      throw new BadRequestError('Template content is required for preview');
    }

    if (variables.length === 0) {
      variables = this.extractVariables(contentTemplate);
    }

    const compiled = this.render(contentTemplate, data);
    const compiledSubject = subjectTemplate ? this.render(subjectTemplate, data) : undefined;

    return {
      subject: compiledSubject,
      content: compiled,
      variables,
    };
  }

  private buildVersionEntry(params: {
    version: number;
    channels: NotificationChannel[];
    subject?: string;
    content: string;
    changeSummary?: string;
    userId: string;
  }): INotificationTemplateVersion {
    return {
      version: params.version,
      channels: params.channels,
      subject: params.subject,
      content: params.content,
      variables: this.extractVariables(params.content),
      changeSummary: params.changeSummary,
      createdBy: new mongoose.Types.ObjectId(params.userId),
      createdAt: new Date(),
    };
  }

  private extractVariables(content: string) {
    const regex = /{{\s*([\w.[\]]+)\s*}}/g;
    const matches = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content))) {
      matches.add(match[1]);
    }
    return Array.from(matches);
  }

  private render(template: string, data: Record<string, unknown>) {
    try {
      const compiled = Handlebars.compile(template);
      return compiled(data);
    } catch (error) {
      logger.error('Failed to render notification template preview', error);
      throw new BadRequestError('Unable to render template with provided data');
    }
  }
}

export const notificationTemplateService = new NotificationTemplateService();

