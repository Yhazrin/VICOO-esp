# Update 010: Database Schema Reconciliation with Alembic

**Date:** 2026-03-30
**Focus:** Database Migration, Schema Drift Repair, Development Stability

## Overview

This update reconciled the live MySQL schema with the current SQLAlchemy models and brought the database back under clean Alembic version control.

The immediate trigger was a chain of runtime errors during OAuth login and development seeding:

- OAuth callback failed because `users.github_id` / `users.google_id` did not exist
- Product seed data failed because `products.status='sold_out'` was not allowed by the live enum definition
- The application had accumulated model/database drift beyond what the original migrations covered

The fix was completed using formal Alembic migrations rather than deleting the database or relying on `create_all()`.

## Problem Discovery

### 1. OAuth Login Exposed Missing User Columns
During Google OAuth callback, the backend failed with:

```text
Unknown column 'users.github_id' in 'field list'
```

This showed that the `users` table in MySQL was behind the current model definition.

### 2. Seed Process Exposed Product Enum Drift
During application startup, the development seed failed with:

```text
Data truncated for column 'status' at row 1
```

This happened because the seed inserts products with:

- `status="sold_out"`

but the live `products.status` enum still only allowed:

- `active`
- `inactive`

### 3. Alembic Version Was Not Fully Reflecting Current Models
Running the migration state and schema inspection showed:

- Alembic was only at older revisions
- the live schema did not fully match the current models in `backend/app/models/`
- drift existed across several tables, not just OAuth-related fields

## Investigation Process

### 1. Reviewed Migration Workflow
- **File:** `deploy/easy/README.md`
- **File:** `backend/alembic/env.py`

Confirmed the intended workflow is:

1. generate migrations with Alembic
2. apply them with `alembic upgrade head`
3. verify drift with Alembic commands

### 2. Compared Models Against Live Tables
Inspected:

- `backend/app/models/*.py`
- live MySQL table definitions via `SHOW COLUMNS` / `SHOW CREATE TABLE`

This confirmed multiple inconsistencies, including:

- `users.github_id`
- `users.google_id`
- `products.category`
- `audit_logs` field shape
- `payment_transactions` field shape
- `supply_chain_records` field shape
- `orders` field shape
- enum mismatches not fully detected by autogenerate

### 3. Generated Alembic Drift Draft
Ran:

```bash
docker compose exec backend alembic revision --autogenerate -m "reconcile_schema_with_models"
```

This produced a draft migration listing the live schema differences against the current models.

### 4. Verified Safety Before Applying
Checked row counts in the affected tables first.

At the time of reconciliation, the critical application tables were still empty, which made structural adjustment safe:

- `orders = 0`
- `products = 0`
- `payment_transactions = 0`
- `supply_chain_records = 0`
- `audit_logs = 0`

That allowed the schema to be reconciled without risky backfill logic.

## Implementation

### 1. Added OAuth Columns Migration
- **File:** `backend/alembic/versions/003_add_oauth_columns_to_users.py`

Added:

- `users.github_id`
- `users.google_id`

plus unique indexes for both columns.

### 2. Added Full Schema Reconciliation Migration
- **File:** `backend/alembic/versions/864b87240722_reconcile_schema_with_models.py`

This migration was generated from Alembic autogeneration and applied to align the database with the current model definitions across multiple tables.

It included reconciliation such as:

- adding missing columns
- adjusting column nullability
- updating indexes
- aligning foreign keys
- reshaping tables such as `audit_logs`, `orders`, `products`, `payment_transactions`, and `supply_chain_records`

### 3. Added Manual Enum Migration for Product Status
- **File:** `backend/alembic/versions/42c9f6e6d8d0_expand_product_status_enum.py`

Alembic drift detection did not fully catch the MySQL enum-value mismatch for `products.status`.

This manual migration updated the column to:

```text
ENUM('active','inactive','sold_out')
```

so that development seed data and API behavior match the model and schema definitions.

### 4. Preserved Runtime Configuration Support
- **File:** `deploy/easy/docker-compose.yml`

The backend service runtime environment was also updated during this troubleshooting cycle so configuration-dependent features such as OAuth and Resend mail delivery no longer depend on accidental `.env` resolution behavior.

## Commands Executed

Following the workflow documented in `deploy/easy/README.md`, the database was repaired through Alembic rather than by deleting volumes.

Key commands used:

```bash
docker compose exec backend alembic revision --autogenerate -m "reconcile_schema_with_models"
docker compose exec backend alembic upgrade head
docker compose exec backend alembic current
docker compose exec backend alembic check
```

## Verification

### 1. Alembic Version Check
Current revision:

```text
42c9f6e6d8d0 (head)
```

### 2. Drift Check
Ran:

```bash
docker compose exec backend alembic check
```

Result:

```text
No new upgrade operations detected.
```

This confirms the database schema now matches the current SQLAlchemy models.

### 3. Development Seed Verification
After restarting the backend, the development seed completed successfully.

Observed seeded data counts:

- `users = 5`
- `child_participants = 10`
- `campaigns = 3`
- `artworks = 20`
- `products = 8`
- `donations = 10`
- `orders = 5`
- `audit_logs = 5`

This verifies that:

- schema alignment is sufficient for current model writes
- startup no longer fails on missing columns or enum mismatch

## Final Result

- [x] Database schema reconciled with current SQLAlchemy models
- [x] OAuth user fields now exist in `users`
- [x] Product status enum now supports `sold_out`
- [x] Alembic head advanced successfully
- [x] `alembic check` reports no further upgrade operations
- [x] Development seed data now completes successfully

## Notes

### 1. Circular FK Warning Still Exists
Alembic still reports:

```text
Cannot correctly sort tables; there are unresolvable cycles between tables "clothing_intakes, products"
```

This is caused by the mutual foreign-key relationship between:

- `clothing_intakes.product_id`
- `products.source_clothing_intake_id`

It does not block current migrations, but it is a structural warning worth cleaning up later.

### 2. Recommended Workflow Going Forward
For future model changes, continue to use the documented process in `deploy/easy/README.md`:

```bash
docker compose exec backend alembic revision --autogenerate -m "describe change"
docker compose exec backend alembic upgrade head
docker compose exec backend alembic check
```

This avoids silent schema drift and prevents runtime-only discovery of database mismatches.
