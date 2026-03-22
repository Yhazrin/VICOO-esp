# Changelog

All notable changes to the Tonghua Public Welfare x Sustainable Fashion project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased] — Cycle 33

### Fixed

- **Security (P0)**: Removed `TESTING=1` bypasses from `main.py` — signature verification and rate limiting middlewares no longer skip checks in test mode.
- **Security (P0)**: `auth.py` — mock fallback login now uses `hmac.compare_digest` for password comparison (timing attack prevention). DB failure raises HTTP 503 (fail-closed). Refresh token endpoint looks up user role from DB instead of relying on token.
- **Security (P0)**: `payments.py` — payment amount validated against actual order/donation amounts (prevents amount tampering). Alipay notify fail-closed when key missing. Webhook `APP_SECRET_KEY` null check added.
- **Security (P0)**: Artwork file upload validation — MIME type whitelist (JPEG/PNG/WebP), 10MB size limit, magic byte content verification.
- **Security (P1)**: `payments.py` webhook endpoint — `APP_SECRET_KEY` empty check (fail-closed, returns 500).
- **Accessibility (P0)**: `MobileNav.tsx` — focus trap added (Tab/Shift+Tab cycles within dialog, WCAG 2.4.7 + 2.1.1).
- **Accessibility (P0)**: `global.css` — `.form-input:focus` visible focus ring via `box-shadow` restored (WCAG 2.4.7).
- **Accessibility (P0)**: 5 pages missing `<h1>` — added `sr-only` h1 to Profile, Campaigns, Shop, Stories, Traceability (WCAG heading hierarchy).
- **Accessibility (P1)**: Checkbox touch targets — Login and DonationPanel checkboxes enlarged from 16px to 44px (`w-11 h-11 p-2.5`, WCAG 2.5.8).
- **Frontend**: `supply-chain.ts` — corrected `getProductJourney` endpoint + removed methods without backend support.
- **Frontend**: `ArtworkDetail.tsx` — `useMutation` for vote (replaced orphaned `handleVote` with proper mutation), `queryError` reference fix.
- **TypeScript**: `Traceability/index.tsx` — removed unused `useQuery`, `buildRecordsFromApi`, `STAGE_MAP`. Fixed `number` vs `string` type comparison. `EnhancedSupplyChainRecord` as standalone interface (not extending backend type).
- **TypeScript**: `Login/index.tsx`, `Register/index.tsx` — removed unused `MagazineDivider` import.
- **Backend**: `orders.py` — `import random` moved to top-level (was inside except block).
- **Backend**: Write operations fail-closed — mock write fallbacks replaced with HTTP 503 in 5 router files.

### Fixed (continued from earlier cycles)

- **NotFound page**: Upgraded from bare 404 to full editorial treatment — PaperTextureBackground, GrainOverlay, entrance animation with reduced-motion guard, corner accents, decorative divider.
- **Donate page**: Fixed `DonationStoryCard` reduced-motion bug — `initial` prop was unconditional, now guarded with `prefersReducedMotion ? false : { opacity: 0, y: 30 }`.
- **Traceability page**: Fixed `AnimatedCounter` — added `useReducedMotion()` guard to skip `requestAnimationFrame` animation when user prefers reduced motion.
- **Contact page**: Replaced inline `FAQItem`/`ChevronIcon` components with reusable `FAQAccordion` editorial component.
- **NotFound page**: Removed invalid `opacity` prop from `GrainOverlay` (component accepts no props).
- **ArtworkDetail.tsx**: Fixed infinite re-render loop caused by data fetching in render body. Moved to proper `useEffect` pattern with cleanup.
- **ProductDetail.tsx**: Fixed React Rules of Hooks violation (`useState` inside `.map()`). Extracted `ThumbnailButton` as a separate component. Added `useParams` + API data fetching with mock fallback (was hardcoded `MOCK_PRODUCT`).
- **CampaignDetail.tsx**: Added `useParams` + `useEffect` API data fetching with `snake_case` to `camelCase` field mapping. Previously ignored route params entirely.
- **Backend - artworks.py**: Added authentication (`Depends(get_current_user)`) to `PUT /artworks/{artwork_id}` and `DELETE /artworks/{artwork_id}` endpoints. Previously these mutation endpoints had no auth guard.
- **Backend - artworks.py**: Added admin role check to `PUT /artworks/{artwork_id}/status`.
- **Backend - contact.py**: Added admin role check to `GET /contact/messages`.
- **Backend - products.py**: Added authentication with role check (`Depends(require_role("admin","editor"))`) to `POST /products` and `PUT /products/{product_id}` endpoints.

