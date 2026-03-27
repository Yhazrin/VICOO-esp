# 童画公益 x 可持续时尚

## Tonghua Public Welfare x Sustainable Fashion

> 跨平台公益生态系统 -- 将儿童的创意表达转化为可持续时尚，连接善意与透明

[![Backend](https://img.shields.io/badge/Backend-FastAPI%20(Python%203.11)-green)](#)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20WeChat%20Mini%20Program%20%7C%20Android-blue)](#)
[![Database](https://img.shields.io/badge/Database-MySQL%208.0%20%7C%20Redis%207-orange)](#)
[![License](https://img.shields.io/badge/License-Educational-purple)](#)

---

## What This Project Does

Tonghua Public Welfare (童画公益) is a multi-platform application that brings together children's creative expression, sustainable fashion, and transparent public welfare operations.

**Core capabilities:**

- **Children's Artwork Platform** -- Themed campaigns where children submit artwork, receive community voting and support
- **Sustainable Fashion Shop** -- Curated fashion products where proceeds fund children's art programs
- **Donation System** -- Multi-channel donations (WeChat Pay, Alipay, Stripe, PayPal) with transparent fund tracking
- **Supply Chain Traceability** -- Full chain visibility: raw materials, manufacturing, environmental impact. Every claim is verifiable
- **Campaign Management** -- Time-limited public welfare campaigns with real-time progress tracking
- **Storytelling** -- Long-form stories about children, artisans, and communities behind the products
- **Cross-Platform** -- React Web (editorial magazine style), WeChat Mini Program, Android App
- **Internationalization** -- Chinese and English support for domestic and international audiences

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Web Frontend** | React 18, TypeScript, Vite, Zustand, Framer Motion, Tailwind CSS |
| **Mini Program** | WeChat Mini Program (WXML/WXSS/JS) |
| **Android** | Kotlin, Jetpack Compose, Material Design 3 |
| **Backend** | Python 3.11, FastAPI, SQLAlchemy (async), Uvicorn |
| **Database** | MySQL 8.0 |
| **Cache** | Redis 7 |
| **Message Queue** | RabbitMQ 3.12 |
| **Object Storage** | Alibaba Cloud OSS + CDN |
| **Payments** | WeChat Pay, Alipay, Stripe, PayPal |
| **Containerization** | Docker, Docker Compose |
| **CI/CD** | GitHub Actions |
| **Reverse Proxy** | Nginx |
| **Design Style** | 1990s Editorial / Print Magazine Aesthetic |

---

## Quick Start

### Prerequisites

- Docker and Docker Compose (v2.20+)
- Node.js 18 LTS (for local frontend development)
- Python 3.11+ (for local backend development)

### Option A: Docker Compose (Recommended)

```bash
# Clone
git clone https://github.com/<your-org>/tonghua-project.git
cd tonghua-project

# Configure environment
cp deploy/docker/.env.example deploy/docker/.env
# Edit .env -- at minimum, change APP_SECRET_KEY, JWT_SECRET_KEY, ENCRYPTION_KEY

# Start all services
cd deploy/docker
docker compose up -d

# Verify
docker compose ps          # All should show "healthy"
curl http://localhost:8000/health
```

Then open http://localhost for the web app, or http://localhost:8000/docs for the API docs.

### Option B: Local Development

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (separate terminal)
cd frontend/web-react
npm install
npm run dev                # Dev server at http://localhost:5173
```

For full deployment instructions, see the **[Deployment Guide](docs/deployment/deployment-guide.md)**.

---

## Project Structure

```
tonghua-project/
├── README.md                        # This file
├── backend/                         # FastAPI backend (18 API routers)
│   ├── app/
│   │   ├── main.py                  # Application entry point
│   │   ├── config.py                # Configuration & env vars
│   │   ├── database.py              # SQLAlchemy async setup
│   │   ├── models/                  # Database models
│   │   ├── schemas/                 # Pydantic schemas
│   │   ├── routers/                 # API route handlers
│   │   ├── services/                # Business logic
│   │   └── security.py             # Auth, encryption, rate limiting
│   ├── alembic/                    # Database migrations
│   ├── requirements.txt
│   └── .venv/                      # Python virtual environment
├── docs/
│   ├── CLAUDE.md                    # Agent team orchestration rules
│   ├── DEVELOPMENT_GUIDE.md         # Developer quick-start guide
│   ├── architecture/                # System architecture documents
│   ├── api/                         # API reference documentation
│   ├── deployment/                  # Deployment guides
│   ├── design-system/               # UI design system specs
│   └── security/                    # Security & compliance docs
│
├── frontend/
│   ├── web-react/                   # React editorial web platform
│   │   ├── src/
│   │   │   ├── pages/               # 8 editorial pages
│   │   │   ├── components/          # Design system components
│   │   │   ├── styles/              # Design tokens & global styles
│   │   │   ├── store/               # Zustand state management
│   │   │   ├── services/            # API service layer
│   │   │   └── i18n/                # Internationalization
│   │   └── package.json
│   ├── weapp/                       # WeChat Mini Program
│   │   ├── pages/                   # Mini program pages
│   │   ├── components/              # Reusable components
│   │   ├── utils/                   # Utilities (auth, request, encryption)
│   │   └── app.json                 # App configuration
│   └── android/                     # Kotlin + Jetpack Compose
│       └── app/src/main/java/
│           ├── ui/                  # Compose screens & theme
│           ├── data/                # API, models, repositories
│           ├── di/                  # Hilt dependency injection
│           └── viewmodel/           # ViewModels
│
├── admin/                           # Admin dashboard (React)
│
├── deploy/
│   ├── docker/
│   │   ├── docker-compose.yml       # Service orchestration
│   │   ├── .env.example             # Environment variable template
│   │   ├── Dockerfiles/
│   │   │   ├── backend.Dockerfile   # Multi-stage Python build
│   │   │   └── frontend.Dockerfile  # Multi-stage Node + Nginx build
│   │   ├── nginx/
│   │   │   └── nginx.conf           # Nginx reverse proxy config
│   │   └── init-db/                 # MySQL init scripts
│   └── ci/
│       └── github-actions.yml       # CI/CD pipeline definition
│
└── tests/
    ├── api-tests/                   # Backend API tests (pytest)
    ├── security-tests/              # Security penetration tests
    └── frontend-tests/              # Frontend component tests
```

---

## Development Workflow

This project follows a **three-phase workflow**, orchestrated by a team of 15 specialized agents. See [docs/CLAUDE.md](docs/CLAUDE.md) for the full agent definitions and dispatch rules.

### Phase 1: Architecture Design

Four parallel workstreams start simultaneously:

1. **Backend Architecture** -- Microservice boundaries, API contracts, database schema design
2. **Frontend Architecture** -- React component hierarchy, routing, state management strategy
3. **Security Architecture** -- JWT auth flow, AES-256-GCM encryption plan, RBAC model
4. **Design System** -- 1990s editorial magazine aesthetic, Design Tokens, component specifications

Downstream: UX Architect, Brand Guardian, Legal Compliance Writer review and refine.

**Outputs:** Architecture documents, API specifications, database schema, design system documentation, security and compliance plans.

### Phase 2: Core Development

After security infrastructure is established, four parallel tracks:

1. **React Web (8 pages)** -- Home, About, Campaigns, Stories, Donate, Shop, Traceability, Contact
2. **WeChat Mini Program** -- Campaign participation, artwork upload, voting, donations, shopping, WeChat Login & Pay
3. **Android App** -- User center, content browsing, product management, order tracking
4. **Backend APIs** -- 8 microservices: gateway, user, artwork, donation, product, supply-chain, payment, admin

Code reviewer performs ongoing PR reviews throughout.

**Outputs:** Functional applications across all three platforms, 8 backend services, code review reports.

### Phase 3: Testing and Deployment

Three parallel workstreams:

1. **API Testing** -- Endpoint coverage, security testing (SQL injection, XSS, authorization bypass), load testing, payment sandbox testing
2. **Accessibility Auditing** -- WCAG 2.1 AA compliance, responsive verification, cross-platform interaction consistency
3. **DevOps** -- CI/CD pipeline, Docker configuration, deployment automation

Final: Technical documentation, full code review, security compliance verification.

---

## Agent Team (15 Roles)

| # | Agent | Role | Phase |
|---|-------|------|-------|
| 01 | Orchestrator | Task decomposition, team coordination | All |
| 02 | Backend Architect | API design, database schema, microservices | 1-2 |
| 03 | React Frontend Developer | React pages, components, state management | 1-2 |
| 04 | WeChat Mini Program Developer | WeChat full-stack, WeChat Pay integration | 2 |
| 05 | Android Engineer | Kotlin + Jetpack Compose mobile app | 2 |
| 06 | Security Engineer | JWT, AES encryption, API security, RBAC | 1-2 |
| 07 | UI Designer | Magazine aesthetic design system, Design Tokens | 1 |
| 08 | UX Architect | CSS architecture, responsive layout, animations | 1-2 |
| 09 | Brand Guardian | Visual consistency across all platforms | All |
| 10 | Legal Compliance Writer | Privacy policy, children's protection, GDPR | 1, 3 |
| 11 | DevOps Engineer | CI/CD, Docker, deployment automation | 3 |
| 12 | API Tester | API testing, security testing, load testing | 3 |
| 13 | Accessibility Auditor | WCAG compliance, responsive verification | 3 |
| 14 | Code Reviewer | Code quality, architecture consistency, security | All |
| 15 | Technical Writer | API docs, architecture docs, deployment guides | 3 |

---

## Backend Microservices

| Service | Description |
|---------|------------|
| `gateway-service` | API security, rate limiting, HMAC verification, routing |
| `user-service` | Authentication (JWT), authorization (RBAC+ABAC), profiles |
| `artwork-service` | Upload, campaigns, voting, content moderation |
| `donation-service` | Donation processing, certificates, fund tracking |
| `product-service` | Products, cart, orders, inventory management |
| `supply-chain-service` | Materials, production, logistics, traceability |
| `payment-service` | WeChat Pay, Alipay, Stripe, PayPal -- webhooks, reconciliation |
| `admin-service` | Audit logs, analytics, campaign management |

---

## Design System

The React web platform uses a **1990s printed magazine aesthetic**, applied consistently across all pages:

- **Typography:** Playfair Display (headlines) + IBM Plex Mono (body text)
- **Colors:** Low-saturation paper tones with rust/brown accents
- **Layout:** Magazine-style CSS Grid with asymmetric columns
- **Images:** Sepia filter + grain overlay
- **Navigation:** Numbered table-of-contents style (01, 02, 03...)
- **Transitions:** Page-flip animation between routes
- **Textures:** Paper grain, noise overlay, editorial pull-quotes

This style is enforced on every page, not just the homepage.

---

## Security

| Area | Implementation |
|------|---------------|
| **Authentication** | JWT (RS256) with 15-min access + 7-day refresh tokens |
| **Authorization** | RBAC + ABAC combined model |
| **Encryption** | AES-256-GCM for sensitive data (children's PII uses a separate key) |
| **Rate Limiting** | Redis-based sliding window (1000/s global, 60/min per user, 20/s per IP) |
| **Request Signing** | HMAC-SHA256 on authenticated endpoints |
| **Transport** | TLS 1.3 mandatory in production |
| **Child Protection** | Isolated encrypted schema, secondary approval, display-name only |

---

## Deployment

### Docker Compose (Development & Staging)

```bash
cd deploy/docker
docker compose up -d
```

| Service | Container | Port |
|---------|-----------|------|
| Web App (Nginx) | tonghua-frontend | 80 |
| FastAPI Backend | tonghua-backend | 8000 |
| MySQL 8.0 | tonghua-mysql | 3306 |
| Redis 7 | tonghua-redis | 6379 |
| RabbitMQ | tonghua-rabbitmq | 5672 / 15672 (UI) |

### CI/CD Pipeline

GitHub Actions runs on every push/PR:

- `develop` branch: Lint + type check + tests
- `main` branch: Full pipeline -- lint, test, Docker build, deploy to staging, then production (manual approval)

Docker images are published to GitHub Container Registry:
```
ghcr.io/<org>/tonghua-project/backend:latest
ghcr.io/<org>/tonghua-project/frontend:latest
```

### Full Documentation

- **[Deployment Guide](docs/deployment/deployment-guide.md)** -- Comprehensive guide covering local setup, Docker, environment variables, CI/CD, production checklist, monitoring, backup/recovery, and security hardening
- **[Architecture Docs](docs/architecture/)** -- System architecture and database design
- **[API Reference](docs/api/)** -- API endpoint documentation
- **[Security Docs](docs/security/)** -- Privacy policy, compliance, child protection

---

## Compliance

- **PIPL** (个人信息保护法) -- Full compliance for Chinese users
- **GDPR** -- Compliance for international visitors
- **Child Protection** -- 《未成年人保护法》 strict adherence; children under 14 require guardian consent
- **Payment** -- Licensed merchant accounts for all payment gateways

---

## Key Constraints

1. The web frontend must maintain the editorial magazine style on every page -- no default UI library styles
2. Payment processing requires sandbox testing and legal compliance review before going live
3. Children's personal information is handled under strict PIPL compliance
4. Supply chain data must be real and verifiable -- no generic ESG copy
5. All TypeScript code uses strict mode
6. All frontend code considers accessibility (a11y)

---

## License

This project is for educational purposes (课程设计). All rights reserved.
