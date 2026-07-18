# UI/UX Development Guidelines

## UI Priority

UI quality is a first-class requirement for FlowSync.

The application should feel like a production-ready B2B SaaS integration and
observability platform, not a generic admin dashboard or student project.

Google Stitch is the primary tool for UI design and generation.

When Stitch MCP is available:
1. Use Stitch to design or generate the UI.
2. Treat the approved Stitch design as the visual source of truth.
3. Implement the generated design accurately in Next.js.
4. Connect real backend data without unnecessarily changing the visual design.
5. Preserve responsiveness and component consistency.

Do not redesign an approved Stitch screen unless explicitly requested.

---

## Design Direction

The visual identity should communicate:

- Reliability
- Infrastructure
- Automation
- Data movement
- Observability
- Modern developer tooling

Take inspiration from polished developer-focused SaaS products.

Avoid:
- Generic admin dashboard templates
- Excessive gradients
- Excessive glassmorphism
- Large empty hero sections inside the application
- Random bright colors
- Oversized cards
- Excessive rounded corners
- Emoji-based UI icons

The UI should be clean, information-dense, and professional.

---

## Application Layout

Use a persistent sidebar navigation.

Primary navigation:

Overview
Integrations
Sync Jobs
Workflows
Logs
Failures

Secondary navigation:

Settings
Documentation

Top navigation should contain:

- Global search
- System status
- Notifications
- User profile

The main content area should use consistent spacing and maximum available
screen width efficiently.

---

## Overview Dashboard

The dashboard should immediately answer:

1. Are integrations working?
2. Is data syncing successfully?
3. What is failing?
4. Does anything require attention?

Top metric cards:

- Active Integrations
- Sync Success Rate
- Failed Syncs
- Average API Latency

Include:

- Sync success rate over time
- API latency over time
- Recent sync activity
- Integration health
- Recent failures

Prioritize actionable information over decorative charts.

---

## Integrations Page

Display connected integrations using clean cards or rows.

Each integration should show:

- Integration name
- Integration type
- Connection status
- Last successful sync
- Sync frequency
- Health status

Available actions:

- View details
- Trigger sync
- View logs
- Configure

Status should be visually distinguishable:

Healthy
Degraded
Failed
Syncing

Do not rely only on color to communicate status.

---

## Integration Detail Page

Each integration should have a dedicated detail page.

Sections:

Overview
Sync History
Logs
Configuration

Display:

- Current health
- Last synchronization
- Success rate
- Average latency
- Records processed
- Recent errors

Include a prominent "Sync Now" action.

---

## Sync Jobs Page

Use a data table.

Columns:

Job ID
Integration
Resource
Status
Records Processed
Records Failed
Duration
Started At

Support:

- Search
- Status filtering
- Integration filtering

Clicking a job should open detailed execution information.

---

## Workflows Page

Represent workflows visually where practical.

Example:

Webhook
    ↓
Validate Event
    ↓
Transform Data
    ↓
Update Database
    ↓
Send Notification

Users should be able to inspect:

- Trigger
- Steps
- Last execution
- Success rate
- Recent failures

Do not build a drag-and-drop workflow editor for the MVP.

---

## Logs Page

Logs should be designed for technical debugging.

Display:

Timestamp
Integration
Operation
Status
Latency
Message

Support:

- Search
- Integration filter
- Status filter
- Time filter

Allow users to expand individual logs to inspect additional metadata.

Do not display sensitive payload data.

---

## Failures Page

Failures should be highly actionable.

Each failure should show:

- Integration
- Failed operation
- Error category
- Error message
- Timestamp
- Retry count

Provide actions where supported:

- View details
- Retry operation
- View related logs

Failures requiring attention should be visually prioritized.

---

## Loading States

Never show blank screens while loading.

Use:

- Skeleton loaders
- Table skeletons
- Card skeletons

Avoid unnecessary full-page loading spinners.

---

## Empty States

Every major page should have a meaningful empty state.

Example:

No integrations:
"Connect your first integration to start synchronizing data."

No failures:
"Everything looks healthy. No integration failures detected."

No sync jobs:
"No synchronization jobs have run yet."

Empty states should explain what the user can do next.

---

## Error States

API failures must not break entire pages.

Display contextual error states with retry actions where possible.

Example:

"Unable to load integration metrics."

[Try Again]

---

## Responsive Design

Primary target:

Desktop: 1440px

Also support:

Laptop: 1280px
Tablet: 768px
Mobile: 375px

The monitoring dashboard is desktop-first.

Tables may become horizontally scrollable on smaller screens.

Sidebar should collapse appropriately.

---

## Component System

Build reusable components for:

MetricCard
StatusBadge
IntegrationCard
DataTable
LogViewer
FailureCard
EmptyState
ErrorState
SkeletonLoader

Do not duplicate visually identical components.

Use a consistent design token system for:

Typography
Spacing
Border radius
Borders
Shadows
Status indicators

---

## Stitch MCP Workflow

For each major screen:

1. Understand the screen requirements from PRD.md and TRD.md.
2. Create a detailed UI brief.
3. Use Stitch MCP to generate the screen.
4. Review the output for consistency with existing FlowSync screens.
5. Refine the design if required.
6. Implement the approved design in Next.js.
7. Break the implementation into reusable components.
8. Connect components to real API endpoints.
9. Add loading, empty, error, and success states.
10. Verify responsive behavior.

Do not ask Stitch to generate the entire application in one prompt.

Generate screens individually while maintaining the same design system.

Recommended generation order:

1. Application shell and sidebar
2. Overview Dashboard
3. Integrations
4. Integration Details
5. Sync Jobs
6. Workflows
7. Logs
8. Failures
9. Settings

Maintain visual consistency across every generated screen.

---

## Final UI Quality Check

Before considering a screen complete, verify:

- Does it match the Stitch design?
- Does it look production-ready?
- Is spacing consistent?
- Is typography consistent?
- Are loading states implemented?
- Are empty states implemented?
- Are error states implemented?
- Are interactions functional?
- Is real backend data connected?
- Does it work at 1440px and 1280px?
- Are components reusable?
- Are there any placeholder buttons that do nothing?

Do not mark UI work complete while visible functionality is broken.