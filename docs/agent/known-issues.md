# Known Issues

## ISSUE-001: Missing frontend routes — FIXED (Round 1)
- **Status**: fixed
- **Severity**: HIGH
- **Module**: frontend/web-react routing
- **First found**: Round 1
- **Last verified**: Round 2
- **Problem**: 5 page components had no route in App.tsx
- **Fix**: Added lazy imports and Route entries

## ISSUE-002: Frontend proxy port mismatch — FIXED (Round 1)
- **Status**: fixed
- **Severity**: HIGH
- **Module**: frontend/web-react vite config
- **First found**: Round 1
- **Last verified**: Round 2
- **Problem**: Proxy targeted localhost:8080 but backend runs on 8000
- **Fix**: Changed proxy target to localhost:8000

## ISSUE-003: Admin DashboardPage uses `<a href>` — FIXED (Round 1)
- **Status**: fixed
- **Severity**: MEDIUM
- **Module**: admin DashboardPage
- **First found**: Round 1
- **Last verified**: Round 2
- **Problem**: Full page reload instead of client-side navigation
- **Fix**: Changed to React Router `<Link>`

## ISSUE-004: Large admin bundle (1129 KB)
- **Status**: open
- **Severity**: LOW
- **Module**: admin build
- **First found**: Round 1
- **Problem**: Single JS chunk exceeds 500 KB warning threshold
- **Suggestion**: Add code splitting / manual chunks

## ISSUE-005: Redis unhealthy in local dev
- **Status**: deferred
- **Severity**: LOW
- **Module**: backend health check
- **First found**: Round 1
- **Problem**: Health check reports Redis unhealthy
- **Notes**: Expected for local dev without Redis; fail-open rate limiting handles this gracefully

## ISSUE-006: Some products missing English i18n fields
- **Status**: open
- **Severity**: LOW
- **Module**: backend product data
- **First found**: Round 1
- **Problem**: Several products (IDs 4, 5, 7, 8, 9) have null trace_story_title_en and trace_story_content_en
- **Impact**: English locale users see empty trace stories for these products

## ISSUE-007: AI Assistant returns 503
- **Status**: open
- **Severity**: MEDIUM
- **Module**: backend AI service / MiniMax API
- **First found**: Round 2
- **Problem**: POST /ai/chat returns 503 "AI Assistant is temporarily unavailable"
- **Impact**: AI chat feature non-functional
- **Notes**: Likely MiniMax API key expired or service down. Not a code issue — external dependency.

## ISSUE-008: Admin mutations missing onError handlers — FIXED (Round 3)
- **Status**: fixed
- **Severity**: MEDIUM
- **Module**: admin OrderPage, UserPage, ArtworkPage
- **First found**: Round 3
- **Problem**: Three mutations had onSuccess but no onError, causing silent failures
- **Fix**: Added onError handlers with toast error messages

## ISSUE-009: CampaignPage edit skips required field validation — FIXED (Round 3)
- **Status**: fixed
- **Severity**: MEDIUM
- **Module**: admin CampaignPage
- **First found**: Round 3
- **Problem**: Edit path only validated targetAmount, not title/startDate/endDate
- **Fix**: Added required field validation matching create path

## ISSUE-010: LoginPage email input type is "text" — FIXED (Round 3)
- **Status**: fixed
- **Severity**: LOW
- **Module**: admin LoginPage
- **First found**: Round 3
- **Problem**: Email field used type="text", missing browser validation and email keyboard
- **Fix**: Changed to type="email"

## ISSUE-011: ProductDetail quantity has no upper bound — FIXED (Round 3)
- **Status**: fixed
- **Severity**: LOW
- **Module**: frontend ProductDetail
- **First found**: Round 3
- **Problem**: setQuantity(quantity + 1) allowed incrementing beyond store cap of 99
- **Fix**: Changed to Math.min(quantity + 1, 99)

## ISSUE-012: ClothingIntakeForm photos not sent to backend
- **Status**: open (design limitation)
- **Severity**: LOW
- **Module**: frontend ClothingIntakeForm, backend clothing_intakes
- **First found**: Round 3
- **Problem**: Form collects photos via file input but never includes them in API payload
- **Notes**: Backend clothing_intakes endpoint has no photo field. Requires backend change to add photo upload support.

