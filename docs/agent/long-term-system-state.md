# Long-Term System State

## Current Core Applications

### 1. User Website (frontend/web-react)
- **Stack**: React 18, TypeScript, Vite, Tailwind CSS, React Router 6, Zustand, React Query, GSAP, Three.js
- **Dev port**: 9111
- **API proxy**: /api → localhost:8000 (fixed in Round 1)
- **Key pages**: Home (UniqloHome), Shop, ImpactShop, ProductDetail, Campaigns, CampaignDetail, Donate, DonateClothing, ClothingRecycle, SupplyChainStudio, AiDesign, Profile, Login, Register, Checkout, OrderDetail, Stories, ArtworkDetail, ArtworkSubmit, Traceability, Vote

### 2. Admin Panel (admin)
- **Stack**: React 18, TypeScript, Vite, Tailwind CSS, React Router 6, Zustand, Recharts, Lucide icons
- **Dev port**: 5173 (base: /admin/)
- **API proxy**: /api → localhost:8000
- **Key pages**: Dashboard, Products, Orders, Users, Artworks, Campaigns, Donations, ClothingDonations, AfterSales, Settings, AuditLog

### 3. Backend API (backend)
- **Stack**: FastAPI, SQLAlchemy (async), SQLite (aiosqlite), Alembic, JWT auth, MiniMax AI
- **Dev port**: 8000 (uvicorn) or 8080 (python app/main.py)
- **API prefix**: /api/v1
- **Key routers**: auth, oauth, users, products, orders, artworks, campaigns, donations, payments, supply_chain, contact, clothing_intakes, reviews, after_sales, sustainability, ai_assistant, editorial, addresses, impact_fund, design_drafts, admin

## Main Routes (Frontend)
- `/` — UniqloHome
- `/shop` — Shop (regular products)
- `/shop/:id` — ProductDetail
- `/impact/shop` — ImpactShop (welfare products)
- `/impact/shop/:id` — ProductDetail
- `/campaigns` — Campaigns list
- `/campaigns/:id` — CampaignDetail
- `/donate` — Donate
- `/donate-clothing` — DonateClothing
- `/clothing-recycle` — ClothingRecycle
- `/ai-design` — AiDesign
- `/studio/supply-chain` — SupplyChainStudio
- `/stories` — Stories (artwork gallery)
- `/artworks/:id` — ArtworkDetail
- `/submit-artwork` — ArtworkSubmit
- `/traceability` — Traceability (3D globe)
- `/vote` — Vote
- `/profile` — Profile
- `/orders/:id` — OrderDetail
- `/checkout` — Checkout
- `/login`, `/register`, `/forgot-password`

## Main Routes (Admin)
- `/` — Dashboard
- `/products` — ProductPage
- `/orders` — OrderPage
- `/users` — UserPage
- `/artworks` — ArtworkPage
- `/campaigns` — CampaignPage
- `/donations` — DonationPage
- `/clothing-donations` — ClothingDonationPage
- `/after-sales` — AfterSalesPage
- `/settings` — SettingsPage
- `/audit-log` — AuditLogPage

## Auth Logic
- JWT-based (access + refresh tokens)
- Access token: 15 min TTL
- Refresh token: 7 day TTL, set as httpOnly cookie
- Admin uses separate auth store (admin/src/stores/authStore.ts)
- Frontend uses session restore hook with withCredentials
- OAuth support via /auth/callback

## API Data Summary (as of Round 8)
- Products: 24 (9 impact/charity, 15 regular)
- Artworks: 20
- Campaigns: 3 (1 active)
- Donations: 10
- Supply chain records: 50
- Users: 7 (admin, editor, 5 regular)
- Orders: 6+
- Clothing intakes: 0

## High-Risk Modules
- SupplyChainStudio (Three.js 3D globe)
- Traceability (Three.js globe + timeline)
- AiDesign (AI assistant with MiniMax)
- Checkout/Payment flow
- Auth/OAuth flow

