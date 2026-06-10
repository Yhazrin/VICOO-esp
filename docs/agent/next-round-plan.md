# Next Round Plan

## Highest Priority
1. Start frontend dev server (port 9111) and verify proxy to backend works
2. Check browser rendering of key pages: Home, Shop, ProductDetail, ImpactShop
3. Verify cart drawer interaction (add/remove items, quantity changes)
4. Check admin panel rendering: Dashboard, Products list, Orders list
5. Verify OAuth login flow works with new CSRF state validation

## Must Re-verify
1. All Round 1-18 fixes still work
2. Order creation flow works end-to-end through the frontend UI
3. Admin product CRUD through the UI (not just API)
4. SettingsPage shows error message and retry button on backend 500 (Fix 28)
5. Artwork submission invalidates artwork lists on Stories/Vote pages (Fix 29)
6. Campaign donate updates donation stats on Donate page (Fix 32)
7. Artwork vote updates featured artworks list on Vote page (Fix 32)
8. Admin DonationPage payment filter resets to page 1 (Fix 33)
9. Campaign/donation/supply_chain updates only modify allowed fields (Fix 30)
10. AI moderation now fails closed instead of fail-open (Fix 31)
11. Admin action buttons show loading spinner during mutation (Fix 34)
12. Backend orders.py no longer leaks str(e) even in DEBUG mode (Fix 35)
13. Backend payment_service.py no longer leaks httpx error details (Fix 36)
14. Admin LoginPage shows spinner during login (Fix 37)
15. ArtworkDetail vote button shows loading state (Fix 38)
16. ProductPage supply chain node form validates required fields (Fix 39)
17. SettingsPage validates siteName and contactEmail (Fix 40)
18. Admin 4 pages error toasts extract server detail (Fix 41)
19. Traceability page shows loading spinner and error message (Fix 42)
20. Donate page shows skeleton while stats load (Fix 43)
21. ProductDetail shows error message on query failure (Fix 44)
22. SupplyChainStudio shows error on query failure (Fix 45)
23. AiDesign shows error on query failure (Fix 46)
24. Admin api.ts payment methods use typed assertion (Fix 47)
25. Admin 9 list pages show error banner with retry on fetch failure (Fix 48)
26. DataTable shows contextual empty messages (Fix 49)
27. Form required field labels show `*` indicator (Fix 50)
28. Checkout payment modal shows countdown timer (Fix 51)
29. Admin form inputs have `aria-required` attribute (Fix 52)
30. ArtworkSubmit/SubmitArtwork show toast on mutation error (Fix 53)
31. Register/Profile/Checkout/ImpactShop form labels have htmlFor/id (Fix 54)
32. Backend forgot-password has rate limiting (Fix 55)
33. Admin Modal.tsx has focus management and focus trap (Fix 56)
34. Frontend Toaster has aria-live for screen readers (Fix 57)
35. CartDrawer closes on Escape key (Fix 58)
36. Backend health endpoint returns 503 when degraded (Fix 59)
37. Frontend zh.json has valid JSON syntax (Fix 60)

## Do Not Waste Time On
1. MagazineNav — unused component
2. MaterialTrace — orphaned page, not referenced
3. AI Assistant 503 — external API issue, not fixable in code
4. Backend test file lock — Windows-specific, not a code issue
5. Admin bundle size — cosmetic warning
6. Redis health — expected in local dev
7. ClothingIntakeForm photos — needs backend change, out of scope
8. Checkout silent catches — intentional design (don't block order flow)
9. Backend settings PUT arbitrary keys — admin-only, low risk
10. External image URLs (Unsplash/Picsum) — hosting strategy decision, not code fix
11. admin.py batch_moderate bare list params — design limitation, admin-only
12. oauth.py access tokens in redirect query params — design limitation
13. Backend IDOR in service layer (order, payment, user) — mitigated by router-level auth checks
14. Backend missing try/except in services — mitigated by router-level error handling
15. ~~Admin list pages missing isError state (ISSUE-041)~~ — FIXED (Round 17)
16. ArtworkPage sort columns (ISSUE-044) — requires backend sort support, not a frontend-only fix
17. DonationPage export limited to current page (ISSUE-045) — design limitation

## New Areas to Investigate
1. Verify that the new i18n keys render correctly in both languages on actual pages
2. Check if any frontend pages have broken image fallbacks (picsum.photos unreachable)
3. Verify the SupplyChainStudio 3D page renders without WebGL errors
4. Verify that all admin CRUD operations work end-to-end through the UI
5. Add TypeScript interfaces for admin api.ts adapter functions (ISSUE-056)
6. Check if admin DataTable hover/row-click states work correctly after isError changes
7. ~~Audit frontend pages for missing label/input associations (htmlFor/id)~~ — DONE (Round 19)
8. ~~Check if admin pages have consistent focus management in modals~~ — DONE (Round 20, Modal.tsx has focus trap)
9. ~~Verify that frontend mutation onError handlers show specific error details~~ — DONE (Round 19, remaining 8 use generic strings — ISSUE-063)
10. ~~Audit backend routers for missing rate limiting on expensive endpoints~~ — DONE (Round 19, forgot-password fixed, rest is LOW priority)
11. ~~Check if frontend toast notifications are accessible (role="status" / aria-live)~~ — DONE (Round 20)
12. ~~Verify that admin modal close buttons have aria-label~~ — DONE (Round 20, already had aria-label)
13. ~~Audit frontend pages for keyboard navigation completeness (tab order, focus trap in modals)~~ — DONE (Round 20, CartDrawer Escape fixed; focus traps noted as ISSUE-069)
14. ~~Check if backend health endpoint returns proper status codes for monitoring~~ — DONE (Round 20, now returns 503)
15. Add focus traps to frontend overlay components (CartDrawer, MobileNav, AiDesign, AIAssistantBall) — ISSUE-069
16. Check if admin pages have proper heading hierarchy (h1 → h2 → h3)
17. Audit frontend for missing skip-to-content link
18. Check if backend API responses have consistent pagination envelope across all list endpoints
