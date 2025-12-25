# 📋 Implementation Plan – Generated on 2025‑11‑24 06:40

## 🎯 Goal
Create a **single source of truth** that captures:
1. What has already been delivered (backend & frontend).
2. What is still missing (tasks, phases, todos).
3. A **sequenced, time‑stamped** roadmap for the next sprint(s).

The plan follows the same naming/ordering convention as the other docs in the `2025-11-24_0640_Documentation` folder (timestamp → sequential number).

---

## 📦 Phase 1 – Critical Front‑end UI (≈ 5 days)
| Day | Feature | Sub‑tasks | Owner | Done? |
|-----|---------|-----------|-------|-------|
| 1‑2 | **Invoice Management UI** | • Build `InvoicesPage` (list view).<br>• Create `InvoiceFormModal` (create / edit).<br>• Integrate invoice templates (modern, classic, minimal, professional, thermal).<br>• Add PDF export (using `pdfkit`).<br>• Add print button.<br>• Add email/SMS send dialogs (hook to backend endpoints). | Frontend team | ☐ |
| 3 | **Notification Center UI** | • Navbar dropdown component.<br>• `NotificationCenterPage` (list, pagination).<br>• Mark‑as‑read & bulk‑read actions.<br>• Preferences page (email/SMS toggles). | Frontend team | ☐ |
| 4 | **Payment UI** | • `PaymentPage` (history table).<br>• Stripe checkout form (client‑side tokenization).<br>• Refund UI (modal).<br>• Confirmation flow & success toast. | Frontend team | ☐ |
| 5 | **Inventory – Stock Transfer UI** | • Add **Transfer Stock** button on `InventoryPage`.
• `StockTransferModal` (source store, target store, quantity).
• Hook to backend `/api/inventory/transfer`. | Frontend team | ☐ |

## 📦 Phase 2 – Medium‑Priority Front‑end Enhancements (≈ 4 days)
| Day | Feature | Sub‑tasks | Owner | Done? |
|-----|---------|-----------|-------|-------|
| 6 | **Audit‑Log Viewer** | • `AuditLogsPage` with timeline view.<br>• Filters: user, action type, entity, date range.<br>• CSV export button.<br>• Pagination / infinite scroll. | Frontend team | ☐ |
| 7 | **Webhook Configuration UI** | • `WebhooksPage` (list, create, edit).<br>• Test webhook button (calls backend test endpoint).<br>• Delivery logs viewer (status, timestamps). | Frontend team | ☐ |
| 8 | **User Profile Page** | • Profile view/edit (name, email).<br>• Change password flow.<br>• Avatar upload (uses file‑upload endpoint).<br>• Preferences (theme, language). | Frontend team | ☐ |
| 9 | **Polish Existing Pages** | • Add loading spinners, error toasts, accessibility tweaks.<br>• Run UI regression tests (Cypress). | Frontend team | ☐ |

## 📦 Phase 3 – Optional Backend Public API & SDK (≈ 3 days)
| Day | Feature | Sub‑tasks | Owner | Done? |
|-----|---------|-----------|-------|-------|
| 10 | **API‑Key Management** | • Create `apiKey.model.ts` (schema).<br>• Add CRUD routes (`/api/api-keys`).<br>• Secure with admin role middleware. | Backend team | ☐ |
| 11 | **Rate‑Limiting per Key** | • Middleware that reads key usage from Redis.
• Configurable quotas (requests/day). | Backend team | ☐ |
| 12 | **Swagger/OpenAPI Docs** | • Install `swagger-ui-express`.
• Generate `swagger.json` from route annotations.
• Serve UI at `/api/docs`. | Backend team | ☐ |
| 13 | **SDK Generation Scripts** | • CLI script (`scripts/generate-sdk.js`).
• Output JS & Python client libraries.
• Publish to `dist/sdk/`. | Backend team | ☐ |

---

## 📅 Milestones
- **Day 5** – All critical UI (Invoices, Notifications, Payments, Stock Transfer) live on dev.
- **Day 9** – Medium‑priority UI (Audit, Webhooks, Profile) ready for QA.
- **Day 13** – Public API & SDK scaffold completed (optional).

---

## 📚 How to Use This Documentation
1. Open the **Implementation Plan** (`2025-11-24_0640_04_Implementation_Plan.md`).
2. Follow the day‑by‑day table; mark the **Done?** column when a task is finished.
3. Cross‑reference the **TODO List** (`2025-11-24_0640_05_TODO_List.md`) for a flat view of all pending items.
4. Use the **References** file (`2025-11-24_0640_06_References.md`) to locate the source documentation that informed this plan.

---

*Generated automatically from the existing documentation set in `docs/` on 2025‑11‑24 06:40.*
