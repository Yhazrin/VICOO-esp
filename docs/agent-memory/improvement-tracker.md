# Improvement Tracker

> Auto-maintained by agent loop. Last updated: 2026-03-21 (cycle 4)

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

## In Progress — Cycle 5

| # | Issue | Priority | Notes |
|---|-------|----------|-------|
| 54 | SectionGrainOverlay — consolidate ALL 18 inline grain SVGs across 15 files | Medium | ✅ done — layouts (Header, MagazineNav, EditorialFooter), editorial components (EditorialCard x2, ImageSkeleton, TraceabilityTimeline, ProductCard, ArtworkCard, DonationPanel), pages (About, Home x2, Contact x2, Traceability x3, Profile) |
| 55 | Backend — artworks PUT/DELETE missing admin role check | High | ✅ done — added `require_role("admin")` to both endpoints |
| 56 | Backend — donation certificate endpoint missing auth + ownership check | High | ✅ done — added `get_current_user` dependency + donor/admin authorization |
| 57 | Backend — order status update mock fallback missing ownership check | High | ✅ done — added user_id vs current_user ownership check in mock fallback |
| 58 | Frontend — donations.ts request schema misaligned with backend | Medium | ✅ done — fixed field names (tierId→amount, campaignId→campaign_id, anonymous→is_anonymous) |
| 59 | Frontend — orders.ts request schema misaligned with backend | Medium | ✅ done — fixed field names (productId→product_id, shippingAddress→shipping_address+payment_method) |
| 60 | Frontend — contact.ts API service file creation | Low | ✅ done — created `/services/contact.ts` with ContactFormRequest interface |

## Pending

| # | Issue | Priority | Notes |
|---|-------|----------|-------|
| 17 | Traceability — hardcoded English strings need i18n extraction | Low | |
| 18 | Shop — hardcoded English strings need i18n extraction | Low | |
| 19 | Donate — hardcoded English strings need i18n extraction | Low | |
| 20 | Stories — hardcoded English strings need i18n extraction | Low | |
| 21 | Contact — hardcoded English strings need i18n extraction | Low | |
