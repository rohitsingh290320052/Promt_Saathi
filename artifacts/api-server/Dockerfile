FROM node:24-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy monorepo root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy shared libraries
COPY lib ./lib

# Copy api-server
COPY artifacts/api-server ./artifacts/api-server

# Copy scripts
COPY scripts ./scripts

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build api-server
WORKDIR /app/artifacts/api-server
RUN pnpm run build

# Expose port
EXPOSE 5000

# Start server
CMD ["pnpm", "run", "start"]
