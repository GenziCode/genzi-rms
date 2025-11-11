# Genzi RMS - Multi-Tenant SaaS Platform

Modern, cloud-native Restaurant Management System and Point of Sale (POS) built with MERN stack.

## 🚀 Project Overview

**Genzi RMS** is a multi-tenant SaaS application built from the ground up to support:
- Multi-location restaurant chains
- Retail stores
- Hospitality businesses
- Franchises

### Tech Stack

- **Frontend:** React 18+ with TypeScript
- **Backend:** Node.js 18+ with Express.js and TypeScript
- **Database:** MongoDB 6.x (multi-tenant architecture)
- **Cache:** Redis 7.x
- **Architecture:** Database-per-Tenant for complete isolation

---

## 📁 Project Structure

```
genzi-rms/
├── backend/         # Node.js API server
├── frontend/        # React application (coming soon)
├── docker-compose.yml
└── README.md
```

---

## 🏃 Quick Start

### Prerequisites

- Node.js 18+ LTS
- Docker & Docker Compose
- Git

### Option 1: Docker (Recommended)

```bash
# Clone/navigate to project
cd genzi-rms

# Start all services
docker-compose up

# Backend API: http://localhost:5000
# MongoDB Express: http://localhost:8081 (admin/admin123)
```

### Option 2: Local Development

```bash
# Install MongoDB 6.x and Redis 7.x locally

# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev

# Backend runs on http://localhost:5000
```

---

## 📚 Documentation

### Getting Started
- `START_HERE.md` - Project navigation and overview
- `COMPLETE_ROADMAP_SUMMARY.md` - Complete implementation roadmap
- `backend/README.md` - Backend API documentation

### Technical Documentation
- `TECHNICAL_ARCHITECTURE.md` - System architecture
- `MULTI_TENANT_STRATEGY.md` - Multi-tenancy implementation
- `API_SPECIFICATION.md` - REST API documentation

### Planning Documents
- `SAAS_ROADMAP_MERN.md` - Detailed roadmap
- `MVP_IMPLEMENTATION_GUIDE.md` - MVP checklist
- `CANDELA_FEATURE_SPECIFICATION.md` - Feature catalog

---

## 🎯 Current Status

### ✅ Phase 0: Foundation - COMPLETE
- [x] Project structure
- [x] TypeScript configuration
- [x] Express.js setup
- [x] MongoDB multi-tenant configuration
- [x] Redis setup
- [x] Docker environment
- [x] Logging & error handling

### ✅ Phase 1: Core Infrastructure - COMPLETE
- [x] Multi-tenant middleware
- [x] Tenant registration API
- [x] Authentication system (JWT)
- [x] Role-based access control (RBAC)
- [x] Rate limiting
- [x] Security middleware

### ⏳ Phase 2: MVP Features - IN PROGRESS
- [ ] Product Management API
- [ ] POS System API
- [ ] Inventory Management API
- [ ] Customer Management API
- [ ] Reporting API

---

## 🔑 API Endpoints

### Public Endpoints

```
GET  /                          # API info
GET  /api/health                # Health check
POST /api/tenants/register      # Register new tenant
GET  /api/tenants/check-subdomain/:subdomain # Check availability
```

### Tenant-Specific Endpoints (require X-Tenant header in dev)

```
POST /api/auth/login            # User login
POST /api/auth/refresh          # Refresh token
GET  /api/auth/me               # Get current user
POST /api/auth/logout           # Logout
```

---

## 🛠️ Development

```bash
# Install dependencies
cd backend
npm install

# Run in development mode (with hot reload)
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Start production server
npm start
```

---

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f backend

# Rebuild containers
docker-compose up --build

# Start with MongoDB Express GUI
docker-compose --profile tools up
```

---

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:5000/api/health
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-11-10T...",
    "uptime": 123.45,
    "environment": "development"
  }
}
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

---

## 🔒 Security Features

- ✅ JWT authentication with short-lived tokens
- ✅ Refresh token mechanism
- ✅ Password hashing with bcrypt (cost 12)
- ✅ Rate limiting per tenant
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Input validation
- ✅ Tenant data isolation
- ✅ SQL injection prevention (MongoDB)
- ✅ XSS protection

---

## 📈 Next Steps

1. Complete Product Management API
2. Build POS System API
3. Implement Inventory Management
4. Create Customer Management
5. Build Reporting System
6. Develop Frontend (React)

---

## 👥 Team

Built with ❤️ by the Genzi Team

## 📄 License

MIT

---

## 🆘 Support

For issues and questions:
- Check documentation in `/docs`
- Review API specification
- See implementation guides

---

**Version:** 1.0.0  
**Last Updated:** November 10, 2024  
**Status:** Phase 0 & Phase 1 Complete ✅

