const EXCLUDED_KEYS = new Set([
  '_id',
  '__v',
  'createdAt',
  'updatedAt',
  'password',
  'passwordHash',
  'hash',
  'tokens',
  'resetToken',
  'verificationToken',
]);

type FlatRecord = Map<string, any>;

interface AuditDiffResult {
  changes: Array<{ field: string; oldValue: any; newValue: any }>;
  snapshotBefore?: Record<string, any> | null;
  snapshotAfter?: Record<string, any> | null;
}

const toPlainObject = (value: any): any => {
  if (value === null || value === undefined) {
    return value ?? null;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
};

const sanitize = (value: any): any => {
  if (value === null || value === undefined) {
    return value ?? null;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item));
  }

  if (typeof value === 'object') {
    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      if (EXCLUDED_KEYS.has(key)) {
        continue;
      }
      sanitized[key] = sanitize(value[key]);
    }
    return sanitized;
  }

  return value;
};

const flattenObject = (
  target: any,
  prefix = '',
  result: FlatRecord = new Map<string, any>()
): FlatRecord => {
  if (target === null || target === undefined) {
    result.set(prefix, target ?? null);
    return result;
  }

  if (typeof target !== 'object') {
    result.set(prefix, target);
    return result;
  }

  if (Array.isArray(target)) {
    if (target.length === 0) {
      result.set(prefix, []);
      return result;
    }
    target.forEach((item, index) => {
      const path = prefix ? `${prefix}[${index}]` : `[${index}]`;
      flattenObject(item, path, result);
    });
    return result;
  }

  const keys = Object.keys(target);
  if (keys.length === 0) {
    result.set(prefix, {});
    return result;
  }

  keys.forEach((key) => {
    const path = prefix ? `${prefix}.${key}` : key;
    flattenObject(target[key], path, result);
  });

  return result;
};

const isEqual = (left: any, right: any): boolean => {
  if (left === right) {
    return true;
  }
  const leftJson = JSON.stringify(left);
  const rightJson = JSON.stringify(right);
  return leftJson === rightJson;
};

export const buildAuditDiff = (
  before?: any | null,
  after?: any | null
): AuditDiffResult => {
  const snapshotBefore = before ? sanitize(toPlainObject(before)) : null;
  const snapshotAfter = after ? sanitize(toPlainObject(after)) : null;

  const beforeFlat = snapshotBefore ? flattenObject(snapshotBefore) : new Map<string, any>();
  const afterFlat = snapshotAfter ? flattenObject(snapshotAfter) : new Map<string, any>();

  const fields = new Set<string>([...beforeFlat.keys(), ...afterFlat.keys()]);

  const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

  fields.forEach((field) => {
    const oldValue = beforeFlat.has(field) ? beforeFlat.get(field) : null;
    const newValue = afterFlat.has(field) ? afterFlat.get(field) : null;

    if (!isEqual(oldValue, newValue)) {
      changes.push({
        field,
        oldValue,
        newValue,
      });
    }
  });

  return {
    changes,
    snapshotBefore: snapshotBefore ?? undefined,
    snapshotAfter: snapshotAfter ?? undefined,
  };
};


