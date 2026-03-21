# Changelog

All notable changes to the Tonghua Public Welfare x Sustainable Fashion project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Fixed

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
