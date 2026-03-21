# Changelog

All notable changes to the Tonghua Public Welfare x Sustainable Fashion project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Fixed

- **ArtworkDetail.tsx**: Fixed infinite re-render loop caused by data fetching in render body. Moved to proper `useEffect` pattern with cleanup.
- **ProductDetail.tsx**: Fixed React Rules of Hooks violation (`useState` inside `.map()`). Extracted `ThumbnailButton` as a separate component. Added `useParams` + API data fetching with mock fallback (was hardcoded `MOCK_PRODUCT`).
- **CampaignDetail.tsx**: Added `useParams` + `useEffect` API data fetching with `snake_case` to `camelCase` field mapping. Previously ignored route params entirely.
- **Backend - artworks.py**: Added authentication (`Depends(get_current_user)`) to `PUT /artworks/{artwork_id}` and `DELETE /artworks/{artwork_id}` endpoints. Previously these mutation endpoints had no auth guard.
- **Backend - products.py**: Added authentication with role check (`Depends(require_role("admin","editor"))`) to `POST /products` and `PUT /products/{product_id}` endpoints.

### Added

- **Profile page**: Enhanced with order history and donation history tabs. Fetches from `ordersApi.getMyOrders()` and `donationsApi.getMyDonations()`. Tab switcher with editorial styling.
- **Backend - contact.py**: New contact form submission endpoint (`POST /contact`, `GET /contact/messages`). Registered in `main.py`.

### Removed

- **Dead code cleanup**: Removed 8 dead barrel files (`HomePage.tsx`, `AboutPage.tsx`, etc.) that only re-exported from subdirectories.
