# Changelog

## 2026-03-22 — Cycle 22: TS Type Safety, Backend NameError Fix, Traceability Rewrite

### Backend

- **orders.py lazy singleton callers** — Fixed 2 call sites (WeChat + Alipay order creation) that referenced module-level `payment_service.create_unified_order(...)`. After Cycle 21's refactor to `get_payment_service()` lazy factory, these caused `NameError` at runtime. Changed to `get_payment_service().create_unified_order(...)`.
- **auth.py /refresh privilege escalation** — `/refresh` endpoint now queries DB for the user's current role instead of trusting the JWT token payload. Prevents an attacker from crafting a refresh token with elevated `role: "admin"`. Added `db: AsyncSession` dependency.
- **security.py refresh token role** — `create_refresh_token()` now accepts `role` parameter and includes it in the token payload. All 7 callers updated to pass `user.role`. Prevents admin→user downgrade if refresh token lacks role metadata.
- **artworks.py vote race condition** — Replaced non-atomic `artwork.like_count += 1` (read-modify-write) with atomic `update(Artwork).where(...).values(like_count=Artwork.like_count + 1)` SQL statement. Prevents lost votes under concurrent requests.
- **payments.py alipay fail-closed** — When `ALIPAY_PUBLIC_KEY` is not configured, the `alipay_notify` handler now returns `"failure"` instead of logging a warning and continuing to accept unverified callbacks.
- **models/payment.py FK constraints** — Added `ForeignKey("orders.id")` and `ForeignKey("donations.id")` to `order_id` and `donation_id` columns. Ensures referential integrity at the database level.

### Frontend

- **ArtworkDetail.tsx voting fix** — Removed broken `handleVote` function that called non-existent `setArtwork()`. Replaced with proper `useMutation` + `queryClient.invalidateQueries({ queryKey: ['artwork', id] })` for cache invalidation. Fixed `error` → `queryError` variable reference mismatch.
- **Traceability/index.tsx major rewrite** — Changed `EnhancedSupplyChainRecord` from extending `SupplyChainRecord` (which has different field names: `timestamp` not `date`, `id: string` not `number`, no `verified`/`partnerName`/`carbonFootprint`) to a standalone interface. Both `useEffect` initial load and `handleSearch` now use explicit field mapping via `r as unknown as Record<string, unknown>` with `Number()`, `String()`, `Boolean()` coercion and fallback values. Removed unused `STAGE_MAP`, `useQuery`, `buildRecordsFromApi`. Fixed `r.id === query.trim()` number-vs-string comparison → `String(r.id) === query.trim()`.
- **Login/Register — dead import cleanup** — Removed unused `MagazineDivider` import from both Login and Register pages.
- **Donate — anchor target fix** — Changed `href="#top"` to `href="#main-content"` to match the `id="main-content"` on `<main>` element.

### Verification

- TypeScript `tsc --noEmit`: 0 errors
- Vite production build: 2.66s, success

## 2026-03-22 — Cycle 21: P0 Security, A11y & Stability Fixes

### Security

- **payment_service.py lazy singleton** — Replaced module-level `payment_service = WeChatPayService()` instantiation with lazy `get_payment_service()` factory. Prevents startup crash (import-time `ValueError`) when WeChat env vars are unconfigured. All callers (`payments.py`, `donations.py`) updated.
- **api.ts null guard on error.config** — Added early return in Axios response interceptor when `error.config` is undefined, preventing TypeError on network-level failures (DNS, CORS, timeout).
- **authStore init sets isAuthenticated** — `initializeAuth()` now calls `set({ accessToken, isAuthenticated: true })` instead of only setting the token. Fixes a race condition where the app renders the login page briefly before rehydrating auth state from localStorage.
- **main.py rate limiting — fail-closed logging** — Rate limiting middleware now logs unexpected errors (`logger.error` with `exc_info=True`) instead of silently passing. HTTPException re-raised; only truly unexpected errors fail-open.
- **deps.py rate limiting — fail-closed logging** — Added `logger.error` to catch-all except block in `rate_limit_check()`, matching the fail-open-for-availability pattern with observability.

