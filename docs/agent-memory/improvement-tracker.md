# Improvement Tracker

> Auto-maintained by agent loop. Last updated: 2026-03-22 (cycle 33)
> Scope broadened: now covers frontend UI/UX + backend architecture + software architecture + sustainability + code quality

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

## Completed — Cycle 8 (2026-03-22)

| # | Issue | Priority | Notes |
|---|-------|----------|-------|
| 99 | TypeScript — CampaignDetail mock data string→number IDs (15 errors) | High | ✅ done — `'1'`→`1`, `'a1'`→`1`, `'c1'`→`1`, `'g1'`→`1` |
| 100 | TypeScript — Campaigns/index.tsx mock data string→number IDs (6 errors) | High | ✅ done — `'1'`-`'6'` → `1`-`6` |
| 101 | TypeScript — Traceability mock data string→number IDs + state type (6 errors) | High | ✅ done — mock IDs + `highlightedId: number \| null` |
| 102 | TypeScript — ProductDetail supply chain mock string→number IDs (7 errors) | High | ✅ done — `'sc1'`-`'sc6'` → `1`-`6` |
| 103 | TypeScript — cartStore removeItem/updateQuantity param string→number (3 errors) | High | ✅ done — params now `number` matching `Product.id` |
| 104 | TypeScript — ProductDetail imageUrls non-existent property (4 errors) | High | ✅ done — derived local `productImages` from `product.image_url` |
| 105 | Backend — auth.py duplicated cookie-setting code (7 occurrences) | Medium | ✅ done — extracted `_set_auth_cookies()` helper, 528→406 lines |
| 106 | Backend — auth.py info-leaking logger calls | High | ✅ done — removed 4 lines logging `is_secure`, `APP_ENV`, response headers |
| 107 | Backend — products.py route ordering: `/{product_id}` shadows `/{product_id}/supply-chain` | High | ✅ done — moved supply-chain route before wildcard |
| 108 | Backend — deps.py auth fallback returns user data from JWT when DB fails | High | ✅ done — raises HTTP 503 on DB error, HTTP 401 if user not found |
| 109 | Backend — payments.py hardcoded HMAC signature check | High | ✅ done — replaced with proper HMAC-SHA256 verification using APP_SECRET_KEY |
| 110 | Frontend — types/index.ts all entity IDs string→number | High | ✅ done — User, Artwork, Campaign, Story, Product, SupplyChainRecord, DonationTier, Donation, Order |
| 111 | Frontend — types: imageUrls→image_url, anonymous→is_anonymous, shippingAddress→shipping_address | High | ✅ done — aligned with backend schema |
| 112 | Frontend — all services response unwrapping `response.data`→`response.data.data` | High | ✅ done — 9 service files fixed |
| 113 | Frontend — supply-chain.ts service file missing | Medium | ✅ done — created with trace/getRecords/getStages |
| 114 | Accessibility — Header/MagazineNav missing keyboard nav + ARIA roles | Medium | ✅ done — role=menu/menuitem, Escape/Arrow keys, aria-haspopup |
| 115 | Accessibility — VintageSelect missing error ARIA | Medium | ✅ done — added error prop with aria-describedby/aria-invalid |
| 116 | Accessibility — EditorialHeroV2 text-gray-400 insufficient contrast | Medium | ✅ done — changed to text-ink-faded |
| 117 | Accessibility — ProductCard <form> inside <a> invalid nesting | Medium | ✅ done — moved Notify Me section outside Link wrapper |
| 118 | Sustainability — Traceability page not wired to API | Medium | ✅ done — useQuery + supplyChainApi.trace() with mock fallback |
| 119 | Sustainability — Donate page impact stats not dynamic | Low | ✅ done — wired to donationsApi.getImpactStats() |
| 120 | Sustainability — Stories page not wired to API | Medium | ✅ done — wired to artworksApi.getAll(), fixed artwork links |
| 121 | Content — ChildrenSafety placeholder text | Medium | ✅ done — 8 real content sections |
| 122 | Content — Privacy placeholder text | Medium | ✅ done — 9 real content sections |
| 123 | i18n — missing translation keys for new features | Low | ✅ done — 88 lines added to en.json/zh.json |

## Completed — Cycle 8b (2026-03-22)

