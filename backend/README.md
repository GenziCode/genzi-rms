# Genzi RMS - Backend API

Multi-tenant SaaS backend built with Node.js, Express, TypeScript, and MongoDB.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration

# Start development server
npm run dev

# Server runs on http://localhost:5000
```

## Project Structure

```
src/
├── config/          # Configuration files
├── middleware/      # Express middleware
├── models/          # MongoDB models
├── routes/          # API routes
├── controllers/     # Route controllers
├── services/        # Business logic
├── utils/           # Utility functions
├── types/           # TypeScript types
└── server.ts        # Entry point
```

## Features

- ✅ Multi-tenant architecture (database-per-tenant)
- ✅ JWT authentication with refresh tokens
- ✅ Role-based access control (RBAC)
- ✅ MongoDB with Mongoose ODM
- ✅ Redis for caching and sessions
- ✅ TypeScript for type safety
- ✅ Express validator for input validation
- ✅ Winston logger
- ✅ Rate limiting
- ✅ Security best practices (Helmet, CORS)

## API Documentation

See `API_SPECIFICATION.md` in project root.

## Environment Variables

See `.env.example` for all required environment variables.

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## Tech Stack

- Node.js 18+
- Express.js 4.x
- TypeScript 5.x
- MongoDB 6.x
- Redis 7.x
- JWT for authentication

## License

MIT

