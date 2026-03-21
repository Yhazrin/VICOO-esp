# Improvement Tracker

> Auto-maintained by agent loop. Last updated: 2026-03-22 (cycle 10)

## Completed

| # | Issue | Priority | Status |
|---|-------|----------|--------|
| 1 | NotFound page — bare 404, no editorial treatment | High | ✅ done |
| 2 | Donate — DonationStoryCard reduced-motion bug | High | ✅ done |
| 3 | Traceability — AnimatedCounter no reduced-motion guard | High | ✅ done |
| 4 | Contact — inline FAQItem should use FAQAccordion | Medium | ✅ done |
| 5 | NotFound — GrainOverlay invalid opacity prop | Medium | ✅ done |
| 6 | ArtworkDetail — infinite re-render loop | High | ✅ done |
| 7 | ProductDetail — useState inside .map() hooks violation | High | ✅ done |
| 8 | CampaignDetail — ignores route params | Medium | ✅ done |
| 9 | Backend — artworks PUT/DELETE missing auth | High | ✅ done |
| 10 | Backend — artworks status PUT missing admin check | High | ✅ done |
| 11 | Backend — contact messages GET missing admin check | Medium | ✅ done |
| 12 | Backend — products POST/PUT missing auth + role check | High | ✅ done |
| 13 | Login page — ⭐⭐ editorial upgrade needed | Medium | ✅ done |
| 14 | Register page — ⭐⭐ editorial upgrade needed | Medium | ✅ done |
| 15 | Tailwind — 17 missing color tokens from tokens.css | Medium | ✅ done |
| 16 | Backend — missing featured/my endpoints | Medium | ✅ done |
| 22 | Profile page — editorial upgrade to ⭐⭐⭐⭐ | Medium | ✅ done |
| 23 | Legal pages (Privacy/Terms/ChildrenSafety) — editorial upgrade | Medium | ✅ done |
| 24 | Footer — legal page links to correct routes | Low | ✅ done |
| 25 | App.tsx — register 3 legal page routes | High | ✅ done |
| 26 | Contact page — dead code cleanup (FAQItem, ChevronIcon, GRAIN_STYLE, openFaqIndex) | Low | ✅ done |
| 27 | Sage green accent system — integrate #3F4F45 across Home, Donate, About, Traceability, ProductCard | Medium | ✅ done |
| 28 | TypeScript — remove `any` types from API callbacks (Profile, CampaignDetail, ProductDetail) | High | ✅ done |
| 29 | TypeScript — remove snake_case property fallbacks (CampaignDetail 7 props, ProductDetail 4 props) | High | ✅ done |
| 30 | React — replace `key={index}` with semantic keys (KineticMarquee, FAQAccordion, ArtworkDetail) | Medium | ✅ done |
| 31 | EditorialHero — fix `boolean | null` vs `boolean | undefined` on TextScramble reducedMotion prop | Low | ✅ done |
| 32 | Contact page — replace raw `<select>` with VintageSelect editorial component | Medium | ✅ done |
| 33 | OrigamiFold — add `useReducedMotion()` to OrigamiCorner component (unconditional rotation animation) | High | ✅ done |
| 34 | EditorialHero — fix TextScramble `reducedMotion` null coercion (`prefersReducedMotion ? true : undefined`) | Medium | ✅ done |
| 35 | Stories — guard article `initial` prop with reduced-motion (was always applying y:50 causing invisible elements) | High | ✅ done |
| 36 | Stories ReadingProgressBar — convert `width` animation to `scaleX` for GPU compositing | Medium | ✅ done |
| 37 | Campaigns progress bar — convert `width` animation to `scaleX` for GPU compositing | Medium | ✅ done |
| 38 | Donate — convert 2 decorative line `width` animations to `scaleX` | Medium | ✅ done |
| 39 | Login — fix "Remember me" label (missing checkbox input and htmlFor attribute) | Medium | ✅ done |
| 40 | Donate — replace 2 inline grain SVG data URLs with reusable SectionGrainOverlay component | Medium | ✅ done |
| 41 | Campaigns — add `role="progressbar"` with aria-valuenow to funding progress bars | Low | ✅ done |
| 42 | Campaigns/Stories — add `role="tablist"` to category filter containers | Low | ✅ done |
| 43 | Stories — add `role="progressbar"` to ReadingProgressBar, `cursor-pointer` to category filter buttons | Low | ✅ done |
| 44 | Traceability CarbonBar — convert `width` animation to `scaleX` for GPU compositing | Medium | ✅ done |
| 45 | CampaignDetail funding progress — convert `width` animation to `scaleX` | Medium | ✅ done |
| 46 | ProductCard sustainability score bar — convert `width` to `scaleX`, add `overflow-hidden` to parent | Medium | ✅ done |
| 47 | Register decorative divider — convert `width` animation to `scaleX` with `origin-center` | Medium | ✅ done |
| 48 | Login decorative divider — convert `width` animation to `scaleX` with `origin-center` | Medium | ✅ done |
| 49 | Profile decorative divider — convert `width` animation to `scaleX` with `origin-center` | Medium | ✅ done |
| 50 | NotFound decorative divider — convert `width` animation to `scaleX` with `origin-center` | Medium | ✅ done |
| 51 | ProductCard "Notify Me" button — add missing `cursor-pointer` | Low | ✅ done |
| 52 | Stories empty-state "Browse All" button — add missing `cursor-pointer` | Low | ✅ done |
| 53 | SepiaImageFrame — replace `as any` with `Exclude<typeof accentPosition, 'diagonal'>` type narrowing | Medium | ✅ done |