| # | Issue | Priority | Notes |
|---|-------|----------|-------|
| 124 | Backend — alipay_notify stub handler missing RSA2 signature verification | High | ✅ done — full verification with `cryptography` lib, RSA/SHA-256 PKCS1v15, form param filtering + sorting |
| 125 | Backend — alipay_notify missing payment processing logic | High | ✅ done — trade status check, idempotency via provider_transaction_id, order lookup, payment tx creation |
| 126 | Backend — list_donations exposes PII to unauthenticated users | High | ✅ done — optional auth via get_optional_current_user, redact donor_name/message/donor_user_id |
| 127 | Backend — deps.py missing optional auth dependency | Medium | ✅ done — get_optional_current_user() returns user dict or None, no exception on auth failure |
| 128 | Backend — donations.py missing name redaction helper | Medium | ✅ done — _redact_name() masks names to first char + asterisks, handles anonymous flag |

## Completed — Cycle 33 (2026-03-22)

| # | Issue | Priority | Notes |
|---|-------|----------|-------|
| 129 | Backend — main.py TESTING=1 bypasses skip signature verification + rate limiting | P0 | ✅ done — removed both `if not TESTING` guards; middlewares always enforce |
| 130 | Backend — auth.py mock fallback uses plain `!=` for password comparison (timing attack) | P0 | ✅ done — changed to `hmac.compare_digest`; DB failure raises HTTP 503 |
| 131 | Backend — auth.py refresh token endpoint trusts token role (privilege escalation) | P0 | ✅ done — looks up user.role from DB instead of token payload |
| 132 | Backend — payments.py amount not validated against actual order/donation (tampering) | P0 | ✅ done — validates amount matches DB record; rejects mismatched amounts |
| 133 | Backend — payments.py alipay_notify ALIPAY_PUBLIC_KEY missing → fail-open | P0 | ✅ done — returns 500 when key missing instead of accepting unverified callback |
| 134 | Backend — artworks.py file upload missing MIME/size/content validation | P0 | ✅ done — JPEG/PNG/WebP whitelist, 10MB limit, magic byte verification |
| 135 | Backend — payments.py webhook APP_SECRET_KEY empty → fail-open | P1 | ✅ done — added empty string check, returns 500 |
| 136 | Frontend — MobileNav.tsx missing focus trap (Tab escapes dialog) | P0 | ✅ done — Tab/Shift+Tab cycles within dialog (WCAG 2.4.7 + 2.1.1) |
| 137 | Frontend — global.css .form-input:focus missing visible focus ring | P0 | ✅ done — restored box-shadow focus indicator (WCAG 2.4.7) |
| 138 | Frontend — 5 pages missing <h1> (Profile, Campaigns, Shop, Stories, Traceability) | P0 | ✅ done — added sr-only h1 to each page (WCAG heading hierarchy) |
| 139 | Frontend — Login/DonationPanel checkboxes below 44px touch target | P1 | ✅ done — enlarged to w-11 h-11 p-2.5 (WCAG 2.5.8) |
| 140 | Frontend — supply-chain.ts wrong endpoint + unsupported methods | Medium | ✅ done — corrected getProductJourney endpoint, removed dead methods |
| 141 | Frontend — ArtworkDetail.tsx orphaned handleVote + missing voteMutation | High | ✅ done — replaced with proper useMutation hook |
| 142 | TypeScript — Traceability unused imports (useQuery, buildRecordsFromApi, STAGE_MAP) | Medium | ✅ done — removed 3 unused declarations |
| 143 | TypeScript — Traceability number vs string ID comparison | Medium | ✅ done — `r.id === query` → `r.id.toString() === query` |
| 144 | TypeScript — Login/Register unused MagazineDivider import | Low | ✅ done — removed from both files |
| 145 | Backend — orders.py `import random` inside except block | Low | ✅ done — moved to top-level imports |
| 146 | Backend — 5 router files mock write fallbacks (fail-open on DB error) | P0 | ✅ done — all replaced with HTTP 503 fail-closed |

## Pending

| # | Issue | Priority | Notes |
|---|-------|----------|-------|
| 17 | Traceability — hardcoded English strings need i18n extraction | Low | |
| 18 | Shop — hardcoded English strings need i18n extraction | Low | |
| 19 | Donate — hardcoded English strings need i18n extraction | Low | |
| 20 | Stories — hardcoded English strings need i18n extraction | Low | |
| 21 | Contact — hardcoded English strings need i18n extraction | Low | |
