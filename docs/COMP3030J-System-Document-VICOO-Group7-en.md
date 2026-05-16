# VICOO — System Documentation (COMP3030J)

**Course:** COMP3030J — Sustainable Software for Business  
**Group:** 7 — *SixSeven*  
**Version:** 1.0 (April 2026)  
**Document language:** English

---

## Abstract (maximum 1 page)

**VICOO (Visual · Circle)** is a full-stack, remotely testable software platform that supports a client’s move from “fast fashion” marketing toward *verifiable* sustainability. The system links **responsible production and consumption** (UN **SDG 12** *Responsible Consumption and Production*), with secondary alignment to **SDG 1** (no poverty / inclusive opportunity for rural children), **SDG 13** (climate action via transparency and circular flows), and **SDG 17** (partnerships and traceable social impact). End users browse an editorial **React** web experience, purchase sustainable products, submit and vote on **children’s artwork** in campaigns, follow **donation** and **impact** flows, and inspect **supply-chain** and **sustainability** records where implemented. **Staff** operate a separate **admin** web application to manage users, content, products, and operational data.

Technically, the product is delivered as a **monolithic yet modular FastAPI** backend (Python 3.11) with **SQLAlchemy (async)**, **MySQL 8**, **Redis 7**, **RabbitMQ 3.12**, and containerised deployment through **`deploy/easy` (Docker Compose)** with **Nginx** fronting the user site and API. The repository also contains **WeChat Mini Program** and **Android (Kotlin, Jetpack Compose)** clients sharing the same API philosophy; the **primary remote demo path** for the course is the Dockerised web + API + admin stack.

This document follows the project specification: system purpose and planning (**Introduction**), a structured **technical implementation** (user vs staff, frontend vs backend, data and deployment), a **Generative AI** section aligned with **UCD College of Science “Level 3: AI Collaboration”** (as stated in the module problem statement: discuss use, and show **critical evaluation and modification** of AI output), **team contributions** (one subsection per member), and a **Conclusion**.

**Keywords:** sustainable fashion, supply chain transparency, charitable traceability, FastAPI, React, Docker, SDG 12.

---

## 1. Introduction (1–2 pages)

### 1.1 System purpose and client need

The global fashion industry has a large **environmental footprint**; “sustainability” is often communicated as a **narrative** without verifiable data. The client in our project proposal (Group 7) is a brand moving toward **responsible** practices under **consumer and ESG pressure**. The software’s job is to turn sustainability into **transparent, testable** behaviour: **traceability** in the value chain, **circular** commerce flows where supported, and **auditable** social impact (e.g. donations and campaigns tied to real records).

VICOO addresses that need with two conceptual pillars, consistent with the project proposal and the implemented codebase:

1. **Transparency & traceability** — product and supply-chain related records, sustainability messaging backed by structured data, and user-facing flows to inspect that information.  
2. **Community co-creation & social impact** — campaigns, artwork submission and voting, editorial storytelling, and donation/impact views that can be connected to purchase and project narratives.

The implementation brand name in the repository is **VICOO** (*Visual · Circle*): children’s visual creativity as **Visual**, and **Circle** as circularity and return — aligned with the sustainability framing of the product.

### 1.2 Planning approach (high level)

**Requirements & architecture:** The team used a **proposal-first** model (client problem, UN SDG mapping, success criteria, stack, and remote testing strategy) and refined it into **incremental development**: backend API and data model, web frontends (user + admin), and deployment that examiners and TAs can run **remotely** (Ireland) — matching the **Problem Statement** emphasis on *remote testability* and *straightforward* access.

**Stack choice (as implemented; note on proposal):** The written proposal listed **Flask** for the server; the delivered system standardises on **FastAPI** with async SQLAlchemy and Uvicorn, with **MySQL/Redis/RabbitMQ** and **Docker Compose** in `deploy/easy`. This is a deliberate engineering choice for **async I/O**, **OpenAPI** documentation, and **typed** API contracts, while still matching the course guidance to use **familiar** web and database skills.

