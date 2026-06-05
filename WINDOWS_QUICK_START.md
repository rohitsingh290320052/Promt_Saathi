# Windows Quick Start Guide - PromtSaathi

## ⚡ 5-Minute Setup on Windows

### Step 1: Install Prerequisites

```powershell
# If you don't have pnpm, install it
npm install -g pnpm

# Verify installation
pnpm --version  # Should be 8.0+
node --version  # Should be 24.0+
```

### Step 2: Setup Database

**Option A: Docker (Easiest)**
```powershell
# Make sure Docker Desktop is running
docker run --name promtsaathi-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:16

# Update DATABASE_URL in .env.local
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres
```

**Option B: PostgreSQL Local Install**
- Download: https://www.postgresql.org/download/windows/
- Create database named `promtsaathi_dev`
- Update `DATABASE_URL` in `.env.local`

### Step 3: Install & Setup Project

```powershell
cd d:\PromtAI\PromtSaathi-main

# Install dependencies
pnpm install

# Create .env.local with your DATABASE_URL
Copy-Item .env.example .env.local
# Edit .env.local and set DATABASE_URL

# Push database schema
pnpm --filter @workspace/db run push
```

### Step 4: Run Development Servers

**Open 3 PowerShell terminals:**

**Terminal 1 - API Server:**
```powershell
$env:PORT=5000
pnpm --filter @workspace/api-server run dev
```

**Terminal 2 - Frontend App:**
```powershell
pnpm --filter @workspace/prompt-bridge run dev
```

**Terminal 3 - Type Checking (optional):**
```powershell
pnpm run typecheck
```

### Access the App

- 🌐 Frontend: http://localhost:5173
- 🔌 API: http://localhost:5000

---

## 🐛 Common Issues & Fixes

### Issue: "pnpm: The term 'pnpm' is not recognized"
```powershell
# Install globally
npm install -g pnpm

# Refresh PowerShell or restart terminal
```

### Issue: "DATABASE_URL connection failed"
```powershell
# Check PostgreSQL is running
# If using Docker:
docker ps  # Should show promtsaathi-postgres

# If local PostgreSQL, check service is running
# Services app > PostgreSQL > Start
```

### Issue: Port 5000 already in use
```powershell
# Find what's using port 5000
Get-NetTCPConnection -LocalPort 5000 | Select-Object OwningProcess

# Kill the process (replace PID)
taskkill /PID {PID} /F

# Or use different port
$env:PORT=5001
```

### Issue: "Use pnpm instead" error
Already fixed! Just run: `pnpm install`

---

## 📦 Build for Production

```powershell
# Full typecheck
pnpm run typecheck

# Build everything
pnpm run build

# Build specific package
pnpm --filter @workspace/prompt-bridge run build
```

---

## 🚀 Deploy to Cloud

See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) for:
- Docker deployment
- Railway.app setup
- Render.com setup
- Fly.io setup
- Vercel setup (frontends)

---

## 📚 Useful Commands

```powershell
# List all packages
pnpm list -r

# Run typecheck only
pnpm run typecheck

# Regenerate API client from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# View available scripts in a package
pnpm --filter @workspace/api-server run

# Clean everything
pnpm run clean
Remove-Item -Recurse -Force artifacts/*/dist, lib/*/dist
```

---

## 💡 Pro Tips

1. **Use VS Code**: Install "Thunder Client" or "REST Client" extension for testing API
2. **Check logs**: Both API server and frontend show detailed logs in terminal
3. **Hot reload**: Both dev servers support hot module reload (HMR)
4. **Git pre-commit hooks**: Format your code before committing

---

## ❓ Need Help?

1. Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed setup
2. Check [replit.md](./replit.md) for project docs
3. Run `pnpm --help` for pnpm commands
4. Check individual package README files

---

**Happy coding! 🎉**
