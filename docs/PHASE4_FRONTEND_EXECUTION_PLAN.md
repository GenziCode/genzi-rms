# Phase 4 Frontend Execution Plan – Tenant Ops & Offline Dashboards  
_Last updated: 2025-11-13 15:45 UTC_

This implementation guide turns the Phase 4 blueprint into concrete frontend work. It folds in the latest product requirement to incorporate off-canvas panels, toggle controls, progress indicators, and live counts wherever they improve clarity and reduce modal clutter.

---

## 1. Layout Principles
- **Off-canvas detail panes** replace oversized modals for deep inspection (tenant profile, device logs, conflict resolution). Panels slide from the right on desktop/tablet and from the bottom on mobile, with snap points and scroll locking.
- **Persistent summary header** with live counts (active tenants, online devices, pending conflicts) and quick toggles for filters (e.g. “Show suspended”).
- **Adaptive cards** that swap between grid and list layouts, injecting progress bars for limits (users, storage, transactions) and labelled counts (e.g. “Offline devices · 3”).
- **Responsive toggles** using the design system switch component to control automation rules, communication channels, and device monitoring flags.

---

## 2. Tenant Operations Area

### 2.1 Overview Screen
- KPI rail with segmented progress bars: seats, stores, products, storage, monthly transactions.
- Alert list using collapsible rows; off-canvas “Alert Details” reveals history, recommended actions, and toggle to mute.

### 2.2 Tenants Table
- Column injects progress capsules (users/stores/% of plan).
- Row actions open `TenantDetailOffcanvas` with tabs: Profile, Usage, Plan, Activity.
- Off-canvas includes embedded toggles for feature flags (inventory, API, webhooks), plan dropdown, and progress bars mirroring backend usage response.

### 2.3 Plans & Limits
- Modular cards with inline sliders/toggles—allow adjusting seat pools and module access.
- “Preview changes” opens staged diff in off-canvas before saving; progress bars show before/after.

---

## 3. Offline Sync Center

### 3.1 Device Dashboard
- Device grid showing status chip, last sync timestamp, queue size badge, conflict count.
- Off-canvas panel `DeviceInsightPane` surfaces device metadata, heartbeat timeline, per-queue progress, and toggles for maintenance mode.

### 3.2 Queue Management
- Table lists queued payloads with status pills and retry buttons.
- Selecting a row opens off-canvas payload viewer with diff and resolution toggles (accept server/client).
- Summary chips across top (“Conflicts”, “Retries scheduled”) with count-up animation.

### 3.3 Logs & Diagnostics
- Virtualized log stream with sticky filters; loading state uses shimmer progress.
- Off-canvas log drill-down for raw payload plus action toggles (mark resolved, escalate).

---

## 4. Component Work Packages

| Component | Description | Key Interactions |
|-----------|-------------|------------------|
| `TenantUsageSummary` | Displays plan/usage KPI cards | Progress bars, counts, tooltips |
| `TenantDetailOffcanvas` | Replaces modal for tenant detail | Tabs, toggles, inline progress |
| `PlanAdjustWizard` | Guides plan/limit edits | Stepper, off-canvas review, confirm | 
| `DeviceStatusBoard` | Responsive device grid | Status toggles, count chips |
| `DeviceInsightPane` | Off-canvas device detail | Queue progress, heartbeat chart |
| `SyncConflictDrawer` | Conflict diff resolution | Toggle between server/client resolution |
| `AutomationToggleRow` | Rule list with toggle controls | Inline edit, progress badges |

All new components will live under `frontend/src/components/tenantOps/` and `frontend/src/components/syncCenter/` namespaces for discoverability.

---

## 5. Integration Checklist
- Fetch new backend usage payloads via `tenantService.getUsage`, store in React Query cache with polling for live counts.
- Ensure all off-canvas panels maintain focus traps and ARIA labels (WCAG 2.2 compliance).
- Extend notification/toast copy to reflect new actions (plan update success, device conflict resolved).
- Update global state (likely Zustand) with offline status + device counts to display in navbar badge.
- Instrument loading states with top-level skeleton + per-card progress indicators to avoid layout shifts.

---

## 6. Acceptance Criteria
1. Every deep-dive interaction uses off-canvas instead of oversized modal (unless flow requires wizard).
2. All primary dashboards present counts and progress bars summarizing limits/queues/conflicts.
3. Toggle controls exist for feature flags, automation rules, maintenance status, and device monitoring where applicable.
4. Mobile layout keeps off-canvas accessible (slide-up) with collapse when navigating back.
5. UX validated for keyboard navigation (tab order, ESC to close, screen reader labels).

This plan should guide the build-out of Phase 4 frontend surfaces while honoring the new UI directives.

