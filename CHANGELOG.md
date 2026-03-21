# Changelog

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
