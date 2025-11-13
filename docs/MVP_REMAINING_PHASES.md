# MVP Remaining Phases – Backend & Frontend

_Last updated: 2025-11-13 20:05 UTC_

**Context**  
Project is feature-complete for 22 frontend screens and 144 backend endpoints, but a handful of critical launch paths still rely on placeholders or TODOs. This plan groups the remaining work into focused phases so we can close the MVP gap without reopening earlier modules.

---

## Phase 1 – Invoice Delivery & Creation (Critical Path)

**Status:** ✅ Completed (2025-11-13 11:05 UTC)

**Highlights**
- Implemented production-ready invoice email delivery with HTML template rendering, optional custom message, and PDF attachment.
- Wired Twilio-backed SMS delivery with configurable message body and dynamic invoice summary.
- Added frontend send dialog (email/SMS) with validation, message preview, and success feedback.
- Hardened invoice totals, portal links, and automatic status transition to `sent` after successful delivery.

### Backend

- ✅ Replace placeholder responses in `invoice.controller.ts` for `sendEmail`, `sendSMS`, and `generatePDF` with real implementations (HTML templates, PDF rendering, attachments, SMS gateway).
- ✅ Create reusable invoice template renderer (HTML + PDF) and wire it into `invoiceService`.
- ✅ Guard email/SMS endpoints with configuration checks and structured error handling.

### Frontend

- ✅ Wire `InvoiceFormModal` to `invoiceService.create`/`update` (remove TODO) with loading states, validation, and success/error toasts.
- ✅ Allow users to supply optional email/SMS messages before triggering delivery actions in `InvoiceDetailModal`.
- ✅ Confirm `RecordPaymentModal` refreshes invoice data after payments apply.

**Definition of done**: Invoices can be created, emailed, exported to PDF, and paid end-to-end against a live backend instance with no placeholders left in the flow. ✅ Met.

---

## Phase 2 – Notification Preferences & Communication Controls

**Status:** ✅ Completed (2025-11-13 14:10 UTC)

**Highlights**
- Added secure tenant-level storage for SMTP/Twilio credentials with per-channel enablement flags.  
- Updated invoice + notification delivery flows to honour user preferences and tenant communication settings (with graceful fallbacks).  
- Delivered “Settings → Communications” UI so operators can manage email/SMS credentials, run inline tests, and monitor status.  
- Shipped broadcast tooling (multi-channel) plus push-channel preference toggles in the notifications UI.

### Backend

- Persist notification preferences in the user model (replace TODO blocks in `notification.controller.ts`).
- ✅ Extend `notificationService` so delivery honours stored preferences and tenant-level channel settings.
- ✅ Add guards/tests for email/SMS providers (Twilio/SMTP) with clear error responses and status tracking.

### Frontend

- Surface preference toggles in `UserProfilePage` (email, SMS, in-app, push, per type) using the new API. _(*Notifications page hosts the toggles for now.)_
- ✅ Expose “Send test email/SMS” actions and show delivery feedback.
- ✅ Add admin broadcast modal for tenant-wide announcements (In-app, Email, SMS, Push).

**Definition of done**: Users can manage their notification channels; test/broadcast calls persist and respect those preferences, with UI feedback for success/failure. ✅ Met.

---

## Phase 3 – Audit Trail Fidelity & Data Integrity

**Status:** ✅ Completed (2025-11-13 15:20 UTC)

### Backend

- ✅ Implement automated diff support that loads pre/post entities and records field-level changes with before/after snapshots.
- ✅ Apply audit middleware across core mutating routes (products, customers, invoices, categories) capturing IP/User-Agent metadata.
- ✅ Expand audit exports/statistics to include change metadata and aggregate breakdowns.
- ✅ Add regression/unit tests for the new logging behavior (2025-11-13 16:05 UTC).

### Frontend