## ISSUE-013: Frontend token refresh failure doesn't logout — FIXED (Round 4)
- **Status**: fixed
- **Severity**: HIGH
- **Module**: frontend api.ts
- **First found**: Round 4
- **Problem**: Stale accessToken in memory caused infinite 401 retry loops after refresh failure
- **Fix**: Added `useAuthStore.getState().logout()` in refresh catch block

## ISSUE-014: DonationCertificate handleDownload has no error handling — FIXED (Round 4)
- **Status**: fixed
- **Severity**: HIGH
- **Module**: frontend DonationCertificate
- **First found**: Round 4
- **Problem**: Unhandled promise rejection on download failure
- **Fix**: Wrapped in try/catch

## ISSUE-015: Admin adaptPaginated crashes on null data — FIXED (Round 4)
- **Status**: fixed
- **Severity**: HIGH
- **Module**: admin api.ts
- **First found**: Round 4
- **Problem**: TypeError when backend returns null data
- **Fix**: Added null/type guard returning empty paginated response

## ISSUE-016: Admin SettingsPage + ProductPage mutations missing onError — FIXED (Round 4)
- **Status**: fixed
- **Severity**: MEDIUM
- **Module**: admin SettingsPage, ProductPage
- **First found**: Round 4
- **Problem**: 4 mutations (settings save, 3 supply chain CRUD) had silent failures
- **Fix**: Added onError handlers with toast error messages

## ISSUE-017: OAuth CSRF state not validated — FIXED (Round 4)
- **Status**: fixed
- **Severity**: HIGH
- **Module**: backend oauth.py
- **First found**: Round 4
- **Problem**: OAuth callback accepted any state parameter without validating against cookie
- **Fix**: Added state comparison in both GitHub and Google callbacks

## ISSUE-018: Admin audit code timing-unsafe comparison — FIXED (Round 4)
- **Status**: fixed
- **Severity**: HIGH
- **Module**: backend admin.py
- **First found**: Round 4
- **Problem**: String `!=` comparison vulnerable to timing attacks
- **Fix**: Changed to `hmac.compare_digest`

## ISSUE-019: Order status / batch moderation lack explicit validation — FIXED (Round 4)
- **Status**: fixed
- **Severity**: MEDIUM
- **Module**: backend orders.py, admin.py
- **First found**: Round 4
- **Problem**: Accepted arbitrary status strings, relying on DB Enum for rejection
- **Fix**: Added explicit allow-list validation with clear 400 errors