**SDG focus:** **SDG 12** is the primary story: *ensure sustainable consumption and production patterns* — the platform makes *consumption* (shopping, participation) and *production* (supply records, product narratives) more **legible and accountable** to the user. **SDG 1** appears in the *social* track (opportunity and visibility for children’s work). **SDG 13** is supported by *transparency* and *circular* narratives rather than a single “carbon app.” **SDG 17** is reflected in *partnership* and *traceable* donation and campaign flows.

**Testing accounts (non-registration-only testing):** The module requires **pre-provisioned** usernames/passwords. For the Docker “easy” deployment, the repository documents demo and seed accounts (see `README.md` and `deploy/easy/README.md`), including admin-style access for the **admin dashboard** (e.g. `admin@tonghua.org` with the documented test password) so that assessment does not rely on ad-hoc self-registration only.

---

## 2. Technical implementation (10–12 pages)

This section is organised by **User vs Staff (employee) surfaces** and by **frontend vs backend and infrastructure**, consistent with the assignment outline.

### 2.1 System context and main components

A typical deployment of the *web* product consists of:

- **User-facing website (`frontend/web-react`)** — React 18, TypeScript, Vite, Tailwind, Zustand, Framer Motion; editorial, magazine-style UI.  
- **Admin / staff dashboard (`admin/`)** — React-based back-office for operations and moderation.  
- **API (`backend/`)** — FastAPI application under `app/`, with routers in `app/routers/`, Pydantic schemas, SQLAlchemy models, and services.  
- **Data and middleware** — MySQL, Redis, RabbitMQ; file/media handling as per implementation.  
- **Reverse proxy and packaging** — Nginx and Dockerfiles in `deploy/easy`, `docker compose` to run the stack.

**Additional client code** in the monorepo (WeChat, Android) shares API concepts with the same backend; where not deployed for the course VM, they still demonstrate **multi-channel** skills from other modules (mobile, mini program).

### 2.2 User-facing web application (customer)

**Role:** Discover campaigns and editorial content, browse products, place orders, participate in artwork/campaign flows, view donations/sustainability content, and use contact/assistant features as enabled.

**Front end (`frontend/web-react`)**

- **Stack:** React, TypeScript, Vite, client-side routing, TanStack Query for server state, Axios for HTTP, i18n support, motion (Framer / GSAP) and a consistent **1990s editorial** visual language.  
- **User journey:** The UI is page-based with magazine-style layout and **navigation** patterns that bind marketing, story, and shop into one language — not a generic e-commerce skin.  
- **API integration:** Calls the **REST** API under a versioned base path (e.g. `/api/v1/...` as configured); CORS and environment-specific API bases are set for local dev and Docker.  
- **Resilience:** The client separates **rendering** from **data fetching**; errors and loading states are handled at feature level.  

**Back end (customer-relevant API surface)**

Representative **router modules** in `backend/app/routers/` that primarily serve the public and logged-in *customer* experience include, among others: `auth`, `users`, `campaigns`, `artworks`, `products`, `orders`, `payments`, `donations`, `supply_chain`, `sustainability`, `reviews`, `clothing_intakes` (circular / intake flows), `contact`, and `ai_assistant` (if the feature is enabled in deployment). The **OpenAPI** definition is served by FastAPI (e.g. `/docs` in development) for **contract review** and **remote testing** with known credentials.

**Security and privacy (user side)** — high level

- **Authentication** uses JWT-style access/refresh patterns as implemented in `security` and `auth` flows; sensitive fields may be encrypted at rest per architecture documents.  
- **Child-related data** is treated with stricter policy (consent, minimisation) as described in `docs/architecture` and `docs/security` — relevant for artwork campaigns.

### 2.3 Staff and administrative surfaces (employee)

**Role:** Onboard and manage **users** (within policy), **campaigns**, **artworks** moderation pipeline, **products** and merchandising, **orders** and **after-sales**, **payments** configuration at integration level, **editorial** and **content** where applicable, and **admin** analytics/operations. This corresponds to the proposal’s *Admin Panel* and **Module A/B** operational controls (traceability + community pipeline).

