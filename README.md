# 🚀 PromtSaathi - Full Stack TypeScript Monorepo

A modern full-stack TypeScript application with multiple React frontends, an Express.js API server, PostgreSQL database, and AI integrations (OpenAI & Anthropic).

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Development](#development)
- [Deployment](#deployment)
- [Documentation](#documentation)

## ⚡ Quick Start

### Prerequisites
- **Node.js 24+** - [Download](https://nodejs.org/)
- **pnpm 8+** - `npm install -g pnpm`
- **PostgreSQL 14+** or Docker
- **Git**

### Windows Users
👉 Follow [WINDOWS_QUICK_START.md](./WINDOWS_QUICK_START.md) for OS-specific setup

### Setup (5 minutes)

```bash
# Clone and enter directory
git clone <repo-url>
cd PromtSaathi-main

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL

# Initialize database
pnpm --filter @workspace/db run push
```

### Run Development Servers

Open 3 terminals and run:

```bash
# Terminal 1: API Server (port 5000)
pnpm --filter @workspace/api-server run dev

# Terminal 2: Frontend (port 5173)
pnpm --filter @workspace/prompt-bridge run dev

# Terminal 3: Type Checking (optional)
pnpm run typecheck
```

Access at:
- 🌐 Frontend: http://localhost:5173
- 🔌 API: http://localhost:5000

---

## 📁 Project Structure

```
PromtSaathi/
├── artifacts/                      # Production applications
│   ├── api-server/                 # Express.js backend
│   │   └── src/
│   │       ├── app.ts              # Express app config
│   │       ├── index.ts            # Server entry point
│   │       └── routes/             # API endpoints
│   │
│   ├── prompt-bridge/              # Main React app (Vite)
│   ├── calamity-detector/          # Alternative React app
│   └── mockup-sandbox/             # Sandbox React app
│
├── lib/                            # Shared libraries
│   ├── db/                         # Drizzle ORM + schema
│   ├── api-zod/                    # Zod validation schemas
│   ├── api-spec/                   # OpenAPI specification
│   ├── api-client-react/           # React API hooks
│   ├── integrations-openai-ai-server/
│   ├── integrations-anthropic-ai/
│   └── integrations-openai-ai-react/
│
├── scripts/                        # Build & utility scripts
├── .github/workflows/              # CI/CD pipelines
├── docker-compose.yml              # Docker setup
└── package.json                    # Workspace root

```

### Key Packages

| Package | Purpose | Port |
|---------|---------|------|
| `@workspace/api-server` | Express.js REST API | 5000 |
| `@workspace/prompt-bridge` | Main React frontend | 5173 |
| `@workspace/db` | Drizzle ORM + DB schema | — |
| `@workspace/api-zod` | Zod validation | — |
| `@workspace/integrations-openai-ai-server` | OpenAI API integration | — |

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 24
- **Framework**: Express 5
- **Database**: PostgreSQL 16 + Drizzle ORM
- **Validation**: Zod v4
- **Logging**: Pino
- **Language**: TypeScript 5.9

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **UI Library**: Radix UI
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form
- **Styling**: Tailwind CSS

### DevOps
- **Package Manager**: pnpm workspaces
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Deployment**: Railway, Vercel, Render, Fly.io

---

## 👨‍💻 Development

### Common Commands

```bash
# Type checking
pnpm run typecheck

# Build all packages
pnpm run build

# Run specific package
pnpm --filter @workspace/prompt-bridge run dev

# Regenerate API client from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Database schema management
pnpm --filter @workspace/db run push     # Push schema
pnpm --filter @workspace/db run generate # Generate types

# View available scripts
pnpm --filter @workspace/api-server run
```

### Database Setup

```bash
# Local PostgreSQL
# Update DATABASE_URL in .env.local, then:
pnpm --filter @workspace/db run push

# Or with Docker
docker run --name promtsaathi-db \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:16
```

### Environment Variables

Create `.env.local`:

```env
# Database (required)
DATABASE_URL=postgresql://user:password@localhost:5432/promtsaathi_dev

# API Server
PORT=5000
NODE_ENV=development

# AI APIs (optional)
OPENAI_API_KEY=sk_...
ANTHROPIC_API_KEY=sk-ant-...

# Frontend
VITE_API_BASE_URL=http://localhost:5000
```

---

## 🚀 Deployment

### Docker (Local Development)

```bash
docker-compose up --build
```

### Production Deployment

See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) for:

- **Railway.app** - Best for API server
- **Render.com** - Full-stack hosting
- **Vercel** - Optimized for React frontends
- **Fly.io** - Global distribution
- **Docker** - Self-hosted deployment

### Deploy with GitHub Actions

Automated CI/CD workflows in `.github/workflows/`:

- `ci.yml` - Type check & build on every push
- `deploy-railway.yml` - Auto-deploy API to Railway
- `deploy-vercel.yml` - Auto-deploy frontend to Vercel

Set up secrets in GitHub:
- `RAILWAY_TOKEN` (for Railway deployments)
- `VERCEL_TOKEN` (for Vercel deployments)

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | Comprehensive setup & development guide |
| [WINDOWS_QUICK_START.md](./WINDOWS_QUICK_START.md) | Windows-specific setup (5-min) |
| [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) | Docker & cloud deployment guide |
| [replit.md](./replit.md) | Original project documentation |

---

## 🐛 Troubleshooting

### "pnpm not found"
```bash
npm install -g pnpm
```

### "PORT environment variable is required"
```bash
export PORT=5000
# or in .env.local:
PORT=5000
```

### "Cannot connect to database"
```bash
# Check DATABASE_URL is correct
# Verify PostgreSQL is running
# Test connection:
psql $DATABASE_URL
```

### "Port already in use"
```bash
# Linux/Mac
lsof -i :5000 | kill -9

# Windows (PowerShell)
Get-NetTCPConnection -LocalPort 5000 | Select-Object OwningProcess
taskkill /PID {PID} /F
```

See [WINDOWS_QUICK_START.md](./WINDOWS_QUICK_START.md#-common-issues--fixes) for more Windows-specific fixes.

---

## 📦 Available NPM Scripts

### Root Workspace
```bash
pnpm run build          # Build all packages with typecheck
pnpm run typecheck      # Type check all packages
pnpm run typecheck:libs # Type check shared libraries only
```

### API Server
```bash
pnpm --filter @workspace/api-server run dev        # Start dev server
pnpm --filter @workspace/api-server run build      # Build
pnpm --filter @workspace/api-server run typecheck  # Type check
```

### Frontend
```bash
pnpm --filter @workspace/prompt-bridge run dev     # Start Vite dev server
pnpm --filter @workspace/prompt-bridge run build   # Build for production
pnpm --filter @workspace/prompt-bridge run serve   # Preview production build
```

### Database
```bash
pnpm --filter @workspace/db run push      # Push schema changes
pnpm --filter @workspace/db run pull      # Pull latest schema
pnpm --filter @workspace/db run generate  # Generate TypeScript types
```

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/my-feature`
3. **Commit** with clear messages
4. **Push** to your fork
5. **Create** a Pull Request

### Before Committing
```bash
pnpm run typecheck  # Ensure type safety
pnpm run build      # Ensure build succeeds
```

---

## 📄 License

MIT - See LICENSE file for details

---

## 🎯 Next Steps

1. ✅ Follow [Quick Start](#quick-start) or [WINDOWS_QUICK_START.md](./WINDOWS_QUICK_START.md)
2. ✅ Set up environment variables in `.env.local`
3. ✅ Initialize database with `pnpm --filter @workspace/db run push`
4. ✅ Start dev servers in 3 terminals
5. ✅ Begin development!

---

**Questions?** Check the documentation files or review individual package README files.

**Ready to deploy?** See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)

---

Made with ❤️ by the PromtSaathi team
