# FlowSync Development Guidelines

## Project Context
You are working on FlowSync, a multi-system data integration and automation platform.

The system integrates heterogeneous external APIs through reusable connectors, normalizes external data, processes asynchronous synchronization jobs, handles webhooks, and provides monitoring for integration reliability.

Read the PRD and TRD before making architectural decisions.

## Primary Tech Stack
- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend: Node.js + TypeScript + Express.js
- Database: PostgreSQL + Prisma
- Queue: Redis + BullMQ
- Validation: Zod
- Logging: Pino
- Testing: Jest
- Infrastructure: Docker

Do not introduce new frameworks or major dependencies unless necessary.

## Architecture Rules

Maintain clear separation between:

Controller → Service → Connector → Transformer → Database

Controllers must only handle HTTP concerns.

Business logic belongs in services.

External API-specific logic belongs inside connectors.

Data transformation belongs inside transformer modules.

Long-running operations must be processed asynchronously using BullMQ workers.

Do not place FHIR-specific logic inside the core integration engine.

All connectors should follow a common interface wherever practical.

## Connector Design

Every external integration should be modular.

A connector should be responsible for:
- Authentication
- Fetching external data
- Sending external data when required
- Handling pagination
- Handling rate limits
- Health checks

External API responses must be transformed into internal models before persistence.

Never tightly couple the core synchronization engine to one external provider.

## API Development

Use RESTful conventions.

All endpoints must return consistent response structures.

Success:

{
  "success": true,
  "data": {},
  "error": null
}

Failure:

{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}

Validate incoming requests using Zod.

Use appropriate HTTP status codes.

Do not expose stack traces or internal implementation details through production APIs.

## Error Handling

Never silently catch errors.

Classify errors into:
- Validation errors
- Authentication errors
- Integration errors
- Rate-limit errors
- Timeout errors
- Database errors
- Internal errors

Retry only transient failures.

Do not automatically retry invalid requests or authentication failures.

Use exponential backoff for retryable integration failures.

## Data Integrity

External resources must use stable external IDs.

Use database upserts where appropriate.

Prevent duplicate webhook processing using idempotency keys.

Webhook events should have a unique constraint based on source and external event ID.

Never blindly insert records during synchronization when an external mapping already exists.

## Async Processing

Do not execute long-running synchronization operations inside HTTP request handlers.

API requests should create jobs and return quickly.

BullMQ workers should handle:
- Data synchronization
- Workflow execution
- Retryable integration operations
- Notifications when applicable

Workers must update job status correctly on success and failure.

## Webhooks

Webhook handlers must:
1. Validate the request.
2. Verify signatures when supported.
3. Check idempotency.
4. Persist event metadata.
5. Queue processing.
6. Return quickly.

Do not execute complex workflows directly inside webhook HTTP handlers.

## Security

Never hardcode:
- API keys
- Database credentials
- Authentication tokens
- Secrets

Use environment variables.

Never commit .env files.

Never log credentials, authentication headers, tokens, or sensitive payloads.

Sanitize external inputs.

Use parameterized database access through Prisma.

Use HTTPS in production.

## FHIR Integration

FHIR is one connector supported by FlowSync, not the core identity of the platform.

Initially support:
- Patient
- Appointment

Keep raw FHIR types isolated inside the FHIR connector.

Transform FHIR resources into FlowSync internal models before using them elsewhere.

Do not claim HIPAA compliance or production healthcare readiness.

Use only synthetic/test data during development.

## Logging and Observability

Use structured logging with Pino.

Important operations should log:
- Integration
- Operation
- Status
- Latency
- Retry count
- Timestamp

Errors should contain enough technical context for debugging without exposing sensitive data.

## Code Quality

Use TypeScript strict typing.

Avoid `any` unless absolutely necessary.

Prefer small, focused functions.

Avoid duplicate logic.

Use descriptive variable and function names.

Keep modules focused on a single responsibility.

Do not over-engineer abstractions before they are needed.

Add comments only when they explain why something is done, not what obvious code does.

## Testing

Write unit tests for:
- Transformers
- Idempotency logic
- Retry classification
- Connector behavior

Write integration tests for:
- API → Database
- Queue → Worker
- Connector → Transformer → Database
- Webhook → Queue

Test failure scenarios including:
- API timeout
- HTTP 429
- HTTP 5xx
- Invalid external data
- Duplicate webhook events

## Agent Behaviour

Before implementing a major feature:
1. Inspect the existing codebase.
2. Understand the current architecture.
3. Identify affected files.
4. Create a short implementation plan.
5. Implement the smallest complete solution.
6. Run relevant tests.
7. Fix errors before considering the task complete.

Do not rewrite working modules unnecessarily.

Do not make unrelated changes.

Do not delete files or execute destructive filesystem/database commands without explicit approval.

Do not change the architecture defined in the TRD without explaining why.

When requirements are ambiguous, prefer the simplest implementation consistent with the PRD and TRD.

After completing a feature, report:
- What was implemented
- Files changed
- Tests performed
- Known limitations
- Recommended next step

## Development Priority

Build in this order:

1. Backend foundation
2. PostgreSQL + Prisma
3. Connector interface and registry
4. Generic REST connector
5. Synchronization engine
6. Redis + BullMQ workers
7. FHIR connector
8. Webhook processing and idempotency
9. Outbound notification integration
10. Structured logging
11. Monitoring APIs
12. Monitoring dashboard
13. Tests
14. Dockerization
15. Deployment

Always prioritize a working end-to-end vertical slice over partially implementing many features.