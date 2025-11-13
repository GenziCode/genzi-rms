# ⚙️ Ops Runbooks – Genzi RMS  
_Last updated: 2025-11-13 16:30 UTC_

This document captures actionable playbooks so on-call engineers can diagnose and resolve production incidents quickly. It links the new observability hooks (Sentry + monitoring webhooks) with concrete response steps.

---

## 1. Email Delivery Failures
1. **Alert origin:** `notification.failure` event in monitoring channel or Sentry issue tagged `channel=email`.
2. **First response:**
   - Check last deploy for secrets drift (`SMTP_HOST/USER/PASS`).
   - Run `curl` smoke test from `docs/PRODUCTION_DEPLOYMENT_GUIDE.md` to reproduce.
3. **Debug:**
   - Inspect recent audit log for `settings` updates (`Audit Logs → filters entity=settings section=communications`).
   - Verify tenant-level overrides via `GET /api/settings/communications`.
   - Examine provider dashboard (SendGrid) for blocklist or rate limits.
4. **Remediation:**
   - Restore known-good credentials from secret manager.
   - Retry failed notifications via admin UI (Broadcast → resend) or manual `PATCH /api/notifications/:id/resend`.
5. **Post-incident:**
   - Create Sentry issue comment with root cause.
   - Update monitoring thresholds if noisy.

## 2. SMS Delivery Failures
Similar to email:
1. Alert: `notification.failure` with `channel=sms`.
2. Validate Twilio status page and logs.
3. Re-run `PUT /api/settings/communications` with sanitized tokens if rotated.
4. Issue partial refunds / credits if customer SLA impacted.

## 3. Audit Anomaly
Triggered when an update produces field-level diffs (10+ fields) or high-frequency changes.
1. Alert payload includes `entityType`, `entityId`, `changeCount`.
2. Cross-reference `Audit Logs` UI → detail modal to confirm expected actor.
3. If suspicious:
   - Freeze tenant via `PATCH /api/tenants/:id/suspend`.
   - Export audit CSV for compliance.
   - File security incident ticket.

## 4. Tenant Suspension / Reactivation
1. **Suspend:** `PATCH /api/tenants/:id/suspend` with reason; triggers audit + notification.
2. **Communicate:** send broadcast (email + in-app) with suspension reason and remediation path.
3. **Reactivation checklist:**
   - Verify outstanding invoices resolved.
   - Resume quota counters if adjusted.
   - `PATCH /api/tenants/:id/activate` and monitor audit log entry.

## 5. Schema Migration / Release
1. **Plan:** capture migration steps in `src/scripts/migrations/<timestamp>-*.ts`.
2. **Dry run:** execute on staging via `npm run migrate:dry`.
3. **Deploy window:** place tenant in maintenance, run migration, verify smoke tests (invoice creation, sync dashboard).
4. **Rollback:** keep backup script or MongoDB snapshot ID for quick restore.

## 6. Offline Sync Queue Spike
1. Alert: monitoring webhook `notification.delivery` (channel=in_app) or manual observation in Sync Center.
2. Steps:
   - Open `SyncCenterPage` → inspect device queue size.
   - Force retry via admin UI control, confirm `syncService.pushSales` logs succeed.
   - If conflicts persist, export queue for manual reconciliation.

## 7. Logging / Monitoring Health Checks
- **Sentry down?** fallback to Slack webhook only; ensure backlog of exceptions exported once service restored.
- **Webhook failing:** check `MONITORING_WEBHOOK_URL` response (2xx). Rotate secret if 410 Gone.
- **HTTP sampling:** adjust `MONITORING_HTTP_SAMPLE_RATE` if dashboards require more/less traffic.

---

### Communication Templates
- `ops/email-outage.md` – Notify tenants of email disruption & mitigation timeline.
- `ops/audit-investigation.md` – Checklist for compliance review (link to `Audit Logs` filters).

### Escalation
1. On-call engineer (Level 1) – resolve within 30 minutes.
2. Platform engineer (Level 2) – engaged via PagerDuty if unresolved.
3. Postmortem within 48 hours for SEV1 incidents.

Maintain this runbook alongside monitoring dashboards so new team members have a single source of truth during incidents.