## Known Technical Debt
- Multiple alembic migrations (17+)
- Some seed/repair scripts run on startup
- Demo mode enabled by default
- Some products missing English i18n fields
- SubmitArtwork page is a legacy duplicate of ArtworkSubmit (not registered, not referenced)
- MaterialTrace page exists but is not referenced by any link
- MagazineNav component exists but is unused
- Backend error handling fully audited (Rounds 8-9): all routers have try/except + logging on mutations
- ai_assistant.py analyze/moderate endpoints now require admin/editor auth (fixed Round 9)
- design_drafts.py + campaigns.py no longer leak str(e) to clients (fixed Round 9)
- Backend service mass-assignment fixed (Round 10): campaign, donation, supply_chain now use field allowlists
- ai_assistant/service.py str(e) leakage fixed + moderation fails-closed (Round 10)
- Frontend mutation query invalidation audit complete (Round 10): 3 HIGH issues fixed, 2 MEDIUM open
- Admin SettingsPage error state added (Round 10)
- Frontend cross-page query invalidation complete (Round 11): CampaignDetail and ArtworkDetail now invalidate related queries
- Admin DonationPage payment filter fixed (Round 11): now resets to page 1 on filter change
- Admin loading states audit complete (Round 12): 9 action buttons across 5 pages now show loading spinner during mutation
- Backend orders.py cleanup (Round 12): duplicate imports removed, conditional str(e) leakage eliminated
- Backend service layer str(e) audit complete (Round 13): payment_service.py leakage fixed, all services clean
- Admin form submit button audit complete (Round 13): all form buttons have loading states, LoginPage converted to shared Button
- Frontend mutation loading/error state audit complete (Round 13): ArtworkDetail vote button fixed, 17 mutations verified
- Backend router str(e) audit complete (Round 14): all 22 routers clean, no leakage found
- Frontend TypeScript `any` audit complete (Round 14): strict mode prevents abuse, critical paths clean
- Admin form validation audit complete (Round 14): ProductPage node form and SettingsPage now validate required fields
- Admin error toast detail extraction complete (Round 15): all 9 admin pages now extract server error detail in onError
- Frontend loading skeleton audit complete (Round 15): Traceability and Donate pages now show loading states; 13 of 15 pages verified clean
- Admin TypeScript `any` audit complete (Round 15): api.ts adapter functions documented as ISSUE-056 (large refactor)
- Frontend error boundary audit complete (Round 16): ProductDetail, SupplyChainStudio, AiDesign now handle query failures with error messages
- Admin api.ts type safety improved (Round 16): PaymentMethodConfig type replaces `as any` casts in settings update
- All frontend pages loading/error state audit complete (Rounds 15-16): 15 pages verified, all gaps fixed
- Admin list pages isError audit complete (Round 17): all 9 pages now show error banner with retry on fetch failure (ISSUE-041)
- DataTable emptyMessage prop added (Round 17): all 9 pages now show contextual empty messages
- Form required field label audit complete (Round 17): 4 missing `*` indicators fixed across ProductPage, CampaignPage, SettingsPage
- Checkout payment polling countdown added (Round 18): PaymentQRModal now shows remaining time before 3-minute timeout
- Admin form accessibility audit complete (Round 18): `aria-required="true"` added to 9 required inputs across 4 pages
- Frontend mutation onError audit complete (Round 19): ArtworkSubmit and SubmitArtwork now show toast on error using getErrorMessage
- Frontend form label/input association audit complete (Round 19): 16 fields across 4 pages now have htmlFor/id; ImpactShop select has aria-label
- Backend rate limiting audit complete (Round 19): forgot-password endpoint added to public rate limit list (20 req/min per IP)
- Admin modal accessibility audit complete (Round 20): Modal.tsx now has focus management, focus trap, and tabIndex — all 9 modals covered
- Frontend toast accessibility audit complete (Round 20): Toaster now has aria-live/role for screen reader announcements
- CartDrawer Escape key handler added (Round 20): keyboard users can close cart with Escape
- Backend health endpoint fixed (Round 20): now returns HTTP 503 when database/Redis is unhealthy
- Frontend zh.json JSON syntax fixed (Round 20): unescaped quotes replaced with Chinese quotation marks
