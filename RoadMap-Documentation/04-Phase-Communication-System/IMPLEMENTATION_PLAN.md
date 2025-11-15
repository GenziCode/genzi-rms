# 🧠 PHASE 4 IMPLEMENTATION PLAN – COMMUNICATION SYSTEM

**Created:** 2025-02-07 11:00:00 UTC  
**Owner:** Platform & Inventory squads (joint)  
**Scope:** Email/SMS/webhook delivery, template/routing management, inbox UI, throttling, monitoring

---

## 1. ARCHITECTURE OVERVIEW

### 1.1 Backend Components

- **Notification Model (`notification.model.ts`)**
  - Fields: `tenantId`, `event`, `channels`, `payload`, `status`, `attempts`, `metadata`, `deliveredAt`, `error`.
- **Notification Service**
  - API: `createNotification`, `scheduleSend`, `retryFailed`, `listByTenant`, `updatePreferences`.
  - Channel adapters: `emailProvider`, `smsProvider`, `webhookProvider`.
- **Routing Engine**
  - Map events → audiences → channels using RBAC scopes and tenant/user preferences.
- **Inbox & Preferences**
  - Store user-level inbox entries + read/unread state.
  - Preferences per channel (mute, quiet hours, escalation paths).

### 1.2 Frontend Modules

- **Notification Templates Page**
  - Manage template metadata, preview with test payloads, version history.
- **Routing Rules Builder**
  - Define triggers, channel mix, fallback logic, and escalation sequences.
- **Inbox Drawer/Page**
  - In-app feed with filters, read/unread toggles, linking back to source entities.
- **Settings**
  - User preferences UI for channel opt-in/out and quiet hours.

### 1.3 Data Flow

1. Event emitted (e.g., STR approved) → event bus/queue.
2. Routing service resolves audience + template.
3. Notification record persisted; job enqueued.
4. Channel adapter sends message; status updated.
5. Delivery log visible via API/UI; inbox entry created for targeted users.

---

## 2. WORKSTREAMS & DELIVERABLES

| #   | Workstream               | Backend Deliverables                                      | Frontend Deliverables      | Notes                         |
| --- | ------------------------ | --------------------------------------------------------- | -------------------------- | ----------------------------- |
| 1   | Providers & Models       | Notification model, provider adapters, secrets management | n/a                        | Choose SES+Twilio to start    |
| 2   | Templates & Routing      | Template service, routing API, event registry             | Template CRUD + preview    | Reuse existing builder UX     |
| 3   | Delivery & Inbox         | Send/ retry jobs, delivery log endpoints, inbox queries   | Inbox page/drawer          | Integrate with MainLayout     |
| 4   | Preferences & Throttling | Quiet hours, rate limiter, tenant budgets                 | Preferences UI             | Support per-channel overrides |
| 5   | Monitoring & QA          | Metrics, alerts, regression suite                         | Toasts + health indicators | Hook into existing logger     |

---

## 3. SEQUENCING & DEPENDENCIES

1. **Week 1:** Model + provider scaffold, event registry, secrets config.
2. **Week 2:** Templates + routing UI, event-to-template matrix, RBAC integration.
3. **Week 3:** Inbox + delivery tracking, throttling, retry flows, QA + docs.
4. **Buffer:** Webhook payload customization, analytics dashboards.

Dependencies:

- BullMQ worker for background jobs.
- Secrets management for provider keys.
- Events emitted from STR/audit/forecast/report services.

---

## 4. TECHNICAL DECISIONS

- **Channel Abstraction:** single `NotificationChannelAdapter` interface with `send(payload)`.
- **Template Format:** Markdown + Handlebars-style placeholders, stored per tenant with version history.
- **Routing Storage:** JSON schema describing triggers, filters, channel mix; stored in `notificationRoutes` collection.
- **Retry Strategy:** exponential backoff up to 3 attempts; escalate to fallback channel after final failure.
- **Throttling:** Redis/bull-based counters for tenant + channel, configurable per plan.
- **Security:** Validate webhook targets, sign payloads, respect RBAC when exposing inbox items.

---

## 5. TESTING & OBSERVABILITY

| Layer       | Strategy                                                                        |
| ----------- | ------------------------------------------------------------------------------- |
| Unit        | Adapter mocks for email/SMS/webhook, template renderer tests                    |
| Integration | API tests for routing + send flows using fake providers                         |
| E2E         | Cypress flows: configure template → send test notification → verify inbox entry |
| Performance | Load-test send queue (1k notifications/min)                                     |
| Monitoring  | Metrics: send success rate, queue latency, provider cost usage                  |
| Alerts      | Slack/email when `notification.status=failed` exceeds threshold                 |

---

## 6. HANDOFF PLAN

- Publish runbooks for template authors, ops team, and tenant admins.
- Provide integration guide for future modules (e.g., Advanced Features).
- Ensure fallback behaviors documented (e.g., email fallback when SMS unavailable).

---

## 7. UPDATE LOG

| Date       | Time (UTC) | Notes                                       | Owner    |
| ---------- | ---------- | ------------------------------------------- | -------- |
| 2025-02-07 | 11:00      | Initial Phase 4 implementation plan drafted | Delivery |

---

**Next Action:** Kickoff call (Feb 10) – finalize provider selection & secrets strategy.
