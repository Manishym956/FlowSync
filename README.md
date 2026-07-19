# FlowSync

**FlowSync** is an enterprise-grade multi-system data integration and automation platform designed to synchronize data across legacy REST services, FHIR R4 healthcare sandboxes, and outbound messaging systems with event-driven reliability and full observability.

---

## Why FlowSync?

Integrating modern cloud applications with legacy databases, EHR healthcare sandboxes (FHIR R4), and external API webhooks presents severe engineering challenges:
- **Duplicate Data & Webhook Storms**: Network retries and duplicate webhooks lead to inconsistent database records without strict idempotency guarantees.
- **System Rate Limits & Failures**: External REST and FHIR endpoints suffer from intermittent rate limits (HTTP 429) and server outages (HTTP 500/503), causing job failures if not handled with intelligent retry backoff.
- **Black-Box Processing**: Integration operations often run as unmonitored scripts without real-time metrics, execution logs, or failure classification.

FlowSync solves these challenges with a decoupled, asynchronous connector architecture, database-enforced idempotency, exponential backoff retries, and a dark-first observability dashboard.

---

## Key Features

- **Generic Connector Architecture**: Standardized `BaseConnector` interface isolating protocol-specific logic (REST, FHIR R4, Messaging) from core processing engines.
- **FHIR R4 Interoperability**: First-class FHIR connector supporting Patient and Appointment resource ingestion and data normalization.
- **Inbound Webhook Pipeline**: Webhook receiver endpoint supporting HMAC-SHA256 signature verification and payload deduplication.
- **Database-Level Idempotency**: Prevents duplicate records using `UNIQUE(source, external_event_id)` constraints and PostgreSQL `UPSERT` statements.
- **Asynchronous BullMQ Queueing**: High-throughput queueing powered by Redis, isolating API response paths from background worker processing loops.
- **Intelligent Error Classification**: Automatic error classification into retryable (HTTP 429, 5xx, network timeouts) and non-retryable (HTTP 400, 401, 403, 422) failures.
- **Outbound Messaging System**: Reusable messaging service abstraction integrating Resend email delivery with automatic mock simulator fallback.
- **Developer Observability Dashboard**: Full Next.js 16 App Router interface featuring time-series metrics, live health checks, execution observability, audit logs, and unified failure tracking.

---

## Architecture Overview

```mermaid
graph TD
    Client[Next.js App Router Frontend] -->|HTTP / Relative Path| BFF[Next.js Server-Side BFF Proxy]
    BFF -->|Bearer Auth / Port 3001| ExpressAPI[Express REST & Webhook API]
    
    ExpressAPI -->|Read/Write Metadata| Postgres[(PostgreSQL Database)]
    ExpressAPI -->|Enqueue Jobs| Redis[(Redis / BullMQ)]
    
    subgraph Workers[Background Workers Process Loop]
        SyncWorker[Sync Worker]
        WorkflowWorker[Workflow Worker]
    end
    
    Redis --> SyncWorker
    Redis --> WorkflowWorker
    
    SyncWorker -->|UPSERT Entities| Postgres
    SyncWorker -->|Fetch Data| ExtREST[RandomUser REST API]
    SyncWorker -->|Fetch Data| ExtFHIR[HAPI FHIR R4 Sandbox]
    
    WorkflowWorker -->|Outbound Dispatch| MsgConnector[Messaging Connector]
    MsgConnector -->|HTTP Delivery| ResendAPI[Resend Outbound Email API / Mock]
```

---

## Technology Stack

- **Backend**: Node.js 20, TypeScript, Express, Prisma ORM, PostgreSQL 16, Redis 7, BullMQ, Pino Logger, Jest, Supertest.
- **Frontend**: Next.js 16 App Router, React 19, TypeScript, TanStack Query, TailwindCSS, Recharts, Lucide Icons, Vitest.
- **Infrastructure & Containerization**: Docker, Multi-Stage Dockerfiles, Docker Compose, GitHub Actions CI.

---

## Core Engineering Decisions

1. **Connector & Transformer Abstraction**: Protocol-specific API structures (RandomUser REST, HAPI FHIR R4) are isolated within dedicated connectors and transformers. The core sync engine operates exclusively on normalized internal models (`FlowSyncUser`, `FlowSyncEvent`).
2. **API & Worker Process Decoupling**: Express API servers and BullMQ workers run in independent process loops. The API server only validates requests and enqueues jobs, guaranteeing response latencies `< 50ms`.
3. **Database-Level Idempotency**: Webhook deduplication relies on `UNIQUE(source, external_event_id)` at the PostgreSQL database boundary rather than transient in-memory locks.
4. **BFF Proxy Secret Isolation**: Next.js route handlers (`app/api/[...path]/route.ts`) act as a server-side BFF proxy. Client-side browser bundles receive relative paths only (`/api/*`), keeping sensitive `API_KEY` credentials isolated within server environment variables.

---

## Reliability & Failure Handling

