# Docker Support for PromtSaathi

## Quick Start with Docker Compose

This allows you to run PostgreSQL and the API server in Docker without manual setup.

### Prerequisites
- Docker Desktop for Windows installed
- At least 4GB RAM allocated to Docker

### Setup

```powershell
# Build and start all services
docker-compose up --build

# In a separate terminal, push database schema
docker-compose exec api pnpm --filter @workspace/db run push

# Access services
# - API: http://localhost:5000
# - PostgreSQL: localhost:5432
```

### Services

- **PostgreSQL 16** - Database on port 5432
- **API Server** - Express.js on port 5000
- Automatically links services via Docker network

### Stopping Services

```powershell
# Stop all services
docker-compose down

# Stop and remove data volumes (clean slate)
docker-compose down -v
```

## Building Docker Images Manually

### Build API Server Image

```powershell
cd artifacts/api-server

# Build
docker build -t promtsaathi-api:latest .

# Run
docker run -p 5000:5000 `
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" `
  -e PORT=5000 `
  -e NODE_ENV=production `
  promtsaathi-api:latest
```

### Build Frontend Image

```powershell
cd artifacts/prompt-bridge

# Build
docker build -t promtsaathi-web:latest .

# Run
docker run -p 80:80 promtsaathi-web:latest
```

**Frontend Dockerfile**:
```dockerfile
FROM node:24-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY lib ./lib
COPY artifacts/prompt-bridge ./artifacts/prompt-bridge

RUN pnpm install --frozen-lockfile
WORKDIR /app/artifacts/prompt-bridge
RUN pnpm run build

# Nginx for serving
FROM nginx:alpine
COPY --from=builder /app/artifacts/prompt-bridge/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Deployment Platforms

### Railway.app
1. Push to GitHub
2. Create Railway project
3. Connect GitHub repo
4. Set environment variables
5. Deploy

### Render.com
1. Create new Web Service
2. Connect GitHub
3. Build command: `pnpm install && pnpm --filter @workspace/api-server run build`
4. Start command: `pnpm --filter @workspace/api-server run start`
5. Add environment variables

### Fly.io
1. Install Fly CLI: `choco install flyctl`
2. `flyctl auth signup`
3. `flyctl launch` in api-server directory
4. `flyctl deploy`

### Vercel (Frontends)
```powershell
npm install -g vercel
cd artifacts/prompt-bridge
vercel
```

## Production Checklist

- [ ] DATABASE_URL points to production PostgreSQL
- [ ] NODE_ENV=production
- [ ] All API keys secured (use secrets management)
- [ ] CORS configured for frontend URLs
- [ ] Logging enabled
- [ ] Error monitoring (Sentry/DataDog) configured
- [ ] Database backups enabled
- [ ] CI/CD pipeline configured