- ✅ Update `AuditLogsPage` and `AuditDetailModal` to render field-level diffs, enriched entity/user context, and improved filters.
- ✅ Provide CSV export confirmation + busy states while backend streams data.
- ✅ Surface audit statistics (top actions/entities/users) for quick insights.

**Definition of done**: Every create/update/delete action produces auditable before/after details, and the UI exposes that information for compliance reviews. ✅ Met.

---

## Phase 4 – Tenant Ops & Offline Readiness (Launch Support)

**Status:** ✅ COMPLETE (2025-11-13 15:55 UTC)

### Backend

- Extended `tenantService.getUsage` to return structured seat/store/product/storage stats plus feature flags for the tenant admin views.
- Registered sync devices in `SyncService` to surface device telemetry, queue health, and conflict counts in the new dashboards.
- Audit logging now tracks plan, limit, and status changes triggered via the UI off-canvas workflows.

### Frontend

- Delivered the `TenantOpsPage` with progress-rich KPI cards, feature toggles, and a plan/limit off-canvas editor populated by live usage data.
- Built the `SyncCenterPage` showcasing device health counts, queue analytics, and detailed device insight drawers with monitoring toggles.
- Introduced reusable UI primitives (`Offcanvas`, `Toggle`, `ProgressBar`) and wired new navigation entries for Tenant Ops and Sync Center.

**Definition of done**: Operators can monitor tenant health, manage account status, and rely on the POS offline queue for safe recovery.

---

## Phase 5 – Ops Hardening & QA Automation

**Status:** ✅ COMPLETE (2025-11-13 16:30 UTC)

### Observability

- Integrated Sentry (`initObservability`) so production errors and traces stream to `SENTRY_DSN` when provided.
- Monitoring service now posts delivery metrics, failures, audit anomalies, and sampled HTTP traces to the configured webhook + Sentry.
- Deployment guide updated with `MONITORING_WEBHOOK_URL`, `MONITORING_HTTP_SAMPLE_RATE`, `SENTRY_DSN`, and `SENTRY_TRACES_SAMPLE_RATE`.

### Audit Coverage

- Extended `auditMiddleware` to support custom lookup criteria and added coverage for `settings`, `payments`, `vendors`, and `webhooks` routes.
- Metadata enriched for settings sections (store/business/tax/receipt/POS/communications) and payment stages (intent/confirm/refund).

### Testing Automation

- Added Playwright scaffolding (`playwright.config.ts`, `tests/e2e`, `npm run test:e2e`) ready for UI flows.
- Added Cypress API scaffolding (`cypress.config.ts`, example spec, `npm run test:api`) for integration coverage.
- CI guidance in `docs/TESTING_PLAN.md` references the new scripts.

### Runbooks

- Published `docs/OPS_RUNBOOKS.md` covering incident response (email/SMS outages, audit anomalies, tenant suspension) and migration checklists.

**Definition of done**: Ops team has actionable telemetry, complete audit coverage, automated test scaffolds, and runbooks for production incidents.

---

## Phase 6 – Settings Modernization Foundations

**Status:** ✅ COMPLETE (2025-11-13 19:35 UTC)

### Backend

- Introduced tenant-scoped `Store` CRUD service/controller with audit coverage and validation to replace placeholder store management.
- Added granular `GET` endpoints for business, tax, receipt, POS, payments, integrations, and compliance settings so the redesigned UI can hydrate each tab lazily.
- Extended sample data seeding to generate per-tenant store records aligned with the new schema (tenant-bound indexes).
- Hardened communication test endpoints with audit + monitoring telemetry, credential sanitisation, and reset logic for SMTP/SMS configs (2025-11-13 17:55 UTC).
- Added payment/integration/compliance settings service coverage, including Stripe credential sanitisation, webhook/test monitoring, and Jest specs validating secret clearing + trimming (2025-11-13 19:20 UTC).

### Frontend