## ISSUE-020: Checkout silently swallows address-save and polling errors
- **Status**: open
- **Severity**: MEDIUM
- **Module**: frontend Checkout
- **First found**: Round 4
- **Problem**: Silent `catch {}` on address save and payment polling — user gets no feedback on failure
- **Notes**: Address save silence may be intentional (don't block order), but polling silence wastes 3 minutes

## ISSUE-021: Admin API functions don't null-guard envelope.data
- **Status**: open
- **Severity**: MEDIUM
- **Module**: admin api.ts (dashboard metrics, trends)
- **First found**: Round 4
- **Problem**: fetchDashboardMetrics, fetchDonationTrend etc. access envelope.data without null check
- **Notes**: Lower risk now that adaptPaginated has a null guard, but dashboard/trend functions are separate

## ISSUE-022: Backend settings PUT accepts arbitrary key/value pairs
- **Status**: open
- **Severity**: MEDIUM
- **Module**: backend admin.py
- **First found**: Round 4
- **Problem**: PUT /admin/settings body is `dict[str, Any]` with no key whitelist
- **Notes**: Admin-only endpoint, but could override security-relevant config accidentally

## ISSUE-021: Admin dashboard/trend functions don't null-guard envelope.data — FIXED (Round 5)
- **Status**: fixed
- **Severity**: MEDIUM
- **Module**: admin api.ts
- **First found**: Round 4
- **Problem**: 5 analytics functions accessed envelope.data without null check
- **Fix**: Added `?? {}` fallback on all 5 functions

## ISSUE-023: Profile page doesn't show address fetch error — FIXED (Round 5)
- **Status**: fixed
- **Severity**: MEDIUM
- **Module**: frontend Profile
- **First found**: Round 5
- **Problem**: Address query didn't track isError — user saw empty list on failure
- **Fix**: Added isError tracking and error message display

## ISSUE-024: DonationCertificate download error not shown — FIXED (Round 5)
- **Status**: fixed
- **Severity**: MEDIUM
- **Module**: frontend DonationCertificate
- **First found**: Round 5
- **Problem**: Download catch block was empty, user got no feedback on failure
- **Fix**: Added downloadError state and UI display

## ISSUE-025: Frontend i18n missing 15 Chinese campaign translations — FIXED (Round 6)
- **Status**: fixed
- **Severity**: MEDIUM
- **Module**: frontend i18n
- **First found**: Round 6
- **Problem**: 5 campaign items × 3 fields existed in en.json but not zh.json
- **Fix**: Added all 15 Chinese translations

## ISSUE-026: Admin i18n missing 2 English Guardian role translations — FIXED (Round 6)
- **Status**: fixed
- **Severity**: LOW
- **Module**: admin i18n
- **First found**: Round 6
- **Problem**: roleGuardian and optionGuardian existed in zh.json but not en.json
- **Fix**: Added English translations

## ISSUE-027: Admin empty alt on content images — FIXED (Round 6)
- **Status**: fixed
- **Severity**: LOW
- **Module**: admin ProductPage, DashboardPage
- **First found**: Round 6
- **Problem**: Gallery item and artwork preview used alt="" on content images
- **Fix**: Used item.caption and artwork.title respectively

## ISSUE-028: Heavy external image URL dependency
- **Status**: open (known limitation)
- **Severity**: LOW
- **Module**: backend seed data, frontend fallbacks
- **First found**: Round 6
- **Problem**: Backend has 6+ files with hardcoded Unsplash URLs and 3+ with Picsum.photos URLs as single points of failure
- **Notes**: Team already aware — db_repair.py has fallback logic. Not a code fix — requires hosting strategy decision.

## ISSUE-029: OrderDetail return modal missing dialog role — FIXED (Round 7)
- **Status**: fixed
- **Severity**: HIGH
- **Module**: frontend OrderDetail
- **First found**: Round 7
- **Problem**: Modal missing role="dialog" and aria-modal="true"
- **Fix**: Added ARIA dialog attributes

## ISSUE-030: Form label/input dissociation across auth pages — FIXED (Round 7)
- **Status**: fixed
- **Severity**: MEDIUM
- **Module**: frontend Login, Register, ForgotPassword; admin LoginPage
- **First found**: Round 7
- **Problem**: <label> missing htmlFor, <input> missing id — screen readers can't associate labels
- **Fix**: Added matching htmlFor/id pairs on all 8 form fields

## ISSUE-031: Icon-only buttons missing aria-labels — FIXED (Round 7)
- **Status**: fixed
- **Severity**: MEDIUM
- **Module**: frontend AIAssistantBall, AiDesign, OrderDetail
- **First found**: Round 7
- **Problem**: Icon-only buttons had no accessible text
- **Fix**: Added aria-label to 5 buttons

## ISSUE-032: Admin i18n missing 5 translation keys — FIXED (Round 7)
- **Status**: fixed
- **Severity**: MEDIUM
- **Module**: admin i18n
- **First found**: Round 7
- **Problem**: generic.error, user.toastRoleFailed, donation.anonLabel, donation.authOkLabel, afterSales.colId missing from both language files
- **Fix**: Added all 5 keys to en.json and zh.json

## ISSUE-033: Frontend i18n missing 131 translation keys — FIXED (Round 8)
- **Status**: fixed
- **Severity**: MEDIUM
- **Module**: frontend i18n
- **First found**: Round 7
- **Last verified**: Round 8
- **Problem**: 131 keys used in code but absent from both en.json and zh.json — mostly in materialTrace, supplyChainStudio, paymentConfirm, checkout QR, legal pages
- **Fix**: Added all 5 groups of keys (materialTrace: 19, supplyChainStudio: 17, paymentConfirm: 10, checkout QR: 9, legal: 76) to both en.json and zh.json

## ISSUE-034: ai_assistant.py analyze/moderate endpoints lack auth — FIXED (Round 9)
- **Status**: fixed
- **Severity**: HIGH
- **Module**: backend ai_assistant.py
- **First found**: Round 9
- **Problem**: `analyze_artwork` and `moderate_content` had no authentication — any unauthenticated user could trigger AI artwork analysis and content moderation
- **Fix**: Added `require_role("admin", "editor")` dependency to both endpoints

## ISSUE-035: design_drafts.py + campaigns.py leak str(e) to clients — FIXED (Round 9)
- **Status**: fixed
- **Severity**: HIGH
- **Module**: backend design_drafts.py, campaigns.py
- **First found**: Round 9
- **Problem**: design_drafts.py all 7 endpoints raised `HTTPException(detail=str(e))` leaking database paths, connection strings; campaigns.py create_campaign same pattern
- **Fix**: Replaced with generic error messages + `logger.exception` server-side logging

## ISSUE-036: Backend 6 routers missing try/except on mutation endpoints — FIXED (Round 9)
- **Status**: fixed
- **Severity**: LOW
- **Module**: backend after_sales.py, orders.py, contact.py, admin.py, payments.py, supply_chain.py
- **First found**: Round 9
- **Problem**: 8 mutation endpoints across 6 routers had no try/except — database errors returned generic 500 without logging
- **Fix**: Added try/except + logger.exception to all 8 endpoints

## ISSUE-037: Admin SettingsPage infinite loading on fetch failure — FIXED (Round 10)
- **Status**: fixed
- **Severity**: HIGH
- **Module**: admin SettingsPage
- **First found**: Round 10
- **Problem**: When settings fetch returned 500, `form` stayed null and the page rendered an infinite loading spinner with no error message or retry button
- **Fix**: Added isError check with error message and retry button

## ISSUE-038: Frontend mutations missing query invalidation — FIXED (Round 10)
- **Status**: fixed
- **Severity**: HIGH
- **Module**: frontend SubmitArtwork, ArtworkSubmit, AiDesign
- **First found**: Round 10
- **Problem**: Artwork creation mutations had no queryClient.invalidateQueries — new artworks were invisible on Stories/Vote/Campaign pages; AiDesign publishMutation didn't invalidate product lists — published products didn't appear on shop pages
- **Fix**: Added proper invalidation for artworks-featured, stories-feed, scroll-narrative-artworks, products, uniqlo-home-products

## ISSUE-039: Backend service mass-assignment vulnerabilities — FIXED (Round 10)
- **Status**: fixed
- **Severity**: HIGH
- **Module**: backend campaign/service.py, donation/service.py, supply_chain/service.py
- **First found**: Round 10
- **Problem**: (a) campaign update_campaign used unrestricted setattr; (b) donation create_donation passed entire input dict to constructor; (c) supply_chain update_record hasattr guard only checked existence not safety
- **Fix**: Added field allowlists (_UPDATABLE_FIELDS / _ALLOWED) to all 3 services

## ISSUE-040: ai_assistant/service.py str(e) leakage + moderation fails-open — FIXED (Round 10)
- **Status**: fixed
- **Severity**: HIGH
- **Module**: backend ai_assistant/service.py
- **First found**: Round 10
- **Problem**: (a) SSE stream error sent str(e) to client; (b) moderation returned is_safe=True on failure (fail-open); (c) artwork analysis leaked str(e) in moderation_notes; (d) feedback recording leaked str(e)
- **Fix**: Replaced all str(e) with generic messages; changed moderation from fail-open to fail-closed

## ISSUE-041: Admin list pages show misleading "No data" on fetch failure — FIXED (Round 17)
- **Status**: fixed
- **Severity**: MEDIUM
- **Module**: admin ProductPage, OrderPage, UserPage, ArtworkPage, CampaignPage, DonationPage, ClothingDonationPage, AfterSalesPage, AuditLogPage
- **First found**: Round 10
- **Last verified**: Round 17
- **Problem**: 9 admin list pages don't check isError from useQuery — on 500, data is undefined, DataTable shows "No data" empty state, admin may believe there are zero records
- **Fix**: Added isError to useQuery destructuring; added error banner with retry button before DataTable in all 9 pages

## ISSUE-042: CampaignDetail donate mutation missing cross-page invalidation — FIXED (Round 11)
- **Status**: fixed
- **Severity**: MEDIUM
- **Module**: frontend CampaignDetail
- **First found**: Round 10
- **Problem**: After donating to a campaign, donation-stats and my-donations queries are not invalidated — global donation stats and user's donation history on Profile page will be stale
- **Fix**: Added invalidation for donation-stats and my-donations in onSuccess

## ISSUE-043: ArtworkDetail vote mutation missing list invalidation — FIXED (Round 11)
- **Status**: fixed
- **Severity**: MEDIUM
- **Module**: frontend ArtworkDetail
- **First found**: Round 10
- **Problem**: After voting, only the individual artwork detail query is invalidated — artworks-featured list on Vote page showed stale vote counts
- **Fix**: Added invalidation for artworks-featured in onSuccess

## ISSUE-044: ArtworkPage sort columns are non-functional
- **Status**: open
- **Severity**: MEDIUM
- **Module**: admin ArtworkPage, backend artworks endpoint
- **First found**: Round 11
- **Problem**: ArtworkPage has sortable columns (title, votes, createdAt) with UI sort controls, but fetchArtworks() never forwards sortBy/sortOrder params to the API, and the backend artworks endpoint doesn't support sort_by/sort_order params. Sort is entirely UI-only.
- **Notes**: Requires both frontend (forward params) and backend (add sort_by/sort_order query params) changes

## ISSUE-045: DonationPage export/report only includes current page data
- **Status**: open
- **Severity**: LOW
- **Module**: admin DonationPage
- **First found**: Round 11
- **Problem**: CSV export and PDF report iterate over filteredData which is only the current page's 10 rows. User on page 2 of 50 pages gets only 10 rows in export.
- **Notes**: Requires either a separate all-records API call or clear UI indication that export is page-limited

## ISSUE-046: Admin table row action buttons missing loading states — FIXED (Round 12)
- **Status**: fixed
- **Severity**: HIGH
- **Module**: admin ArtworkPage, CampaignPage, OrderPage, ProductPage, DonationPage
- **First found**: Round 12
- **Problem**: 9 action buttons across 5 admin pages had no `loading` prop — rapid clicks triggered duplicate mutations and users got no visual feedback during pending state
- **Fix**: Added `loading={mutation.isPending}` to all 9 buttons

## ISSUE-047: Backend orders.py duplicate imports + conditional str(e) leakage — FIXED (Round 12)
- **Status**: fixed
- **Severity**: LOW
- **Module**: backend orders.py
- **First found**: Round 12
- **Problem**: Duplicate `import logging` and `logger` definitions; `detail = str(e) if settings.DEBUG` leaked DB errors in DEBUG mode
- **Fix**: Removed duplicates; replaced with always-generic error message

## ISSUE-048: Backend payment_service.py str(e) in raised exception — FIXED (Round 13)
- **Status**: fixed
- **Severity**: HIGH
- **Module**: backend app/services/payment_service.py
- **First found**: Round 13
- **Problem**: `call_wechat_pay()` raised `Exception(f"WeChat API connection failed: {str(e)}")` — raw httpx error details (hostnames, ports, DNS errors) could propagate to clients via donations router in development mode
- **Fix**: Replaced with generic `"WeChat API connection failed"` — raw error only in logger

## ISSUE-049: Admin LoginPage raw button missing spinner — FIXED (Round 13)
- **Status**: fixed
- **Severity**: MEDIUM
- **Module**: admin LoginPage.tsx
- **First found**: Round 13
- **Problem**: Login submit was a raw `<button>` with `disabled={loading}` and manual text swap — no CSS spinner during pending, inconsistent with admin design system
- **Fix**: Converted to shared `Button` component with `loading={loading}` prop

## ISSUE-050: Frontend ArtworkDetail vote button missing loading state — FIXED (Round 13)
- **Status**: fixed
- **Severity**: MEDIUM
- **Module**: frontend ArtworkDetail.tsx
- **First found**: Round 13
- **Problem**: `voteMutation.isPending` was never referenced in JSX — users got no visual feedback while voting, could trigger duplicate votes
- **Fix**: Added `disabled={voteMutation.isPending}`, opacity/cursor classes, pending text swap, disabled animations

## ISSUE-051: ProductPage supply chain node form missing validation — FIXED (Round 14)
- **Status**: fixed
- **Severity**: HIGH
- **Module**: admin ProductPage.tsx
- **First found**: Round 14
- **Problem**: `submitNode()` had zero client-side validation — `stage`, `description`, `location` could all be empty, sending invalid data to backend
- **Fix**: Added validation for `stage` and `description` (both required) with toast error messages

## ISSUE-052: SettingsPage missing client-side validation — FIXED (Round 14)
- **Status**: fixed
- **Severity**: HIGH
- **Module**: admin SettingsPage.tsx
- **First found**: Round 14
- **Problem**: `handleSave()` had no validation — empty `siteName` or invalid `contactEmail` could be submitted
- **Fix**: Added validation for `siteName` (required) and `contactEmail` (regex email format, optional) with toast error messages

## ISSUE-053: Admin 4 pages generic error toasts — FIXED (Round 15)
- **Status**: fixed
- **Severity**: MEDIUM
- **Module**: admin ArtworkPage, DonationPage, ClothingDonationPage, AfterSalesPage
- **First found**: Round 14
- **Problem**: Server error toasts showed generic message without extracting `response.data.detail` — admin got no specific error info on failure
- **Fix**: Added `e?.response?.data?.detail ??` fallback pattern to all 4 onError handlers

## ISSUE-054: Traceability page missing loading/error state — FIXED (Round 15)
- **Status**: fixed
- **Severity**: HIGH
- **Module**: frontend Traceability/index.tsx
- **First found**: Round 15
- **Problem**: useEffect fetch had no loading flag or error state — page rendered empty timeline with no feedback on loading or failure
- **Fix**: Added `loadingRecords` and `fetchError` states; timeline shows spinner while loading, error message on failure

## ISSUE-055: Donate page impact stats missing loading skeleton — FIXED (Round 15)
- **Status**: fixed
- **Severity**: HIGH
- **Module**: frontend Donate/index.tsx
- **First found**: Round 15
- **Problem**: `donation-stats` query had no loading indicator — counters rendered with fallback zeroes while data was still loading
- **Fix**: Added `statsLoading` from useQuery; counter section shows skeleton placeholders while loading

## ISSUE-056: Admin api.ts adapter functions use ~20 `any` types
- **Status**: open
- **Severity**: HIGH
- **Module**: admin src/services/api.ts
- **First found**: Round 15
- **Problem**: All adapter functions (adaptPaginated, adaptCampaign, adaptAdminProduct, adaptSupplyChainRecord, adaptDonation, adaptUser) accept `item: any` with no runtime validation — API shape changes silently produce undefined values
- **Notes**: Attempted `Record<string, unknown>` in Round 16 but caused ~40 type errors (every property access returns `unknown`). Reverted to `any` — the adapter pattern inherently needs permissive input types. Partial fix: payment method `as any` casts replaced with `PaymentMethodConfig` type (Fix 47). Full fix requires creating raw API response interfaces for each entity, which is a large refactor.

## ISSUE-057: ProductDetail shows loading text on query error — FIXED (Round 16)
- **Status**: fixed
- **Severity**: LOW
- **Module**: frontend ProductDetail.tsx
- **First found**: Round 16
- **Problem**: useQuery only extracted `isLoading` — on error, `product` was undefined and `!product` branch showed misleading loading text forever
- **Fix**: Added `isError` check with error message before loading check

## ISSUE-058: SupplyChainStudio shows "no records" on query error — FIXED (Round 16)
- **Status**: fixed
- **Severity**: LOW
- **Module**: frontend SupplyChainStudio/index.tsx
- **First found**: Round 16
- **Problem**: useQuery only extracted `isLoading` — on error, `records` defaulted to empty array, showing "no records" instead of error message
- **Fix**: Added `isError: recordsError` and error message in rendering chain

## ISSUE-059: AiDesign shows "no drafts" on query error — FIXED (Round 16)
- **Status**: fixed
- **Severity**: LOW
- **Module**: frontend AiDesign/index.tsx
- **First found**: Round 16
- **Problem**: useQuery only extracted `isLoading` — on error, `drafts` defaulted to empty array, showing "no drafts" instead of error message
- **Fix**: Added `isError: draftsError` and error branch in ternary chain

## ISSUE-060: ArtworkSubmit + SubmitArtwork mutations missing onError — FIXED (Round 19)
- **Status**: fixed
- **Severity**: LOW
- **Module**: frontend ArtworkSubmit/index.tsx, SubmitArtwork/index.tsx
- **First found**: Round 19
- **Problem**: Both artwork submission mutations had onSuccess but no onError — on API failure, user got no feedback
- **Fix**: Added onError callback using getErrorMessage utility to extract server detail and show toast

## ISSUE-061: Frontend form label/input associations missing htmlFor/id — FIXED (Round 19)
- **Status**: fixed
- **Severity**: LOW
- **Module**: frontend Register, Profile, Checkout, ImpactShop
- **First found**: Round 19
- **Problem**: 16 form fields across 4 pages had <label> without htmlFor and <input> without id — screen readers couldn't associate labels with inputs
- **Fix**: Added matching htmlFor/id pairs to all 16 fields; added aria-label to ImpactShop campaign filter select

## ISSUE-062: Backend forgot-password missing from rate limit list — FIXED (Round 19)
- **Status**: fixed
- **Severity**: MEDIUM
- **Module**: backend app/deps.py
- **First found**: Round 19
- **Problem**: /api/v1/auth/forgot-password was not in public_endpoints rate limit list — password reset requests had no per-IP throttling
- **Fix**: Added both legacy and v1 forgot-password paths to public_endpoints list (20 req/min per IP)

## ISSUE-063: Frontend mutations use generic error strings instead of server detail
- **Status**: open
- **Severity**: LOW
- **Module**: frontend various pages
- **First found**: Round 19
- **Problem**: 8 frontend mutations (CampaignDetail donate, ArtworkDetail vote, Donate page, etc.) use generic i18n strings like "Failed to donate" in onError instead of extracting server detail via getErrorMessage
- **Notes**: Functional — user sees an error message. But discards potentially useful server error detail. Low priority since error messages are already user-facing.

## ISSUE-064: Admin Modal.tsx missing focus management and focus trap — FIXED (Round 20)
- **Status**: fixed
- **Severity**: HIGH
- **Module**: admin src/components/ui/Modal.tsx
- **First found**: Round 20
- **Problem**: Shared Modal component had no focus management (focus not moved into dialog on open, not returned to trigger on close), no focus trap (Tab escapes to background), no tabIndex on dialog div — affects all 9 modals across 6 pages
- **Fix**: Added useRef for dialog/trigger, tabIndex={-1}, focus dialog on open, save/restore activeElement, Tab/Shift+Tab focus trap

## ISSUE-065: Frontend Toaster missing aria-live — FIXED (Round 20)
- **Status**: fixed
- **Severity**: MEDIUM
- **Module**: frontend App.tsx
- **First found**: Round 20
- **Problem**: <Toaster> had no ariaProps — toast messages not announced to screen readers
- **Fix**: Added default ariaProps (role="status", aria-live="polite") and error-specific ariaProps (role="alert", aria-live="assertive")

## ISSUE-066: CartDrawer missing Escape key handler — FIXED (Round 20)
- **Status**: fixed
- **Severity**: LOW
- **Module**: frontend CartDrawer.tsx
- **First found**: Round 20
- **Problem**: CartDrawer had no Escape key listener — keyboard users could only close by clicking
- **Fix**: Added useEffect with keydown listener for Escape

## ISSUE-067: Backend health endpoint always returns HTTP 200 — FIXED (Round 20)
- **Status**: fixed
- **Severity**: MEDIUM
- **Module**: backend app/main.py
- **First found**: Round 20
- **Problem**: Health endpoint returned HTTP 200 even when database/Redis was unhealthy — monitoring tools wouldn't detect degradation
- **Fix**: Return JSONResponse with status_code=503 when status is "degraded"

## ISSUE-068: Frontend zh.json broken JSON syntax — FIXED (Round 20)
- **Status**: fixed
- **Severity**: MEDIUM
- **Module**: frontend src/i18n/zh.json
- **First found**: Round 20
- **Problem**: Unescaped ASCII double-quote characters in "futureAndDreams" subtitle/description values would cause JSON.parse failures in strict parsers
- **Fix**: Replaced "未来科技" with 「未来科技」 (Chinese quotation marks)

## ISSUE-069: Frontend overlay components missing focus trap (CartDrawer, MobileNav, AiDesign, AIAssistantBall)
- **Status**: open
- **Severity**: LOW
- **Module**: frontend various components
- **First found**: Round 20
- **Problem**: CartDrawer, MobileNav, AiDesign modal, and AIAssistantBall chat panel are missing focus trap implementation — Tab can escape to background content
- **Notes**: Admin Modal.tsx now has a working focus trap pattern that can be replicated. These are lower priority since they're individual frontend components, not a shared component affecting many pages.
