# Tonghua Public Welfare · Sustainable Fashion Project
## Comprehensive Technical & Design Planning Document

> *A cross-platform initiative uniting children's artwork, sustainable fashion, and transparent philanthropy — built for global audiences, grounded in editorial integrity.*

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Product Architecture](#2-product-architecture)
3. [Technical Stack](#3-technical-stack)
4. [React Web Platform — Strategic Vision](#4-react-web-platform--strategic-vision)
5. [Visual Design System](#5-visual-design-system)
6. [Page-by-Page Specifications](#6-page-by-page-specifications)
7. [Component & Design Token System](#7-component--design-token-system)
8. [Backend Architecture & API Design](#8-backend-architecture--api-design)
9. [Security & Compliance Framework](#9-security--compliance-framework)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Project Directory Structure](#11-project-directory-structure)
12. [Deliverables & Validation Criteria](#12-deliverables--validation-criteria)

---

## 1. Project Overview

### 1.1 Core Identity

| Field | Detail |
|---|---|
| **Project Name** | Tonghua Public Welfare · Sustainable Fashion Project（童画公益·可持续时尚） |
| **Platform Types** | WeChat Mini Program · Android App · React Web · Backend API |
| **Core Business** | Children's artwork collection · Sustainable fashion product sales · Supply chain traceability |
| **Security Level** | **HIGH** — Involves children's personal data, donation funds, and payment transactions |
| **Primary Audience** | Domestic users (Mini Program / Android) + International visitors (React Web) |

### 1.2 Mission Statement

To build a trusted, warm, and cross-platform ecosystem that transforms children's creative expressions into sustainable fashion artifacts — enabling public welfare participation, supply chain transparency, and international cultural storytelling.

### 1.3 Key Design Philosophy

> The React web platform is not a standard SaaS product. It is a **public welfare editorial publication**, designed with the visual language of 1990s printed magazines — humanistic, tactile, literary, and archival.

This distinction must be maintained across **every page**, not just the homepage. The visual identity is the brand.

---

## 2. Product Architecture

### 2.1 Platform Overview

```
┌─────────────────────────────────────────────────────┐
│                  TONGHUA PLATFORM                    │
├───────────────┬──────────────┬──────────────────────┤
│ WeChat Mini   │   Android    │    React Web          │
│  Program      │     App      │    (English / Intl.)  │
│               │              │                       │
│ • Activities  │ • User Hub   │ • Brand Narrative     │
│ • Artwork     │ • Orders     │ • Donation Portal     │
│   Upload      │ • Welfare    │ • Shop & Stories      │
│ • Voting      │   Feed       │ • Traceability        │
│ • Donations   │ • Content    │ • International PR    │
│ • Shopping    │   Browse     │                       │
└───────┬───────┴──────┬───────┴───────────┬──────────┘
        │              │                   │
        └──────────────▼───────────────────┘
                  Backend API Layer
        ┌─────────────────────────────────────┐
        │  Gateway · Auth · Artwork · Donation│
        │  Product · Payment · Supply Chain   │
        │  Admin · Compliance                 │
        └─────────────────────────────────────┘
```

### 2.2 User Roles

| Role | Permissions |
|---|---|
| Anonymous Visitor | Browse public content, view artworks and campaigns |
| Registered User | Upload artworks, vote, participate in campaigns |
| Donor | Donation history, certificates, impact tracking |
| Product Buyer | Shopping cart, orders, delivery tracking |
| Child Participant & Guardian | Artwork submissions with consent flow |
| Content Reviewer | Artwork moderation, content audit queue |
| Operations Manager | Campaign config, activity management |
| Legal / Compliance Officer | Compliance review, policy management |
| Super Administrator | Full system access, role management |

---

## 3. Technical Stack

### 3.1 Full Stack Technology Decisions

| Layer | Technology | Rationale |
|---|---|---|
| **Mini Program** | Native WeChat + Taro | Native WeChat ecosystem support, domestic activity participation |
| **React Web** | React 18 + Vite + TypeScript | High-performance SPA for international editorial experience |
| **State Management** | Zustand | Lightweight, scalable, TypeScript-native |
| **Routing** | React Router v6 | Declarative routing with nested layout support |
| **Styling** | Tailwind CSS + CSS Modules | Utility-first with component-scoped magazine layout control |
| **Animation** | Framer Motion | Page transitions, editorial motion design |
| **Data Fetching** | TanStack Query + Axios | Caching, background sync, optimistic updates |
| **Internationalization** | react-i18next | EN primary, CN secondary |
| **Content** | Headless CMS / Markdown | Editorial flexibility, content-developer separation |
| **Android** | Kotlin + Jetpack Compose | Modern declarative UI, maintainable architecture |
| **Backend** | FastAPI (Python 3.11) | Async-first, high performance, easy API decomposition |
| **Primary Database** | MySQL 8.0 | Relational integrity for transactions and consent records |
| **Cache / Sessions** | Redis 7 | Rate limiting, session management, real-time counts |
| **Message Queue** | RabbitMQ | Async tasks: notifications, audit workflows, payment callbacks |
| **Object Storage** | Alibaba Cloud OSS / Tencent COS | Artwork images, certificates, campaign assets |
| **API Gateway** | FastAPI + Uvicorn | Auth, rate limiting, HMAC signature verification |
| **Containers** | Docker + Docker Compose | Consistent dev-to-prod environment |
| **CI/CD** | GitHub Actions / GitLab CI | Automated build, test, and deploy pipelines |

### 3.2 Payment Gateway Integration

| Gateway | Use Case | Notes |
|---|---|---|
| **WeChat Pay** | Domestic Mini Program payments | Requires merchant account |
| **Alipay** | Domestic H5 / Android payments | Requires merchant account |
| **Stripe** | International donations via React Web | Preferred for global charitable giving |
| **PayPal** | International fallback | Optional integration |

> ⚠️ All payment gateways must be tested in sandbox mode before live deployment. Merchant credentials and legal compliance must be verified prior to launch.

### 3.3 Microservice Architecture

```
gateway-service          ← API security, rate limiting, HMAC verification
├── user-service         ← Auth, authorization, profiles, role management
├── artwork-service      ← Upload, campaigns, voting, comments, audit workflow
├── donation-service     ← Donations, certificates, fund tracking
├── product-service      ← Products, cart, orders, inventory
├── supply-chain-service ← Materials, production records, logistics, traceability
├── payment-service      ← Orders, callbacks, reconciliation, risk control
└── admin-service        ← Audit, campaign config, analytics, permissions
```

### 3.4 Core Database Schema

```sql
-- User accounts
users (id, openid, phone_encrypted, role, created_at)

-- Child participant data — highest sensitivity, separately encrypted
child_participants (
  id, encrypted_name, encrypted_id_card,
  display_name, encrypted_school,
  artwork_ids, consent_status
)

-- Artwork submissions
artworks (id, child_id, image_url, description, vote_count, status)

-- Donation records
donations (id, user_id, amount, payment_status, donation_certificate_url)

-- Product orders
orders (id, user_id, product_id, amount, status, supply_chain_id)

-- Supply chain traceability
supply_chain_records (
  id, product_id, raw_material_source,
  production_date, logistics_info, blockchain_hash
)
```

---

## 4. React Web Platform — Strategic Vision

### 4.1 Platform Role

The React web platform is the **international public welfare narrative hub** — not a mobile H5 or an enterprise portal. Its primary responsibilities:

- Present the project's vision, welfare stories, and brand ethos to **international audiences in English**
- Show how children's artworks are transformed into sustainable fashion goods and charitable action
- Provide a donation portal, campaign showcase, and impact dashboard
- Narrate the supply chain sustainability story and product traceability
- Serve as a permanent exhibition space for media, partners, and brand collaborations

### 4.2 Frontend Architecture

```
frontend/web/
├── public/
│   ├── textures/        ← Paper grain, aged stock textures
│   ├── grain/           ← Noise overlays (SVG or PNG)
│   └── images/          ← Brand photography, editorial imagery
├── src/
│   ├── app/             ← Root layout, providers, router config
│   ├── pages/
│   │   ├── Home/
│   │   ├── About/
│   │   ├── Campaigns/
│   │   ├── Stories/
│   │   ├── Donate/
│   │   ├── Shop/
│   │   ├── Traceability/
│   │   └── Contact/
│   ├── components/
│   │   ├── layout/      ← Page wrappers, section containers
│   │   ├── editorial/   ← Hero, quote blocks, story modules
│   │   ├── navigation/  ← Magazine-style nav, numbered items
│   │   ├── transitions/ ← Page flip animations
│   │   └── common/      ← Buttons, inputs, shared UI
│   ├── styles/
│   │   ├── tokens.css   ← Design tokens: colors, spacing, fonts
│   │   ├── global.css   ← Base resets and global rules
│   │   ├── textures.css ← Paper and grain effects
│   │   └── typography.css ← Type scale, editorial hierarchy
│   ├── hooks/           ← Custom React hooks
│   ├── store/           ← Zustand state stores
│   ├── services/        ← API service functions
│   ├── utils/           ← Helpers, formatters
│   └── i18n/            ← Translation files (EN primary, CN secondary)
└── package.json
```

---

## 5. Visual Design System

### 5.1 Aesthetic Direction

> **Core brief:** 1990s printed magazine aesthetics applied to a contemporary public welfare website. Every page should feel like an issue of a thoughtful, independent journal — not a corporate charity portal or a SaaS product.

**Design keywords:**

`Editorial` · `Print-Inspired` · `Humanistic` · `Warm` · `Literary` · `Asymmetrical` · `Tactile` · `Archival` · `Public-Interest Storytelling`

---

### 5.2 Master Style Guide Prompt

> *This prompt serves as the binding creative specification for all designers, developers, and generative tools working on the React web platform.*

---

Create a site-wide visual style for an English public welfare website in a 1990s printed magazine aesthetic. Apply this design language consistently across all pages, including homepage, about, campaigns, stories, donation, contact, shop, traceability, and any subpages.

Use elegant serif headlines such as **Playfair Display**, paired with monospaced body text such as **IBM Plex Mono**. Build every page with magazine-like multi-column grid layouts with **uneven column widths** to create an authentic print composition. Maintain generous negative space, asymmetrical alignment, and layered editorial hierarchy throughout the entire site.

Headlines should feel oversized and expressive, sometimes shifted left beyond the viewport edge to evoke print bleed and cropped magazine covers. All imagery should use a subtle **sepia filter around 0.2 intensity**, combined with soft grain or noise overlays to imitate aged printed photographs.

Backgrounds should feature a delicate **paper texture**, giving every page the feeling of being printed on warm, slightly worn stock. Page transitions should resemble the sensation of **turning pages** in a magazine or book, with soft layered movement and tactile editorial flow — not sleek digital motion.

Navigation should be styled like a **magazine table of contents**, with numbered items such as `01`, `02`, `03` before each label. On hover, the numbers should enlarge and become more visually dominant.

Keep the overall mood **thoughtful, poetic, humanistic, and culturally refined**. The website should feel like a public welfare editorial publication, not a corporate charity website. Ensure this visual identity is preserved consistently on every page so the entire experience reads as one cohesive print-inspired publication.

---

### 5.3 Typography System

| Role | Font Family | Usage |
|---|---|---|
| **Display / Headlines** | Playfair Display | Hero text, section headings, cover-style titles |
| **Body / Editorial** | IBM Plex Mono | Article body, captions, narrative paragraphs |
| **Functional UI** | Inter / Source Sans Pro | Buttons, form labels, navigation secondary text |

**Type Scale Principles:**
- Display headlines: 96px–120px at desktop, allowing bleed overflow
- Section headings: 48px–72px, asymmetrically positioned
- Body text: 14px–16px with generous line-height (1.8–2.0)
- Captions: 11px–12px monospaced, styled like photo credits

### 5.4 Color Palette

```css
:root {
  /* Backgrounds */
  --color-paper:        #F5F0E8;  /* Warm paper white */
  --color-aged-stock:   #EDE6D6;  /* Lightly worn page */
  --color-warm-gray:    #D4CFC4;  /* Dividers, muted areas */

  /* Foregrounds */
  --color-ink:          #1A1A16;  /* Deep editorial black */
  --color-ink-faded:    #4A4540;  /* Secondary text */
  --color-sepia-mid:    #7A6A58;  /* Photo credit, dates */

  /* Accents */
  --color-rust:         #8B3A2A;  /* Rare accent, pull quotes */
  --color-archive-brown:#5C4033;  /* Headlines, dominant accent */
  --color-pale-gold:    #C4A45A;  /* Subtle highlight */

  /* Functional */
  --color-link:         #8B3A2A;
  --color-focus:        #5C4033;
}
```

### 5.5 Layout System

**Grid Philosophy:**
- Magazine-style CSS Grid with **unequal column widths** (e.g., `3fr 2fr`, `7fr 3fr`, `2fr 5fr 3fr`)
- Mechanical symmetry is avoided; every spread has editorial intention
- Large headlines may overflow their column boundary intentionally
- Some elements extend beyond the content area to simulate print bleed
- Content hierarchy follows editorial logic: narrative → image → supporting detail

**Responsive Breakpoints:**
- Mobile: single-column, scaled editorial hierarchy
- Tablet: two-column with reduced oversized title treatment
- Desktop: full editorial grid with bleed titles and asymmetric composition

### 5.6 Image Treatment Rules

All images must follow these rendering rules without exception:

```css
.editorial-image {
  filter: sepia(0.2) contrast(1.05) brightness(0.97);
}

.grain-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url('/textures/grain.png');
  opacity: 0.08;
  mix-blend-mode: multiply;
  pointer-events: none;
}
```

- **No high-saturation photography** — all imagery should feel archival
- **No pure white backgrounds** behind images — always paper-toned
- **Photo credits** rendered in small monospaced text below or beside images

### 5.7 Motion & Animation System

| Context | Animation Approach |
|---|---|
| **Page Transitions** | Page-flip style: outgoing page fades and slides like a turned leaf; incoming page reveals with a slight delay and upward drift |
| **Section Entrances** | Slow, staggered fade-in with 40–60px upward drift. Delay increases per element |
| **Hover — Numbered Nav** | Number enlarges 1.4× scale with opacity fade-in; label text remains stable |
| **Hover — Headlines** | 2–4px leftward shift with subtle opacity change |
| **Hover — Images** | Grain overlay intensity increases slightly; sepia lifts marginally |
| **Scroll Reveals** | IntersectionObserver triggers — single, non-repeating, editorial-paced |

**Animation Principles:**
- All motion targets **reading experience and page-turning sensation**, never visual spectacle
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` for exits; `cubic-bezier(0, 0, 0.2, 1)` for entrances
- Duration: typically 600ms–900ms; never under 300ms for major transitions
- Framer Motion `AnimatePresence` for route-level transitions

### 5.8 Navigation Design

```
┌─────────────────────────────────────────────────────────┐
│  TONGHUA              01 Home  02 About  03 Campaigns   │
│  公益·可持续时尚        04 Stories  05 Donate  06 Shop    │
│                       07 Traceability  08 Contact       │
└─────────────────────────────────────────────────────────┘
```

**Interaction spec:**
- Numbers (`01`, `02`...) at `font-size: 0.75rem` at rest
- On hover: number scales to `1.1rem`, bold, color shifts to `--color-archive-brown`
- Active page: number remains enlarged, underline rule appears
- Mobile: collapses to hamburger with full-screen editorial overlay

---

## 6. Page-by-Page Specifications

### 6.1 Home

**Mission:** Establish brand identity and communicate the core trifecta — *children's art × public welfare × sustainable fashion* — within the first viewport.

**Modules:**

| Module | Description |
|---|---|
| **Editorial Hero** | Oversized serif headline, optionally bleeding left; brief mission statement in mono; full-bleed editorial image with grain overlay |
| **Mission Statement** | Single declarative sentence. Large, centered, archival tone |
| **Artwork × Product Showcase** | Asymmetric split: children's artwork on left, derived fashion product on right. Sepia-treated imagery |
| **Impact Summary Strip** | Key metrics (artworks collected, donations raised, products sold) in typographic display form — no charts |
| **Current Campaign CTA** | Editorial-style event listing with date, theme, participation link |
| **Donate Teaser** | Minimal — a number, a sentence, and a link |
| **Traceability Entry Point** | A single sentence + chain link icon guiding toward the supply chain story |

---

### 6.2 About

**Mission:** Explain project origins, methodology, and social value in editorial long-form.

**Modules:**

| Module | Description |
|---|---|
| **Origin Story** | Narrative editorial block — why this project was founded, by whom |
| **Why Children's Art?** | Pull quote + supporting body copy |
| **Why Sustainable Fashion?** | Policy context, material ethics, environmental reasoning |
| **How Welfare + Commerce Align** | Diagram or editorial layout showing the value flow |
| **Partners & Institutions** | Logo strip + brief descriptions, archival styling |

---

### 6.3 Campaigns

**Mission:** Archive and publicize all welfare artwork collection campaigns.

**Modules:**

| Module | Description |
|---|---|
| **Campaign Directory** | Numbered list styled as a magazine index (`Vol. 1`, `Vol. 2`...) |
| **Active Campaign Feature** | Full editorial spread: theme, call-to-participate, deadline countdown |
| **Participation Rules** | Timeline display in editorial column format |
| **Past Campaign Gallery** | Masonry or editorial grid of featured artworks, archivally treated |
| **Results & Impact** | Statistics presented as printed data pullouts |

---

### 6.4 Stories

**Mission:** Deepen emotional connection through editorial long-form storytelling.

**Modules:**

| Module | Description |
|---|---|
| **Children's Creation Stories** | Profile + story format. Display name only (no real name), artwork featured |
| **Design Transformation Narratives** | How a specific artwork became a fashion product — process story |
| **Volunteer & Partner Interviews** | Q&A or narrative portrait format |
| **Welfare Action Records** | Documentary-style event photography + editorial captions |
| **Long-form Feature Articles** | Single-topic deep dives, magazine layout with drop caps |

---

### 6.5 Donate

**Mission:** Convert international visitors into donors with transparency and dignity.

**Modules:**

| Module | Description |
|---|---|
| **Impact Statement** | What each donation tier enables — no corporate charity language |
| **Fund Transparency** | Explicit breakdown of how funds are allocated |
| **Donation Amount Selector** | Clean, editorial-styled amount selection (not a typical UI widget) |
| **Payment Methods** | Stripe (primary), PayPal (secondary). No WeChat/Alipay on English site |
| **Certificate Preview** | Sample donation certificate shown inline |
| **FAQ** | Collapsed accordion, archive-styled |

---

### 6.6 Shop

**Mission:** Present sustainable fashion products as an extension of the children's art story.

**Modules:**

| Module | Description |
|---|---|
| **Product Catalog** | Editorial grid, each product linked to its source artwork |
| **Product Story Pages** | Per-product editorial spread: the artwork, the child (display name), the product |
| **Materials & Sustainability** | Certifications, material sourcing, environmental credentials |
| **Cart & Order Flow** | Functional but styled consistently with editorial system |
| **Welfare Connection** | Clear statement per product: what portion supports the welfare program |

---

### 6.7 Traceability

**Mission:** Demonstrate supply chain transparency and make sustainability claims verifiable.

**Modules:**

| Module | Description |
|---|---|
| **Raw Material Origins** | Map or editorial layout showing where materials come from |
| **Production Process** | Step-by-step editorial timeline (not a flowchart) |
| **Logistics Nodes** | Key milestones from factory to delivery, archivally documented |
| **ESG / Sustainability Declaration** | Specific, verifiable claims. No vague greenwashing |
| **Blockchain Hash Reference** | Optional: per-product traceable supply chain hash |

> ⚠️ All traceability content must be **verifiably true**. Avoid generic ESG marketing language. Each claim should be traceable to a source or record.

---

### 6.8 Contact

**Mission:** Receive media, partnership, and volunteer inquiries with editorial warmth.

**Modules:**

| Module | Description |
|---|---|
| **Contact Form** | Name, email, inquiry type, message. Minimal and elegant |
| **Media Inquiries** | Dedicated media email address, press kit link |
| **Partnership Directions** | Brief editorial descriptions of collaboration types |
| **Volunteer Information** | How to get involved, what roles exist |
| **Social Media** | Minimal, typographic social links — no logo clusters |

---

## 7. Component & Design Token System

### 7.1 Core Component Library

| Component | Description |
|---|---|
| `EditorialHero` | Full-bleed hero with oversized serif headline, bleed-left title option, mission sub-line |
| `MagazineNav` | Numbered horizontal nav with hover scale animation on numbering |
| `NumberedSectionHeading` | Section header with `01`, `02`... prefix in editorial style |
| `BleedTitleBlock` | Headline component that allows controlled overflow beyond column boundary |
| `SepiaImageFrame` | Image wrapper applying sepia filter, grain overlay, and archival border treatment |
| `PaperTextureBackground` | Section wrapper with paper-stock texture applied via CSS |
| `GrainOverlay` | Pseudo-element grain layer applied over images or sections |
| `FlipPageTransition` | Framer Motion `AnimatePresence` wrapper for route-level page-turn transitions |
| `StoryQuoteBlock` | Pull quote component: oversized serif quote mark, body text, attribution |
| `DonationPanel` | Amount selector, Stripe integration, certificate preview |
| `TraceabilityTimeline` | Vertical editorial timeline for supply chain milestones |
| `EditorialFooter` | Magazine-style footer with issue-number styling, navigation, and legal links |
| `ArtworkCard` | Artwork display with display name, campaign tag, sepia treatment |
| `ProductCard` | Fashion product linked to source artwork, welfare contribution noted |
| `ImpactCounter` | Typographic display metric — no charts, pure typography |

### 7.2 Design Tokens Reference

```css
/* === SPACING === */
--space-xs:    4px;
--space-sm:    8px;
--space-md:    16px;
--space-lg:    32px;
--space-xl:    64px;
--space-2xl:   96px;
--space-3xl:   160px;

/* === TYPOGRAPHY === */
--font-display:  'Playfair Display', Georgia, serif;
--font-mono:     'IBM Plex Mono', 'Courier New', monospace;
--font-ui:       'Inter', 'Source Sans Pro', sans-serif;

--text-hero:     clamp(64px, 10vw, 120px);
--text-h1:       clamp(40px, 6vw, 72px);
--text-h2:       clamp(28px, 4vw, 48px);
--text-h3:       clamp(20px, 2.5vw, 32px);
--text-body:     16px;
--text-caption:  12px;
--text-label:    13px;

--leading-tight:  1.2;
--leading-editorial: 1.8;
--leading-body:  1.7;

/* === BORDERS === */
--border-rule:    1px solid var(--color-ink-faded);
--border-heavy:   2px solid var(--color-ink);
--border-decorative: 0.5px solid var(--color-sepia-mid);

/* === SHADOWS === */
/* Deliberately minimal — no modern UI card shadows */
--shadow-none:    none;
--shadow-press:   inset 0 1px 0 rgba(0,0,0,0.08);
```

---

## 8. Backend Architecture & API Design

### 8.1 API Design Principles

- All endpoints follow RESTful conventions with consistent response envelopes
- Versioning via URL prefix: `/api/v1/`
- Response format: `{ "success": bool, "data": {}, "error": null, "meta": {} }`
- All sensitive data excluded from API responses; use display-safe aliases

### 8.2 Key API Endpoints

```
Authentication
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

Artworks
GET    /api/v1/artworks
POST   /api/v1/artworks
GET    /api/v1/artworks/{id}
POST   /api/v1/artworks/{id}/vote
GET    /api/v1/artworks/{id}/status

Campaigns
GET    /api/v1/campaigns
GET    /api/v1/campaigns/active
GET    /api/v1/campaigns/{id}

Donations
POST   /api/v1/donations/initiate
GET    /api/v1/donations/{id}
GET    /api/v1/donations/{id}/certificate

Products
GET    /api/v1/products
GET    /api/v1/products/{id}
GET    /api/v1/products/{id}/traceability

Orders
POST   /api/v1/orders
GET    /api/v1/orders/{id}

Supply Chain
GET    /api/v1/supply-chain/{product_id}
GET    /api/v1/supply-chain/{product_id}/timeline

Payment
POST   /api/v1/payments/create
POST   /api/v1/payments/webhook/{provider}
```

### 8.3 Async Job Architecture (RabbitMQ)

| Queue | Purpose |
|---|---|
| `audit.artwork` | Newly submitted artwork triggers moderation review |
| `notification.donation` | Post-donation certificate generation and email |
| `payment.callback` | Payment gateway webhook processing |
| `consent.reminder` | Guardian consent follow-up notifications |
| `export.report` | Admin analytics report generation |

---

## 9. Security & Compliance Framework

### 9.1 Authentication & Authorization

```
Access Token:   JWT, 15-minute expiry, signed with RS256
Refresh Token:  7-day expiry, stored httpOnly cookie
Scope:          RBAC (role-based) + ABAC (attribute-based) combined
MFA:            Mandatory for all admin roles (TOTP or SMS)
```

### 9.2 Data Encryption

| Sensitivity Level | Data Types | Encryption |
|---|---|---|
| **Maximum** | National ID numbers, payment passwords | AES-256-GCM |
| **High** | Phone numbers, bank card numbers | AES-256-GCM |
| **Standard** | General user data | AES-256-CBC at rest |
| **Transport** | All network traffic | TLS 1.3 mandatory |

### 9.3 Child Information Protection

This is the highest-priority compliance domain in the entire project.

- All participants under 14 years old require **written guardian consent** before participation
- Child data is **stored in an isolated, separately encrypted schema**
- Access to child records requires **secondary approval workflow** — no single-person access
- Public display **must never expose**: real name, school name, home city, family context
- Display names are system-assigned or guardian-approved pseudonyms
- Data retention policy: child records are purged per statutory schedule
- Any breach or unauthorized access triggers mandatory escalation and notification

### 9.4 API Security Controls

| Control | Specification |
|---|---|
| **Global Rate Limit** | 1,000 requests/second |
| **Per-User Rate Limit** | 60 requests/minute |
| **Per-IP Rate Limit** | 20 requests/second |
| **Request Signing** | HMAC-SHA256 on all authenticated endpoints |
| **Input Validation** | Server-side schema validation on all inputs |
| **SQL Injection** | ORM-only queries, no raw SQL with user input |
| **XSS Protection** | Output encoding, Content-Security-Policy headers |
| **CORS** | Strict allowlist, no wildcard origins |

### 9.5 Payment & Philanthropy Compliance

- All domestic payments processed through licensed WeChat Pay / Alipay merchant accounts
- International donations via Stripe (primary) with full Stripe Radar fraud protection enabled
- Donation fund usage must be **publicly reported and verifiably traceable**
- Legal review required before launch for: Privacy Policy, Child Protection Policy, Donation Agreement
- Financial reconciliation reports generated monthly and available to compliance officer

---

## 10. Implementation Roadmap

### Phase 1 — Architecture & Design Foundation

*Priority: Critical · Parallelizable*

| # | Role | Deliverables | Est. Hours |
|---|---|---|---|
| 1 | Backend Architect | Technical architecture doc, API design, DB schema, microservice plan | 2h |
| 2 | Mini Program Developer | Mini Program structure, page flows, WeChat login integration | 1h |
| 3 | React Frontend Architect | Site architecture, routing system, component hierarchy, design system plan | 1.5h |
| 4 | Visual Designer | Full editorial style guide, page wireframes, asset specifications | 2h |

> All four roles execute in parallel.

---

### Phase 2 — Core Feature Development

*Priority: Critical · Sequential with parallelism*

| # | Role | Deliverables | Est. Hours |
|---|---|---|---|
| 5 | Security Engineer | JWT auth, RBAC+ABAC implementation, AES-256-GCM encryption, API security middleware | 2h |
| 6 | React Frontend Developer | Home, About, Stories, Donate, Shop, Traceability pages | 3h |
| 7 | Mini Program Developer | Core business feature development (upload, vote, donate, shop) | 3h |
| 8 | Backend Developer | User, artwork, donation, product, payment, supply chain APIs | 4h |
| 9 | Legal & Compliance Officer | Privacy policy, child protection compliance checklist, donation fund compliance | 1h |

> **Sequential logic:** Security foundation (Step 5) must precede all frontend/backend feature work. Legal review (Step 9) runs in parallel with development but gates final production deployment.

---

### Phase 3 — Testing, QA & Deployment

*Priority: High · Sequential after Phase 2*

| # | Role | Deliverables | Est. Hours |
|---|---|---|---|
| 10 | API Test Engineer | API test suite, security test scenarios, load testing | 1.5h |
| 11 | Frontend QA / UX Reviewer | Cross-platform visual review, interaction consistency, responsive adaptation | 1h |
| 12 | DevOps Engineer | CI/CD pipeline, Dockerfiles, staging + production deployment config | 1.5h |

---

### Pre-Launch Checklist

- [ ] All payments tested in sandbox mode (WeChat Pay, Alipay, Stripe)
- [ ] Child data protection audit completed by compliance officer
- [ ] Legal documents approved: Privacy Policy, Child Protection Policy, Donation Agreement
- [ ] Security penetration testing completed
- [ ] Load testing passed at target throughput
- [ ] Supply chain content reviewed for verifiable accuracy
- [ ] Editorial design consistency reviewed across all 8 pages
- [ ] Merchant credentials and payment compliance verified

---

## 11. Project Directory Structure

```
tonghua-project/
├── backend/
│   ├── gateway-service/
│   ├── user-service/
│   ├── artwork-service/
│   ├── donation-service/
│   ├── product-service/
│   ├── supply-chain-service/
│   ├── payment-service/
│   └── admin-service/
├── frontend/
│   ├── weapp/               ← WeChat Mini Program (Taro)
│   ├── web-react/           ← React editorial web platform
│   │   ├── public/
│   │   │   ├── textures/
│   │   │   ├── grain/
│   │   │   └── images/
│   │   └── src/
│   │       ├── app/
│   │       ├── pages/
│   │       ├── components/
│   │       ├── styles/
│   │       ├── hooks/
│   │       ├── store/
│   │       ├── services/
│   │       ├── utils/
│   │       └── i18n/
│   └── android/             ← Kotlin + Jetpack Compose
├── admin/                   ← Internal management dashboard
├── deploy/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   └── Dockerfiles/
│   └── k8s/                 ← Kubernetes configs for production
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── design-system/
│   └── security/
└── tests/
    ├── api-tests/
    ├── security-tests/
    └── frontend-tests/
```

---

## 12. Deliverables & Validation Criteria

### 12.1 Complete Deliverables Checklist

**Architecture & Design**
- [ ] Technical Architecture Document (microservices, data flows, deployment topology)
- [ ] React Web Information Architecture Diagram
- [ ] Site-Wide Visual Style Guide (this document's Section 5 formatted for design team)
- [ ] Component Design System Documentation
- [ ] Design Token Reference Sheet

**Backend**
- [ ] API Reference Documentation (all endpoints, request/response schemas)
- [ ] Database Design Document (ERD + schema annotations)
- [ ] Security Compliance Checklist

**Frontend**
- [ ] Mini Program Feature Design Specification
- [ ] React Web Page Specifications (8 pages, per Section 6)
- [ ] Admin Dashboard Feature Specification

**Operations**
- [ ] Test Case Suite & Acceptance Criteria
- [ ] Docker / Docker Compose Configuration
- [ ] CI/CD Pipeline Configuration

---

### 12.2 Validation Criteria

| Domain | Criteria |
|---|---|
| **Architecture Review** | Technical completeness, security, horizontal scalability |
| **Design Review** | Full visual consistency across all 8 pages; editorial magazine aesthetic faithfully rendered |
| **Frontend Acceptance** | React page-by-page consistency; animation quality; responsive at 375px, 768px, 1440px |
| **Functional Testing** | Upload → vote → donate → order → traceability full-flow coverage |
| **Security Testing** | SQL injection, XSS, IDOR, amount tampering, sensitive data exposure |
| **Payment Testing** | WeChat Pay sandbox, Alipay sandbox, Stripe test mode — all flows complete |
| **Performance Testing** | Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1 |
| **Compliance Review** | Privacy policy, child protection policy, donation agreement — final legal sign-off |

---

## Key Principles — Non-Negotiable

> These principles govern every decision on this project and cannot be relaxed:

1. **Editorial integrity over UI convention.** The React web platform must feel like an editorial publication — every page, not just the homepage.

2. **Style consistency is universal.** Interior pages must maintain the same visual identity as the hero page. Deviation into generic enterprise web design is a failure state.

3. **Child safety is absolute.** No shortcuts on consent, encryption, access control, or display name policies. This is non-negotiable and legally mandated.

4. **Supply chain claims must be verifiable.** Every sustainability assertion must trace to a source. No vague ESG marketing.

5. **Payments go live only after full compliance.** Merchant credentials, legal review, and sandbox testing must all be complete before any live transaction processing.

---

*Document version: 1.0 — Consolidated & Optimized*
*For use by: Product, Design, Frontend, Backend, Security, and Legal teams*
