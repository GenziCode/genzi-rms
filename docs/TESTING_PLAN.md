# 🧪 Genzi RMS – End-to-End & Integration Testing Plan  
_Last updated: 2025-11-13 16:20 UTC_

This plan codifies the end-to-end (E2E) and integration coverage needed to guarantee invoice delivery, notification preferences, and audit logging work seamlessly across the MERN stack. The suites below extend our Playwright UI runs and Cypress API smoke tests so they can be executed locally and in CI.

---

## 1. Tooling & Execution Matrix
| Layer | Tool | Trigger | Command |
| --- | --- | --- | --- |
| Browser E2E (critical flows) | Playwright | CI nightly + pre-release | `npm run test:e2e` (frontend) |
| API Contract / Integration | Cypress (API mode) | CI nightly | `npm run test:api` (backend) |
| Regression sanity | Postman/Newman (optional) | Manual (pre-release) | `npm run test:newman` |

> **CI Hook:** Add jobs in GitHub Actions / Railway deploy that run `npm run build && npm run test:api && npm run test:e2e` against a seeded staging tenant.

---

## 2. Test Data & Pre-Conditions
- **Seed tenant:** `tenant-e2e` via `npm run seed:e2e` (ensures products, customers, invoices template).
- **Service secrets:** Use the secrets workflow from `docs/PRODUCTION_DEPLOYMENT_GUIDE.md` (SMTP, Twilio, Stripe test keys).
- **Test accounts:**
  - App user: `qa.admin@genzirms.com` / `P@ssw0rd!`
  - SMTP inbox: `qa.smtp@genzirms.com`
  - Twilio sandbox number: `+15005550006`
- **Cleanup:** Reset audit logs and notifications via `/api/admin/qa/reset` (admin-only endpoint) between runs.

---

## 3. Playwright Suites (UI Flows)

### Suite P1 – Invoice Delivery Flow
1. **Create draft invoice** – Fill modal, add line items, save as draft.
2. **Convert to issued** – Update status to `sent`.
3. **Download PDF** – Click “Download PDF”, assert file contents contain invoice number, totals.
4. **Email delivery** – Trigger email send, intercept toast + verify status in notification center (optionally poll test inbox via IMAP helper).
5. **Audit verification** – Navigate to Audit Logs, confirm entry for invoice creation & send email (fields: status change, send_email action).

### Suite P2 – Notification Preferences
1. Navigate to `Settings → Communications`.
2. Toggle email/sms/push/in-app preferences; save.
3. Reload page (fresh query) and assert toggles maintain state.
4. Trigger “Send Test Email/SMS” buttons; watch toast result.
5. Verify backend response (Playwright APIRequestContext) `preferences` endpoint returns updated values.

### Suite P3 – Audit Trail Regression
1. Create a product (delta recorded).
2. Update name/price (field diff should show only changed fields).
3. Delete product (after snapshot null).
4. Open Audit detail modal → assert before/after JSON present, highlight classes applied.

> **Playwright config:** mark these specs under `tests/e2e/*.spec.ts`, baseURL from `VITE_API_URL`, storage state for auth.

---

## 4. Cypress API Suites
### Suite C1 – Invoice Delivery APIs
- `POST /api/invoices` → expect 201 & audit log created.
- `GET /api/invoices/:id/pdf` → expect 200 (content-type `application/pdf`).
- `POST /api/invoices/:id/send` with SMTP credentials → expect 200, queue entry in notification service collection.

### Suite C2 – Notification Preferences APIs
- `GET /api/notifications/preferences` default snapshot.
- `PUT /api/notifications/preferences` with toggles → expect 200 & persisted values.
- Negative: missing auth returns 401, invalid channel returns 400.

### Suite C3 – Audit Logging APIs
- `GET /api/audit-logs` with filters → expect pagination metadata.
- `GET /api/audit-logs/export` → returns CSV with `changes` column.
- `GET /api/audit-logs/statistics` → verify count fields.

### Suite C4 – Cross-Service Webhooks (Optional)
- Simulate Stripe webhook using `stripe triggers payment_intent.succeeded` and assert audit + notification entries.

> Implement under `backend/cypress/e2e/*.cy.ts` using Cypress v12+ with `experimentalRunAllSpecs: true`.

---

## 5. CI/Automation Checklist
1. Add GitHub Action `qa.yml`:
   ```yaml
   - run: cd backend && npm ci && npm run test:api
   - run: cd frontend && npm ci && npm run build && npx playwright install --with-deps && npm run test:e2e
   ```
2. Store env secrets in Action secrets (`SMTP_HOST`, `TWILIO_ACCOUNT_SID`, etc.).
3. Upload Playwright trace & video artifacts on failure.
4. Slack/Teams notification on CI failure (optional using webhook).

---

## 6. Bug Filing & Coverage Tracking
- Track failures in Jira board `QA` with labels `invoice-delivery`, `notification-prefs`, `audit-logs`.
- Attach Playwright trace ZIP or Cypress screenshot to tickets.
- Coverage KPI:
  - Invoice delivery paths: 100% of happy-path scenarios automated.
  - Notification toggles: at least one test per channel.
  - Audit logging: create/update/delete scenario verified each release.

---

## 7. Manual Spot Checks (Release Day)
1. Retry end-to-end invoice (UI) in staging with real SMTP sandbox user.
2. Update notification preference from mobile viewport to ensure responsiveness.
3. Manually export audit CSV and validate diff columns visually.

---

## 8. Maintenance
- Review suite quarterly; prune redundant specs.
- Update seed data when schema evolves (watch migrations).
- Keep Playwright/Cypress dependencies in sync with `npm-check-updates`.

> Once suites are stable, update `docs/MVP_REMAINING_PHASES.md` to reflect completion of the testing task.


