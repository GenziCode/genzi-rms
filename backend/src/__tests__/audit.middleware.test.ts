import type { Response } from 'express';
import { auditMiddleware } from '../middleware/audit.middleware';
import type { TenantRequest } from '../types';

const logMutationMock = jest.fn();
jest.mock('../services/audit.service', () => ({
  auditService: {
    logMutation: logMutationMock,
  },
}));

const getTenantConnectionMock = jest.fn();
jest.mock('../config/database', () => ({
  getTenantConnection: getTenantConnectionMock,
}));

describe('auditMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('captures before/after snapshots and forwards them to auditService.logMutation', async () => {
    const oldDocument = { _id: 'prod-123', name: 'Old product', price: 10 };
    const newDocument = { _id: 'prod-123', name: 'Updated product', price: 12 };

    const firstLean = jest.fn().mockResolvedValue(oldDocument);
    const secondLean = jest.fn().mockResolvedValue(newDocument);
    const findByIdMock = jest
      .fn()
      .mockReturnValueOnce({ lean: firstLean })
      .mockReturnValueOnce({ lean: secondLean });

    const modelMock = jest.fn().mockReturnValue({
      findById: findByIdMock,
    });

    getTenantConnectionMock.mockResolvedValue({
      model: modelMock,
    });

    const middleware = auditMiddleware({ action: 'update', entityType: 'product' });

    const req = {
      user: { tenantId: 'tenant-1', id: 'user-1' },
      params: { id: 'prod-123' },
      method: 'PUT',
      originalUrl: '/api/products/prod-123',
      body: { name: 'Updated product', price: 12 },
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('jest-agent'),
    } as unknown as TenantRequest;

    let finishHandler: (() => Promise<void> | void) | null = null;
    const res = {
      statusCode: 200,
      json(body: any) {
        return body;
      },
      send(body: any) {
        return body;
      },
      get: jest.fn().mockReturnValue('jest-agent'),
      on(event: string, handler: () => Promise<void> | void) {
        if (event === 'finish') {
          finishHandler = handler;
        }
        return this;
      },
    } as unknown as Response;

    const next = jest.fn();

    await middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    (res.send as unknown as (body: any) => any)({
      data: { _id: 'prod-123', name: 'Updated product', price: 12 },
    });

    await finishHandler?.();

    expect(logMutationMock).toHaveBeenCalledTimes(1);
    expect(findByIdMock).toHaveBeenCalledTimes(2);
    expect(firstLean).toHaveBeenCalledTimes(1);
    expect(secondLean).toHaveBeenCalledTimes(1);

    const payload = logMutationMock.mock.calls[0][0];
    expect(payload).toMatchObject({
      tenantId: 'tenant-1',
      userId: 'user-1',
      action: 'update',
      entityType: 'product',
      entityId: 'prod-123',
      entityName: 'Updated product',
      before: oldDocument,
      after: newDocument,
      metadata: expect.objectContaining({
        method: 'PUT',
        path: '/api/products/prod-123',
      }),
    });
  });
});


