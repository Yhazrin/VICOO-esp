# Database Design Document

## Tonghua Public Welfare x Sustainable Fashion Platform

**Version:** 1.0.0
**Last Updated:** 2026-03-19
**Database:** MySQL 8.0

---

## Table of Contents

1. [Overview](#1-overview)
2. [Entity Relationship Diagram](#2-entity-relationship-diagram)
3. [Table Definitions](#3-table-definitions)
4. [Encryption Strategy](#4-encryption-strategy)
5. [Child Data Isolation](#5-child-data-isolation)
6. [Indexing Strategy](#6-indexing-strategy)
7. [Migration Strategy](#7-migration-strategy)

---

## 1. Overview

- **RDBMS**: MySQL 8.0
- **Character Set**: utf8mb4 (full Unicode support for Chinese + international)
- **Collation**: utf8mb4_unicode_ci
- **Engine**: InnoDB (ACID compliance)
- **Isolation Level**: READ COMMITTED (balance between consistency and performance)

---

## 2. Entity Relationship Diagram

```
+-------------+       +--------------------+       +------------------+
|   users     |       | child_participants |       |    artworks      |
|             |       | (ISOLATED SCHEMA)  |       |                  |
| id (PK)     |<--1:N-| id (PK)            |       | id (PK)          |
| openid      |       | guardian_id (FK)   |--1:N---| child_id (FK)    |
| phone_enc   |       | encrypted_name     |       | campaign_id (FK) |
| email_enc   |       | encrypted_id_card  |       | title            |
| display_name|       | display_name       |       | image_url        |
| role        |       | consent_status     |       | vote_count       |
| hashed_pw   |       | data_retention     |       | status           |
| is_active   |       +--------------------+       +---------+--------+
+------+------+                                                |
       |                                                       | N:1
       |                                              +--------v--------+
       | 1:N                                         |   campaigns     |
       |                                             |                 |
+------v------+                                      | id (PK)         |
| donations   |                                      | title           |
|             |                                      | theme           |
| id (PK)     |                                      | description     |
| user_id(FK) |                                      | start_date      |
| amount      |                                      | end_date        |
| currency    |                                      | status          |
| status      |                                      | vote_enabled    |
| cert_url    |                                      +-----------------+
+-------------+

+-------------+       +--------------------+       +------------------+
|  orders     |       |  order_items       |       |    products      |
|             |       |                    |       |                  |
| id (PK)     |--1:N--| id (PK)            |       | id (PK)          |
| user_id(FK) |       | order_id (FK)      |       | title            |
| total_amount|       | product_id (FK)    |<--1:N--| price            |
| currency    |       | quantity           |       | materials        |
| status      |       | unit_price         |       | stock            |
| shipping_   |       | subtotal           |       | source_artwork_id|
|  address    |       +--------------------+       +--------+--------+
+------+------+                                                |
       |                                                       | 1:N
       | 1:1                                          +--------v--------+
       |                                             | supply_chain_   |
+------v----------+                                  | records         |
| payments        |                                  |                 |
|                 |                                  | id (PK)         |
| id (PK)         |                                  | product_id (FK) |
| reference_type  |                                  | step_order      |
| reference_id    |                                  | stage           |
| provider        |                                  | verified        |
| provider_txn_id |                                  | verification_   |
| amount          |                                  |  hash           |
| status          |                                  +-----------------+
+-----------------+

+------------------+       +---------------------+
|  certificates    |       |   audit_logs        |
|                  |       |                     |
| id (PK)          |       | id (PK)             |
| donation_id (FK) |       | admin_id (FK)       |
| certificate_url  |       | action              |
| issued_at        |       | target_type         |
+------------------+       | target_id           |
                           | details (JSON)      |
                           | ip_address          |
                           | timestamp           |
                           +---------------------+
```

---

## 3. Table Definitions

### 3.1 users

Platform users (parents, donors, shoppers, admins).

```sql
CREATE TABLE users (
    id              VARCHAR(36)    NOT NULL PRIMARY KEY,  -- UUID
    openid          VARCHAR(64)    DEFAULT NULL UNIQUE,   -- WeChat openid
    phone_encrypted VARBINARY(256) DEFAULT NULL,          -- AES-256-GCM encrypted
    email_encrypted VARBINARY(256) DEFAULT NULL,          -- AES-256-GCM encrypted
    display_name    VARCHAR(100)   NOT NULL,
    avatar_url      VARCHAR(512)   DEFAULT NULL,
    role            ENUM('anonymous', 'registered', 'donor', 'buyer',
                         'child_participant', 'guardian', 'reviewer',
                         'ops_manager', 'compliance_officer', 'super_admin')
                    NOT NULL DEFAULT 'registered',
    hashed_password VARCHAR(255)   DEFAULT NULL,          -- bcrypt hashed
    is_active       BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_role (role),
    INDEX idx_users_openid (openid),
    INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.2 child_participants (ISOLATED SCHEMA -- highest sensitivity)

Children whose artwork is submitted to campaigns.

```sql
CREATE TABLE child_participants (
    id                      VARCHAR(36)    NOT NULL PRIMARY KEY,  -- UUID
    guardian_id             VARCHAR(36)    NOT NULL,              -- FK -> users.id
    encrypted_name          VARBINARY(512) NOT NULL,             -- AES-256-GCM encrypted real name
    encrypted_id_card       VARBINARY(512) NOT NULL,             -- AES-256-GCM encrypted national ID
    display_name            VARCHAR(100)   NOT NULL,             -- System-generated pseudonym
    encrypted_school        VARBINARY(512) DEFAULT NULL,         -- AES-256-GCM encrypted school name
    age                     TINYINT        NOT NULL,
    consent_status          ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    consent_document_url    VARCHAR(512)   DEFAULT NULL,
    approved_by             VARCHAR(36)    DEFAULT NULL,          -- Reviewer who approved
    approved_at             DATETIME       DEFAULT NULL,
    data_retention_until    DATE           NOT NULL,              -- Auto-calculated purge deadline
    created_at              DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_child_guardian FOREIGN KEY (guardian_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_child_approver FOREIGN KEY (approved_by) REFERENCES users(id),

    INDEX idx_child_guardian (guardian_id),
    INDEX idx_child_consent (consent_status),
    INDEX idx_child_retention (data_retention_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Access Control:**
- SELECT requires role IN (compliance_officer, super_admin) AND secondary_approval = TRUE
- All access logged to audit_log table
- Data automatically purged when data_retention_until is reached

### 3.3 campaigns

Artwork submission campaigns.

```sql
CREATE TABLE campaigns (
    id              VARCHAR(36)    NOT NULL PRIMARY KEY,  -- UUID
    title           VARCHAR(200)   NOT NULL,
    theme           VARCHAR(200)   NOT NULL,
    description     TEXT           NOT NULL,
    cover_image_url VARCHAR(512)   DEFAULT NULL,
    start_date      DATE           NOT NULL,
    end_date        DATE           NOT NULL,
    status          ENUM('draft', 'active', 'ended', 'archived') NOT NULL DEFAULT 'draft',
    max_artworks    INT            DEFAULT NULL,
    artwork_count   INT            NOT NULL DEFAULT 0,
    vote_enabled    BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_campaign_dates CHECK (end_date > start_date),

    INDEX idx_campaign_status (status),
    INDEX idx_campaign_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.4 artworks

Artwork submissions by child participants.

```sql
CREATE TABLE artworks (
    id              VARCHAR(36)    NOT NULL PRIMARY KEY,  -- UUID
    child_id        VARCHAR(36)    NOT NULL,              -- FK -> child_participants.id
    campaign_id     VARCHAR(36)    NOT NULL,              -- FK -> campaigns.id
    title           VARCHAR(200)   NOT NULL,
    image_url       VARCHAR(512)   NOT NULL,
    thumbnail_url   VARCHAR(512)   DEFAULT NULL,
    description     TEXT           DEFAULT NULL,
    vote_count      INT            NOT NULL DEFAULT 0,
    status          ENUM('pending', 'review', 'approved', 'rejected', 'featured')
                    NOT NULL DEFAULT 'pending',
    reviewed_by     VARCHAR(36)    DEFAULT NULL,
    reviewed_at     DATETIME       DEFAULT NULL,
    review_note     TEXT           DEFAULT NULL,
    created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_artwork_child FOREIGN KEY (child_id) REFERENCES child_participants(id) ON DELETE RESTRICT,
    CONSTRAINT fk_artwork_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    CONSTRAINT fk_artwork_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id),

    INDEX idx_artwork_campaign (campaign_id),
    INDEX idx_artwork_child (child_id),
    INDEX idx_artwork_status (status),
    INDEX idx_artwork_votes (vote_count DESC),
    INDEX idx_artwork_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.5 donations

Charitable donation records.

```sql
CREATE TABLE donations (
    id                       VARCHAR(36)    NOT NULL PRIMARY KEY,  -- UUID
    user_id                  VARCHAR(36)    NOT NULL,              -- FK -> users.id
    amount                   DECIMAL(10,2)  NOT NULL,
    currency                 CHAR(3)        NOT NULL DEFAULT 'CNY',
    payment_status           ENUM('pending', 'processing', 'completed', 'failed', 'refunded')
                             NOT NULL DEFAULT 'pending',
    payment_transaction_id   VARCHAR(36)    DEFAULT NULL,          -- FK -> payment_transactions.id
    message                  TEXT           DEFAULT NULL,
    is_anonymous             BOOLEAN        NOT NULL DEFAULT FALSE,
    donation_certificate_url VARCHAR(512)   DEFAULT NULL,
    created_at               DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_donation_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT chk_donation_amount CHECK (amount > 0),

    INDEX idx_donation_user (user_id),
    INDEX idx_donation_status (payment_status),
    INDEX idx_donation_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.6 products

Sustainable fashion product catalog.

```sql
CREATE TABLE products (
    id                   VARCHAR(36)    NOT NULL PRIMARY KEY,  -- UUID
    title                VARCHAR(200)   NOT NULL,
    description          TEXT           NOT NULL,
    price                DECIMAL(10,2)  NOT NULL,
    source_artwork_id    VARCHAR(36)    DEFAULT NULL,          -- FK -> artworks.id
    materials            TEXT           NOT NULL,
    sustainability_info  TEXT           NOT NULL,
    welfare_contribution DECIMAL(5,2)   NOT NULL,              -- % of price to welfare
    image_urls           JSON           NOT NULL,
    category             VARCHAR(50)    NOT NULL,
    stock                INT            NOT NULL DEFAULT 0,
    is_active            BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_artwork FOREIGN KEY (source_artwork_id) REFERENCES artworks(id),
    CONSTRAINT chk_product_price CHECK (price > 0),

    INDEX idx_product_category (category),
    INDEX idx_product_active (is_active),
    INDEX idx_product_price (price),
    INDEX idx_product_stock (stock)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.7 orders

Customer orders for products.

```sql
CREATE TABLE orders (
    id               VARCHAR(36)    NOT NULL PRIMARY KEY,  -- UUID
    user_id          VARCHAR(36)    NOT NULL,              -- FK -> users.id
    product_id       VARCHAR(36)    NOT NULL,              -- FK -> products.id
    quantity         INT            NOT NULL DEFAULT 1,
    unit_price       DECIMAL(10,2)  NOT NULL,
    total_amount     DECIMAL(10,2)  NOT NULL,
    status           ENUM('pending_payment', 'paid', 'shipped', 'delivered',
                          'completed', 'cancelled', 'refunded')
                     NOT NULL DEFAULT 'pending_payment',
    shipping_address JSON           DEFAULT NULL,
    supply_chain_id  VARCHAR(36)    DEFAULT NULL,          -- FK -> supply_chain_records.id
    created_at       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_order_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT chk_order_qty CHECK (quantity > 0),
    CONSTRAINT chk_order_amount CHECK (total_amount > 0),

    INDEX idx_order_user (user_id),
    INDEX idx_order_status (status),
    INDEX idx_order_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.8 supply_chain_records

Append-only supply chain transparency records.

```sql
CREATE TABLE supply_chain_records (
    id                     VARCHAR(36)    NOT NULL PRIMARY KEY,  -- UUID
    product_id             VARCHAR(36)    NOT NULL,              -- FK -> products.id
    raw_material_source    TEXT           NOT NULL,
    production_date        DATE           NOT NULL,
    production_facility    VARCHAR(200)   NOT NULL,
    quality_certifications JSON           DEFAULT NULL,
    logistics_info         JSON           DEFAULT NULL,
    environmental_impact   TEXT           DEFAULT NULL,
    blockchain_hash        VARCHAR(128)   DEFAULT NULL,          -- Verification hash
    verified               BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at             DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sc_product FOREIGN KEY (product_id) REFERENCES products(id),

    INDEX idx_sc_product (product_id),
    INDEX idx_sc_verified (verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Append-only policy:** No UPDATE or DELETE operations are permitted on this table. All records are immutable once inserted.

### 3.9 payment_transactions

Payment transaction records for both donations and orders.

```sql
CREATE TABLE payment_transactions (
    id                       VARCHAR(36)    NOT NULL PRIMARY KEY,  -- UUID
    order_id                 VARCHAR(36)    NOT NULL,              -- Related order/donation ID
    order_type               ENUM('product', 'donation') NOT NULL,
    user_id                  VARCHAR(36)    NOT NULL,              -- FK -> users.id
    provider                 ENUM('wechat_pay', 'alipay', 'stripe', 'paypal') NOT NULL,
    amount                   DECIMAL(10,2)  NOT NULL,
    currency                 CHAR(3)        NOT NULL DEFAULT 'CNY',
    status                   ENUM('pending', 'processing', 'completed', 'failed', 'refunded')
                             NOT NULL DEFAULT 'pending',
    provider_transaction_id  VARCHAR(128)   DEFAULT NULL,
    webhook_data             JSON           DEFAULT NULL,
    risk_score               DECIMAL(3,2)   DEFAULT NULL,
    created_at               DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at             DATETIME       DEFAULT NULL,

    CONSTRAINT fk_payment_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT chk_payment_amount CHECK (amount > 0),

    INDEX idx_payment_order (order_type, order_id),
    INDEX idx_payment_provider (provider, provider_transaction_id),
    INDEX idx_payment_status (status),
    INDEX idx_payment_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Idempotency:** The `provider_transaction_id` combined with `provider` ensures duplicate webhook callbacks are detected.

### 3.10 certificates

Donation certificates generated after payment completion.

```sql
CREATE TABLE certificates (
    id               VARCHAR(36)    NOT NULL PRIMARY KEY,
    donation_id      VARCHAR(36)    NOT NULL UNIQUE,
    certificate_url  VARCHAR(512)   NOT NULL,
    issued_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cert_donation FOREIGN KEY (donation_id) REFERENCES donations(id),

    INDEX idx_cert_donation (donation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.11 audit_log

Immutable audit trail for all administrative actions.

```sql
CREATE TABLE audit_log (
    id            VARCHAR(36)    NOT NULL PRIMARY KEY,
    user_id       VARCHAR(36)    DEFAULT NULL,              -- FK -> users.id
    action        VARCHAR(100)   NOT NULL,
    resource_type VARCHAR(50)    NOT NULL,
    resource_id   VARCHAR(36)    DEFAULT NULL,
    details       JSON           DEFAULT NULL,
    ip_address    VARCHAR(45)    DEFAULT NULL,
    user_agent    VARCHAR(500)   DEFAULT NULL,
    created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id),

    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_resource (resource_type, resource_id),
    INDEX idx_audit_time (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. Encryption Strategy

### 4.1 Encryption Architecture

```
Application Layer
       |
       v
+------------------+
| Encryption       |
| Middleware        |
|                  |
| AES-256-GCM      |
| - Encrypt on write|
| - Decrypt on read |
| - Field-level     |
+--------+---------+
         |
         v
+------------------+
| MySQL            |
|                  |
| Encrypted fields |
| stored as        |
| VARBINARY        |
+------------------+
```

### 4.2 Sensitive Fields

| Table | Field | Encryption | Key ID |
|-------|-------|-----------|--------|
| users | phone_encrypted | AES-256-GCM | ENC_KEY_USER_PHONE |
| users | email_encrypted | AES-256-GCM | ENC_KEY_USER_EMAIL |
| child_participants | encrypted_name | AES-256-GCM | ENC_KEY_CHILD_NAME |
| child_participants | encrypted_id_card | AES-256-GCM | ENC_KEY_CHILD_ID |
| child_participants | encrypted_school | AES-256-GCM | ENC_KEY_CHILD_SCHOOL |

### 4.3 Implementation Notes

- **Algorithm:** AES-256-GCM (authenticated encryption with associated data)
- **Key Storage:** Encryption keys stored in environment variable vault (not in code or database)
- **IV/Nonce:** Random 96-bit nonce generated per encryption operation, stored as prefix to ciphertext
- **Format:** `nonce (12 bytes) + ciphertext + tag (16 bytes)` stored as VARBINARY
- **Key Rotation:** Supported via key ID prefix in encrypted data. New writes use latest key; reads try all active keys.

### 4.4 Password Storage

- Passwords are hashed using bcrypt with cost factor 12
- No reversible password storage
- Password reset via email verification link (no password stored in plaintext anywhere)

### 4.5 Application-Level Masking

When returning child data through the API:

- `encrypted_name` is decrypted, then masked: surname + "**" (e.g., "Li Ming" -> "Li M**")
- `encrypted_id_card` is never returned in full; only last 4 digits when verification display is needed
- Admin access to unmasked data requires secondary approval and is logged

---

## 5. Child Data Isolation

### 5.1 Access Control Rules

| Role | Can View Child Name | Can View Child ID Card | Can Edit Child Record | Requires 2nd Approval |
|------|-------------------|----------------------|---------------------|----------------------|
| guardian | Masked own children | Last 4 digits own children | Own children (limited) | No |
| reviewer | No | No | No | N/A |
| ops_manager | Masked only | No | No | No |
| compliance_officer | Full (decrypted) | Full (decrypted) | Yes | Yes |
| super_admin | Full (decrypted) | Full (decrypted) | Yes | Yes |

### 5.2 Data Retention

- `data_retention_until` is automatically set to 2 years from the child's last activity
- A nightly job queries for expired records and flags them for deletion
- Parents are notified 30 days before automatic deletion via email
- Deleted child records are hard-deleted (not soft-deleted) to comply with data minimization

### 5.3 Consent Tracking

- `consent_status` must be `approved` before any child data processing
- Consent is verified via email confirmation link sent to the parent's registered email
- Consent can be revoked at any time, which immediately prevents all data processing for that child
- Consent verification method and timestamp are recorded for audit purposes

---

## 6. Indexing Strategy

### 6.1 Performance-Critical Indexes

| Table | Index | Query Pattern |
|-------|-------|--------------|
| artworks | `(campaign_id, status, vote_count DESC)` | List published artworks by campaign, sorted by popularity |
| artworks | `(status, created_at DESC)` | List recent published artworks |
| donations | `(user_id, created_at DESC)` | User's donation history |
| orders | `(user_id, status)` | User's order list |
| payment_transactions | `(provider, provider_transaction_id)` | Idempotent webhook processing |
| supply_chain_records | `(product_id)` | Ordered supply chain steps per product |
| audit_log | `(created_at)` | Recent audit log queries |

### 6.2 Full-Text Indexes

Not implemented initially. Product and artwork search uses application-level filtering. If search becomes a bottleneck, Elasticsearch integration will be evaluated.

---

## 7. Migration Strategy

- Use Alembic for schema migrations
- Every schema change is a numbered migration file
- Migrations run automatically on application startup (dev) or manually (prod)
- Backward-compatible migrations preferred (add columns, don't drop)
- Data migrations for encryption key rotation

### Migration Rules

1. **No destructive migrations in production** without a backup
2. **Column additions** must have a DEFAULT value or be NULLable
3. **Column renames** are done as: add new column -> migrate data -> drop old column (two migrations)
4. **Index additions** use `CREATE INDEX CONCURRENTLY` where supported to avoid table locks
5. **Data migrations** are separated from schema migrations

---

*Document version: 1.0*
*Last updated: 2026-03-19*