**Admin frontend (`admin/`)**

- Separate build and deployment, often on a distinct port in Docker (see `deploy/easy` README: e.g. admin on **8080** in the documented mapping).  
- **Employee workflows** focus on *efficiency* and *auditability*: list/detail views, forms, and actions that call **admin** or privileged endpoints.  

**Back end (staff-oriented)**

- The `admin` router and related **privilege** checks implement **role-based** operations (e.g. campaign approval, product lifecycle, user support).  
- **Operational** modules (`orders`, `after_sales`, `payments` callbacks, `supply_chain` maintenance) are primarily *staff* concerns but may expose limited read data to the customer.  

### 2.4 Backend implementation (depth)

**Framework and structure**

- **Entry:** `app/main.py` wires middleware, CORS, exception handling, and includes routers.  
- **Routers:** Feature slices under `routers/*.py` — keeps HTTP layer thin; delegates to `services/`.  
- **Models & DB:** SQLAlchemy models under `app/models/`, **Alembic** migrations for schema evolution.  
- **Schemes:** Pydantic schemas for **validation** and **documentation**.  

**Cross-cutting concerns**

- **Configuration:** `config.py` and environment variables (Docker `.env` in `deploy/easy`).  
- **Resilience & messaging:** RabbitMQ for asynchronous jobs (e.g. payment/donation/notification style workloads — exact bindings per `services/`).  
- **Caching and rate limits:** Redis for **sessions**, **rate limiting**, and hot **cache** keys.  
- **Observability:** Structured logging and health endpoint(s) (see deployment docs for the exact **health** path used by Docker health checks).

**API design**

- **REST** resources grouped by domain (`/users`, `/artworks`, `/products`, …) with **pagination** and **filtering** where needed.  
- **Payments:** Multiple provider hooks (e.g. WeChat Pay, Alipay, Stripe, PayPal) with **idempotent** handling and **callback** security — as implemented in `payments` and related services.  
- **AI assistant:** A dedicated `ai_assistant` router for optional LLM-style features; in production, this should be **rate-limited**, **logged**, and **aligned** with the Generative AI policy in Section 3.

### 2.5 Data layer and information architecture

- **RDBMS:** MySQL 8 stores **users**, **orders**, **products**, **artworks**, **campaigns**, **donation** records, **supply_chain** nodes, and related **review** and **sustainability** fields.  
- **ER modelling** and field-level design were a group responsibility (see **Team** section — Database lead). Migrations in `backend/alembic` are the **source of truth** for schema history.  
- **Consistency:** Use of **transactions** for checkout and payment flows; **soft deletes** or status fields where business rules require history.

### 2.6 Distributed systems, network, and deployment

- **Course alignment:** The **Problem Statement** requests skills from **distributed systems, networking, databases, and information systems** — this project demonstrates:  
  - **Multi-container** architecture (Compose services: `frontend`, `admin`, `backend`, `mysql`, `redis`, `rabbitmq`, etc.).  
  - **Nginx** as an **edge** reverse proxy, TLS termination in production, path routing to API vs static.  
  - **Message queue** for **async** work — classic **loose coupling** between web requests and long-running or retryable tasks.  
- **Remote access:** The stack exposes standard **HTTP** ports; documentation in `README.md` / `deploy/easy` explains **localhost** URLs; on the **VM**, public DNS or port forwarding is configured per course instructions.  

### 2.7 Engineering documentation in-repo

- **Architecture:** `docs/architecture/system-architecture.md` (logical decomposition, data layer, security).  
- **API:** `docs/api/api-reference.md` (endpoint-level description).  
- **Deployment:** `docs/deployment/deployment-guide.md` (note: new deployments should follow **`deploy/easy`** as per migration notes).  
- **Security:** `docs/security/` (policies, threat model elements, child protection).  

This internal documentation is what the team uses to keep **AI-assisted** and **human** changes consistent (see Section 3).

### 2.8 Known drift from the original proposal (transparency to markers)