### Accessibility

- **Layout.tsx skip-to-content link** — Added WCAG 2.4.1 bypass block: sr-only `<a href="#main-content">Skip to content</a>` that becomes visible on focus. Added `id="main-content"` to `<main>` element.
- **Header.tsx nav aria-label** — Added `aria-label="Main navigation"` to desktop `<nav>` element for screen reader landmark identification.
- **global.css reduced-motion guard** — Added `@media (prefers-reduced-motion: reduce)` block disabling all animations, transitions, and smooth scroll globally. Complements per-component reduced-motion guards with a CSS-level safety net.

### Frontend

- **PagePeel.tsx Rules of Hooks fix** — Replaced `useTransform()` calls inside a `switch` statement (inside `getTransforms()` function) with 16 unconditional top-level `useTransform()` calls + a pure selector IIFE. Fixes React "Rules of Hooks" violation that could cause crashes with strict mode.

## 2026-03-22 — Cycle 8b: Backend Security Hardening

### Security

- **alipay_notify signature verification** — Replaced stub handler with full RSA2 signature verification using `ALIPAY_PUBLIC_KEY` from settings. Verifies Alipay callback form params against `sign` field using RSA/SHA-256 PKCS1v15. Returns plain text "success"/"failure" per Alipay spec.
- **alipay_notify payment processing** — Added trade status check (`TRADE_SUCCESS`/`TRADE_FINISHED`), idempotency check via `provider_transaction_id`, order lookup by `out_trade_no`, and payment transaction record creation.
- **list_donations PII redaction** — Added optional authentication via `get_optional_current_user`. Unauthenticated users see redacted donor names (first char + asterisks), no messages, no `donor_user_id`. Authenticated users see full donation details.

### Backend

- **deps.py** — Added `get_optional_current_user()` dependency that returns user dict or `None` (no exception on auth failure).
- **donations.py** — Added `_redact_name()` helper for PII masking. Both DB and mock fallback paths include redaction logic.

## 2026-03-22 — Cycle 8: TypeScript Safety & Backend Code Quality

### TypeScript

- **CampaignDetail mock data IDs** — Converted 15 string-typed mock IDs (`'1'`, `'a1'`, `'c1'`, `'g1'`) to numeric literals matching `Product.id: number` type.
- **Campaigns/index.tsx mock data IDs** — Converted 6 string-typed mock IDs (`'1'`–`'6'`) to numbers.
- **Traceability mock data** — Fixed string→number IDs + `highlightedId` state type to `number | null`.
- **ProductDetail supply chain mock** — Converted 7 string-typed mock IDs (`'sc1'`–`'sc6'`) to numbers.
- **cartStore parameter types** — Changed `removeItem(productId: string)` and `updateQuantity(productId: string, ...)` to `number` matching `Product.id`.
- **ProductDetail imageUrls** — Removed references to non-existent `imageUrls` property; derived local `productImages` from `product.image_url`.

### Backend

- **auth.py code deduplication** — Extracted `_set_auth_cookies()` helper, replacing 7 identical cookie-setting blocks. File reduced from 528 to 406 lines (~23%).
- **auth.py info leakage** — Removed 4 logger lines that logged `is_secure` values, `APP_ENV`, and response headers in production.
- **products.py route ordering** — Moved `GET /{product_id}/supply-chain` before wildcard `GET /{product_id}` to prevent route shadowing.

### Security

- **deps.py auth fallback** — Removed fallback that returned user data from JWT payload when DB lookup fails; now raises HTTP 503 on DB errors and HTTP 401 if user not found.
- **payments.py HMAC verification** — Replaced hardcoded `signature != "valid-hmac-signature"` with proper HMAC-SHA256 verification using `APP_SECRET_KEY` with `hmac.compare_digest()`.

### Type Safety & API Alignment