## Completed — Cycle 5

| # | Issue | Priority | Notes |
|---|-------|----------|-------|
| 54 | SectionGrainOverlay — consolidate ALL 18 inline grain SVGs across 15 files | Medium | ✅ done — layouts (Header, MagazineNav, EditorialFooter), editorial components (EditorialCard x2, ImageSkeleton, TraceabilityTimeline, ProductCard, ArtworkCard, DonationPanel), pages (About, Home x2, Contact x2, Traceability x3, Profile) |
| 55 | Backend — artworks PUT/DELETE missing admin role check | High | ✅ done — added `require_role("admin")` to both endpoints |
| 56 | Backend — donation certificate endpoint missing auth + ownership check | High | ✅ done — added `get_current_user` dependency + donor/admin authorization |
| 57 | Backend — order status update mock fallback missing ownership check | High | ✅ done — added user_id vs current_user ownership check in mock fallback |
| 58 | Frontend — donations.ts request schema misaligned with backend | Medium | ✅ done — fixed field names (tierId→amount, campaignId→campaign_id, anonymous→is_anonymous) |
| 59 | Frontend — orders.ts request schema misaligned with backend | Medium | ✅ done — fixed field names (productId→product_id, shippingAddress→shipping_address+payment_method) |
| 60 | Frontend — contact.ts API service file creation | Low | ✅ done — created `/services/contact.ts` with ContactFormRequest interface |

## Completed — Cycle 6

| # | Issue | Priority | Notes |
|---|-------|----------|-------|
| 61 | Backend — campaigns.py role check references non-existent roles (`super_admin`, `content_admin`) | High | ✅ done — all 3 occurrences changed to `require_role("admin")` |
| 62 | Backend — orders.py status update privilege escalation (owner can set any status) | High | ✅ done — non-admin users restricted to `cancelled` status only |
| 63 | Backend — payments.py create endpoint missing ownership verification | High | ✅ done — added order/donation ownership check + gated test endpoint behind admin |
| 64 | Backend — DonationCreate schema accepts `donor_user_id` from client (IDOR vector) | High | ✅ done — removed field from schema; server already overrides from current_user |
| 65 | Frontend — API services snake_case mismatches (pageSize, campaignId, vote response) | Medium | ✅ done — fixed artworks.ts, products.ts, campaigns.ts, donations.ts; ArtworkDetail.tsx, Campaigns/index.tsx |
| 66 | Donate — progress bar animates `width` instead of `scaleX` | Medium | ✅ done — converted to scaleX with origin-left for GPU compositing |
| 67 | ProductCard — notify submitted text unguarded reduced-motion initial | High | ✅ done — guarded with prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 5 } |
| 68 | ProductCard — notify email form unguarded reduced-motion initial (height) | High | ✅ done — guarded with prefersReducedMotion ? { opacity: 1 } : { opacity: 0, height: 0 } |
| 69 | ArtworkDetail — image fade-in unguarded reduced-motion initial | High | ✅ done — guarded with prefersReducedMotion ? { opacity: 1 } : { opacity: 0 } |
| 70 | Campaigns — paginated list transition unguarded reduced-motion initial | High | ✅ done — guarded with prefersReducedMotion ? { opacity: 1 } : { opacity: 0 } |
| 71 | Campaigns — empty state false-guard (opacity: 0 in reduced-motion branch) | High | ✅ done — fixed to { opacity: 1 } in reduced-motion branch |
| 72 | Traceability — search spinner unguarded reduced-motion initial (height) | High | ✅ done — guarded with prefersReducedMotion ? { opacity: 1 } : { opacity: 0, height: 0 } |
| 73 | Traceability — search result card unguarded reduced-motion initial | High | ✅ done — guarded with prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 } |
| 74 | Traceability — highlight detail unguarded reduced-motion initial (height) | High | ✅ done — guarded with prefersReducedMotion ? { opacity: 1 } : { opacity: 0, height: 0 } |
| 75 | Contact — validation error message unguarded reduced-motion initial | High | ✅ done — guarded with prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -5 } |
| 76 | Contact — submit error state unguarded reduced-motion initial | High | ✅ done — guarded with prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 } |
| 77 | ProductDetail — image fade-in unguarded reduced-motion initial | High | ✅ done — guarded with prefersReducedMotion ? { opacity: 1 } : { opacity: 0 } |

