import { auditService } from '../services/audit.service';

describe('auditService.logMutation', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs differences for update mutations and strips excluded fields', async () => {
    const logSpy = jest.spyOn(auditService, 'log').mockResolvedValue();

    await auditService.logMutation({
      tenantId: 'tenant-1',
      userId: 'user-1',
      action: 'update',
      entityType: 'product',
      entityId: 'prod-1',
      before: {
        _id: 'prod-1',
        name: 'Original',
        password: 'secret',
        inventory: { qty: 5 },
      },
      after: {
        _id: 'prod-1',
        name: 'Updated',
        password: 'secret',
        inventory: { qty: 8 },
      },
    });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const payload = logSpy.mock.calls[0][0];

    expect(payload.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'name', oldValue: 'Original', newValue: 'Updated' }),
        expect.objectContaining({ field: 'inventory.qty', oldValue: 5, newValue: 8 }),
      ])
    );
    expect(payload.changes).toHaveLength(2);
    expect(payload.snapshotBefore).toEqual({ name: 'Original', inventory: { qty: 5 } });
    expect(payload.snapshotAfter).toEqual({ name: 'Updated', inventory: { qty: 8 } });
  });

  it('skips logging when an update produces no changes', async () => {
    const logSpy = jest.spyOn(auditService, 'log').mockResolvedValue();

    await auditService.logMutation({
      tenantId: 'tenant-1',
      action: 'update',
      entityType: 'product',
      entityId: 'prod-1',
      before: { name: 'Same' },
      after: { name: 'Same' },
    });

    expect(logSpy).not.toHaveBeenCalled();
  });

  it('records snapshots for create mutations', async () => {
    const logSpy = jest.spyOn(auditService, 'log').mockResolvedValue();

    await auditService.logMutation({
      tenantId: 'tenant-1',
      action: 'create',
      entityType: 'product',
      entityId: 'prod-2',
      after: { _id: 'prod-2', name: 'Brand New', tags: ['featured'] },
    });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const payload = logSpy.mock.calls[0][0];

    expect(payload.snapshotBefore).toBeUndefined();
    expect(payload.snapshotAfter).toEqual({ name: 'Brand New', tags: ['featured'] });
    expect(payload.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'name', newValue: 'Brand New' }),
        expect.objectContaining({ field: 'tags[0]', newValue: 'featured' }),
      ])
    );
  });
});