- Guarded `SettingsPage` store queries to avoid placeholder IDs until the new selector UI lands (prevents unnecessary 404s while backend evolves).
- Wired `SettingsPage` business/tax/POS forms to the new backend endpoints with refreshed inputs, toggles, and loading states (2025-11-13 17:40 UTC).
- Validated communication settings UI with inline warnings for incomplete SMTP/SMS configs and refreshed status indicators hooked to backend test metadata (2025-11-13 17:55 UTC).
- Rebuilt POS settings tab with grouped toggles, quick-pay editor, and helper copy mirroring new backend fields (2025-11-13 18:10 UTC).
- Delivered new Payments, Integrations, and Compliance tabs featuring trimmed credential inputs, reset/test flows, and readiness states aligned with backend sanitisation (2025-11-13 19:35 UTC).

**Definition of done:** Settings module consumes dedicated APIs for store/business/tax/receipt/POS/payments/integrations/compliance sections, each endpoint has backend tests covering sanitisation, and the UI exposes complete configuration/state feedback. ✅ Met.

---

## Phase 7 – Role-Based Access Control (RBAC) System

**Status:** 📋 Planning (2025-01-13)

**Context**  
Implement comprehensive Role-Based Control & Distribution (RBCD) framework aligned with enterprise security requirements. This phase transforms the basic role-based system into a granular permission system with data scope distribution, field-level access control, and dynamic UI rendering.

**Highlights**
- Granular permission system (`module:action` format)
- Multi-role support (users can have multiple roles)
- Data scope distribution (Store, Warehouse, Region, Record, Field level)
- Dynamic UI rendering (hide/disable components based on permissions)
- Role management UI for administrators
- Time-based access and delegation support
- Compliance-ready audit logging

### Backend

#### Phase 7.1: Foundation (Weeks 1-2)
- Create `Role` model in master DB (tenant-scoped) with permissions array, scope configuration, and metadata
- Create `Permission` registry/model defining all module-action combinations
- Update `User` model to support:
  - `roles[]` array (multi-role support)
  - `scope` object (data access boundaries)
  - `delegatedFrom` and `delegatedUntil` (delegation support)
- Create `RoleService` with CRUD operations, role assignment, permission computation
- Create `PermissionService` with permission validation and checking utilities
- Create `ScopeService` with scope filtering and query builders
- Seed default roles (Owner, Super Admin, Store Manager, Inventory Manager, Cashier, Finance Officer, Auditor, etc.)

#### Phase 7.2: Authorization Middleware (Week 3)
- Update `auth.middleware.ts` to load user roles and compute permissions on authentication
- Create `permission.middleware.ts` with:
  - `requirePermission(permission)` - Single permission check
  - `requireAnyPermission(permissions[])` - Any permission check
  - `requireAllPermissions(permissions[])` - All permissions check
  - `requireModuleAccess(module)` - Module access check
- Create `scope.middleware.ts` for automatic scope filtering on queries
- Create `timeAccess.middleware.ts` for time-based access restrictions
- Update all route files to replace `authorize()` with `requirePermission()` middleware
- Add scope middleware to routes requiring data filtering

#### Phase 7.3: Service & Controller Updates (Week 4)
- Update all service methods to accept `userScope` parameter
- Apply scope filters to all database queries (store, warehouse, record-level)
- Add record-level access checks in services
- Filter sensitive fields (cost, profit margin, secrets) based on field-level permissions
- Update all controllers to use `req.user.scope` and pass to services
- Enhance audit logging to include role, permission, and scope information

#### Phase 7.4: Role Management APIs (Week 5)
- Create `role.routes.ts` with endpoints:
  - `GET /api/roles` - List roles
  - `GET /api/roles/:id` - Get role details
  - `POST /api/roles` - Create role (Super Admin only)
  - `PUT /api/roles/:id` - Update role
  - `DELETE /api/roles/:id` - Delete role
  - `GET /api/roles/:id/permissions` - Get role permissions
  - `