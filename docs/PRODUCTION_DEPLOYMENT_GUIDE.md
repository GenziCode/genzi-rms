# 🚀 PRODUCTION DEPLOYMENT GUIDE

**Date:** November 13, 2025 (16:10 UTC)  
**System:** Genzi RMS v1.0  
**Status:** Ready for Production  

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### **Code Quality:**
- [x] 0 TypeScript errors
- [x] 0 Linter warnings
- [x] All imports resolved
- [x] All types defined
- [x] Error boundaries in place
- [x] Loading states implemented
- [x] Empty states implemented

### **Security:**
- [x] JWT authentication
- [x] Password hashing (bcrypt)
- [x] CORS configured
- [x] Helmet security headers
- [x] Rate limiting
- [x] Input validation
- [x] SQL injection prevention
- [x] XSS prevention

### **Performance:**
- [x] Code splitting ready
- [x] Lazy loading components
- [x] API caching (React Query)
- [x] Compression enabled
- [x] Static file serving

---

## 🗄️ DATABASE SETUP

### **MongoDB Atlas (Recommended):**

**1. Create Cluster:**
- Go to mongodb.com/cloud/atlas
- Create free cluster (M0)
- Choose region close to users
- Wait for cluster creation

**2. Create Database User:**
- Database Access → Add User
- Username: genzi_admin
- Password: Generate secure password
- Save credentials securely

**3. Network Access:**
- Network Access → Add IP
- Add `0.0.0.0/0` for production (or specific IPs)

**4. Get Connection String:**
```
mongodb+srv://genzi_admin:<password>@cluster0.xxxxx.mongodb.net/
```

---

## 🔧 ENVIRONMENT VARIABLES

### **Backend (.env):**
```env
# Server
NODE_ENV=production
PORT=5000

# Database
MASTER_DB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/genzi_master
TENANT_DB_BASE_URI=mongodb+srv://USER:PASS@cluster.mongodb.net

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security
COOKIE_SECRET=your-cookie-secret-key

# CORS
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-domain.com

# Redis (Optional)
REDIS_URL=redis://localhost:6379
# Or skip: REDIS_URL=skip

# File Upload
MAX_FILE_SIZE=10485760

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Email (SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxx
SMTP_FROM=no-reply@genzirms.com
FRONTEND_URL=https://app.your-domain.com
CUSTOMER_PORTAL_URL=https://portal.your-domain.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM_NUMBER=+1234567890

# PDF / File generation
PDF_ENGINE=pdfkit
PDF_SIGNATURE_KEY=<optional-signing-key>

# Stripe (Payments)
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Notifications / Push
PUSHER_APP_ID=xxxxxx
PUSHER_KEY=xxxxxxxxxxxxxxxx
PUSHER_SECRET=xxxxxxxxxxxxxxxx
PUSHER_CLUSTER=mt1

# Monitoring
MONITORING_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
MONITORING_HTTP_SAMPLE_RATE=0.05
# Observability
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxx.ingest.sentry.io/12345
SENTRY_TRACES_SAMPLE_RATE=0.05
```

### **Frontend (.env):**
```env
VITE_API_URL=https://your-backend-domain.com/api
```

### 🔐 Secrets Validation Workflow
1. **Populate `.env` variables** above (never commit secrets).  
2. **Smoke test SMTP:**  
   ```bash
   curl -X POST http://localhost:5000/api/notifications/test-email \
     -H "Authorization: Bearer <token>" \
     -H "X-Tenant: <tenant-subdomain>" \
     -H "Content-Type: application/json" \
     -d '{"email":"ops@your-domain.com"}'
   ```  
   Expect `200 OK` with “Test email enqueued”. Confirm delivery in the SMTP provider dashboard.
3. **Smoke test SMS:**  
   ```bash
   curl -X POST http://localhost:5000/api/notifications/test-sms \
     -H "Authorization: Bearer <token>" \
     -H "X-Tenant: <tenant-subdomain>" \
     -H "Content-Type: application/json" \
     -d '{"phone":"+1234567890"}'
   ```  
   Validate SMS in Twilio → Messaging → Logs.
4. **Validate PDF generator:**  
   ```bash
   curl -L -X GET http://localhost:5000/api/invoices/<invoiceId>/pdf \
     -H "Authorization: Bearer <token>" \
     -H "X-Tenant: <tenant-subdomain>" \
     --output sample-invoice.pdf
   ```  
   Ensure the PDF downloads without error and includes correct branding.
5. **Validate Stripe:**  
   ```bash
   stripe login
   stripe listen --forward-to localhost:5000/api/webhooks/stripe
   ```  
   Complete a test checkout in staging; confirm webhook handled successfully.