- **types/index.ts mass overhaul** — Changed all entity IDs from `string` to `number` (User, Artwork, Campaign, Story, Product, SupplyChainRecord, DonationTier, Donation, Order). Renamed `imageUrls`→`image_url`, `anonymous`→`is_anonymous`, `shippingAddress`→`shipping_address`.
- **All services response unwrapping** — Fixed 9 service files from `response.data` to `response.data.data` to match backend envelope pattern.
- **supply-chain.ts service** — New service file with `trace`, `getRecords`, `getStages` methods.

### Accessibility

- **Header/MagazineNav keyboard navigation** — Added `role="menu"/"menuitem"`, Escape/Arrow key handling, `aria-haspopup`, focus return on close.
- **VintageSelect error ARIA** — Added `error` prop with `aria-describedby`, `aria-invalid`, and border color on error state.
- **EditorialHeroV2 contrast** — Changed `text-gray-400` to `text-ink-faded` for WCAG AA compliance.
- **ProductCard form nesting** — Moved Notify Me section outside `<Link>` wrapper to fix invalid `<form>` inside `<a>`.

### Sustainability & Content

- **Traceability API integration** — Wired to supply-chain API via `useQuery` with `supplyChainApi.trace()`, falls back to mock data.
- **Donate impact stats** — Wired to `donationsApi.getImpactStats()` for dynamic counters.
- **Stories API integration** — Wired to `artworksApi.getAll()`, fixed artwork link routes to `/artworks/${id}`.
- **ChildrenSafety/Privacy** — Replaced placeholder text with real content (8–9 sections each).

### Code Quality

- **i18n keys** — Added 88 lines of translation keys across `en.json` and `zh.json`.

## 2026-03-22 — Cycle 7: Frontend Page Expansion & Service Completion

### Features

