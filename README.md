# FlowSync

A multi-system data integration and automation platform.

## Architecture

```
backend/   - Node.js + TypeScript + Express + Prisma + BullMQ
frontend/  - Next.js + TypeScript + Tailwind CSS + TanStack Query
```

## Quick Start

### Prerequisites
- **Docker Desktop** must be running before executing `docker-compose up`
- Or install PostgreSQL and Redis locally as an alternative

### Option A — Docker (recommended)
```bash
# 1. Start Docker Desktop first, then:
cp .env.example .env
docker-compose up -d postgres redis
cd backend
npm install
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
npm run dev        # API on :3001 (separate terminal)
npm run worker     # BullMQ worker (separate terminal)
```

### Option B — Local PostgreSQL + Redis
```bash
# Create database
createdb flowsync
# Set DATABASE_URL in backend/.env
cd backend
npm install
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
npm run dev
npm run worker
```

## Manual Development Setup

### Backend
```bash
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev        # API server on :3001
npm run worker     # BullMQ worker (separate terminal)
```

### Frontend
```bash
cd frontend
npm install
npm run dev        # Next.js on :3000
```

## Environment Variables

See `.env.example` for all required variables.

## API Documentation

- Health: `GET http://localhost:3001/health`
- Integrations: `GET http://localhost:3001/api/integrations`
- Trigger sync: `POST http://localhost:3001/api/integrations/:id/sync`
- Sync jobs: `GET http://localhost:3001/api/sync-jobs`
- Logs: `GET http://localhost:3001/api/logs`
- Metrics: `GET http://localhost:3001/api/metrics`

All endpoints require `Authorization: Bearer <API_KEY>` header.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, TanStack Query |
| Backend | Node.js, TypeScript, Express.js |
| ORM | Prisma |
| Database | PostgreSQL |
| Queue | Redis + BullMQ |
| Logging | Pino |
| Validation | Zod |
| Testing | Jest |
| Infrastructure | Docker + Docker Compose |
