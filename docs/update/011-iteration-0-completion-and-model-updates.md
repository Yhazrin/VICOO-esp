# Update 011: Iteration 0 Completion & Core Model Enhancement

**Date:** 2026-04-01
**Focus:** Infrastructure, Database Schema, Baseline Audit

## Overview
Completed the baseline audit (Iteration 0) and initiated the first phase of model enhancements to support payment windows and guardian-child account linking.

## Changes

### 1. Baseline Audit & Documentation
- **File:** `docs/update/iteration/000-baseline-report.md`
    - Mapped all 17 existing routers to functional domains.
    - Identified "logic leakage" (business logic in routers) and flagged high-risk modules (Auth, Payments, Child Data).
    - Frozen the project structure to follow the `Router -> Service -> Repository` pattern.

### 2. Payment Model Enhancement (Payment Window Support)
- **File:** `backend/app/models/payment.py`
    - Added `expires_at`: Supports auto-expiration of pending payments.
    - Added `payment_url`: Stores pre-payment links from providers (WeChat/Alipay/Stripe).
    - Added `idempotency_key`: Prevents duplicate payment processing at the database level.

### 3. User Model Enhancement (Guardian-Child Linking)
- **File:** `backend/app/models/user.py`
    - Added `guardian_user_id` to `ChildParticipant` model.
    - This allows linking anonymously submitted child data to a registered guardian's account, fulfilling the "Guardian Management" requirement.

### 4. Testing Infrastructure
- **File:** `backend/tests/api-tests/test_auth_baseline.py`
    - Added a baseline suite to ensure authentication routes remain stable during Iteration 1's transition to dual-token (Access/Refresh) logic.

## Status
- [x] Iteration 0 Baseline Audit (Completed)
- [x] Payment/Order skeleton enhancements (Completed)
- [x] Child Participant account linking (Completed)
- [ ] **Next:** Refresh Token implementation & RBAC refinement (Iteration 1)
