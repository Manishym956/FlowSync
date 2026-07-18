# Technical Requirements Document (TRD)

## FlowSync — Multi-System Data Integration & Automation Platform

**Version:** 1.0
**Status:** MVP
**Primary Stack:** TypeScript, Node.js, Express.js, PostgreSQL, Redis, BullMQ, Next.js

---

# 1. Purpose

FlowSync is a backend-first integration platform designed to connect heterogeneous external systems, synchronize data between them, and automate workflows triggered by external events.

The platform will provide a reusable connector architecture that abstracts differences between external APIs while providing centralized:

* API integration
* Data transformation
* Data synchronization
* Webhook processing
* Workflow automation
* Retry and failure recovery
* Idempotency
* Monitoring
* Integration logging

The MVP will demonstrate integration with:

1. A standard REST API
2. A FHIR-compatible API
3. A messaging/notification API

The architecture should allow additional connectors to be introduced without modifying the core synchronization engine.

---

# 2. Technical Objectives

The system must:

* Provide modular connectors for heterogeneous APIs.
* Normalize external data into a unified internal model.
* Support synchronous and asynchronous operations.
* Process long-running synchronization jobs in the background.
* Support webhook-based real-time events.
* Prevent duplicate event processing.
* Retry transient failures automatically.
* Track integration and workflow execution.
* Provide operational metrics and structured logs.
* Expose REST APIs for managing and monitoring integrations.

---

# 3. High-Level Architecture

```text
                    ┌─────────────────────┐
                    │    Next.js Client   │
                    │ Monitoring Dashboard│
                    └──────────┬──────────┘
                               │
                               │ HTTPS / REST
                               ▼
                    ┌─────────────────────┐
                    │   Express.js API    │
                    │     Gateway         │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
      Integration        Webhook           Monitoring
        Service          Service            Service
             │                 │                 │
             └────────────┬────┘                 │
                          │                      │
                          ▼                      │
                    ┌───────────┐                │
                    │   Redis   │                │
                    │  BullMQ   │                │
                    └─────┬─────┘                │
                          │                      │
                          ▼                      │
                    ┌───────────┐                │
                    │  Workers  │                │
                    └─────┬─────┘                │
                          │                      │
                          ▼                      │
                 ┌──────────────────┐            │
                 │ Connector Layer  │            │
                 └────────┬─────────┘            │
                          │                      │
             ┌────────────┼────────────┐         │
             │            │            │         │
             ▼            ▼            ▼         │
          REST API     FHIR API    Messaging API │
             │            │            │         │
             └────────────┼────────────┘         │
                          │                      │
                          ▼                      │
                 Data Transformation            │
                          │                      │
                          ▼                      ▼
                    ┌────────────────────┐
                    │    PostgreSQL      │
                    │ Data + Logs + Jobs │
                    └────────────────────┘
```

---

# 4. Technology Stack

## 4.1 Frontend

* Next.js
* TypeScript
* Tailwind CSS
* Recharts

Responsibilities:

* Integration dashboard
* Sync job monitoring
* Integration health monitoring
* Error/failure inspection
* Workflow execution history

---

## 4.2 Backend

* Node.js
* TypeScript
* Express.js

Responsibilities:

* REST API endpoints
* Integration management
* Webhook ingestion
* Job creation
* Connector orchestration
* Authentication
* Metrics aggregation

---

## 4.3 Database

PostgreSQL will serve as the primary persistent database.

It will store:

* Internal entities
* External entity mappings
* Integration configurations
* Sync jobs
* Workflow executions
* Webhook metadata
* Integration logs

Recommended ORM:

Prisma

---

## 4.4 Queue and Background Processing

Redis will act as the queue backend.

BullMQ will manage:

* Synchronization jobs
* Workflow jobs
* Notification jobs
* Retry scheduling

Workers will process jobs independently from the main API server.

---

## 4.5 Infrastructure

The application will use Docker for local development.

Required containers:

```text
flowsync-api
flowsync-worker
flowsync-web
postgres
redis
```

Docker Compose will orchestrate local development.

---

# 5. Backend Project Structure