6. **CI guard:** add `.env.example` entries for every secret; run `npm run lint:secrets` (script checks for missing env keys) before deploy.
7. **Sentry ping:** set `SENTRY_DSN`, start backend, and trigger `curl http://localhost:5000/api/health` to generate a breadcrumb (appears in Sentry dashboard within minutes).

> ⚠️ **Never** store live credentials in the repo or CI logs. Use platform secret managers (Railway Variables, Render Environment, Netlify/Vercel secrets).

---

## 🚀 DEPLOYMENT OPTIONS

### **Option 1: Vercel (Frontend) + Railway (Backend)**

#### **Frontend to Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd genzi-rms/frontend
vercel

# Set environment variable
vercel env add VITE_API_URL production
# Enter: https://your-backend.railway.app/api
```

#### **Backend to Railway:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
cd genzi-rms/backend
railway init
railway up

# Add environment variables in Railway dashboard
```

---

### **Option 2: Netlify (Frontend) + Render (Backend)**

#### **Frontend to Netlify:**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build
cd genzi-rms/frontend
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

#### **Backend to Render:**
1. Go to render.com
2. New → Web Service
3. Connect GitHub repo
4. Build command: `cd backend && npm install`
5. Start command: `npm start`
6. Add environment variables

---

### **Option 3: Self-Hosted (VPS)**

#### **Requirements:**
- Ubuntu 22.04 LTS
- Node.js 18+
- MongoDB
- Nginx
- PM2

#### **Setup:**
```bash
# Install dependencies
sudo apt update
sudo apt install nodejs npm mongodb nginx

# Install PM2
npm install -g pm2

# Clone repo
git clone <your-repo>
cd genzi-rms

# Backend
cd backend
npm install
pm2 start npm --name "genzi-backend" -- start

# Frontend
cd ../frontend
npm install
npm run build
# Serve with nginx

# Nginx config
sudo nano /etc/nginx/sites-available/genzi-rms
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/genzi-rms/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🧪 TESTING CHECKLIST

### **Functional Testing:**
- [ ] User can register tenant
- [ ] User can login
- [ ] User can create products
- [ ] User can create categories
- [ ] User can process sale in POS
- [ ] User can adjust inventory
- [ ] User can create customer
- [ ] User can add loyalty points
- [ ] User can manage credit
- [ ] User can create vendor
- [ ] User can create purchase order
- [ ] User can receive goods
- [ ] User can add team members
- [ ] User can configure settings
- [ ] User can export data

### **Error Handling:**
- [ ] Invalid login shows error
- [ ] Network errors handled
- [ ] Validation errors shown
- [ ] 404 pages work
- [ ] Error boundary catches crashes

### **Performance:**
- [ ] Pages load < 2 seconds
- [ ] API calls < 500ms
- [ ] Large lists paginate
- [ ] Images optimized
- [ ] No memory leaks

---

## 📊 MONITORING SETUP

### **Error Tracking (Sentry):**
```bash
npm install @sentry/react @sentry/node
```

**Frontend:**
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
});
```

**Backend:**
```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
});
```

---

## 🔐 SECURITY HARDENING

### **Production Checklist:**
- [x] HTTPS only (enforce SSL)
- [x] Secure headers (Helmet)
- [x] CORS whitelist
- [x] Rate limiting
- [x] Input sanitization
- [x] Password hashing
- [x] JWT secret rotation plan
- [ ] Regular security audits
- [ ] Dependency updates

---

## 📈 SCALING CONSIDERATIONS

### **When to Scale:**
- Users > 100
- Transactions > 10,000/month
- Database > 10GB

### **How to Scale:**
1. **Database:** MongoDB Atlas auto-scaling
2. **Backend:** Horizontal scaling (add more servers)
3. **Redis:** Add caching layer
4. **CDN:** CloudFlare for static assets
5. **Load Balancer:** Nginx or cloud LB

---

## 🎯 GO-LIVE STEPS

### **Day Before Launch:**
1. Full system test
2. Backup data
3. Document credentials
4. Train users
5. Prepare support plan

### **Launch Day:**
1. Deploy frontend
2. Deploy backend
3. Configure DNS
4. Enable monitoring
5. Test production
6. Announce launch!

### **Day After Launch:**
1. Monitor errors
2. Check performance
3. Gather user feedback
4. Fix any issues
5. Plan enhancements

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] MongoDB Atlas configured
- [ ] Environment variables set
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] DNS configured
- [ ] SSL certificate installed
- [ ] Monitoring enabled
- [ ] Backup schedule set
- [ ] Team trained
- [ ] Support plan ready

---

## 🎊 YOUR SYSTEM IS READY!

**Follow this guide to deploy your Genzi RMS to production!**

**Estimated deployment time:** 2-4 hours  
**Recommended platform:** Vercel + Railway  
**Cost:** ~$20-50/month (starts free)  

**Good luck with your launch!** 🚀

