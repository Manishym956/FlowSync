# ==============================================================================
# Multi-stage Production Dockerfile for FlowSync Next.js Frontend
# ==============================================================================

# ── Stage 1: Dependencies & Build stage ───────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Set production env for Next.js build
ENV NODE_ENV=production
RUN npm run build

# ── Stage 2: Production runner stage ──────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary runtime assets from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "run", "start"]