## Completed — P0 Backend Security (2026-03-21)

| # | Issue | Priority | Notes |
|---|-------|----------|-------|
| 78 | Backend — orders.py real DB path allows non-admin to set any order status | P0 | ✅ done — added `body.status != "cancelled"` restriction to real DB path (mock fallback already had it) |
| 79 | Backend — RegisterRequest missing EmailStr validation | P0 | ✅ done — changed `email: str` to `email: EmailStr` |
| 80 | Backend — RegisterRequest missing password constraints | P0 | ✅ done — added `min_length=8, max_length=128` |
| 81 | Backend — users.py update_me fallback mass-assignment vulnerability | P0 | ✅ done — explicitly whitelisted nickname/avatar/phone fields |
| 82 | Backend — update_user_role missing self-modification guard | P0 | ✅ done — admin cannot modify their own role (prevents lock-out) |
| 83 | Backend — update_user_status missing self-modification guard | P0 | ✅ done — admin cannot modify their own status (prevents lock-out) |
| 84 | Backend — UserUpdate.phone missing max_length constraint | P0 | ✅ done — added `max_length=20` to prevent oversized encryption input |

## Completed — P1 Editorial Reduced-Motion Round 3 (2026-03-22)

| # | Issue | Priority | Notes |
|---|-------|----------|-------|
| 85 | StoryQuoteBlock — Rules of Hooks violation (inline useTransform in JSX) | P0 | ✅ done — hoisted flourishDashoffset to top-level; removed inline useTransform call |
| 86 | EditorialHeroV2 — 7 animation blocks unguarded reduced-motion | P1 | ✅ done — content div, eyebrow, headline, subtitle, CTA row, arrow animation, stats row |
| 87 | HeroInteractiveOrb — 6 continuous animations unguarded reduced-motion | P1 | ✅ done — 3 ring rotations, core orb pulse, inner highlight, 6 floating particles |
| 88 | HeroFloatingCards — prefersReducedMotion scope error + unguarded arrow SVG | P1 | ✅ done — added useReducedMotion to parent component; guarded arrow SVG + badge |
| 89 | EditorialAdvertisement — reduced-motion guard | P1 | ✅ done |
| 90 | EditorialCallout — reduced-motion guard | P1 | ✅ done |
| 91 | VintageInput — reduced-motion guard | P1 | ✅ done |
| 92 | ProductDetail — setTimeout without cleanup (setState on unmounted) | P1 | ✅ done — useRef for timeout ID + useEffect cleanup with clearTimeout |

## Completed — Cycle 7 (2026-03-22)

