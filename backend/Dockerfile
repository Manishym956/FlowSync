# ==============================================================================
# Multi-stage Production Dockerfile for FlowSync Backend (API & Worker)
# ==============================================================================

# ── Stage 1: Build stage ──────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client & compile TypeScript
RUN npm run db:generate
RUN npm run build

# ── Stage 2: Production runtime stage ─────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built assets and prisma schema from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# Expose default HTTP port
EXPOSE 3001

# Default command starts the API server (Worker uses same image with different command)
CMD ["node", "dist/server.js"]
