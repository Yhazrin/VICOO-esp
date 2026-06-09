# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VICOO (Visual · Circle) transforms children's creative expression into wearable art with full supply chain transparency. A course project (COMP3030J Software Engineering) for team COMP3030J_Spring_2025-2026_Group_7.

## Build Commands

### Backend (FastAPI)
```bash
cd VICOO-esp/backend
pip install -r requirements.txt
alembic upgrade head          # Run migrations
python -m pytest              # Run tests
python app/seed.py            # Seed demo data
uvicorn app.main:app --reload # Dev server on port 8000
```

### Frontend (React)
```bash
cd VICOO-esp/frontend/web-react
npm install
npm run dev                   # Dev server on port 9111
npm run build                 # Production build
```

### Docker (Full Stack)
```bash
cd VICOO-esp/deploy/easy
cp .env.example .env
docker compose up -d
```

## Architecture

### Backend (FastAPI + SQLAlchemy async)
- **Entry point**: `backend/app/main.py`
- **Config**: `backend/app/config.py` (Pydantic settings from env)
- **Database**: `backend/app/database.py` (async SQLAlchemy with aiomysql)
- **Migrations**: Alembic (`backend/alembic/`)
- **Routers** (20 modules in `backend/app/routers/`):
  - `auth.py` - JWT authentication, RS256 tokens (15min access + 7day refresh)
  - `users.py`, `artworks.py`, `campaigns.py`, `donations.py`, `products.py`, `orders.py`, `payments.py`
  - `supply_chain.py` - 6-stage traceability (artwork→design→material→production→quality→shipping)
  - `clothing_intakes.py` - Donation status: pending→received→processing→converted/rejected
  - `ai_assistant.py` - AI chat + content moderation
  - `addresses.py` - User shipping addresses CRUD
  - `after_sales.py` - Returns/exchanges
  - `admin.py` - Admin dashboard APIs
  - `oauth.py` - GitHub/Google OAuth

### Frontend (React 18 + Vite + TypeScript)
- **State**: Zustand stores in `src/store/`
- **Data fetching**: TanStack Query in `src/services/`
- **i18n**: react-i18next with JSON files in `src/i18n/`
- **Pages** (30+ in `src/pages/`): Home, About, Campaigns, Stories, Donate, Shop, ImpactShop, Vote, Traceability, Contact, Login, Register, Profile, AiAssistant, Checkout, etc.
- **Design**: 1990s editorial magazine aesthetic - Playfair Display + IBM Plex Mono, Tailwind CSS + custom CSS

### Three Platforms
1. **React Web** (`frontend/web-react/`) - 30+ pages, editorial magazine style
2. **WeChat Mini Program** (`frontend/weapp/`) - 13 pages, native WXML/WXSS
3. **Android** (`frontend/android/`) - Kotlin + Jetpack Compose + Hilt

### Admin Dashboard
- `admin/` - React + TypeScript + Recharts for dashboard, artwork/campaign/donation/order management

## Key Patterns

### Security
- JWT RS256 with short-lived access tokens + 7-day refresh tokens
- AES-256-GCM encryption for children's PII
- RBAC + ABAC authorization (admin/editor/viewer/auditor roles)
- Redis sliding window rate limiting (1000/s global, 60/min per user)
- HMAC-SHA256 request signing on authenticated endpoints

### Child Data Protection
- Isolated encrypted schema
- Secondary approval workflow
- Display-name only in public-facing data

### Payment Integration
- WeChat Pay, Alipay, Stripe, PayPal
- Idempotency handling
- Multiple payment gateway fallbacks

## Environment Variables

Key variables needed in `backend/.env`:
```
DATABASE_URL=              # MySQL connection string
REDIS_URL=                # Redis connection
JWT_SECRET_KEY=           # For refresh token signing
JWT_PRIVATE_KEY=          # RS256 private key
JWT_ALGORITHM=            # Default: RS256
STRIPE_API_KEY=           # Stripe secret key
WECHAT_APP_ID=           # WeChat mini program app ID
ALIPAY_APP_ID=           # Alipay app ID
```

Frontend uses `frontend/web-react/.env.development` for Vite defaults.

## Database

MySQL 8.0 with async SQLAlchemy. Key tables: users, child_participants, artworks, campaigns, products, orders, donations, supply_chain_records, addresses, after_sales.

Alembic migrations in `backend/alembic/`. Seed data via `backend/app/seed.py`.

## Testing

```bash
# Backend tests
cd backend && python -m pytest

# Frontend (Playwright)
cd frontend/web-react && npx playwright test
```

## Project Location

```
/Users/freeman/编程/26软工课设/VICOO-esp/
```