FlowSync implements error handling governed by the following rules:
- **Retryable Errors**: HTTP 429 (Rate Limit), 500, 502, 503, 504, and network timeouts (`ECONNRESET`, `ETIMEDOUT`). Retried via BullMQ exponential backoff (`0s`, `30s`, `2m`, `10m`).
- **Non-Retryable Errors**: HTTP 400 (Bad Request), 401/403 (Auth Failure), 404 (Not Found), 422 (Unprocessable Entity), and schema validation failures. Immediately classified as `FAILED` with an error summary written to `IntegrationLog`.
- **Outbound Delivery Guarantees**: Outbound messaging supports **at-least-once** attempt delivery. Downstream idempotency keys are passed to messaging providers to minimize duplicate delivery risk.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default / Example |
|----------|-------------|-------------------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://flowsync:flowsync_dev_pass@localhost:5433/flowsync` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `PORT` | Backend Express server port | `3001` |
| `NODE_ENV` | Environment mode | `development` / `production` / `test` |
| `API_KEY` | Static Bearer API key for authorization | `dev-api-key-change-in-production` |
| `WEBHOOK_SECRET` | HMAC SHA-256 webhook signature secret | `dev-webhook-secret-change-in-production` |
| `FHIR_BASE_URL` | FHIR R4 Sandbox endpoint | `https://hapi.fhir.org/baseR4` |
| `RANDOM_USER_API_URL` | Generic REST sandbox endpoint | `https://randomuser.me/api/` |
| `RESEND_API_KEY` | Resend API key or mock mode | `mock-mode` |
| `RESEND_FROM_EMAIL` | Outbound email sender address | `onboarding@resend.dev` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Default / Example |
|----------|-------------|-------------------|
| `NEXT_PUBLIC_API_BASE_URL` | Client API base path | `/api` |
| `BACKEND_API_URL` | Server-side BFF proxy target | `http://localhost:3001` |
| `API_KEY` | Server-side Bearer authentication token | `dev-api-key-change-in-production` |

---

## Local Setup & Quickstart

### 1. Prerequisites
- Node.js 20+
- Docker Desktop & Docker Compose

### 2. Start Infrastructure (PostgreSQL & Redis)
```bash
docker compose up -d
```

### 3. Setup Backend Database & Start Servers
```bash
# Navigate to backend
cd backend

# Install dependencies & run Prisma migrations & seed database
npm install
npm run db:migrate
npm run db:seed

# Terminal 1: Start Express API server (Port 3001)
npm run dev

# Terminal 2: Start BullMQ background worker
npm run worker
```

### 4. Start Frontend Dashboard
```bash
# Open new terminal and navigate to frontend
cd frontend

# Install dependencies & start Next.js dev server (Port 3000)
npm install
npm run dev
```

Open `http://localhost:3000` in your browser to view the FlowSync Dashboard.

---

## Testing

FlowSync includes automated test suites covering unit logic, API integration, and full product workflows:

```bash
# Run Backend Unit & Integration Tests (Jest)
cd backend
npm test

# Run Frontend API Client Unit Tests (Vitest)
cd frontend
npm test

# Run Full End-to-End Product Flow Test
cd frontend
node e2e_smoke_test.js
```

---

## Production Docker Deployment

FlowSync provides multi-stage production Dockerfiles and a full-stack Compose configuration:

```bash
# Build and launch production stack with container healthchecks
docker compose -f docker-compose.prod.yml up --build -d
```

---

## Important API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/health` | System health check (API, DB, Redis) | No |
| `GET` | `/api/metrics` | Dashboard overview counters & rates | Yes (Bearer) |
| `GET` | `/api/integrations` | List active connectors and performance stats | Yes (Bearer) |
| `GET` | `/api/integrations/:id/health` | Live health probe for specific integration | Yes (Bearer) |
| `POST` | `/api/integrations/:id/sync` | Trigger asynchronous synchronization job | Yes (Bearer) |
| `POST` | `/api/webhooks/:provider` | Ingest inbound webhook (HMAC signature checked) | Signature |
| `GET` | `/api/sync-jobs` | Paginated sync jobs execution log | Yes (Bearer) |
| `GET` | `/api/workflow-executions` | Paginated workflow executions audit table | Yes (Bearer) |
| `GET` | `/api/logs` | Technical audit logs search & filter API | Yes (Bearer) |
| `GET` | `/api/failures` | Unified failure events tracking endpoint | Yes (Bearer) |

---

## Repository Structure

```
FlowSync/
├── backend/
│   ├── src/
│   │   ├── connectors/      # Base, REST, FHIR, Messaging connectors
│   │   ├── controllers/     # API route handlers
│   │   ├── middleware/      # Auth, error handling, logging
│   │   ├── queues/          # BullMQ queue definitions
│   │   ├── services/        # Sync, webhook, messaging services
│   │   ├── transformers/    # User & FHIR transformers
│   │   ├── utils/           # Idempotency, signature, retry utils
│   │   ├── workers/         # Sync & Workflow background workers
│   │   ├── app.ts           # Express application setup
│   │   └── server.ts        # HTTP server entry point
│   ├── tests/
│   │   ├── unit/            # Transformer, signature, retry unit tests
│   │   └── integration/     # API & Webhook integration tests
│   ├── prisma/              # Database schema & migrations
│   └── Dockerfile           # Multi-stage production build
├── frontend/
│   ├── app/                 # Next.js 16 App Router pages & BFF proxy
│   ├── components/          # Dashboard layout & UI components
│   ├── lib/                 # Typed API client & data models
│   ├── __tests__/           # Vitest frontend unit tests
│   └── Dockerfile           # Multi-stage production build
├── docs/                    # Architecture diagrams & API documentation
├── docker-compose.yml       # Development infrastructure compose
├── docker-compose.prod.yml  # Full-stack production compose
└── README.md                # FlowSync project documentation
```

---

## License & Disclaimer

FlowSync is built for demonstration purposes. While implementing production-grade integration design patterns, it is a sandbox demonstration project.