```text
backend/
│
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── env.ts
│   │
│   ├── controllers/
│   │   ├── integration.controller.ts
│   │   ├── sync.controller.ts
│   │   ├── webhook.controller.ts
│   │   ├── metrics.controller.ts
│   │   └── logs.controller.ts
│   │
│   ├── services/
│   │   ├── integration.service.ts
│   │   ├── sync.service.ts
│   │   ├── webhook.service.ts
│   │   ├── workflow.service.ts
│   │   └── monitoring.service.ts
│   │
│   ├── connectors/
│   │   ├── base.connector.ts
│   │   ├── rest/
│   │   │   └── rest.connector.ts
│   │   ├── fhir/
│   │   │   └── fhir.connector.ts
│   │   └── messaging/
│   │       └── messaging.connector.ts
│   │
│   ├── transformers/
│   │   ├── user.transformer.ts
│   │   ├── event.transformer.ts
│   │   └── fhir.transformer.ts
│   │
│   ├── queues/
│   │   ├── sync.queue.ts
│   │   └── workflow.queue.ts
│   │
│   ├── workers/
│   │   ├── sync.worker.ts
│   │   └── workflow.worker.ts
│   │
│   ├── middleware/
│   │   ├── error.middleware.ts
│   │   ├── auth.middleware.ts
│   │   └── validation.middleware.ts
│   │
│   ├── routes/
│   │   ├── integration.routes.ts
│   │   ├── sync.routes.ts
│   │   ├── webhook.routes.ts
│   │   └── monitoring.routes.ts
│   │
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── retry.ts
│   │   └── idempotency.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── prisma/
│   └── schema.prisma
│
└── tests/
```

---

# 6. Connector Architecture

All external integrations must implement a common connector interface.

```typescript
interface Connector<TExternal, TInternal> {
  authenticate(): Promise<void>;

  fetchData(params?: Record<string, unknown>): Promise<TExternal[]>;

  transformData(data: TExternal): TInternal;

  pushData?(data: TInternal): Promise<void>;

  healthCheck(): Promise<boolean>;
}
```

Connector-specific logic must remain isolated from the synchronization engine.

Example:

```text
Sync Engine
    │
    ▼
Connector Registry
    │
    ├── RESTConnector
    ├── FHIRConnector
    └── MessagingConnector
```

A Connector Registry will map an integration type to its implementation.

Example:

```typescript
const connectorRegistry = {
  rest: RestConnector,
  fhir: FhirConnector,
  messaging: MessagingConnector
};
```

This allows the synchronization engine to dynamically select connectors.

---

# 7. REST API Connector

The generic REST connector will demonstrate integration with a conventional third-party API.

Responsibilities:

* Authentication
* GET/POST requests
* Pagination
* Timeout handling
* Rate-limit handling
* Response validation
* Error handling

Example flow:

```text
REST API
   ↓
Fetch Records
   ↓
Validate Response
   ↓
Transform Records
   ↓
Check Existing Mapping
   ↓
Upsert Internal Record
```

The connector should use Axios or native Fetch.

---

# 8. FHIR Connector

The FHIR connector will communicate with a public FHIR-compatible sandbox/test environment.

Initial supported resources:

* Patient
* Appointment

Example request:

```text
GET /Patient
GET /Patient/{id}
GET /Appointment
GET /Appointment/{id}
```

FHIR responses should be transformed into FlowSync's unified models.

Example:

```text
FHIR Patient
{
    id,
    name,
    telecom,
    gender,
    birthDate
}

        ↓

FlowSync User
{
    id,
    externalId,
    sourceSystem,
    name,
    email,
    phone
}
```

FHIR-specific models should remain inside the FHIR connector and transformer modules.

The core integration engine should not contain FHIR-specific business logic.

---

# 9. Data Synchronization Engine

Synchronization will run asynchronously.

Flow:

```text
POST /api/integrations/:id/sync
             │
             ▼
      Create SyncJob
             │
             ▼
        Add BullMQ Job
             │
             ▼
        Worker Receives
             │
             ▼
      Resolve Connector
             │
             ▼
        Fetch Data
             │
             ▼
      Validate + Transform
             │
             ▼
        Deduplicate
             │
             ▼
       Database Upsert
             │
             ▼
      Update Job Status
```

Sync job states:

```text
PENDING
PROCESSING
COMPLETED
FAILED
```

Each sync operation must track:

* Start time
* Completion time
* Records processed
* Records failed
* Retry count
* Error details

---

# 10. Queue Architecture

Two primary queues will exist.

```text
sync-queue
workflow-queue
```

Optional:

```text
notification-queue
```

Example BullMQ job:

```typescript
{
  integrationId: "uuid",
  operation: "SYNC",
  resourceType: "Patient"
}
```

Workers should operate independently from the API process.

---

# 11. Retry Strategy

Transient failures should automatically retry using exponential backoff.

Recommended configuration:

```text
Attempt 1 → Immediate
Attempt 2 → 30 seconds
Attempt 3 → 2 minutes
Attempt 4 → 10 minutes
```

Retryable errors:

