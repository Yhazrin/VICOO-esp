# VICOO

**Sustainable Fashion · Circular Commerce · Transparent Impact**

> A cross-platform ecosystem that transforms children's creative expression into wearable art -- with full supply chain transparency and traceable social impact.

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python%203.11-green)](#)
[![React](https://img.shields.io/badge/React-18-blue)](#)
[![WeChat](https://img.shields.io/badge/WeChat%20Mini%20Program-Grey?style=flat&logo=weixin)](#)
[![Android](https://img.shields.io/badge/Android-Kotlin-blue?style=flat&logo=android)](#)
[![License](https://img.shields.io/badge/License-Educational-purple)](#)

---

## What VICOO Does

VICOO is a multi-platform application connecting three worlds: **children's artistic expression**, **sustainable fashion**, and **transparent public welfare**.

- **Creative Platform** -- Children submit artwork through themed campaigns, receive community votes and editorial features
- **Fashion Collection** -- Curated apparel and accessories where proceeds directly fund children's art programs
- **Circular Commerce** -- Clothing intake, resale, and recycling with verified supply chain records
- **Donation System** -- Multi-channel giving (WeChat Pay, Alipay, Stripe, PayPal) with real-time fund tracking
- **Full Traceability** -- Every material, artisan, and environmental claim is independently verifiable
- **Editorial Storytelling** -- Long-form narratives about the children, makers, and communities behind each piece

**Three platforms, one visual language.** React Web (editorial magazine aesthetic), WeChat Mini Program, and Android App -- all sharing the same design DNA.

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
| **Payments** | WeChat Pay, Alipay, Stripe, PayPal |
| **Containerization** | Docker, Docker Compose |
| **CI/CD** | GitHub Actions |
| **Design Language** | 1990s Editorial / Print Magazine Aesthetic |

---

## Quick Start

### Prerequisites

- Docker and Docker Compose (v2.20+)
- Node.js 18 LTS (for local frontend development)
- Python 3.11+ (for local backend development)

### Option A: Docker Compose (Recommended)

```bash
# Clone
git clone https://github.com/Yhazrin/VICOO-esp.git
cd VICOO-esp

# Configure environment
cp deploy/docker/.env.example deploy/docker/.env
# Edit .env -- at minimum, set APP_SECRET_KEY, JWT_SECRET_KEY, ENCRYPTION_KEY

# Start all services
cd deploy/docker
docker compose up -d

# Verify
docker compose ps
curl http://localhost:8000/health
```

The web app is at **http://localhost**, API docs at **http://localhost:8000/docs**.

### Option B: Local Development

```bash
# Backend
cd backend
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (separate terminal)
cd frontend/web-react
npm install
npm run dev
```

For full deployment instructions, see the **[Deployment Guide](docs/deployment/deployment-guide.md)**.

---

## Project Structure

```
VICOO-esp/
├── README.md                        # This file
│
├── backend/                         # FastAPI backend
│   ├── app/
│   │   ├── main.py                  # Entry point
│   │   ├── config.py               # Configuration & env vars
│   │   ├── database.py             # SQLAlchemy async setup
│   │   ├── models/                  # Database models
│   │   ├── schemas/                 # Pydantic schemas
│   │   ├── routers/                 # API route handlers (18 modules)
│   │   ├── services/               # Business logic
│   │   └── security.py            # Auth, encryption, rate limiting
│   ├── alembic/                    # Database migrations
│   ├── scripts/                    # Utility scripts
│   ├── requirements.txt
│   └── .venv/                      # Python virtual environment
│
├── frontend/
│   ├── web-react/                  # React 18 editorial web platform
│   │   └── src/
│   │       ├── pages/              # 8 editorial pages
│   │       ├── components/         # Design system components
│   │       ├── styles/             # Design tokens & global styles
│   │       ├── store/              # Zustand state management
│   │       ├── services/           # API service layer
│   │       └── i18n/               # Internationalization
│   ├── weapp/                      # WeChat Mini Program
│   │   ├── pages/                  # Mini program pages
│   │   ├── components/             # Reusable components
│   │   ├── utils/                  # Auth, request, encryption
│   │   └── app.json               # App configuration
│   └── android/                    # Kotlin + Jetpack Compose
│       └── app/src/main/java/org/tonghua/app/
│           ├── ui/                 # Compose screens & theme
│           ├── data/               # API, models, repositories
│           ├── di/                 # Hilt dependency injection
│           └── viewmodel/          # ViewModels
│
├── admin/                           # Admin dashboard (React)
│
├── deploy/
│   ├── docker/
│   │   ├── docker-compose.yml      # Service orchestration
│   │   ├── .env.example            # Environment variable template
│   │   ├── Dockerfiles/
│   │   │   ├── backend.Dockerfile  # Multi-stage Python build
│   │   │   └── frontend.Dockerfile # Multi-stage Node + Nginx build
│   │   ├── nginx/
│   │   │   └── nginx.conf          # Nginx reverse proxy config
│   │   └── init-db/               # MySQL init scripts
│   └── ci/
│       └── github-actions.yml      # CI/CD pipeline
│
├── docs/
│   ├── CLAUDE.md                   # Agent team orchestration rules
│   ├── DEVELOPMENT_GUIDE.md        # Developer quick-start guide
│   ├── architecture/               # System architecture & database design
│   ├── api/                        # API reference documentation
│   ├── deployment/                 # Deployment guides
│   ├── design-system/             # Editorial style guide & Morandi themes
│   └── security/                   # Privacy policy, compliance, child protection
│
└── tests/
    ├── api-tests/                  # Backend API tests (pytest)
    └── security-tests/             # Security penetration tests
```

---

## Design System

The web platform uses a **1990s printed magazine aesthetic** -- applied consistently on every page, not just the homepage:

- **Typography** -- Playfair Display (headlines) + IBM Plex Mono (body)
- **Colors** -- Low-saturation paper tones with rust and warm brown accents
- **Layout** -- Magazine-style CSS Grid with deliberate asymmetry
- **Images** -- Sepia filter + grain overlay
- **Navigation** -- Numbered table-of-contents style (01 / 02 / 03...)
- **Transitions** -- Page-flip animation between routes
- **Textures** -- Paper grain, noise overlay, editorial pull-quotes

See the full **[Editorial Style Guide](docs/design-system/editorial-style-guide.md)** and **[Morandi Theme Guide](docs/design-system/morandi-theme-guide.md)** for specifications.

---

## Backend API (18 Routers)

```
auth · users · artworks · campaigns · donations
products · orders · payments · supply_chain · reviews
after_sales · clothing_intakes · sustainability
ai_assistant · contact · admin
```

Full API reference at **[docs/api/api-reference.md](docs/api/api-reference.md)**.

---

## Security

| Area | Implementation |
|------|---------------|
| **Authentication** | JWT (RS256) -- 15-min access + 7-day refresh tokens |
| **Authorization** | RBAC + ABAC combined model |
| **Encryption** | AES-256-GCM for sensitive data; children's PII uses a separate key |
| **Rate Limiting** | Redis sliding window (1000/s global, 60/min per user) |
| **Request Signing** | HMAC-SHA256 on authenticated endpoints |
| **Child Protection** | Isolated encrypted schema, secondary approval, display-name only |

Full security documentation at **[docs/security/](docs/security/)**.

---

## Compliance

- **PIPL** (个人信息保护法) -- Full compliance for Chinese users
- **GDPR** -- Compliance for international visitors
- **Child Protection** -- Guardian consent required for users under 14
- **Payment** -- Licensed merchant accounts for all payment gateways

---

## Documentation

| Document | Description |
|----------|-------------|
| [Deployment Guide](docs/deployment/deployment-guide.md) | Full deployment -- Docker, CI/CD, production checklist |
| [System Architecture](docs/architecture/system-architecture.md) | Architecture overview and design decisions |
| [Database Design](docs/architecture/database-design.md) | Schema design and data model |
| [API Reference](docs/api/api-reference.md) | All endpoint specifications |
| [Editorial Style Guide](docs/design-system/editorial-style-guide.md) | Design language and component specs |
| [Morandi Theme Guide](docs/design-system/morandi-theme-guide.md) | Color system and theme documentation |

---

## License

This project is for educational purposes (课程设计). All rights reserved.
