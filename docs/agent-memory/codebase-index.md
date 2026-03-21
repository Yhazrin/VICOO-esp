# Codebase Index

> Auto-maintained by agent loop. Last updated: 2026-03-21

## Frontend Pages (18 total)

| Page | Path | File | Editorial Rating | Key Components |
|------|------|------|-----------------|----------------|
| Home | `/` | `pages/Home/index.tsx` | ⭐⭐⭐⭐⭐ | EditorialHero, MagazineNav, StoryQuoteBlock, SepiaImageFrame, ScrollPathDraw |
| About | `/about` | `pages/About/index.tsx` | ⭐⭐⭐⭐⭐ | EditorialHero, NumberedSectionHeading, StoryQuoteBlock, SepiaImageFrame, ScrollPathDrawInline, TeamMemberCard |
| Campaigns | `/campaigns` | `pages/Campaigns/index.tsx` | ⭐⭐⭐⭐ | EditorialHero, SepiaImageFrame |
| CampaignDetail | `/campaigns/:id` | `pages/CampaignDetail/index.tsx` | ⭐⭐⭐ | SepiaImageFrame, useParams + useEffect fetch |
| Stories | `/stories` | `pages/Stories/index.tsx` | ⭐⭐⭐⭐ | EditorialHero, SepiaImageFrame |
| ArtworkDetail | `/artworks/:id` | `pages/ArtworkDetail/index.tsx` | ⭐⭐⭐ | SepiaImageFrame, useParams + useEffect fetch |
| Donate | `/donate` | `pages/Donate/index.tsx` | ⭐⭐⭐⭐ | EditorialHero, DonationStoryCard, DonationPanel |
| Shop | `/shop` | `pages/Shop/index.tsx` | ⭐⭐⭐⭐ | EditorialHero, SepiaImageFrame |
| ProductDetail | `/shop/:id` | `pages/ProductDetail/index.tsx` | ⭐⭐⭐⭐ | SepiaImageFrame, ThumbnailButton (extracted) |
| Traceability | `/traceability` | `pages/Traceability/index.tsx` | ⭐⭐⭐⭐⭐ | EditorialHero, TraceabilityTimeline, AnimatedCounter (reduced-motion guard) |
| Contact | `/contact` | `pages/Contact/index.tsx` | ⭐⭐⭐⭐⭐ | EditorialHero, FAQAccordion, StoryQuoteBlock, ScrollPathDrawInline, VintageInput, ContactInfoCard |
| Login | `/login` | `pages/Login/index.tsx` | ⭐⭐⭐⭐ | PaperTextureBackground, MagazineDivider, VintageInput, GrainOverlay |
| Register | `/register` | `pages/Register/index.tsx` | ⭐⭐⭐⭐ | PaperTextureBackground, MagazineDivider, VintageInput, GrainOverlay |
| Profile | `/profile` | `pages/Profile/index.tsx` | ⭐⭐⭐⭐ | GrainOverlay, MagazineDivider, EditorialCard, PaperTextureBackground |
| Privacy | `/privacy` | `pages/Privacy.tsx` | ⭐⭐⭐⭐ | PaperTextureBackground, GrainOverlay, NumberedSectionHeading, MagazineDivider, corner accents |
| Terms | `/terms` | `pages/Terms.tsx` | ⭐⭐⭐⭐ | PaperTextureBackground, GrainOverlay, NumberedSectionHeading, MagazineDivider, corner accents |
| Children Safety | `/children-safety` | `pages/ChildrenSafety.tsx` | ⭐⭐⭐⭐ | PaperTextureBackground, GrainOverlay, NumberedSectionHeading, MagazineDivider, corner accents |
| NotFound | `*` | `pages/NotFound/index.tsx` | ⭐⭐⭐⭐ | PaperTextureBackground, GrainOverlay, entrance animation, corner accents |

## Editorial Components (19 total)

