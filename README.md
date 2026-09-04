# Feature Flag Service

A lightweight feature flag management platform built with **Java, Quarkus, React, TypeScript, PostgreSQL, and Docker**.

It allows teams to turn application features on or off independently across **Development, Test, and Production environments**, while keeping a complete audit trail of every change.

---

## What is a Feature Flag?

Imagine your application contains a new payment screen.

Normally, releasing the application could immediately expose that new feature to every user.

With a feature flag, the application can ask:

> "Should the new payment feature be enabled?"

The answer can be changed without changing the application code.

For example:

| Feature | DEV | TEST | PROD |
|---|---:|---:|---:|
| `payment-v2` | ON | ON | OFF |
| `new-checkout` | ON | OFF | OFF |
| `dark-mode` | ON | ON | ON |

This makes it possible to develop, test, and release features more safely.

---

# Why This Project?

Modern software teams often need to:

- test unfinished features without exposing them to production users,
- enable or disable functionality quickly,
- manage different configurations across environments,
- understand who changed a feature and when,
- reduce the risk associated with software releases.

This project provides a simple implementation of those concepts.

It is intentionally focused on the core feature-flag workflow rather than trying to reproduce large commercial platforms.

---

# Main Features

## Environment-Based Feature Flags

Feature flags are managed independently across:

- `DEV`
- `TEST`
- `PROD`

The same feature key can exist in multiple environments.

Example:

```text
payment-v2 / DEV  / enabled
payment-v2 / TEST / enabled
payment-v2 / PROD / disabled
```

A feature key must remain unique **within the same environment**.

---

## Create Feature Flags

New flags can be created directly from the dashboard.

Each feature flag contains:

```text
Key
Environment
Enabled / Disabled status
```

Example:

```text
Key: payment-v2
Environment: PROD
Status: Disabled
```

---

## Enable / Disable Features

Feature flags can be switched on or off instantly from the dashboard.

```text
OFF → ON
ON  → OFF
```

Every toggle operation is recorded in the audit history.

---

## Edit Feature Flags

Existing flags can be updated directly from the UI.

The application validates duplicate keys and prevents conflicting flags within the same environment.

---

## Delete Feature Flags

Flags can be removed from the active configuration.

The delete operation is still preserved in the audit history.

---

# Audit History

Every important change creates an audit record.

Supported audit actions:

```text
CREATED
UPDATED
ENABLED
DISABLED
DELETED
```

An audit entry contains:

```text
Feature key
Environment
Action
Previous value
New value
Changed by
Timestamp
```

Example:

```text
payment-v2
PROD
ENABLED
OFF → ON
by merve
04 Sep 2026 08:15
```

This means that even after a flag changes or is deleted, the history of the operation remains available.

---

# Dashboard

The React dashboard provides a single interface for managing feature flags.

Main areas include:

### Environment Selector

```text
[ DEV ]   [ TEST ]   [ PROD ]
```

Changing the selected environment automatically loads the flags and audit history associated with that environment.

### Summary

The dashboard shows:

```text
Current Environment
Total Flags
Enabled Flags
Disabled Flags
```

### Feature Flag Management

Users can:

```text
Create
Search
Filter
Edit
Enable / Disable
Delete
```

### Audit History

Recent changes are displayed directly below the feature flag list.

---

# Architecture

The project is structured as a small full-stack application.

```text
                     ┌─────────────────────┐
                     │      Browser        │
                     │                     │
                     │  React + TypeScript │
                     └──────────┬──────────┘
                                │
                                │ REST / JSON
                                ▼
                     ┌─────────────────────┐
                     │   Quarkus Backend   │
                     │                     │
                     │ Feature Flag API    │
                     │ Audit API           │
                     │ Validation          │
                     │ Business Rules      │
                     └──────────┬──────────┘
                                │
                                │ Hibernate ORM
                                ▼
                     ┌─────────────────────┐
                     │     PostgreSQL      │
                     │                     │
                     │ feature_flags       │
                     │ audit_logs          │
                     └─────────────────────┘
```

