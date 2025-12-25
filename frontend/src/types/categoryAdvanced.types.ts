export type CategoryPermission = {
  role: string;
  view: boolean;
  edit: boolean;
  delete: boolean;
  manage: boolean;
};

export type CategoryPermissionsConfig = {
  inheritParent: boolean;
  requireApprovalForDelete: boolean;
  allowBulkEdit: boolean;
  roles: CategoryPermission[];
};

export type CategorySecurityConfig = {
  auditLogging: boolean;
  requireMfaForDelete: boolean;
  lockHierarchy: boolean;
  preventDeleteWithProducts: boolean;
  retentionDays: number;
  changeWindowHours: number;
};

export type CategoryValidationRule = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  severity: 'warning' | 'blocking';
};

export type CategoryCustomRule = {
  id: string;
  name: string;
  pattern: string;
  message: string;
  enabled: boolean;
};

export type CategoryValidationConfig = {
  rules: CategoryValidationRule[];
  customRules: CategoryCustomRule[];
  requireIcon: boolean;
  maxDepth: number;
  maxNameLength: number;
};

export type CategoryCollaborationConfig = {
  requireReviewForChanges: boolean;
  autoNotifyWatchers: boolean;
  commentRequiredOnDelete: boolean;
  defaultWatchers: string[];
  mentionsEnabled: boolean;
};

export type CategoryAutomationTrigger =
  | 'on_create'
  | 'on_update'
  | 'on_delete'
  | 'on_inactive'
  | 'on_low_stock';

export type CategoryAutomationAction =
  | 'notify'
  | 'assign'
  | 'archive'
  | 'tag'
  | 'approve';

export type CategoryAutomationRule = {
  id: string;
  name: string;
  trigger: CategoryAutomationTrigger;
  action: CategoryAutomationAction;
  enabled: boolean;
};

export type CategoryAutomationConfig = {
  rules: CategoryAutomationRule[];
};