### Added

- **Sage green accent system**: Introduced low-saturation sage green (#3F4F45) as a complementary cool-tone accent across the site. Semantic color language: rust = urgency/action, sage = trust/transparency/sustainability. Applied to:
  - **Traceability page**: Migrated all 17 `eco-green` references to `sage` tokens (CarbonBar, status indicators, search results, highlighted records, carbon reduction counter).
  - **ProductCard**: Sustainability score tier (≥80) now uses `text-sage`/`bg-sage` instead of `eco-green`.
  - **Home page**: Brand pillar borders (`border-sage/40`), featured/artworks "View All" links (`text-sage`), shop CTA secondary button (`border-sage/40 hover:border-sage`).
  - **Donate page**: Transparency section corner accents, bullet dots, trust badge dots all use sage. Financial report card hover/corner accents use sage. Final CTA decorative lines use `bg-sage/50`. "Learn More" button uses `border-sage/40`.
  - **About page**: Value card top borders use `border-sage/20`. Mission section vertical accent line uses sage gradient.
- **Legal pages editorial upgrade**: Privacy, Terms, and ChildrenSafety pages upgraded from ⭐⭐ to ⭐⭐⭐⭐ — added `GrainOverlay`, `MagazineDivider` between sections, decorative corner accents, vertical accent line, `whileInView` scroll-reveal animations. Fixed `useMediaQuery` → `useReducedMotion` inconsistency.
- **Routes**: Registered `/privacy`, `/terms`, `/children-safety` routes in App.tsx.
- **Footer**: Updated legal links to match registered route paths (`/children-safety` instead of `/children`).
- **Agent docs**: Created `docs/agent-memory/codebase-index.md` and `improvement-tracker.md` for persistent codebase tracking.
- **Login page**: Upgraded from ⭐⭐ to ⭐⭐⭐⭐ — added `PaperTextureBackground` wrapping, `MagazineDivider` decorative separator, decorative vertical accent line, animated "Vol. IX" header with decorative divider. Removed redundant GrainOverlay opacity wrapper.
- **Register page**: Same editorial upgrade as Login — `PaperTextureBackground`, `MagazineDivider`, decorative accents, animated header with divider. Consistent editorial treatment across auth pages.
- **Tailwind config**: Added 17 missing color tokens from `tokens.css` — ink-light, sepia-dark, sepia-light, rust-light, rust-dark, pale-gold-light, muted-gray, cream, editorial-red, editorial-navy, editorial-olive, editorial-burgundy, success, error, warning, info.
- **Backend - artworks.py**: `GET /artworks/featured` — returns featured artworks (limit 8).
- **Backend - campaigns.py**: `GET /campaigns/featured` — returns active campaigns.
- **Backend - donations.py**: `GET /donations/tiers` — returns 4 static donation tiers.
- **Backend - donations.py**: `GET /donations/mine` — returns current user's donation records (auth required).
- **Backend - products.py**: `GET /products/featured` — returns active products with stock (limit 8).
- **Backend - orders.py**: `GET /orders/mine` — returns current user's orders (auth required).
- **Backend - orders.py**: `POST /orders/{id}/cancel` — cancels pending orders (auth required, ownership validated).
- **Profile page**: Enhanced with order history and donation history tabs. Fetches from `ordersApi.getMyOrders()` and `donationsApi.getMyDonations()`. Tab switcher with editorial styling.
- **Profile page**: Upgraded from ⭐⭐⭐ to ⭐⭐⭐⭐ — integrated `EditorialCard` for order/donation items (2-column grid), added `GrainOverlay` to both sections, added `MagazineDivider` between sections, upgraded not-logged-in state with `PaperTextureBackground` + animated header, enhanced avatar with grain texture. All 19 editorial components now in use.
- **Backend - contact.py**: New contact form submission endpoint (`POST /contact`, `GET /contact/messages`). Registered in `main.py`.

### Removed

- **Contact page**: Removed unused `FAQItem`, `ChevronIcon` inline components, `GRAIN_STYLE` constant, and `openFaqIndex` state (dead code from merge).
- **Dead code cleanup**: Removed 8 dead barrel files (`HomePage.tsx`, `AboutPage.tsx`, etc.) that only re-exported from subdirectories.

### Fixed (2026-03-21)

- **TypeScript type safety**: Removed `any` type annotations from `.then()` callbacks in Profile (`Order[]`, `Donation[]`), CampaignDetail (`Campaign`), and ProductDetail (`Product`). Eliminated unnecessary `const raw = data?.data ?? data` pattern — service layer already returns properly typed `response.data`.
- **Snake_case fallback removal**: CampaignDetail — removed 7 `raw.snake_case ??` fallbacks (`cover_image`, `start_date`, `end_date`, `artwork_count`, `participant_count`, `goal_amount`, `current_amount`). ProductDetail — removed 4 snake_case fallbacks (`image_urls`, `stock`, `sustainability_score`, `supply_chain`). Service layer returns camelCase typed data.
- **React list keys**: Replaced `key={index}` with semantic unique keys in KineticMarquee (`marquee-${item}`, `stat-${stat.value}`), FAQAccordion (`item.question`), and ArtworkDetail (`tag`).
- **EditorialHero**: Fixed `boolean | null` → `boolean | undefined` type mismatch on `TextScramble.reducedMotion` prop (`prefersReducedMotion ?? undefined`).
- **Contact page**: Replaced raw `<select>` element with `VintageSelect` editorial component for consistent form styling.
- **OrigamiFold**: Added `useReducedMotion()` hook to `OrigamiCorner` component — was running unconditional rotation animation, violating accessibility.
- **EditorialHero**: Fixed `TextScramble.reducedMotion` prop coercion — `prefersReducedMotion ?? undefined` passes `undefined` when `useReducedMotion()` returns `null`, which defaults to `false` (animations run). Changed to `prefersReducedMotion ? true : undefined`.
- **Stories**: Fixed article `initial` prop — was always `{{ opacity: 0, y: 50 }}` regardless of reduced-motion, causing elements to start invisible with no reveal animation. Now fully guarded.
- **Stories/Campaigns/Donate**: Converted `width`-based animations to `scaleX` transforms across 4 locations (Stories ReadingProgressBar, Campaigns funding progress bar, Donate 2 decorative lines) for GPU compositing and hardware acceleration compliance.
- **Traceability/CampaignDetail/ProductCard**: Extended `width`→`scaleX` conversions to 3 more locations — Traceability CarbonBar progress, CampaignDetail funding progress bar, ProductCard sustainability score bar. Added `overflow-hidden` to ProductCard parent container.
- **Register/Login/Profile/NotFound**: Converted decorative divider line animations from `width` to `scaleX` with `origin-center` across 4 page components for consistent GPU compositing.
- **ProductCard**: Added missing `cursor-pointer` to "Notify Me" button.
- **Stories**: Added missing `cursor-pointer` to empty-state "Browse All" button.
- **SepiaImageFrame**: Replaced `as any` type assertion with `Exclude<typeof accentPosition, 'diagonal'>` for proper TypeScript type narrowing.
- **Login**: Fixed "Remember me" label — was missing `<input type="checkbox">` element and `htmlFor` attribute. Added proper checkbox with `accent-rust` styling.
- **Stories**: Added `cursor-pointer` to category filter buttons.

### Added (2026-03-21)

- **SectionGrainOverlay component**: Reusable section-scoped grain overlay component extracted from Donate page inline SVG data URLs. Supports configurable `frequency`, `octaves`, and `opacity` props. Replaces 2 inline grain SVG instances in Donate page.
- **Aria attributes**: Added `role="progressbar"` with `aria-valuenow`/`aria-valuemin`/`aria-valuemax` to Campaigns funding progress bars and Stories ReadingProgressBar. Added `role="tablist"` to Campaigns and Stories category filter containers.