- **Backend framework:** Proposal mentioned **Flask**; the repository standardises on **FastAPI** — *better match* for **async** workloads and **automatic OpenAPI** for remote testers.  
- **Microservice diagram vs deployment:** The architecture document may describe a **gateway / microservice** *logical* view; the **shipped** easy-deploy stack is often a **modular monolith** inside one API process for **simpler** course deployment — a common engineering trade-off.

---

## 3. Generative AI use (1–2 pages)

### 3.1 Module policy (UCD, Level 3: “AI Collaboration”)

The **Problem Statement (Problem_Statement.docx.pdf)** states that the module uses **UCD College of Science** expectations at **Level 3: *AI Collaboration***. In plain terms, students are expected to **discuss** how they used generative AI and to show how they **critically evaluated and modified** AI-generated content — not to submit raw, unchecked model output as final work.

We apply that policy in three layers: **(1) code and configuration**, **(2) product and UX text**, **(3) documentation and deliverables** (including this system document).

### 3.2 Where generative AI was useful in the VICOO project

Typical, responsible uses across the team include:

- **Scaffolding and exploration** — boilerplate for **React** components, **FastAPI** routes, and **SQLAlchemy** models; *proposals* for folder layout or naming.  
- **Draft documentation** — first drafts of README sections, ADR-style notes, or test cases; *never* the sole source of truth.  
- **Text assistance** — marketing copy, in-app strings, and report language — always checked against **brand**, **compliance** (PIPL/GDPR/child safety), and **accuracy** of technical claims.  
- **Code explanation** — understanding errors from logs and stack traces, suggesting *hypotheses* for bugs (verified by **tests** and **reproduction**).

The repository may include an `ai_assistant` feature on the product side; that is *user-facing* AI and is separate from **development-time** use. Both are governed by **review** and **logging** where enabled.

### 3.3 How we review and modify AI content (concrete process)

1. **Human ownership:** Every commit has a **named author**; AI output is not anonymous “team work” — a developer **integrates** and **signs off** on changes.  
2. **Correctness & security review:** For code, we run **linters**, **type checks**, and **tests**; we read **SQL** and **auth** code paths for **injection** and **IDOR** issues — models are bad at *security without humans*.  
3. **Architecture alignment:** AI suggestions that violate **our** Nginx, Compose, and API versioning are **rejected** or **adapted** to the actual repo layout.  
4. **Fact checking:** For sustainability, legal, and SDG claims in user-visible text, we **verify** against **cited** sources; we avoid unverifiable statistics.  
5. **Plagiarism and licensing:** We do not paste large chunks of **unknown** provenance; dependencies remain **licence-audited** in `package.json` / `requirements.txt`.  
6. **This document:** Sections describing the **stack** and **routers** were **cross-checked** against the **repository**; proposal PDF text (e.g. Flask) was **corrected** where the product uses **FastAPI**.  

### 3.4 Positioning for assessment

We treat generative AI as a **productivity tool under human judgment**, consistent with **Level 3 — AI Collaboration**: transparent use, **critical** editing, and **traceability** in Git history and team practices — analogous to the platform’s own promise of **traceability** in sustainability storytelling.

---

## 4. Team work (3–4 pages) — individual responsibilities

*The role titles below are taken from the **Group 7 — SixSeven** project proposal (`Group_7_SixSeven.pdf`) and the sample **Weekly Update** in `Weekly Update Template.pdf`. Wording is expanded to match the *delivered* codebase and workflow.*

### 4.1 Huang Tian — Backend Lead & Technical Coordinator

**Proposal role:** Lead backend **MVC-style** structure and **API** specifications.  
**Delivery alignment:** The backend is **FastAPI-centric** (not classic Django MVC) but preserves **separation of concerns** — `routers` → `services` → `models`. Huang coordinates **interface contracts** (OpenAPI), **versioning** with the frontends, and **integration** checkpoints (e.g. auth, payments) so that **user** and **admin** clients stay compatible. The role includes resolving **cross-module** issues (CORS, env vars, health checks) for **Docker** deployments.