| # | Issue | Priority | Notes |
|---|-------|----------|-------|
| 93 | About page — missing CTA section after Team | Medium | ✅ done — added "Get Involved" section (#04) with Donate + Explore Campaigns links |
| 94 | Campaigns page — missing CTA section at bottom | Medium | ✅ done — added "Start a Campaign" bordered CTA box with Get in Touch link |
| 95 | Profile page — avatar area lacks editorial treatment | Low | ✅ done — upgraded to w-20 h-20, added corner accents + hover scale, consistent with TeamMemberCard |
| 96 | Frontend — auth.ts missing updateProfile method | Medium | ✅ done — added `updateProfile` mapping to PUT /users/me |
| 97 | Frontend — products.ts missing getCategories method | Low | ✅ done — added `getCategories` mapping to GET /products/categories |
| 98 | Frontend — payments.ts service file missing | Medium | ✅ done — created with create + getById methods, added Payment type to types/index.ts |

## Completed — Cycle 10 (2026-03-22)

### P0 Backend Security

| # | Issue | Priority | Notes |
|---|-------|----------|-------|
| 100 | CORS — wildcard origins with credentials enabled | P0 | ✅ done — config.py model_validator rejects `*` when allow_credentials |
| 101 | TrustedHostMiddleware disabled in all environments | P0 | ✅ done — enabled in non-development; dev skips |
| 102 | WeChat API secret exposed in GET query string (access logs) | P0 | ✅ done — both login + wx_login switched to POST form data |
| 103 | Mock password comparison using `==` (timing attack) | P0 | ✅ done — replaced with `hmac.compare_digest` |
| 104 | WeChat error detail leaked in HTTP 401 response | P0 | ✅ done — generic "WeChat authentication failed" message |
| 105 | Debug print statement in artworks.py create endpoint | P0 | ✅ done — removed |
| 106 | PII in auth.py debug logs (email addresses) | P0 | ✅ done — removed email from log messages |

### P0/P1 Frontend Security

| # | Issue | Priority | Notes |
|---|-------|----------|-------|
| 107 | VITE_API_SECRET_KEY fallback to hardcoded default | P0 | ✅ done — removed fallback, throws if unset |
| 108 | ProductDetail — `product.price.toFixed()` crashes on null | P1 | ✅ done — `(product.price ?? 0).toFixed(2)` |
| 109 | Profile — no error states for failed order/donation loads | P1 | ✅ done — added errorOrders/errorDonations states + UI |

### P1 Backend Hardening

| # | Issue | Priority | Notes |
|---|-------|----------|-------|
| 110 | Contact form — no per-IP rate limiting | P1 | ✅ done — 5 submissions per 60s window |
| 111 | Contact form — email field missing EmailStr validation | P1 | ✅ done — changed to EmailStr |
| 112 | Alipay notify — accepts unverified callbacks in production | P1 | ✅ done — 501 in production until RSA2 verification configured |
| 113 | Payment webhook — mock HMAC verification | P1 | ✅ done — proper HMAC-SHA256 with APP_SECRET_KEY |
| 114 | WeChatPayService — `==` for signature comparison | P1 | ✅ done — `hmac.compare_digest` |
| 115 | Password min_length=6 (too weak) | P1 | ✅ done — changed to min_length=8 |
| 116 | X-Nonce missing from CORS allowed headers | P1 | ✅ done — added to main.py CORS config |

### Accessibility — Heading Hierarchy + ARIA

| # | Issue | Priority | Notes |
|---|-------|----------|-------|
| 117 | 6 pages missing sr-only h1 when hideHero=true | P1 | ✅ done — Campaigns, Stories, Traceability, Shop, Profile, CampaignDetail |
| 118 | 3 category filter tabs missing ARIA tab pattern | P1 | ✅ done — Campaigns statuses, Stories categories, Shop categories |
| 119 | MagazineDivider — 3 variants missing aria-hidden on container | P1 | ✅ done — numbered, decorative, and default variants |
| 120 | Footer email input missing aria-label | P1 | ✅ done |
| 121 | 15+ decorative elements missing aria-hidden across 9 files | P1 | ✅ done — editorial-dividers, corner accents, gradient overlays |

### UX Improvements

| # | Issue | Priority | Notes |
|---|-------|----------|-------|
| 122 | Donate — console.log/console.error instead of user-facing feedback | Medium | ✅ done — success/error status banners |

## Pending

| # | Issue | Priority | Notes |
|---|-------|----------|-------|
| 17 | Traceability — hardcoded English strings need i18n extraction | Low | |
| 18 | Shop — hardcoded English strings need i18n extraction | Low | |
| 19 | Donate — hardcoded English strings need i18n extraction | Low | |
| 20 | Stories — hardcoded English strings need i18n extraction | Low | |
| 21 | Contact — hardcoded English strings need i18n extraction | Low | |
