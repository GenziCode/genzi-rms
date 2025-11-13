# Settings Experience Overhaul – UI/UX & API Plan  
_Last updated: 2025-11-13 16:45 UTC_

The current “Settings” surface mixes local-storage placeholders with a single-page tab UI. To deliver the enterprise-grade UX you requested, we’ll split the work into focused tracks that upgrade the experience, wire everything to real APIs, and keep the visual system consistent with the blueprint provided earlier.

---

## 1. Current Gaps
- **Single-tab layout** makes it hard to discover sections (store, business, tax, POS, communications). No breadcrumbs or contextual save feedback.
- **Local storage stubs** for tax/POS/receipt settings; nothing persisted per tenant/store.
- **Store context** hard-coded to `000000000000000000000001`; no multi-store management or selection UX.
- **Missing sections**: company profile, users & roles control, payment gateway config, audit/notification toggles, data retention, integrations.
- **Limited feedback**: success via `alert()`, no inline validation or disabled states, no audit history indicator.

---

## 2. Information Architecture

```
Settings (layout with sticky sidebar)
├── Overview (tenant summary, last updated, quick actions)
├── Organization
│   ├── Business Profile (legal info, branding, contact)
│   ├── Stores (list, create/edit modal, default flag)
│   └── Users & Roles (links to existing users page)
├── Sales & POS
│   ├── POS Behavior (new POS settings form)
│   ├── Receipt Templates (existing ReceiptDesigner, restyled)
│   └── Tax Rules (global & store overrides)
├── Communications
│   ├── Email (SMTP + test, status badges)
│   ├── SMS (Twilio + test, delivery log)
│   └── Notifications (channel toggles, preference defaults)
├── Payments & Billing
│   ├── Payment Gateways (Stripe keys, test buttons, webhook status)
│   └── Billing Profile (subscription plan, invoice history)
├── Integrations
│   ├── Webhooks (existing module, embedded)
│   ├── Marketplace connectors (coming soon placeholders)
│   └── API Keys (generate/rotate tokens)
├── Compliance
│   ├── Audit Trail Settings (retention, exports)
│   └── Data Retention / Privacy controls
```

---

## 3. UI/UX Enhancements
- **Navigation**: left rail with icon + label, active highlight, search, and “last saved” status in header.
- **Forms**: two-column responsive layout with field grouping, inline validation, optimistic saves, and toast confirmations.
- **Secondary panels**: off-canvas detail editors for store details & payment methods (reuse `Offcanvas` component).
- **Visual language**: align with blueprint—progress bars for quotas, toggle switches (`Toggle` component), destructive actions inside confirmation modals.
- **Feedback loop**: show “Draft” vs “Published” badges, integrate audit-entry quick links (“View change log”).
- **Testing hooks**: keep “Send Test Email/SMS” buttons but surface last result + timestamp inline.

---

## 4. Backend Requirements
1. **Settings Service Expansion**
   - Create REST endpoints:
     - `GET/PUT /api/settings/business`
     - `GET/PUT /api/settings/tax`
     - `GET/PUT /api/settings/pos`
     - `GET/PUT /api/settings/receipt`
     - `GET/POST/PUT/DELETE /api/stores`
     - `POST /api/settings/test-email`, `POST /api/settings/test-sms`
   - Persist nested JSON in `Settings` model (current schema already supports most fields).
2. **Store Model**
   - Introduce `Store` schema/controller which was previously stubbed.
   - Link store selection to tenant context + audit middleware.
3. **Audit Logging**
   - Ensure all new routes use updated `auditMiddleware` (section metadata).
4. **Role Guards**
   - Restrict access to owners/admins for high-impact settings.

---

## 5. Frontend Work Packages

| Package | Description | Dependencies |
|---------|-------------|--------------|
| `SettingsLayout` | New layout with sidebar, header, breadcrumbs, Toast context | `react-router-dom`, existing design tokens |
| `OrganizationSettings` | Business profile & multi-store CRUD (table + off-canvas edit) | Requires `/api/stores` |
| `SalesPosSettings` | POS and receipt editors; convert to controlled forms with `react-hook-form` | Backend endpoints |
| `TaxSettings` | Replace local storage; support per-store overrides with tabs | `/api/settings/tax`, `/api/stores` |
| `CommunicationsSettings` | Email/SMS config with status cards and test actions | `/api/settings/communications`, new test endpoints |
| `PaymentsBilling` | Stripe keys, test button, plan summary card | PaymentService enhancements |
| `Integrations` | Webhook embed + placeholder cards (Shopify, QuickBooks) with “Join waitlist” CTAs | `system-webhook.routes` |
| `ComplianceSettings` | Audit retention toggle, export links, data retention options | `audit.service`, new retention fields |

---

## 6. Implementation Timeline (Suggested)
1. **Sprint A – Backend foundations**  
   - Build store CRUD + business/tax/pos/receipt endpoints.  
   - Wire audit logging & tests.
2. **Sprint B – Layout + Organization tab**  
   - Implement new Settings layout, multi-store UI, business profile forms.
3. **Sprint C – Sales & Communications**  
   - POS, receipt, tax forms with live API calls; email/SMS panels with test buttons.
4. **Sprint D – Payments, Integrations, Compliance**  
   - Stripe config UI, embed webhook module, add compliance toggles.  
   - Update runbooks to reflect new controls.

---

## 7. QA & Rollout
- **Feature flags**: gate new settings UI behind `?newSettings=1` during beta.
- **E2E tests**: extend Playwright suite to cover store CRUD, email test button, POS toggle.
- **Migration**: seed default store entries per tenant; backfill settings document if absent.

---

Delivering this plan will provide the “rich, modular, enterprise-ready” settings experience while keeping the codebase stable and auditable.