- **About page CTA** — Added "Get Involved" section (#04) with Donate and Explore Campaigns editorial links, matching existing magazine aesthetic with reduced-motion guards.
- **Campaigns page CTA** — Added "Start a Campaign" bordered callout box with eyebrow, title, body copy, and "Get in Touch" link to contact page.
- **Profile page avatar upgrade** — Enlarged avatar container (w-16→w-20), added decorative corner accents, SectionGrainOverlay, and hover micro-interaction (scale 1.03) consistent with TeamMemberCard style.

### API Alignment

- **Frontend: auth.ts updateProfile** — Added `updateProfile` method mapping to backend `PUT /users/me` with nickname/avatar/phone fields.
- **Frontend: products.ts getCategories** — Added `getCategories` method mapping to backend `GET /products/categories`.
- **Frontend: payments.ts service created** — New service file with `create` and `getById` methods matching backend `POST /payments/create` and `GET /payments/{id}`.
- **Frontend: Payment type added** — New `Payment` interface in types/index.ts (id, orderId, donationId, amount, method, status, createdAt).

## 2026-03-21 — P0 Backend Security Fixes

### Security

- **Backend: orders.py status update authorization bypass** (`orders.py`) — The real DB path for `PUT /orders/{id}/status` previously allowed non-admin order owners to set arbitrary statuses (completed, paid, shipped). Added `body.status != "cancelled"` restriction matching the mock fallback.
- **Backend: RegisterRequest missing email validation** (`common.py`) — Changed `email: str` to `email: EmailStr` to reject malformed email addresses at the schema level.
- **Backend: RegisterRequest missing password constraints** (`common.py`) — Added `min_length=8, max_length=128` to enforce password policy at the API boundary.
- **Backend: update_me mass-assignment** (`users.py`) — The mock fallback used `body.model_dump()` which could inject arbitrary fields. Replaced with explicit whitelisting of `nickname`, `avatar`, `phone` only.
- **Backend: admin self-modification guards** (`users.py`) — `PUT /users/{id}/role` and `PUT /users/{id}/status` now reject requests when the target user is the current admin, preventing privilege escalation or self-lockout.
- **Backend: phone field length validation** (`schemas/user.py`) — Added `max_length=20` to `UserUpdate.phone` to prevent DoS via oversized encryption input.

## 2026-03-21 — Cycle 6+

### Accessibility

- **prefers-reduced-motion: P0 invisible elements fix** — Fixed 11 remaining unguarded Framer Motion `initial` props across 6 files where elements were permanently invisible (opacity: 0) when users prefer reduced motion. Pattern: `initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: N }}`.
  - ProductCard: "Notify Me" submitted text + email form (height animation)
  - ArtworkDetail: image fade-in
  - Campaigns: paginated list transition + empty state false-guard (was `opacity: 0` in reduced-motion branch)
  - Traceability: search spinner + result card + highlighted record detail (height animations)
  - Contact: validation error message + submit error state
  - ProductDetail: image fade-in

## 2026-03-21 — Cycle 6

### Security

- **Backend: campaigns.py role check fix** (`campaigns.py`) — Replaced 3 references to non-existent roles (`super_admin`, `content_admin`) with `require_role("admin")`. The UserRole enum only defines `admin`/`editor`/`user`, so previous checks silently bypassed authorization.
- **Backend: orders.py status update privilege escalation fix** (`orders.py`) — Non-admin users can now only cancel their own orders (`status=cancelled`). Previously any authenticated order owner could set arbitrary status values (completed, paid, shipped).
- **Backend: payments.py ownership verification** (`payments.py`) — `POST /payments/create` now verifies the requesting user owns the referenced order or donation. Also gated the `test-wechat-params` debug endpoint behind admin auth.
- **Backend: DonationCreate IDOR fix** (`schemas/donation.py`) — Removed `donor_user_id` field from DonationCreate schema. The server already sets this from `current_user`, but the schema accepting it from the client was an IDOR vector.

### API Alignment

- **Frontend: artworks.ts vote response type** — Fixed `voteCount` → `like_count` to match backend response shape.
- **Frontend: products.ts getByCategory** — Fixed from non-existent route `/products/category/${category}` to query param `/products?category=X`. Return type corrected to `PaginatedResponse<Product>`.
- **Frontend: campaigns.ts query params** — Fixed `pageSize` → `page_size`.
- **Frontend: donations.ts impact stats** — Fixed `getImpactStats` return type to `{ total_amount: string, total_donors: number, currency: string }` matching backend.
- **Frontend: ArtworkDetail.tsx + Campaigns/index.tsx** — Updated consumers to use corrected API property names.

### Performance

- **Donate page progress bar** — Converted `width` animation to `scaleX` transform with `origin-left` for GPU compositing instead of layout reflow.

## 2026-03-21 — Cycle 5

### Security

- **Backend: artworks PUT/DELETE now require admin role** (`artworks.py`) — Endpoints previously only checked authentication; now enforce `require_role("admin")` to prevent non-admin users from modifying or deleting artworks.
- **Backend: donation certificate endpoint auth + ownership** (`donations.py`) — `GET /donations/{id}/certificate` now requires authentication and verifies the requesting user is either the donor or an admin. Previously accessible without auth (IDOR vulnerability).
- **Backend: order status update ownership check in mock fallback** (`orders.py`) — `PUT /orders/{id}/status` mock fallback now verifies ownership before allowing status changes.

### API Alignment

- **Frontend: donations.ts request schema fixed** — Aligned `CreateDonationRequest` with backend `DonationCreate` schema. Fixed field names: `tierId`→`amount`, `campaignId`→`campaign_id`, `anonymous`→`is_anonymous`, added `donor_name`, `payment_method`.
- **Frontend: orders.ts request schema fixed** — Aligned `CreateOrderRequest` with backend `OrderCreate` schema. Fixed field names: `productId`→`product_id`, `shippingAddress`→`shipping_address`+`payment_method`.
- **Frontend: contact.ts API service created** — New `/services/contact.ts` with `ContactFormRequest` interface wiring the Contact page form to `POST /contact`.

### Code Quality

- **SectionGrainOverlay consolidation** — Replaced 18 inline grain SVG data URL instances across 15 files with the reusable `SectionGrainOverlay` editorial component. Reduced code duplication while maintaining correct z-index layering (z-0, z-10, z-20) per context.
  - Layouts: Header, MagazineNav, EditorialFooter
  - Editorial components: EditorialCard (x2), ImageSkeleton, TraceabilityTimeline, ProductCard, ArtworkCard, DonationPanel
  - Pages: About, Home (x2), Contact (x2), Traceability (x3), Profile

## 2026-03-21 — Cycle 4

### Performance

- **GPU compositing: width→scaleX animations** — Converted 9 `width` CSS animations to `scaleX` transforms across Stories (ReadingProgressBar), Campaigns (progress bars), Donate (decorative lines), Traceability (CarbonBar), CampaignDetail (funding progress), ProductCard (sustainability score), Register/Login/Profile/NotFound (decorative dividers). Enables GPU-accelerated compositing instead of layout recalculation.

### Accessibility

- **Campaigns progress bars** — Added `role="progressbar"` with `aria-valuenow`/`aria-valuemin`/`aria-valuemax` to funding progress indicators.
- **Campaigns/Stories category filters** — Added `role="tablist"` to filter containers.
- **Stories ReadingProgressBar** — Added `role="progressbar"` with proper ARIA attributes.
- **Login "Remember me"** — Fixed missing checkbox input and `htmlFor` attribute on label.
- **Cursor-pointer** — Added to ProductCard "Notify Me" button and Stories empty-state "Browse All" button.

### Code Quality

- **SepiaImageFrame** — Replaced `as any` type assertion with `Exclude<typeof accentPosition, 'diagonal'>` for proper type narrowing.

## 2026-03-20 — Cycle 3

### Code Quality

- **TypeScript type safety** — Removed `any` types from API callbacks in Profile, CampaignDetail, ProductDetail.
- **Snake_case cleanup** — Removed camelCase↔snake_case property fallbacks (CampaignDetail 7 props, ProductDetail 4 props).
- **React key fix** — Replaced `key={index}` with semantic keys in KineticMarquee, FAQAccordion, ArtworkDetail.
- **Reduced-motion guards** — Fixed EditorialHero TextScramble `boolean|null` coercion, Stories article `initial` prop guard.
- **OrigamiFold** — Added `useReducedMotion()` to OrigamiCorner component.
- **Dead code cleanup** — Removed unused FAQItem, ChevronIcon, GRAIN_STYLE, openFaqIndex from Contact page.

## 2026-03-19 — Cycle 2

### Features

- **Sage green accent system** — Integrated `#3F4F45` accent color across Home, Donate, About, Traceability, ProductCard.
- **Profile page** — Editorial upgrade to quality level 4.
- **Legal pages** — Created Privacy, Terms, ChildrenSafety pages with editorial treatment.
- **Footer** — Added legal page links to correct routes.
- **App.tsx** — Registered 3 legal page routes.

### Backend

- **Featured/my endpoints** — Added `GET /campaigns/featured`, `GET /products/featured`, `GET /donations/tiers`, `GET /donations/mine`, `GET /orders/mine`, `POST /orders/{id}/cancel`.

### Security

- **Artworks PUT/DELETE** — Added authentication requirement.
- **Products POST/PUT** — Added authentication + role check.
- **Contact messages GET** — Added admin-only check.

## 2026-03-18 — Cycle 1

### Design System

- **Tailwind config** — Added 17 missing color tokens from tokens.css.
- **NotFound page** — Editorial style upgrade with PaperTextureBackground, GrainOverlay, animations, corner accents.
- **Login/Register pages** — Editorial upgrade.

### Bug Fixes

- **Donate** — Fixed DonationStoryCard reduced-motion bug.
- **Traceability** — Fixed AnimatedCounter missing reduced-motion guard.
- **Contact** — Replaced inline FAQItem with FAQAccordion editorial component.
- **NotFound** — Fixed GrainOverlay invalid opacity prop.
- **ArtworkDetail** — Fixed infinite re-render loop.
- **ProductDetail** — Fixed useState inside .map() hooks violation.
- **CampaignDetail** — Fixed ignoring route params.

### API

- **Contact API** — Wired frontend to backend POST /contact.