* HTTP 429
* HTTP 500
* HTTP 502
* HTTP 503
* HTTP 504
* Network timeout
* Connection reset

Generally non-retryable errors:

* HTTP 400
* HTTP 401
* HTTP 403
* Invalid payload
* Schema validation failure

Jobs that exceed retry limits will be marked as FAILED.

---

# 12. Webhook Architecture

Endpoint:

```text
POST /api/webhooks/:provider
```

Processing flow:

```text
Webhook Received
      ↓
Validate Signature
      ↓
Generate / Read Event ID
      ↓
Idempotency Check
      ↓
Persist Event Metadata
      ↓
Return HTTP 200
      ↓
Queue Processing Job
      ↓
Execute Workflow
```

Webhook endpoints should acknowledge valid requests quickly.

Long-running processing must occur asynchronously.

---

# 13. Idempotency

FlowSync must prevent duplicate operations.

Possible idempotency key:

```text
provider + external_event_id
```

A unique database constraint should enforce this.

Example:

```text
UNIQUE(source, external_event_id)
```

If the same webhook is received again:

```text
Webhook Received
      ↓
Event Exists?
      ↓
YES
      ↓
Return 200
      ↓
Do Not Reprocess
```

Synchronization should use external resource IDs to perform database upserts instead of blindly inserting new records.

---

# 14. Database Schema

## Integration

```text
id UUID PK
name VARCHAR
type VARCHAR
status VARCHAR
created_at TIMESTAMP
updated_at TIMESTAMP
```

## ExternalEntity

```text
id UUID PK
internal_entity_id UUID
external_id VARCHAR
source_system VARCHAR
entity_type VARCHAR
last_synced_at TIMESTAMP

UNIQUE(source_system, external_id, entity_type)
```

## SyncJob

```text
id UUID PK
integration_id UUID FK
status VARCHAR
records_processed INTEGER
records_failed INTEGER
retry_count INTEGER
started_at TIMESTAMP
completed_at TIMESTAMP
error_message TEXT
```

## WebhookEvent

```text
id UUID PK
external_event_id VARCHAR
source VARCHAR
event_type VARCHAR
payload JSONB
processed BOOLEAN
received_at TIMESTAMP

UNIQUE(source, external_event_id)
```

## IntegrationLog

```text
id UUID PK
integration_id UUID FK
operation VARCHAR
status VARCHAR
latency INTEGER
retry_count INTEGER
error_message TEXT
created_at TIMESTAMP
```

## WorkflowExecution

```text
id UUID PK
workflow_name VARCHAR
trigger_event VARCHAR
status VARCHAR
started_at TIMESTAMP
completed_at TIMESTAMP
error_message TEXT
```

---

# 15. REST API Specification

## Integration APIs

```text
GET /api/integrations
GET /api/integrations/:id
POST /api/integrations/:id/sync
GET /api/integrations/:id/health
```

## Sync APIs

```text
GET /api/sync-jobs
GET /api/sync-jobs/:id
```

## Webhooks

```text
POST /api/webhooks/:provider
```

## Monitoring

```text
GET /api/metrics
GET /api/logs
GET /api/failures
```

## Connector APIs

```text
GET /api/connectors/fhir/patients
GET /api/connectors/fhir/appointments

POST /api/connectors/fhir/sync
```

