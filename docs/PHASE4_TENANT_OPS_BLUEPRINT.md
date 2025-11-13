# Phase 4 – Tenant Operations & Offline Readiness Blueprint

_Last updated: 2025-11-13 15:25 UTC_

This blueprint aligns Phase 4 development with the broader UX modernization directive. It defines product requirements, UX hierarchy, and technical expectations for tenant operations and the offline sync center.

---

## 1. Enhanced Feature Matrix

| Capability | Typical ERP Offering | Target Experience |
|------------|----------------------|-------------------|
| Tenant Usage Monitoring | Ad-hoc scripts or manual DB checks | Real-time dashboard (seats, stores, storage, transactions) with trend projections and at-risk indicators |
| Suspend / Reactivate | Manual support ticket | Admin console with scheduled actions, reason codes, stakeholder notifications, and full audit trail |
| Plan & Seat Management | Static plan labels | Modular plan builder, seat pools per role, AI right-sizing suggestions, and history of changes |
| Offline Sync | Simple queue dump | Device dashboard (status, queue length, conflicts, logs) with manual retry/push and conflict resolution UI |
| Device Health | Not tracked | Inventory of POS/mobile devices with heartbeat, app version, OS, last sync, and location metadata |
| Alerts & Notifications | Limited email blasts | Configurable alert engine (web, push, SMS) for limit thresholds, sync failures, deliberate pauses |
| Forecasting | Absent | AI predictions for seat usage, transaction spikes, storage exhaustion, recommended sync windows |
| Integrations | Minimal API docs | Connector gallery (barcode, fulfillment API, chat/voice assistants) with status badges and error visibility |
| Audit & Compliance | Generic log dump | Field-level diffs, before/after snapshots, filtered exports for tenant plan edits, suspend/reactivate, sync events |

---

## 2. UI / UX Architecture

### Tenant Operations Module
- **Overview Tab**: KPI cards, utilization heatmap, forecast chart, alerts list
- **Tenants Tab**: Tenant table, status badges, quick actions, detail drawer (profile, billing, usage, history)
- **Plans & Limits Tab**: Plan cards, seat allocation table, module toggles, plan change scheduler
- **Automation Tab**: Rule list (trigger → channel → action), AI recommendations, notification templates
- **Audit Tab**: Filtered log (action/entity/actor), diff modal, export, top actions widget

### Offline Sync Center
- **Device Dashboard**: Cards for healthy/offline devices, tabs per warehouse/store, device table with statuses
- **Queue Management**: Queue length graphs, conflict table, retry/suppress actions, payload viewer
- **Schedules**: Calendar for maintenance windows and sync cadence, editors for blackout periods
- **Logs & Diagnostics**: Searchable log stream, filters (device/severity), export
- **Integrations**: Connector cards (barcode, voice, fulfillment), status, reconnect actions

### Global Navigation & Patterns
- Sticky top bar with tenant switcher, network status indicator, quick actions
- Contextual breadcrumbs, saved views, in-context help (AI assistant)
- Component library anchored in Material 3 tokens (elevation, spacing, responsive typography)

---

## 3. Design System Highlights
- **Color & Elevation**: Primary #2563EB (blue), Secondary #7C3AED (purple), tertiary accents for success/warning
- **Spacing**: 4px baseline grid; 16/24/32 px macro spacing for sections/cards; responsive gutters (12–24 px)
- **Typography**: Inter; H1 2.25rem, H2 1.875rem, Body 1rem; WCAG 2.2 contrast compliance
- **Components**: Sticky headers, card hover states (2dp → 6dp), virtualized tables, inline toasts, micro-interactions
- **Navigation**: Persistent headers, floating quick actions (mobile), breadcrumbs, contextual shortcuts

---

## 4. Responsive & PWA Strategy
- **Mobile**: Drawer navigation, stacked cards, FAB for critical actions, offline banner, gesture shortcuts
- **Tablet**: Two-column split (filters / content), modal detail views, pinned dashboards
- **Desktop**: Three-column layout with insight rail, live widgets, virtualization for large tables
- **PWA Enhancements**: Service worker caching, IndexedDB queue snapshots, background sync, push notifications
- **Performance**: Lazy loading, skeletons, prefetching next-likely views, Web Workers for heavy diffs

---

## 5. Implementation Roadmap

### Backend
1. Tenant usage service returning seats/stores/products/transactions/storage breakdowns with trends
2. Plan & limit management endpoints, suspend/reactivate with reason codes, audit coverage
3. Offline sync enhancements (payload validation, device registry, conflict reporting, logging)
4. Seed/demo data and ops runbooks

### Frontend
1. Tenant admin dashboards (usage, plan management, automation rules)
2. Offline sync center UI with device health, queue management, conflict resolution, logs
3. Global offline indicators, responsive design, saved filters/views
4. AI assistant placeholders and contextual help hooks

### Cross-Cutting
- Integrate with audit system for all tenant ops + sync activities
- Extend notification rules for usage thresholds and sync failures
- Document operator workflows and QA scenarios (suspend/reactivate, offline recovery)

---

## 6. Developer Handoff Checklist
- Updated design tokens and component specs
- API contracts for usage, plan updates, suspend/reactivate, sync management
- Data models for device registry and automation rules
- QA scripts for offline/online transitions, plan adjustments, limit breaches
- Accessibility and performance acceptance criteria

This document guides Phase 4 implementation and anchors the product/UX vision for tenant operations and offline readiness. Use it alongside `docs/MVP_REMAINING_PHASES.md` to track progress.

