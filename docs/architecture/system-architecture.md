# System Architecture Document

## Tonghua Public Welfare x Sustainable Fashion

**Version:** 1.0.0
**Last Updated:** 2026-03-19
**Status:** Draft

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Microservice Decomposition](#3-microservice-decomposition)
4. [Data Flow Diagrams](#4-data-flow-diagrams)
5. [Technology Stack](#5-technology-stack)
6. [Scalability Considerations](#6-scalability-considerations)
7. [Security Architecture](#7-security-architecture)
8. [Deployment Architecture](#8-deployment-architecture)

---

## 1. System Overview

The Tonghua Public Welfare platform is a multi-channel (Web, WeChat Mini Program, Android) application that connects children's art creation with sustainable fashion. The system enables charitable donations, artwork submissions with community voting, supply chain transparency tracking, and an e-commerce shop for sustainable products.

**Core Principles:**

- **Child Safety First:** All data related to child participants is encrypted at rest and in transit, with strict access controls and parental consent verification.
- **Supply Chain Transparency:** Every product links to verifiable supply chain records. No vague ESG claims.
- **Editorial Aesthetic:** The frontend follows a 1990s print-magazine design language across all pages, not just the homepage.
- **Multi-tenant Channels:** Web (React), WeChat Mini Program, and Android share the same backend API through an API Gateway.

---

## 2. Architecture Diagram

```
                            +-------------------------------------------------------------+
                            |                      CLIENTS                                |
                            |                                                             |
                            |   +----------+   +--------------+   +--------------+       |
                            |   |  React   |   |  WeChat Mini |   |   Android    |       |
                            |   |  Web App |   |  Program     |   |   (Kotlin)   |       |
                            |   |  (Vite)  |   |  (WXML/WXSS) |   |  (Compose)   |       |
                            |   +-----+----+   +------+------+   +------+-------+       |
                            |         |               |                 |                |
                            +---------+---------------+-----------------+----------------+
                                      |               |                 |
                                      v               v                 v
                           +--------------------------------------------------------------+
                           |                  HTTPS / TLS 1.3                              |
                           +------------------------------+-------------------------------+
                                                          |
                           +------------------------------v-------------------------------+
                           |              API GATEWAY (gateway-svc)                      |
                           |                                                              |
                           |   +------------+ +------------+ +------------------+        |
                           |   | Rate Limit | | JWT Verify | | Request Routing  |        |
                           |   | 1000 QPS   | | + Refresh  | | /api/v1/*        |        |
                           |   | global     | | Token Check| | --> microservices|        |
                           |   | 60 QPM/user| |            | |                  |        |
                           |   +------------+ +------------+ +------------------+        |
                           +------------------------------+-------------------------------+
                                                          |
                           +------------------------------v-------------------------------+
                           |                                                              |
          +----------------+---------------+--------+--------+----------------+          |
          |                |               |        |        |                |          |
          v                v               v        v        v                v          |
 +--------------+  +--------------+  +----------+ +----------+  +--------------+        |
 |  user-svc    |  | artwork-svc  |  | donation | | product- |  |  admin-svc   |        |
 |              |  |              |  |  -svc    | |  svc     |  |              |        |
 | Registration |  | CRUD         |  |          | |          |  | Audit logs   |        |
 | Login        |  | Voting       |  | Create   | | Catalog  |  | Analytics    |        |
 | Profile      |  | Status       |  | Detail   | | Detail   |  | Campaigns    |        |
 | Children     |  | Campaigns    |  | Cert     | | Trace    |  | Moderation   |        |
 +------+-------+  +------+-------+  +-----+----+ +----+-----+  +------+-------+        |
        |                 |                |           |               |                 |
        v                 v                v           v               v                 |
 +--------------+  +--------------+  +----------+ +----------+  +--------------+        |
 |  payment-svc |  | supply-chain |  |          | |          |  |              |        |
 |              |  |    -svc      |  |          | |          |  |              |        |
 | WeChat Pay   |  | Records      |  |          | |          |  |              |        |
 | Alipay       |  | Timeline     |  |          | |          |  |              |        |
 | Stripe       |  | Verify       |  |          | |          |  |              |        |
 | PayPal       |  |              |  |          | |          |  |              |        |
 +------+-------+  +------+-------+  +----------+ +----------+  +--------------+        |
        |                 |                                                            |
        |                 |                                                            |
 +------v-----------------v------------------------------------------------------------+ |
 |                          DATA LAYER                                                 | |
 |                                                                                     | |
 |   +--------------+   +--------------+   +--------------+   +-------------+         | |
 |   |    MySQL 8   |   |    Redis 7   |   |  RabbitMQ    |   |  MinIO/OSS  |         | |
 |   |              |   |              |   |              |   |             |         | |
 |   | users        |   | Sessions     |   | Donation     |   | Artwork     |         | |
 |   | artworks     |   | Rate Limits  |   | Processing   |   | Images      |         | |
 |   | donations    |   | Cache        |   | Payment      |   | Product     |         | |
 |   | orders       |   | Tokens       |   | Callbacks    |   | Images      |         | |
 |   | products     |   |              |   | Email/SMS    |   | Certs       |         | |
 |   | supply_chain |   |              |   |              |   |             |         | |
 |   +--------------+   +--------------+   +--------------+   +-------------+         | |
 +-------------------------------------------------------------------------------------+ |
 +-------------------------------------------------------------------------------------+
```

---

## 3. Microservice Decomposition

### 3.1 Gateway Service (gateway-svc)

**Responsibility:** Single entry point for all client requests. Handles cross-cutting concerns.

| Function | Description |
|----------|-------------|
| Rate Limiting | 1000 QPS global, 60 QPM per authenticated user |
| JWT Verification | Validates access tokens, extracts user claims |
| Request Routing | Routes `/api/v1/*` to appropriate microservice |
| CORS | Configured per-origin for web, mini program, and Android |
| Request Logging | Structured logs for all incoming requests |
| HMAC Signature | Optional request signature verification for sensitive endpoints |

### 3.2 User Service (user-svc)

**Responsibility:** User lifecycle, authentication, and child participant management.

| Function | Description |
|----------|-------------|
| Registration | Email/phone registration with verification |
| Login | Credential validation, JWT issuance (Access 15min, Refresh 7d) |
| Profile | User profile CRUD with field-level encryption for PII |
| Child Participants | Child registration with parental consent verification |
| WeChat Login | OAuth flow for WeChat Mini Program users |

**Sensitive Data Handling:**
- `id_card_number`: AES-256-GCM encrypted at rest
- `phone_number`: AES-256-GCM encrypted at rest
- `child_name`: AES-256-GCM encrypted at rest
- All child records require parental consent flag before any data processing

### 3.3 Artwork Service (artwork-svc)

**Responsibility:** Artwork submission, community voting, and campaign management.

| Function | Description |
|----------|-------------|
| CRUD | Submit, read, update, delete artworks |
| Voting | One vote per user per artwork, anti-fraud checks |
| Status | Moderation workflow: pending -> approved -> published |
| Campaigns | Active campaign listing, detail, participation tracking |

**Business Rules:**
- Artwork images stored in object storage (MinIO/OSS), URL stored in MySQL
- Each vote is recorded with user_id + artwork_id unique constraint
- Moderation requires admin approval before public visibility

### 3.4 Donation Service (donation-svc)

**Responsibility:** Charitable donation processing and certificate generation.

| Function | Description |
|----------|-------------|
| Initiate | Create donation record, redirect to payment |
| Detail | Donation status and breakdown |
| Certificate | Generate PDF donation certificate |

**Business Rules:**
- Donation amounts must be validated server-side (client amount is never trusted)
- Certificates generated only after payment confirmation
- All donations are publicly auditable (amount + date, no personal details)

### 3.5 Product Service (product-svc)

**Responsibility:** Sustainable fashion product catalog.

| Function | Description |
|----------|-------------|
| Catalog | List products with pagination and filtering |
| Detail | Full product info with materials, sizing, impact metrics |
| Traceability | Link to supply chain records |

### 3.6 Supply Chain Service (supply-chain-svc)

**Responsibility:** Transparent supply chain record management.

| Function | Description |
|----------|-------------|
| Records | Raw material sourcing, manufacturing, shipping records |
| Timeline | Chronological supply chain visualization data |
| Verification | Third-party verification status for each step |

**Integrity Rules:**
- Supply chain records are append-only (no modification after creation)
- Each record includes a verification hash
- Public API exposes only verified records

### 3.7 Payment Service (payment-svc)

**Responsibility:** Payment processing across multiple providers.

| Function | Description |
|----------|-------------|
| Create | Initiate payment with server-side amount validation |
| Webhook | Receive and validate payment provider callbacks |
| Refund | Process refunds (admin only) |

**Supported Providers:**
- WeChat Pay (primary for Mini Program)
- Alipay
- Stripe (international)
- PayPal (international)

**Security:**
- Payment amounts validated against order/donation records
- Webhook signatures verified before processing
- Idempotent webhook handling (duplicate callbacks ignored)

### 3.8 Admin Service (admin-svc)

**Responsibility:** Administrative operations and platform management.

| Function | Description |
|----------|-------------|
| Audit Logs | Queryable audit trail of all admin actions |
| Analytics | Platform usage, donation totals, artwork statistics |
| Campaigns | Create and manage campaigns |
| Moderation | Approve/reject artworks, manage users |

**Access Control:**
- RBAC: `super_admin`, `admin`, `moderator` roles
- ABAC: Campaign managers can only manage their assigned campaigns
- All admin actions logged with admin_id, timestamp, action, target

---

## 4. Data Flow Diagrams

### 4.1 User Authentication Flow

```
Client                Gateway              user-svc              Redis
  |                      |                     |                   |
  | POST /auth/login     |                     |                   |
  | {email, password}    |                     |                   |
  |--------------------->|                     |                   |
  |                      | Rate limit check    |                   |
  |                      |-------------------->|                   |
  |                      |                     | Verify credentials|
  |                      |                     |----->  MySQL      |
  |                      |                     |<-----             |
  |                      |                     |                   |
  |                      |                     | Generate JWT pair |
  |                      |                     |------------------>|
  |                      |                     | Store refresh     |
  |                      |                     |<------------------|
  |                      |                     |                   |
  |<---------------------|<--------------------|                   |
  | {access_token,       |                     |                   |
  |  refresh_token,      |                     |                   |
  |  expires_in}         |                     |                   |
```

### 4.2 Artwork Submission and Voting Flow

```
Client              Gateway          artwork-svc         MinIO          MySQL
  |                    |                  |                |              |
  | POST /artworks     |                  |                |              |
  | (multipart/form)   |                  |                |              |
  |------------------->|                  |                |              |
  |                    | JWT + rate check |                |              |
  |                    |----------------->|                |              |
  |                    |                  | Upload image   |              |
  |                    |                  |--------------->|              |
  |                    |                  |<------- URL    |              |
  |                    |                  |                |              |
  |                    |                  | Insert record  |              |
  |                    |                  |-------------------------------->|
  |                    |                  |<--------------- OK ------------|
  |<-------------------|<-----------------|                |              |
  | {artwork_id,       |                  |                |              |
  |  status: "pending"}|                  |                |              |
  |                    |                  |                |              |
  | POST /artworks/    |                  |                |              |
  | {id}/vote          |                  |                |              |
  |------------------->|                  |                |              |
  |                    |----------------->|                |              |
  |                    |                  | Check duplicate|              |
  |                    |                  |-------------------------------->|
  |                    |                  |<----------- no vote yet -------|
  |                    |                  | Insert vote    |              |
  |                    |                  |-------------------------------->|
  |                    |                  | Increment count|              |
  |                    |                  |-------------------------------->|
  |<-------------------|<-----------------|                |              |
```

### 4.3 Donation Payment Flow

```
Client          Gateway      donation-svc    payment-svc     Payment Provider
  |                |              |               |                |
  | POST /donations|              |               |                |
  | /initiate      |              |               |                |
  |--------------->|              |               |                |
  |                |------------->|               |                |
  |                |              | Validate amt  |                |
  |                |              | Create record |                |
  |                |              |-------------->|                |
  |                |              |               | Create payment |
  |                |              |               |--------------->|
  |                |              |               |<----- pay_url  |
  |                |              |<--------------|                |
  |<---------------|<-------------|               |                |
  | {payment_url}  |              |               |                |
  |                |              |               |                |
  | ---- User completes payment on provider page ----             |
  |                |              |               |                |
  |                |              |               |  Webhook POST  |
  |                |              |               |<---------------|
  |                |              |               | Verify sig     |
  |                |              | Update status |                |
  |                |              |<--------------|                |
  |                |              | Generate cert |                |
```

### 4.4 Supply Chain Traceability Flow

```
Client              Gateway          product-svc     supply-chain-svc    MySQL
  |                    |                  |                  |              |
  | GET /products/     |                  |                  |              |
  | {id}/traceability  |                  |                  |              |
  |------------------->|                  |                  |              |
  |                    |----------------->|                  |              |
  |                    |                  | Fetch records    |              |
  |                    |                  |----------------->|              |
  |                    |                  |                  |------------->|
  |                    |                  |                  |<----- rows   |
  |                    |                  |<--- records -----|              |
  |<-------------------|<-----------------|                  |              |
  | [{step, date,      |                  |                  |              |
  |   location,        |                  |                  |              |
  |   verified}, ...]  |                  |                  |              |
```

---

## 5. Technology Stack

### 5.1 Justification

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Backend Framework** | Python FastAPI | Async-first, automatic OpenAPI docs, Pydantic validation, high performance for IO-bound workloads |
| **Database** | MySQL 8.0 | ACID compliance for financial transactions, mature ecosystem, strong encryption support |
| **Cache** | Redis 7 | Session management, rate limiting counters, token blacklisting, sub-millisecond reads |
| **Message Queue** | RabbitMQ | Reliable message delivery for async payment processing, email notifications, certificate generation |
| **Object Storage** | MinIO (dev) / Alibaba Cloud OSS (prod) | S3-compatible, cost-effective for artwork and product images |
| **Frontend - Web** | React 18 + Vite + TypeScript | Component model, fast HMR, strict type safety |
| **Frontend - State** | Zustand | Lightweight, minimal boilerplate, excellent TypeScript support |
| **Frontend - i18n** | react-i18next | Industry standard for React internationalization |
| **Frontend - Data** | TanStack Query | Server state management, caching, background refetch |
| **Frontend - Animations** | Framer Motion | Declarative animations, page transitions (book-turn effect) |
| **Frontend - CSS** | Tailwind CSS + CSS Modules | Utility-first for rapid development, CSS Modules for editorial-specific styles |
| **Mini Program** | WeChat Mini Program (WXML/WXSS) | Required for WeChat ecosystem, WeChat Pay integration |
| **Mobile** | Kotlin + Jetpack Compose | Modern Android UI toolkit, Material Design 3 |
| **Auth** | JWT (RS256) | Stateless authentication, short-lived access tokens (15min), long-lived refresh (7d) |
| **Encryption** | AES-256-GCM | NIST-approved authenticated encryption for sensitive child data |
| **CI/CD** | GitHub Actions | Free for open source, native Docker support |
| **Containerization** | Docker + Docker Compose | Consistent dev/prod parity, easy local setup |

### 5.2 Version Requirements

```
Python:         >= 3.11
FastAPI:        >= 0.110.0
MySQL:          >= 8.0
Redis:          >= 7.0
RabbitMQ:       >= 3.12
Node.js:        >= 20.0
React:          >= 18.2
TypeScript:     >= 5.3
Kotlin:         >= 1.9
JDK:            >= 17
Docker:         >= 24.0
Docker Compose: >= 2.24
```

---

## 6. Scalability Considerations

### 6.1 Horizontal Scaling Strategy

```
                    Load Balancer (Nginx / Cloud LB)
                              |
                +-------------+-------------+
                v             v             v
          +----------+ +----------+ +----------+
          | Gateway  | | Gateway  | | Gateway  |
          | Replica 1| | Replica 2| | Replica N|
          +----+-----+ +----+-----+ +----+-----+
               |            |            |
               +------------+------------+
                            |
                    Service Mesh / Direct
                            |
           +----------------+----------------+
           v                v                v
     +----------+    +----------+    +----------+
     | user-svc |    | artwork- |    | payment- |
     | Replicas |    | svc Rep. |    | svc Rep. |
     +----------+    +----------+    +----------+
```

**Scaling Tiers:**

| Tier | Service | Scaling Trigger | Strategy |
|------|---------|----------------|----------|
| 1 | gateway-svc | CPU > 70% | Horizontal pod autoscaler |
| 2 | user-svc | Request queue depth > 100 | Add replicas behind load balancer |
| 3 | artwork-svc | Image upload throughput | Scale + CDN offload for static assets |
| 4 | payment-svc | Must maintain exactly-once processing | Active-passive with leader election |
| 5 | supply-chain-svc | Read-heavy, cache-friendly | Redis cache + read replicas |

### 6.2 Database Scaling

- **Read Replicas:** MySQL read replicas for analytics queries (admin-svc)
- **Connection Pooling:** SQLAlchemy connection pool (min 5, max 20 per service)
- **Sharding Readiness:** `user_id` as shard key design, not implemented initially
- **Archival:** Artworks older than 2 years moved to cold storage

### 6.3 Caching Strategy

| Data | Cache Layer | TTL | Invalidation |
|------|------------|-----|-------------|
| User session | Redis | 15 min (access token lifetime) | On logout |
| Product catalog | Redis | 5 min | On product update |
| Artwork list | Redis | 1 min | On new submission/vote |
| Campaign list | Redis | 10 min | On campaign update |
| Supply chain records | Redis | 30 min | Append-only, no invalidation needed |
| Rate limit counters | Redis | Sliding window | Automatic expiry |

---

## 7. Security Architecture

### 7.1 Authentication and Authorization

```
Client Request
      |
      v
+-----------------+     +------------------+     +-----------------+
|  TLS 1.3        |---->|  JWT Validation   |---->|  RBAC + ABAC    |
|  Transport      |     |                  |     |  Authorization  |
|  Encryption     |     |  Verify RS256    |     |                 |
|                 |     |  Check exp       |     |  Role check     |
|                 |     |  Check iss       |     |  Policy eval    |
|                 |     |  Check blacklist  |     |  Resource own   |
+-----------------+     +------------------+     +--------+--------+
                                                          |
                                                   +------v------+
                                                   |  Endpoint   |
                                                   |  Handler    |
                                                   +-------------+
```

**Token Design:**
- **Access Token:** RS256 signed, 15-minute expiry, contains `sub`, `role`, `permissions`
- **Refresh Token:** Opaque, stored in Redis, 7-day expiry, single-use (rotated on refresh)
- **Token Blacklist:** On logout, access token `jti` added to Redis blacklist until natural expiry

### 7.2 Data Encryption

| Data Category | Encryption | Key Management |
|--------------|-----------|----------------|
| Child ID card number | AES-256-GCM | Application-level, key in env vault |
| Child real name | AES-256-GCM | Application-level, key in env vault |
| User phone number | AES-256-GCM | Application-level, key in env vault |
| Passwords | bcrypt (cost 12) | N/A (one-way hash) |
| Payment credentials | Provider-managed | Never stored locally |
| TLS certificates | TLS 1.3 | Managed by load balancer / reverse proxy |

### 7.3 API Security Middleware Stack

```
Incoming Request
      |
      v
+------------------+
| 1. TLS Termination|
+--------+---------+
         |
+--------v---------+
| 2. CORS Check     |
+--------+---------+
         |
+--------v---------+
| 3. Rate Limiting  |  <-- Redis-backed sliding window
|    1000 QPS global|      1000 QPS global
|    60 QPM / user  |      60 QPM per user
+--------+---------+
         |
+--------v---------+
| 4. Request Size   |  <-- Max 10MB (artwork upload)
|    Validation     |      Max 1MB (JSON endpoints)
+--------+---------+
         |
+--------v---------+
| 5. JWT Verify     |  <-- Skip for public endpoints
+--------+---------+
         |
+--------v---------+
| 6. HMAC Signature |  <-- For payment endpoints
|    Verification   |
+--------+---------+
         |
+--------v---------+
| 7. Input          |  <-- Pydantic schema validation
|    Validation     |      SQL injection prevention (parameterized queries)
+--------+---------+
         |
+--------v---------+
| 8. Business Logic |
+------------------+
```

### 7.4 Child Data Protection

- All child-related data fields are encrypted with AES-256-GCM before database insertion
- API responses for child data always apply field masking (e.g., name shows as "X**", ID shows last 4 digits)
- Admin access to full child data requires secondary approval (two-person rule)
- Audit log records every access to child data with admin_id, timestamp, and accessed fields
- Data retention: Child records purged 2 years after last activity, with parental notification 30 days prior

---

## 8. Deployment Architecture

### 8.1 Environment Topology

```
+---------------------------------------------------------------+
|                        Production                              |
|                                                                |
|   +----------+   +----------+   +----------+   +-----------+  |
|   | Nginx LB |   | Gateway  |   | Services |   | Data      |  |
|   |          |---| x2       |---| x2 each  |---| Stores    |  |
|   | SSL Term |   |          |   |          |   |           |  |
|   | Static   |   |          |   |          |   | MySQL     |  |
|   | Cache    |   |          |   |          |   | Master    |  |
|   |          |   |          |   |          |   | MySQL     |  |
|   |          |   |          |   |          |   | Replica   |  |
|   |          |   |          |   |          |   | Redis     |  |
|   |          |   |          |   |          |   | Cluster   |  |
|   |          |   |          |   |          |   | RabbitMQ  |  |
|   |          |   |          |   |          |   | x2        |  |
|   |          |   |          |   |          |   | MinIO/OSS |  |
|   +----------+   +----------+   +----------+   +-----------+  |
|                                                                |
+---------------------------------------------------------------+
```

### 8.2 Docker Compose Services (Development)

| Service | Image | Port | Notes |
|---------|-------|------|-------|
| mysql | mysql:8.0 | 3306 | Volume-mounted data, init scripts |
| redis | redis:7-alpine | 6379 | AOF persistence |
| rabbitmq | rabbitmq:3.12-management | 5672, 15672 | Management UI on 15672 |
| minio | minio/minio | 9000, 9001 | Console on 9001 |
| gateway | Custom Dockerfile | 8000 | API entry point |
| user-svc | Custom Dockerfile | 8001 | |
| artwork-svc | Custom Dockerfile | 8002 | |
| donation-svc | Custom Dockerfile | 8003 | |
| product-svc | Custom Dockerfile | 8004 | |
| supply-chain-svc | Custom Dockerfile | 8005 | |
| payment-svc | Custom Dockerfile | 8006 | |
| admin-svc | Custom Dockerfile | 8007 | |

---

## Appendix A: API Endpoint Summary

Total endpoints: **28**

| Service | Endpoints | Auth Required |
|---------|-----------|---------------|
| Gateway (auth) | 3 | Mixed |
| Artwork | 5 | Mixed |
| Campaign | 3 | No |
| Donation | 3 | Yes |
| Product | 3 | No |
| Order | 2 | Yes |
| Supply Chain | 2 | No |
| Payment | 2 | Yes |
| Admin | 3 | Yes (admin role) |

See `docs/api/api-reference.md` for complete endpoint documentation.
