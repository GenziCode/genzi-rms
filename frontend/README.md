# Genzi RMS - Frontend

Modern, responsive React frontend for the Genzi RMS (Retail Management System).

## 🚀 Tech Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **API Client:** Axios + React Query
- **Forms:** React Hook Form + Zod
- **Routing:** React Router v6
- **Icons:** Lucide React

## 📦 Installation

```bash
npm install
```

## 🏃 Development

```bash
npm run dev
```

Server runs at: `http://localhost:3000`

## 🏗️ Build

```bash
npm run build
```

## 📁 Project Structure

```
src/
├── components/        # Reusable components
│   ├── layout/       # Layout components
│   └── ui/           # UI components (shadcn/ui)
├── pages/            # Page components
│   ├── auth/         # Login & Register pages
│   └── DashboardPage.tsx
├── lib/              # Utilities
│   ├── api.ts        # API client with interceptors
│   └── utils.ts      # Helper functions
├── services/         # API services
│   └── auth.service.ts
├── store/            # Zustand stores
│   └── authStore.ts
├── types/            # TypeScript types
├── routes/           # Route configuration
├── App.tsx           # Main app component
└── main.tsx          # Entry point
```

## 🔐 Authentication

The app uses JWT authentication with:

- Access tokens (stored in Zustand store + localStorage)
- Refresh tokens (automatically handled by API interceptor)
- Protected routes (redirect to login if not authenticated)
- Role-based access control (RBAC)

## 🎨 Styling

- Tailwind CSS for utility-first styling
- Custom color scheme (can be configured in `tailwind.config.js`)
- Responsive design (mobile-first approach)
- Dark mode ready

## 🔌 API Integration

API client configured with:

- Base URL from environment variables
- Request interceptor (adds auth token + tenant header)
- Response interceptor (handles token refresh + errors)
- Automatic error toasts

## 📝 Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Genzi RMS
VITE_APP_VERSION=1.0.0
VITE_ENABLE_OFFLINE=true
```

## ✅ Phase 1 Status

**COMPLETED:**

- ✅ Project setup with Vite + React + TypeScript
- ✅ Tailwind CSS configuration
- ✅ API client with Axios interceptors
- ✅ Zustand store for auth state
- ✅ Login page with validation
- ✅ Register tenant page
- ✅ Protected routes
- ✅ Main layout with sidebar
- ✅ Dashboard page (placeholder)

**NEXT PHASE:** Dashboard & Reports (Week 3)

## 🎯 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🐛 Troubleshooting

**Port already in use:**

```bash
# Change port in vite.config.ts or use:
npm run dev -- --port 3001
```

**API connection issues:**

- Check `.env` file has correct `VITE_API_URL`
- Ensure backend is running on `http://localhost:5000`
- Check browser console for CORS errors

## 📚 Documentation

See `FRONTEND_DEVELOPMENT_PLAN.md` in the parent directory for the complete roadmap and detailed plan.

## 🎉 Status

**Phase 1:** ✅ COMPLETE  
**Backend Connection:** ✅ READY  
**Authentication:** ✅ WORKING