All API responses should follow a consistent structure.

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Error:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INTEGRATION_FAILED",
    "message": "Failed to synchronize external data"
  }
}
```

---

# 16. Monitoring Requirements

The monitoring service should expose:

```text
totalRequests
successfulRequests
failedRequests
averageLatency
activeIntegrations
failedIntegrations
syncSuccessRate
recentFailures
```

Dashboard:

```text
┌─────────────────────────────────────────────┐
│              FlowSync Dashboard             │
├───────────┬───────────┬───────────┬─────────┤
│ Active    │ Success   │ Failed    │ Avg API │
│ Integr.   │ Syncs     │ Syncs     │ Latency │
├───────────┴───────────┴───────────┴─────────┤
│                                             │
│           Sync Success Rate Graph           │
│                                             │
├─────────────────────────────────────────────┤
│ Recent Integration Activity                 │
├─────────────────────────────────────────────┤
│ Integration │ Status │ Latency │ Last Sync  │
└─────────────────────────────────────────────┘
```

---

# 17. Logging

Logs should use structured JSON.

Recommended library:

Pino

Example:

```json
{
  "timestamp": "2026-07-18T10:30:00Z",
  "level": "error",
  "integration": "fhir",
  "operation": "fetchPatients",
  "status": "failed",
  "latency": 1250,
  "retryCount": 2
}
```

Sensitive payload data must not be logged.

---

# 18. Security Requirements

The application must:

* Store credentials in environment variables.
* Validate incoming API payloads.
* Validate webhook signatures where supported.
* Avoid logging secrets or sensitive data.
* Use HTTPS in production.
* Apply request rate limiting.
* Sanitize user-controlled input.
* Implement CORS restrictions.
* Use parameterized database queries through the ORM.

Environment variables:

```text
DATABASE_URL
REDIS_URL
FHIR_BASE_URL
MESSAGING_API_KEY
JWT_SECRET
```

No credentials should be committed to Git.

---

# 19. Validation

Zod should be used for request and external-data validation.

Example:

```typescript
const SyncRequestSchema = z.object({
  resourceType: z.enum([
    "Patient",
    "Appointment"
  ])
});
```

External API responses should be validated before transformation.

Invalid records should:

1. Be skipped.
2. Increment `records_failed`.
3. Generate an integration log.
4. Not stop valid records from processing.

---

# 20. Error Handling

A centralized Express error handler should convert internal errors into standardized API responses.

Error categories:

```text
VALIDATION_ERROR
AUTHENTICATION_ERROR
INTEGRATION_ERROR
RATE_LIMIT_ERROR
TIMEOUT_ERROR
DATABASE_ERROR
INTERNAL_ERROR
```

Internal stack traces must not be exposed through production API responses.

---

# 21. Testing Strategy

## Unit Tests

Test:

* Data transformers
* Idempotency logic
* Retry classification
* Connector methods

## Integration Tests

Test:

* API → Database
* Queue → Worker
* Connector → Transformation
* Webhook → Queue
* Sync → Database

## Failure Tests

Simulate:

* API timeout
* HTTP 429
* HTTP 500
* Invalid JSON
* Duplicate webhooks
* Redis unavailable
* Database unavailable

Recommended framework:

Jest

Target:

```text
Core business logic coverage ≥ 80%
```

---

# 22. Deployment Architecture

MVP deployment:

```text
                  Internet
                     │
                     ▼
              ┌─────────────┐
              │  Next.js    │
              │  Frontend   │
              └──────┬──────┘
                     │
                     ▼
              ┌─────────────┐
              │ Node.js API │
              └──────┬──────┘
                     │
              ┌──────┴───────┐
              ▼              ▼
         PostgreSQL         Redis
                              │
                              ▼
                         BullMQ Worker
                              │
                              ▼
                        External APIs
```

Possible deployment:

Frontend:

Vercel

Backend and worker:

Render / Railway

Database:

Supabase PostgreSQL / Neon

Redis:

Upstash

---

# 23. MVP Development Sequence

### Phase 1 — Foundation

* Initialize Node.js + TypeScript backend
* Configure Express
* Configure Prisma
* Set up PostgreSQL
* Implement base API structure
* Implement centralized error handling

### Phase 2 — Connector System

* Build BaseConnector interface
* Implement Connector Registry
* Build REST connector
* Implement data transformation

### Phase 3 — FHIR Integration

* Connect FHIR sandbox
* Fetch Patient resources
* Fetch Appointment resources
* Build FHIR transformers
* Store normalized records

### Phase 4 — Async Processing

* Configure Redis
* Configure BullMQ
* Implement sync queue
* Implement worker
* Add retry and exponential backoff

### Phase 5 — Webhooks & Automation

* Build webhook endpoint
* Implement idempotency
* Queue webhook processing
* Trigger notification workflow

### Phase 6 — Observability

* Implement structured logging
* Store integration logs
* Build metrics APIs
* Build monitoring dashboard

### Phase 7 — Testing & Deployment

* Add unit tests
* Add integration tests
* Dockerize services
* Deploy application
* Create Swagger documentation

---

# 24. MVP Definition of Done

The MVP is complete when the following flow works end-to-end:

```text
External API / FHIR API
          ↓
     Connector
          ↓
     Sync Queue
          ↓
       Worker
          ↓
     Fetch Data
          ↓
      Validate
          ↓
     Transform
          ↓
     Deduplicate
          ↓
     PostgreSQL
          ↓
 Trigger Workflow
          ↓
 External Service
```

The system must demonstrate:

* At least one standard REST integration.
* At least one FHIR integration.
* At least one outbound API integration.
* Background job processing.
* Automatic retries.
* Idempotent webhook processing.
* Data normalization.
* Integration health monitoring.
* Structured error logging.
* A functional monitoring dashboard.

The final GitHub repository should include architecture documentation, API documentation, setup instructions, sample environment variables, Docker configuration, and screenshots of the monitoring dashboard.
