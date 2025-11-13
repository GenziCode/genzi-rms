# Installation Guide - Genzi RMS Backend

## Issue Encountered

Network error during `npm install`. This can happen due to:
- Network connectivity issues
- Corporate proxy/firewall
- NPM registry timeout

## Solutions

### Option 1: Retry Installation (Recommended)

```bash
cd genzi-rms/backend

# Try standard install
npm install

# If that fails, try with legacy peer deps
npm install --legacy-peer-deps

# If still failing, try with different registry
npm install --registry=https://registry.npmjs.org/
```

### Option 2: Use Docker (Bypasses local npm install)

```bash
cd genzi-rms

# Docker will handle npm install inside container
docker-compose up --build

# This installs packages inside Docker container
# No local npm install needed!
```

### Option 3: Install in Chunks

```bash
# Install core dependencies first
npm install express mongoose redis dotenv cors helmet

# Then install dev dependencies
npm install -D typescript ts-node-dev @types/node @types/express

# Then remaining packages in smaller groups
```

### Option 4: Use Yarn or PNPM

```bash
# If you have yarn
yarn install

# Or if you have pnpm
pnpm install
```

---

## What's Already Built

All code files are created and ready:
- ✅ 28 TypeScript source files
- ✅ All configuration files
- ✅ Docker setup
- ✅ Environment files

**Only npm packages need to be installed!**

---

## Quick Test Without Installing

You can review the code structure:

```bash
# See all TypeScript files
find backend/src -name "*.ts"

# Check main files
cat backend/src/server.ts
cat backend/src/app.ts
cat backend/package.json
```

---

## Recommended Next Step

**Use Docker** - it handles everything:

```bash
cd genzi-rms
docker-compose up

# Docker will:
# 1. Install npm packages inside container
# 2. Start MongoDB
# 3. Start Redis  
# 4. Start backend API
```

This avoids any local npm install issues!