### 4.2 Yang Haoze — Product Designer & System Architect

**Proposal role:** Prototyping, **UI/UX** specifications, and **functional** flows.  
**Delivery alignment:** VICOO’s **editorial** look-and-feel and **information architecture** (campaign → artwork → shop → impact) are design-led. Yang bridges **Figma**-level intent and **React** page structure, defines **design tokens** and motion affordances, and ensures **user** and **staff** interfaces remain **on-brand** while staying implementable on **Vite** and **Tailwind**.

### 4.3 Li Jinhao — Database Lead

**Proposal role:** **ER modelling**, table design, and **query** optimisation.  
**Delivery alignment:** Owns the **MySQL** schema, **indices**, and **migration** quality with **Alembic**; works with backend developers to avoid **N+1** issues and to keep **financial** and **order** data **ACID-consistent**; reviews **reporting** queries for the admin side. The role is critical where **artworks** and **orders** must stay **linkable** for **audit** stories.

### 4.4 Wang Jundi — Backend Developer & System Integration

**Proposal role:** Feature modules and **third-party** integrations.  
**Delivery alignment:** Implements domain routers and **services** (e.g. **payments**, **webhooks**, **supply** records), and wires **RabbitMQ**-backed jobs where the design calls for **asynchronous** behaviour. Contributes to **integration testing** of **endpoints** with real **Docker** services (MySQL, Redis, MQ).

### 4.5 Liu Honghao — Frontend Developer

**Proposal role:** **Full-page** development for **client** and **admin** with **interactive** effects.  
**Delivery alignment:** Builds **React** features for listing/detail flows, state with **Zustand** and **TanStack Query**, and high-polish **motion** and **layout** in the user site; contributes to the **admin** app where staff workflows require **dense** tables and **forms** with validation feedback.

### 4.6 Ma Qingchuan — Test Engineer & Documentation Lead

**Proposal role:** **End-to-end** testing, test reports, and **user** operation manuals.  
**Delivery alignment:** Organises **manual test** matrices for **core flows** (login, browse, cart, payment stubs, admin moderation), **API** checks against `/docs`, and **Docker** “happy path” validation for **remote** examiners. Owns **consolidation** of **developer** and **operator** documentation (including alignment with this **system document** and weekly communication norms from the **Weekly Update Template**).

### 4.7 Collaboration and weekly process

Early weekly updates (see the template) document **formation**, **team agreement**, **topic reading**, and **even contribution** to updates — practices that we carried forward as **sprint-style** check-ins, **code review**, and **shared** Definition of Done (tests + docs + deployability).

---

## 5. Conclusion (maximum 1 page)

VICOO implements a **credible, remotely testable** path for a fashion-adjacent client to connect **sustainable consumption and production (SDG 12)** with **transparent** product stories, **circular** and **welfare** flows, and **community** co-creation around children’s art. The **user** web, **admin** web, and **FastAPI** backend, backed by **MySQL/Redis/RabbitMQ** and packaged with **Docker Compose**, reflect **distributed systems** and **IS** course goals while remaining **practical** for the semester.

We explicitly align **Generative AI** with **UCD Level 3 (AI Collaboration)**: AI assists, humans **authorise**, and all outputs that affect **code**, **UX**, and **compliance** pass **review** and **verification** — a workflow we also try to *embody* in the product’s own promises of **traceability**.

Future work (beyond the course) could include **harder** LCA integrations, **stronger** mobile shipping paths, and **deeper** external audit of supply data — the architecture already **modularises** these concerns at API and data layers.

---

## References (informative)

- United Nations, *The 17 Goals* — [https://sdgs.un.org/goals](https://sdgs.un.org/goals)  
- UCD / COMP3030J **Problem Statement** — *Problem_Statement.docx.pdf* (module).  
- Group 7 proposal — *Group_7_SixSeven.pdf*.  
- Repository: `README.md`, `docs/architecture/system-architecture.md`, `docs/api/api-reference.md`, `deploy/easy/README.md`.  

---

*End of system document.*
