# Email Service Configuration

_Last updated: 2025-11-13 13:25 UTC_

The backend email service (`backend/src/utils/email.ts`) is wired with **nodemailer** and stays dormant until the required SMTP variables are supplied. Populate the following environment variables in your deployment environment (e.g. `.env`, hosting config) to activate it:

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | `smtp.sendgrid.net` |
| `SMTP_PORT` | SMTP port (465 or 587 are common) | `587` |
| `SMTP_SECURE` | Use TLS (set to `true` for port 465, `false` otherwise) | `false` |
| `SMTP_USER` | SMTP username/account | `apikey` |
| `SMTP_PASS` | SMTP password or API key | `SG.xxxxxxx` |
| `SMTP_FROM` | Optional explicit “from” email address; falls back to `SMTP_USER` | `no-reply@genzirms.com` |
| `FRONTEND_URL` | Used for links in system emails (password reset, verification) | `https://app.yourdomain.com` |

### Verification
- After setting the variables, run `npm run dev` (or restart the backend) so the transporter re-initialises.
- Use the **Test Email** endpoint (`POST /api/notifications/test-email`) or the `emailService.testConnection()` helper to confirm connectivity.

> ⚠️ If the credentials are missing, the service logs a warning and skips sending emails—no messages are attempted while in that state.

### Communications UI (2025-11-13 13:25 UTC)

- Navigate to **Settings → Communications** to manage per-tenant SMTP and Twilio credentials.  
- The form persists credentials securely and supports clearing or rotating secrets without redeploying.  
- Inline “Test Email” and “Test SMS” actions call the notification test endpoints and stamp the last status/time.  
- Invoice delivery and notification flows automatically pick up tenant overrides; if disabled or incomplete, the system falls back to server-wide environment variables.
- Multi-channel broadcasts launched from **Notifications → Send Broadcast** reuse these credentials alongside user channel preferences.

### Invoice Delivery (2025-11-13 11:05 UTC)

- Invoice emails render a full HTML summary via `renderInvoiceEmail`, automatically attaching the generated PDF when `attachPdf` is true (default).  
- The delivery endpoints (`POST /api/invoices/:id/send`) accept optional `subject`, `message`, `cc`, `bcc`, and `attachPdf` flags.  
- Set `CUSTOMER_PORTAL_URL` (falls back to `FRONTEND_URL`) to embed “View Invoice” links inside the outgoing messages.  
- Delivery gracefully aborts with a descriptive error when SMTP credentials are absent, keeping invoice creation flows unaffected.

### SMS Configuration

- Populate Twilio credentials (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`) in either environment variables or the Communications UI.  
- The invoice and notification services now respect tenant-level SMS settings, ensuring messages are only attempted when the channel is enabled and fully configured.  
- Use the Communications UI “Test SMS” action to validate credentials before enabling production traffic.


