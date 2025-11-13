# 📅 RBAC Phase & Task Summary

**Document Type:** Phase & Task Sequence  
**Created:** 2025-11-13 20:05 UTC  
**Last Updated:** 2025-11-13 20:05 UTC

---

## Phase 7.1 – Foundation (Weeks 1-2)

1. **7.1.1** Define and document full permission registry (`module:action` patterns) in `docs/PERMISSION_REFERENCE.md`.
2. **7.1.2** Implement `Role` model in master DB with compound unique index `(tenantId, code)`.
3. **7.1.3** Extend `User` model with `roles[]`, `scope`, `delegatedFrom`, and `delegatedUntil` fields.
4. **7.1.4** Build `RoleService` for CRUD, assignment, and permission aggregation logic.
5. **7.1.5** Build `PermissionService` for validation, wildcard expansion, and registry exposure.
6. **7.1.6** Build `ScopeService` utilities for query filters and record-level checks.
7. **7.1.7** Seed default roles per tenant during provisioning and via migration script.

## Phase 7.2 – Authorization Middleware (Week 3)

1. **7.2.1** Update `authenticate` middleware to hydrate roles, permissions, and scope on each request.
2. **7.2.2** Add `permission.middleware.ts` with helpers (`requirePermission`, `requireAnyPermission`, `requireAllPermissions`, `requireModuleAccess`).
3. **7.2.3** Add `scope.middleware.ts` for automatic query scoping.
4. **7.2.4** Add `timeAccess.middleware.ts` enforcing configured access windows.
5. **7.2.5** Replace legacy `authorize()` usage across routes with new permission middleware.

## Phase 7.3 – Services & Controllers (Week 4)

1. **7.3.1** Update backend services to accept `userScope` and apply filters before hitting Mongo queries.
2. **7.3.2** Enforce record-level checks (ownership, assignment) in relevant services (sales, CRM, inventory).
3. **7.3.3** Mask sensitive fields in service responses when `canAccessField` fails.
4. **7.3.4** Propagate scope-aware parameters through controllers and standardize error responses.
5. **7.3.5** Enhance audit middleware payload to include `role`, `permission`, and `scope` metadata.

## Phase 7.4 – Role & Permission APIs (Week 5)

1. **7.4.1** Create `role.routes.ts` with CRUD, assignment, and permission management endpoints.
2. **7.4.2** Create `permission.routes.ts` exposing registry and user permission snapshots.
3. **7.4.3** Implement validation schemas and error handling for new endpoints.
4. **7.4.4** Wire audit logging to new role and permission mutation routes.
5. **7.4.5** Add integration tests covering role CRUD and assignment workflows.

## Phase 7.5 – Advanced Controls (Week 6)

1. **7.5.1** Implement time-based access windows per role and ensure enforcement in middleware.
2. **7.5.2** Add delegation workflows (`delegatedFrom`, `delegatedUntil`) with automatic expiry handling.
3. **7.5.3** Integrate approval chain hooks for sensitive actions (purchase approvals, refunds, adjustments).
4. **7.5.4** Emit monitoring events for denied access, scope violations, and delegation usage.
5. **7.5.5** Document advanced control configurations in `docs/RBAC_ARCHITECTURE.md`.

## Phase 7.6 – Frontend Permission System (Weeks 1-3 in parallel)

1. **7.6.1** Extend auth store/context to include `roles`, `permissions`, and `scope` metadata.
2. **7.6.2** Build `usePermissions` hook supporting `hasPermission`, `hasAny`, `hasAll`, `hasModuleAccess`, `canAccessField`.
3. **7.6.3** Build `useScope` hook for store/warehouse filtering helpers.
4. **7.6.4** Implement `PermissionGuard` and `ModuleGuard` components with graceful fallbacks.
5. **7.6.5** Introduce global permission utility (`permission.service.ts`) mirroring backend registry names.

## Phase 7.7 – Frontend UI Conditioning (Week 4)

1. **7.7.1** Guard route definitions with `ModuleGuard` and redirect to `AccessDeniedPage` when blocked.
2. **7.7.2** Apply permission-based rendering to primary pages (POS, Products, Inventory, Customers, Invoices, Payments, Settings, Users, Reports).
3. **7.7.3** Add field-level masking in forms and tables for sensitive data (cost, margin, secrets).
4. **7.7.4** Update navigation/menu items to hide modules without access and show role badges.
5. **7.7.5** Add contextual tooltips explaining disabled actions and guidance for requesting access.

## Phase 7.8 – Role Management UI (Week 5)

1. **7.8.1** Build `RolesPage` with list, filters, usage metrics, and action handlers.
2. **7.8.2** Build `RoleForm` with permission tree, scope configuration, and validation.
3. **7.8.3** Build `PermissionSelector` with search, module grouping, and bulk actions.
4. **7.8.4** Build `UserRoleAssignment` component supporting multi-role, scope overrides, and delegation windows.
5. **7.8.5** Update `UsersPage` to surface role chips, permission previews, and quick assignment flows.

## Phase 7.9 – Scope & Data Filtering (Week 6)

1. **7.9.1** Filter store selector options client-side based on `useScope` helpers.
2. **7.9.2** Apply scope filters to dashboard widgets and KPI cards.
3. **7.9.3** Apply scope filters to list/table queries (React Query keys) for inventory, sales, CRM modules.
4. **7.9.4** Surface scope indicators in UI (badges, callouts) to clarify visibility boundaries.
5. **7.9.5** Introduce optional role simulation mode for admins to preview other roles.

## Phase 7.10 – Migration, Testing, & Rollout (Weeks 7-8)

1. **7.10.1** Implement migration script assigning new default roles to existing users.
2. **7.10.2** Enable feature flag (`RBAC_ENABLED`) and stage progressive rollout.
3. **7.10.3** Write unit and integration tests for backend role/permission flows.
4. **7.10.4** Write component and E2E tests validating frontend permission gating.
5. **7.10.5** Publish runbooks covering migration, rollback, and access escalation procedures.

---

## Next Immediate Actions

1. **Prep-01** Review and approve the RBAC roadmap & task summary with stakeholders by 2025-11-14.
2. **Prep-02** Decide implementation start date and resource assignments for each phase.
3. **Prep-03** Stand up tracking board (Jira/Linear) using the numbered tasks as backlog items.
4. **Prep-04** Capture current user-role mappings to inform migration planning (export master `User` records).
5. **Prep-05** Schedule architecture sign-off meeting focusing on permission registry and scope model.