---

# Technology Stack

## Backend

- Java 21
- Quarkus 3
- REST API
- Hibernate ORM
- Panache
- Jakarta Validation
- PostgreSQL
- H2 for automated tests
- JUnit
- REST Assured
- Maven

## Frontend

- React
- TypeScript
- Vite
- Fetch API
- CSS

## Infrastructure

- Docker
- Docker Compose
- PostgreSQL 16
- Nginx

---

# Project Structure

```text
feature-flag/
│
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/dkrmerve/
│   │   │   │   ├── AuditAction.java
│   │   │   │   ├── AuditLog.java
│   │   │   │   ├── AuditLogResource.java
│   │   │   │   ├── Environment.java
│   │   │   │   ├── FeatureFlag.java
│   │   │   │   └── FeatureFlagResource.java
│   │   │   │
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   │
│   │   └── test/
│   │
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── pom.xml
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── featureFlags.ts
│   │   ├── types/
│   │   │   └── FeatureFlag.ts
│   │   ├── App.tsx
│   │   └── App.css
│   │
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

# Data Model

## Feature Flag

A feature flag contains:

```text
id
key
environment
enabled
```

Example:

```json
{
  "id": 1,
  "key": "payment-v2",
  "environment": "DEV",
  "enabled": true
}
```

The combination of:

```text
flag key + environment
```

must be unique.

This allows:

```text
payment-v2 + DEV
payment-v2 + TEST
payment-v2 + PROD
```

while preventing two `payment-v2` flags inside `DEV`.

---

## Audit Log

An audit record contains:

```text
id
flagKey
environment
action
oldValue
newValue
changedBy
changedAt
```

Example:

```json
{
  "id": 12,
  "flagKey": "payment-v2",
  "environment": "PROD",
  "action": "ENABLED",
  "oldValue": false,
  "newValue": true,
  "changedBy": "web-ui",
  "changedAt": "2026-09-04T06:15:24Z"
}
```

---

# REST API

Base backend URL:

```text
http://localhost:8080
```

---

## Get Feature Flags

```http
GET /api/flags
```

Returns all feature flags.

### Filter by environment

```http
GET /api/flags?environment=DEV
```

Available values:

```text
DEV
TEST
PROD
```

---

## Create Feature Flag

```http
POST /api/flags
```

Example request:

```json
{
  "key": "payment-v2",
  "environment": "DEV",
  "enabled": true
}
```

Optional audit header:

```http
X-Changed-By: developer-name
```

---

## Update Feature Flag

```http
PUT /api/flags/{id}
```

Example:

```json
{
  "key": "payment-v2",
  "environment": "DEV",
  "enabled": false
}
```

---

## Toggle Feature Flag

```http
PUT /api/flags/{id}/toggle
```

Example:

```text
false → true
```

or:

```text
true → false
```

---

## Delete Feature Flag

```http
DELETE /api/flags/{id}
```

Successful deletion returns:

```text
204 No Content
```

---

# Audit API

## Get All Audit Records

```http
GET /api/audit
```

---

## Filter by Environment

```http
GET /api/audit?environment=PROD
```

---

## Filter by Feature Key

```http
GET /api/audit?flagKey=payment-v2
```

---

## Filter by Both

```http
GET /api/audit?flagKey=payment-v2&environment=PROD
```

---

# Business Rules

The application currently applies the following core rules:

1. A feature flag key cannot be empty.
2. An environment must be one of:

```text
DEV
TEST
PROD
```

3. A feature key must be unique within an environment.
4. The same key may exist in different environments.
5. Creating a feature generates a `CREATED` audit record.
6. Updating a feature generates an `UPDATED` audit record.
7. Enabling a feature generates an `ENABLED` audit record.
8. Disabling a feature generates a `DISABLED` audit record.
9. Deleting a feature generates a `DELETED` audit record.
10. Audit history remains separate from the active feature configuration.

---

# Running with Docker

The easiest way to run the complete application is Docker Compose.

## Requirements

Install:

- Docker Desktop
- Docker Compose

Clone the repository:

```bash
git clone https://github.com/dkrmerve/feature-flag-service.git
cd feature-flag-service/backend
```

Start the complete stack:

```bash
docker compose up --build
```

The application will start:

| Service | Address |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8080 |
| PostgreSQL | localhost:5432 |

Open:

```text
http://localhost:5173
```

---

# Running Without Docker

## PostgreSQL

The backend expects a PostgreSQL database:

```text
Database: feature_flags
Username: feature_user
Password: feature_pass
Port: 5432
```

---

## Backend

From:

```text
backend/
```

run:

### Windows

```powershell
.\mvnw.cmd quarkus:dev
```

### macOS / Linux

```bash
./mvnw quarkus:dev
```

Backend:

```text
http://localhost:8080
```

---

## Frontend

From:

```text
frontend/
```

install dependencies:

```bash
npm install
```

Start Vite:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# Backend Tests

The backend contains automated integration tests covering the main feature flag and audit workflows.

Run:

### Windows

```powershell
.\mvnw.cmd clean test
```

### macOS / Linux

```bash
./mvnw clean test
```

The test environment uses an in-memory **H2 database**, so running the automated tests does not require a local PostgreSQL instance.

Covered scenarios include:

- creating feature flags,
- environment separation,
- duplicate detection,
- invalid environment validation,
- empty key validation,
- updating flags,
- toggling flags,
- deleting flags,
- not-found scenarios,
- audit creation,
- audit updates,
- audit enable / disable events,
- audit deletion events,
- audit actor tracking,
- audit filtering.

---

# Frontend Build

Create a production frontend build with:

```bash
npm run build
```

The production build performs TypeScript compilation before generating the Vite bundle.

---

# Example Workflow

A developer creates:

```text
new-checkout
DEV
ON
```

The team tests the feature successfully.

The same feature can then be configured independently:

```text
new-checkout
TEST
ON
```

while production remains:

```text
new-checkout
PROD
OFF
```

When the production release is ready:

```text
new-checkout
PROD
OFF → ON
```

The change is recorded in the audit history with its timestamp and actor.

---

# Current Scope

This project currently focuses on the fundamental mechanics of feature flag management:

```text
Environment management
Flag lifecycle
Flag status control
Audit history
REST APIs
Persistence
Validation
Docker deployment
```

It does **not** currently attempt to be a full replacement for enterprise platforms such as LaunchDarkly or Unleash.

The goal is to demonstrate a clean implementation of the core engineering concepts behind such systems.

---

# Possible Future Improvements

Potential next steps include:

- authentication and authorization,
- user accounts,
- role-based access control,
- flag ownership,
- project / application grouping,
- approval workflow for production changes,
- scheduled flag activation,
- percentage-based rollout,
- user targeting,
- application SDKs,
- WebSocket / real-time updates,
- Redis caching,
- Kafka-based change events,
- frontend automated tests,
- CI/CD pipeline,
- metrics and monitoring,
- Kubernetes deployment.

---

# Engineering Goals

This project demonstrates:

- REST API design,
- backend validation,
- environment-aware domain modeling,
- auditability,
- relational database design,
- transactional operations,
- backend integration testing,
- React and TypeScript integration,
- full-stack API communication,
- containerization,
- Docker Compose orchestration.

---

# Repository

GitHub:

```text
https://github.com/dkrmerve/feature-flag-service
```

---

## Author

**Merve Döker**

Senior Java Backend Engineer / Technical Lead

Focus areas:

```text
Java
Backend Engineering
Distributed Systems
Microservices
Software Architecture
AI-Assisted Software Development
```