| Component | File | Used In |
|-----------|------|---------|
| EditorialHero | `components/editorial/EditorialHero.tsx` | Home, About, Campaigns, Stories, Donate, Shop, Traceability, Contact |
| MagazineNav | `components/editorial/MagazineNav.tsx` | Home |
| NumberedSectionHeading | `components/editorial/NumberedSectionHeading.tsx` | About, Privacy, Terms, ChildrenSafety, Contact |
| BleedTitleBlock | `components/editorial/BleedTitleBlock.tsx` | — |
| SepiaImageFrame | `components/editorial/SepiaImageFrame.tsx` | About, Campaigns, Stories, Shop, Contact, ProductDetail |
| PaperTextureBackground | `components/editorial/PaperTextureBackground.tsx` | Login, Register, Profile, Privacy, Terms, ChildrenSafety, NotFound |
| GrainOverlay | `components/editorial/GrainOverlay.tsx` | Login, Register, Profile, Privacy, Terms, ChildrenSafety, NotFound, Contact |
| StoryQuoteBlock | `components/editorial/StoryQuoteBlock.tsx` | About, Contact |
| DonationPanel | `components/editorial/DonationPanel.tsx` | Donate |
| DonationStoryCard | `components/editorial/DonationStoryCard.tsx` | Donate |
| TraceabilityTimeline | `components/editorial/TraceabilityTimeline.tsx` | Traceability |
| EditorialFooter | `components/layout/EditorialFooter.tsx` | Layout (global) |
| EditorialCard | `components/editorial/EditorialCard.tsx` | Profile |
| MagazineDivider | `components/editorial/MagazineDivider.tsx` | Login, Register, Profile, Privacy, Terms, ChildrenSafety |
| FAQAccordion | `components/editorial/FAQAccordion.tsx` | Contact |
| VintageInput | `components/editorial/VintageInput.tsx` | Login, Register, Contact |
| ImageSkeleton | `components/editorial/ImageSkeleton.tsx` | About |
| ErrorBoundary | `components/editorial/ErrorBoundary.tsx` | App (global) |
| ScrollPathDraw / ScrollPathDrawInline | `components/animations/ScrollPathDraw.tsx` | About, Contact |

## Animation Components (9 total)

| Component | File | Status |
|-----------|------|--------|
| ScrollPathDraw | `components/animations/ScrollPathDraw.tsx` | Used |
| OrigamiFold | `components/animations/OrigamiFold.tsx` | Used (footer) |
| FlipPageTransition | `components/transitions/FlipPageTransition.tsx` | Used (App) |
| AnimatedCounter | inline in Traceability | Used |
| ParallaxScroll | `components/animations/ParallaxScroll.tsx` | Unknown |
| MagneticButton | `components/animations/MagneticButton.tsx` | Unknown |
| PageLoadSequence | `components/animations/PageLoadSequence.tsx` | Unknown |
| ScrollReveal | `components/animations/ScrollReveal.tsx` | Unknown |
| TextScramble | `components/animations/TextScramble.tsx` | Unknown |

## Tailwind Config

- Color tokens: 36 total (19 base + 17 added from tokens.css)
- Font families: `display` (Playfair Display), `body` (IBM Plex Mono), `mono`
- Key design tokens: `ink`, `paper`, `aged-stock`, `sepia-*`, `rust`, `pale-gold`, `warm-gray`

## Backend API Endpoints

| Router | Endpoints | Auth |
|--------|-----------|------|
| auth | POST /auth/login, POST /auth/register, GET /auth/me | JWT |
| users | GET /users/me, PUT /users/me | JWT |
| artworks | CRUD + GET /artworks/featured, PUT /artworks/{id}/status (admin) | Mixed |
| campaigns | CRUD + GET /campaigns/featured | Public |
| donations | POST /donations, GET /donations/tiers, GET /donations/mine | Mixed |
| products | CRUD + GET /products/featured | Mixed |
| orders | POST /orders, GET /orders/mine, POST /orders/{id}/cancel | JWT |
| contact | POST /contact, GET /contact/messages (admin) | Mixed |
