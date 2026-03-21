# API Reference

## Tonghua Public Welfare x Sustainable Fashion

**Base URL:** `https://api.tonghua.org/api/v1`
**Version:** 1.0.0
**Last Updated:** 2026-03-21

---

## Table of Contents

- [General](#general)
- [Authentication](#authentication)
  - [POST /auth/login](#post-authlogin)
  - [POST /auth/refresh](#post-authrefresh)
  - [POST /auth/logout](#post-authlogout)
- [Artworks](#artworks)
  - [GET /artworks](#get-artworks)
  - [POST /artworks](#post-artworks)
  - [GET /artworks/{id}](#get-artworksid)
  - [POST /artworks/{id}/vote](#post-artworksidvote)
  - [GET /artworks/{id}/status](#get-artworksidstatus)
- [Campaigns](#campaigns)
  - [GET /campaigns](#get-campaigns)
  - [GET /campaigns/active](#get-campaignsactive)
  - [GET /campaigns/{id}](#get-campaignsid)
- [Donations](#donations)
  - [POST /donations/initiate](#post-donationsinitiate)
  - [GET /donations/{id}](#get-donationsid)
  - [GET /donations/{id}/certificate](#get-donationsidcertificate)
- [Products](#products)
  - [GET /products](#get-products)
  - [GET /products/{id}](#get-productsid)
  - [GET /products/{id}/traceability](#get-productsidtraceability)
- [Orders](#orders)
  - [POST /orders](#post-orders)
  - [GET /orders/{id}](#get-ordersid)
- [Supply Chain](#supply-chain)
  - [GET /supply-chain/{product_id}](#get-supply-chainproduct_id)
  - [GET /supply-chain/{product_id}/timeline](#get-supply-chainproduct_idtimeline)
- [Payments](#payments)
  - [POST /payments/create](#post-paymentscreate)
  - [POST /payments/webhook/{provider}](#post-paymentswebhookprovider)
- [Contact](#contact)
  - [POST /contact](#post-contact)
  - [GET /contact/messages](#get-contactmessages)
- [Admin](#admin)
  - [GET /admin/audit](#get-adminaudit)
  - [GET /admin/analytics](#get-adminanalytics)
  - [PUT /admin/campaigns/{id}](#put-admincampaignsid)

---

## General

### Request Headers

All authenticated requests must include:

```
Authorization: Bearer <access_token>
Content-Type: application/json
X-Request-Id: <uuid>              # Optional, for tracing
```

### Response Format

All endpoints return a consistent envelope:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

Error response:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Amount must be greater than 0",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": null,
  "request_id": "req_a1b2c3d4e5f6"
}
```

### Rate Limiting

| Scope | Limit | Window |
|-------|-------|--------|
| Global | 1000 requests | per second |
| Per authenticated user | 60 requests | per minute |
| Per IP (unauthenticated) | 30 requests | per minute |
| Login | 10 requests | per minute per IP |

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1710892800
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Successful request |
| 201 | Created - Resource created |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource does not exist |
| 409 | Conflict - Duplicate resource |
| 422 | Unprocessable Entity - Business rule violation |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Authentication

### POST /auth/login

Authenticate a user and receive JWT tokens.

**Authentication:** Not required
**Rate Limit:** 10 requests/minute per IP

**Request Headers:**

```
Content-Type: application/json
```

**Request Body (Email/Password):**

```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd"
}
```

**Request Body (WeChat):**

```json
{
  "login_type": "wechat",
  "code": "wx_login_code_from_wx.login()"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes (for email login) | Registered email address |
| password | string | Yes (for email login) | User password (min 8 chars) |
| login_type | string | No | "wechat" for WeChat Mini Program login |
| code | string | Yes (for WeChat login) | Authorization code from wx.login() |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
    "token_type": "Bearer",
    "expires_in": 900,
    "user": {
      "id": "usr_abc123def456",
      "email": "user@example.com",
      "display_name": "Jane Doe",
      "role": "registered",
      "avatar_url": "https://cdn.tonghua.org/avatars/usr_abc123.jpg"
    }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| access_token | string | JWT access token (15 min expiry) |
| refresh_token | string | Opaque refresh token (7 day expiry) |
| token_type | string | Always "Bearer" |
| expires_in | int | Access token TTL in seconds (900) |
| user | object | User profile summary |

**Error Responses:**

401 - Invalid credentials:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Email or password is incorrect"
  }
}
```

429 - Rate limited:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many login attempts. Try again in 60 seconds."
  }
}
```

**Example curl:**

```bash
curl -X POST https://api.tonghua.org/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecureP@ssw0rd"
  }'
```

---

### POST /auth/refresh

Refresh an expired access token using a valid refresh token.

**Authentication:** Not required (refresh token in body)
**Rate Limit:** 20 requests/minute per IP

**Request Body:**

```json
{
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| refresh_token | string | Yes | Valid refresh token from login |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 900
  }
}
```

**Note:** The old refresh token is invalidated and a new one is issued (token rotation).

**Error Responses:**

401 - Invalid or expired refresh token:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Refresh token is invalid or expired. Please login again."
  }
}
```

**Example curl:**

```bash
curl -X POST https://api.tonghua.org/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
  }'
```

---

### POST /auth/logout

Invalidate the current access token and refresh token.

**Authentication:** Required (Bearer token)

**Request Headers:**

```
Authorization: Bearer <access_token>
```

**Success Response (200):**

```json
{
  "success": true,
  "data": { "message": "Logged out successfully" }
}
```

**Error Responses:**

401 - Token already expired or invalid:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token is already invalid or expired"
  }
}
```

**Example curl:**

```bash
curl -X POST https://api.tonghua.org/api/v1/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## Artworks

### GET /artworks

List published artworks with pagination and optional filtering.

**Authentication:** Not required
**Rate Limit:** 60 requests/minute per user, 30 requests/minute per IP

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | int | 1 | Page number (1-indexed) |
| per_page | int | 20 | Items per page (max 50) |
| campaign_id | string | - | Filter by campaign ID |
| sort | string | "-created_at" | Sort: "created_at", "-created_at", "vote_count", "-vote_count" |
| status | string | "approved" | Filter by status |

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "art_789xyz",
      "title": "Rainbow Village",
      "image_url": "https://cdn.tonghua.org/artworks/art_789xyz.jpg",
      "thumbnail_url": "https://cdn.tonghua.org/artworks/thumb_art_789xyz.jpg",
      "display_name": "Xiao M**",
      "campaign_title": "Spring 2026: Colors of Home",
      "vote_count": 342,
      "created_at": "2026-02-15T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 156,
    "total_pages": 8
  }
}
```

**Note:** Child artist names are always masked (surname + asterisks).

**Example curl:**

```bash
curl "https://api.tonghua.org/api/v1/artworks?page=1&per_page=10&sort=-vote_count"
```

---

### POST /artworks

Submit a new artwork for moderation. Requires authentication and guardian consent.

**Authentication:** Required (Bearer token)
**Rate Limit:** 10 requests/hour per user
**Content-Type:** `multipart/form-data`

**Request Body (multipart/form-data):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Artwork title (max 200 chars) |
| image | file | Yes | Image file (JPEG/PNG, max 10MB) |
| campaign_id | string | Yes | Campaign to submit to |
| child_display_name | string | Yes | Child's display name (NOT real name) |
| description | string | No | Artwork description (max 2000 chars) |
| guardian_consent | boolean | Yes | Must be true |

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "art_new123abc",
    "status": "pending",
    "message": "Artwork submitted for review"
  }
}
```

**Error Responses:**

400 - Invalid file type:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Only JPEG and PNG images are accepted"
  }
}
```

403 - Consent not provided:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "CONSENT_REQUIRED",
    "message": "Guardian consent has not been verified for this child participant"
  }
}
```

**Example curl:**

```bash
curl -X POST https://api.tonghua.org/api/v1/artworks \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -F "title=Rainbow Village" \
  -F "description=A colorful village scene" \
  -F "campaign_id=cmp_spring2026" \
  -F "child_display_name=Little Star" \
  -F "guardian_consent=true" \
  -F "image=@/path/to/artwork.jpg"
```

---

### GET /artworks/{id}

Get detailed information about a specific artwork.

**Authentication:** Not required
**Rate Limit:** 60 requests/minute per user, 30 requests/minute per IP

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Artwork ID |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "art_789xyz",
    "title": "Rainbow Village",
    "image_url": "https://cdn.tonghua.org/artworks/art_789xyz.jpg",
    "description": "A colorful depiction of our hometown",
    "display_name": "Xiao M**",
    "campaign": {
      "id": "cmp_spring2026",
      "title": "Spring 2026: Colors of Home"
    },
    "vote_count": 342,
    "has_voted": false,
    "related_products": [
      {
        "id": "prod_tshirt001",
        "title": "Rainbow Tote Bag",
        "price": 128.00,
        "image_url": "https://cdn.tonghua.org/products/prod_tshirt001.jpg"
      }
    ],
    "created_at": "2026-02-15T10:30:00Z"
  }
}
```

**Note:** `has_voted` is only accurate when the request includes a valid auth token.

**Error Responses:**

404 - Artwork not found or not published:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Artwork not found"
  }
}
```

**Example curl:**

```bash
curl "https://api.tonghua.org/api/v1/artworks/art_789xyz"
```

---

### POST /artworks/{id}/vote

Cast a vote for an artwork. One vote per user per artwork.

**Authentication:** Required (Bearer token)
**Rate Limit:** 60 requests/minute per user

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Artwork ID |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "vote_count": 343,
    "has_voted": true
  }
}
```

**Error Responses:**

400 - Already voted:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ALREADY_VOTED",
    "message": "You have already voted for this artwork"
  }
}
```

403 - Voting closed:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "Voting is closed for this campaign"
  }
}
```

**Example curl:**

```bash
curl -X POST https://api.tonghua.org/api/v1/artworks/art_789xyz/vote \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

### GET /artworks/{id}/status

Check the moderation status of an artwork. Only available to the artwork submitter.

**Authentication:** Required (Bearer token)
**Rate Limit:** 60 requests/minute per user

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Artwork ID |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "status": "approved",
    "reviewed_at": "2026-03-16T14:00:00Z",
    "review_note": null
  }
}
```

**Status values:** `pending`, `review`, `approved`, `rejected`, `featured`

**Error Responses:**

403 - Not the artwork submitter:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You can only check the status of your own submissions"
  }
}
```

**Example curl:**

```bash
curl "https://api.tonghua.org/api/v1/artworks/art_new123abc/status" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## Campaigns

### GET /campaigns

List all campaigns with pagination.

**Authentication:** Not required
**Rate Limit:** 60 requests/minute per user, 30 requests/minute per IP

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | int | 1 | Page number |
| status | string | "all" | Filter: "all", "active", "ended" |

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "cmp_spring2026",
      "title": "Spring 2026: Colors of Home",
      "theme": "Paint your hopes for the future",
      "cover_image_url": "https://cdn.tonghua.org/campaigns/cmp_spring2026.jpg",
      "start_date": "2026-03-01",
      "end_date": "2026-05-31",
      "status": "active",
      "artwork_count": 156,
      "max_artworks": 500
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 12,
    "total_pages": 1
  }
}
```

**Example curl:**

```bash
curl "https://api.tonghua.org/api/v1/campaigns?page=1&status=active"
```

---

### GET /campaigns/active

Get the currently active campaign (convenience endpoint).

**Authentication:** Not required
**Rate Limit:** 60 requests/minute per user, 30 requests/minute per IP

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "cmp_spring2026",
    "title": "Spring 2026: Colors of Home",
    "theme": "Paint your hopes for the future",
    "description": "Celebrate the vibrant colors of rural communities through children's art.",
    "cover_image_url": "https://cdn.tonghua.org/campaigns/cmp_spring2026.jpg",
    "start_date": "2026-03-01",
    "end_date": "2026-05-31",
    "status": "active",
    "artwork_count": 156,
    "max_artworks": 500,
    "vote_enabled": true
  }
}
```

**Error Responses:**

404 - No active campaign:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "There is no active campaign at this time"
  }
}
```

**Example curl:**

```bash
curl "https://api.tonghua.org/api/v1/campaigns/active"
```

---

### GET /campaigns/{id}

Get detailed information about a specific campaign, including featured artworks.

**Authentication:** Not required
**Rate Limit:** 60 requests/minute per user, 30 requests/minute per IP

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Campaign ID |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "cmp_spring2026",
    "title": "Spring 2026: Colors of Home",
    "theme": "Paint your hopes for the future",
    "description": "Celebrate the vibrant colors of rural communities...",
    "cover_image_url": "https://cdn.tonghua.org/campaigns/cmp_spring2026.jpg",
    "start_date": "2026-03-01",
    "end_date": "2026-05-31",
    "status": "active",
    "artwork_count": 156,
    "max_artworks": 500,
    "vote_enabled": true,
    "featured_artworks": [
      {
        "id": "art_789xyz",
        "title": "Rainbow Village",
        "image_url": "https://cdn.tonghua.org/artworks/thumb_art_789xyz.jpg",
        "vote_count": 342
      }
    ]
  }
}
```

**Error Responses:**

404 - Campaign not found:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Campaign not found"
  }
}
```

**Example curl:**

```bash
curl "https://api.tonghua.org/api/v1/campaigns/cmp_spring2026"
```

---

## Donations

### POST /donations/initiate

Initiate a charitable donation.

**Authentication:** Required (Bearer token)
**Rate Limit:** 10 requests/hour per user

**Request Body:**

```json
{
  "amount": 100.00,
  "currency": "CNY",
  "message": "For the children!",
  "is_anonymous": false,
  "payment_provider": "stripe"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| amount | decimal | Yes | Donation amount (validated server-side) |
| currency | string | Yes | ISO 4217: "CNY", "USD", "EUR", "GBP" |
| message | string | No | Donor message (max 500 chars) |
| is_anonymous | bool | No | Hide donor name from public listing |
| payment_provider | string | Yes | "wechat_pay", "alipay", "stripe", "paypal" |

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "donation_id": "don_qwerty123",
    "payment_client_secret": "pi_xxx_secret_yyy",
    "payment_provider": "stripe"
  }
}
```

**Error Responses:**

400 - Invalid amount:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Donation amount must be between 1.00 and 100000.00"
  }
}
```

**Example curl:**

```bash
curl -X POST https://api.tonghua.org/api/v1/donations/initiate \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "currency": "CNY",
    "payment_provider": "stripe",
    "is_anonymous": false
  }'
```

---

### GET /donations/{id}

Get details of a specific donation.

**Authentication:** Required (Bearer token, must be donor or admin)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Donation ID |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "don_qwerty123",
    "amount": 100.00,
    "currency": "CNY",
    "status": "completed",
    "message": "For the children!",
    "is_anonymous": false,
    "donor_name": "Jane D.",
    "created_at": "2026-03-15T10:30:00Z"
  }
}
```

**Status values:** `pending`, `processing`, `completed`, `failed`, `refunded`

**Error Responses:**

403 - Not the donor or admin:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You can only view your own donations"
  }
}
```

**Example curl:**

```bash
curl "https://api.tonghua.org/api/v1/donations/don_qwerty123" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

### GET /donations/{id}/certificate

Retrieve the donation certificate download URL.

**Authentication:** Required (Bearer token, must be donor or admin)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Donation ID |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "certificate_url": "https://cdn.tonghua.org/certs/don_qwerty123.pdf",
    "generated_at": "2026-03-15T11:00:00Z"
  }
}
```

**Error Responses:**

404 - Certificate not available:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Certificate is only available for completed donations"
  }
}
```

**Example curl:**

```bash
curl "https://api.tonghua.org/api/v1/donations/don_qwerty123/certificate" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## Products

### GET /products

List products in the sustainable fashion catalog.

**Authentication:** Not required
**Rate Limit:** 60 requests/minute per user, 30 requests/minute per IP

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | int | 1 | Page number |
| per_page | int | 20 | Items per page (max 50) |
| category | string | - | Filter by category |
| sort | string | "-created_at" | Sort: "created_at", "-created_at", "price", "-price" |
| min_price | decimal | - | Minimum price filter |
| max_price | decimal | - | Maximum price filter |

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "prod_tshirt001",
      "title": "Rainbow Tote Bag",
      "description": "Handcrafted from organic cotton...",
      "price": 128.00,
      "materials": "100% organic cotton, natural dyes",
      "sustainability_info": "GOTS certified, carbon neutral shipping",
      "welfare_contribution": 15.00,
      "image_urls": ["https://cdn.tonghua.org/products/prod_tshirt001_1.jpg"],
      "source_artwork": {
        "id": "art_789xyz",
        "title": "Rainbow Village",
        "display_name": "Xiao M**"
      },
      "stock": 45,
      "category": "bags"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 48,
    "total_pages": 3
  }
}
```

**Example curl:**

```bash
curl "https://api.tonghua.org/api/v1/products?category=bags&sort=-created_at"
```

---

### GET /products/{id}

Get detailed information about a product, including source artwork info.

**Authentication:** Not required
**Rate Limit:** 60 requests/minute per user, 30 requests/minute per IP

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Product ID |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "prod_tshirt001",
    "title": "Rainbow Tote Bag",
    "description": "Handcrafted from organic cotton...",
    "price": 128.00,
    "materials": "100% organic cotton, natural dyes",
    "sustainability_info": "GOTS certified, carbon neutral shipping",
    "welfare_contribution": 15.00,
    "image_urls": [
      "https://cdn.tonghua.org/products/prod_tshirt001_1.jpg",
      "https://cdn.tonghua.org/products/prod_tshirt001_2.jpg"
    ],
    "source_artwork": {
      "id": "art_789xyz",
      "title": "Rainbow Village",
      "display_name": "Xiao M**",
      "image_url": "https://cdn.tonghua.org/artworks/art_789xyz.jpg"
    },
    "stock": 45,
    "category": "bags",
    "traceability_available": true
  }
}
```

**Example curl:**

```bash
curl "https://api.tonghua.org/api/v1/products/prod_tshirt001"
```

---

### GET /products/{id}/traceability

Get the supply chain traceability data for a product.

**Authentication:** Not required
**Rate Limit:** 60 requests/minute per user, 30 requests/minute per IP

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Product ID |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "product_id": "prod_tshirt001",
    "records": [
      {
        "step": "Raw Material Sourcing",
        "date": "2026-01-15",
        "facility": "Organic Farm, Xinjiang",
        "description": "GOTS certified organic cotton",
        "verified": true,
        "blockchain_hash": "0xabc123..."
      },
      {
        "step": "Manufacturing",
        "date": "2026-02-10",
        "facility": "Green Textile Co., Shenzhen",
        "description": "Cut and sew with natural dyes",
        "verified": true,
        "blockchain_hash": "0xdef456..."
      }
    ]
  }
}
```

**Example curl:**

```bash
curl "https://api.tonghua.org/api/v1/products/prod_tshirt001/traceability"
```

---

## Orders

### POST /orders

Create a new order.

**Authentication:** Required (Bearer token)
**Rate Limit:** 20 requests/hour per user

**Request Body:**

```json
{
  "product_id": "prod_tshirt001",
  "quantity": 2,
  "shipping_address": {
    "name": "Jane Doe",
    "phone": "+86-138-xxxx-xxxx",
    "province": "Guangdong",
    "city": "Shenzhen",
    "district": "Nanshan",
    "address": "123 Tech Park Road",
    "postal_code": "518000"
  },
  "payment_provider": "wechat_pay"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| product_id | string | Yes | Product ID |
| quantity | int | Yes | Quantity (min 1, max 99) |
| shipping_address | object | Yes | Shipping address |
| payment_provider | string | Yes | "wechat_pay", "alipay", "stripe", "paypal" |

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "order_id": "ord_abc123def",
    "total_amount": 256.00,
    "currency": "CNY",
    "status": "pending_payment",
    "payment_client_secret": "pi_xxx_secret_yyy",
    "payment_provider": "wechat_pay"
  }
}
```

**Error Responses:**

400 - Invalid quantity:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Quantity must be between 1 and 99"
  }
}
```

422 - Out of stock:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Product prod_tshirt001 is out of stock"
  }
}
```

**Example curl:**

```bash
curl -X POST https://api.tonghua.org/api/v1/orders \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "prod_tshirt001",
    "quantity": 2,
    "shipping_address": {"name": "Jane Doe", "phone": "+86-138-xxxx-xxxx", "province": "Guangdong", "city": "Shenzhen", "district": "Nanshan", "address": "123 Tech Park Road", "postal_code": "518000"},
    "payment_provider": "wechat_pay"
  }'
```

---

### GET /orders/{id}

Get details of a specific order with status timeline.

**Authentication:** Required (Bearer token, must be order owner or admin)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Order ID |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "ord_abc123def",
    "product": {
      "id": "prod_tshirt001",
      "title": "Rainbow Tote Bag",
      "image_url": "https://cdn.tonghua.org/products/prod_tshirt001_1.jpg"
    },
    "quantity": 2,
    "unit_price": 128.00,
    "total_amount": 256.00,
    "currency": "CNY",
    "status": "paid",
    "shipping_address": {
      "name": "Jane Doe",
      "phone": "+86-138-xxxx-xxxx",
      "province": "Guangdong",
      "city": "Shenzhen",
      "district": "Nanshan",
      "address": "123 Tech Park Road",
      "postal_code": "518000"
    },
    "tracking_number": null,
    "created_at": "2026-03-15T10:30:00Z",
    "paid_at": "2026-03-15T10:30:15Z",
    "shipped_at": null
  }
}
```

**Status values:** `pending_payment`, `paid`, `shipped`, `delivered`, `completed`, `cancelled`, `refunded`

**Example curl:**

```bash
curl "https://api.tonghua.org/api/v1/orders/ord_abc123def" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## Supply Chain

### GET /supply-chain/{product_id}

Get all supply chain records for a product.

**Authentication:** Not required
**Rate Limit:** 60 requests/minute per user, 30 requests/minute per IP

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| product_id | string | Product ID |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "product_id": "prod_tshirt001",
    "records": [
      {
        "step": "Raw Material Sourcing",
        "date": "2026-01-15",
        "facility": "Organic Farm, Xinjiang",
        "description": "GOTS certified organic cotton",
        "verified": true,
        "blockchain_hash": "0xabc123..."
      }
    ]
  }
}
```

**Example curl:**

```bash
curl "https://api.tonghua.org/api/v1/supply-chain/prod_tshirt001"
```

---

### GET /supply-chain/{product_id}/timeline

Get supply chain records formatted as a chronological timeline for visualization.

**Authentication:** Not required
**Rate Limit:** 60 requests/minute per user, 30 requests/minute per IP

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| product_id | string | Product ID |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "product_id": "prod_tshirt001",
    "timeline": [
      {
        "date": "2026-01-15",
        "title": "Raw Material Sourced",
        "subtitle": "Organic Farm, Xinjiang",
        "description": "GOTS certified organic cotton harvested",
        "verified": true
      },
      {
        "date": "2026-02-10",
        "title": "Manufacturing Complete",
        "subtitle": "Green Textile Co., Shenzhen",
        "description": "Cut and sew with natural dyes",
        "verified": true
      }
    ]
  }
}
```

**Example curl:**

```bash
curl "https://api.tonghua.org/api/v1/supply-chain/prod_tshirt001/timeline"
```

---

## Payments

### POST /payments/create

Create a payment session/intent. Used internally by donation and order flows.

**Authentication:** Required (Bearer token)
**Rate Limit:** 20 requests/hour per user

**Request Body:**

```json
{
  "order_id": "ord_abc123def",
  "order_type": "product",
  "provider": "stripe",
  "amount": 256.00,
  "currency": "CNY"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| order_id | string | Yes | Order or Donation ID |
| order_type | string | Yes | "product" or "donation" |
| provider | string | Yes | "wechat_pay", "alipay", "stripe", "paypal" |
| amount | decimal | Yes | Amount (must match reference record) |
| currency | string | Yes | ISO 4217 currency code |

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "payment_id": "pay_stripe_abc456",
    "status": "created",
    "client_secret": "pi_xxx_secret_yyy",
    "provider": "stripe"
  }
}
```

**Error Responses:**

422 - Amount does not match reference:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Payment amount does not match the reference record"
  }
}
```

**Example curl:**

```bash
curl -X POST https://api.tonghua.org/api/v1/payments/create \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "don_qwerty123",
    "order_type": "donation",
    "provider": "stripe",
    "amount": 100.00,
    "currency": "CNY"
  }'
```

---

### POST /payments/webhook/{provider}

Receive payment provider callback notifications. This endpoint is called by payment providers, not by clients.

**Authentication:** Provider signature verification (not JWT)
**Rate Limit:** None (providers need reliable access)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| provider | string | "wechat_pay", "alipay", "stripe", "paypal" |

**Request Body (Stripe example):**

```json
{
  "id": "evt_stripe_123",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_stripe_456",
      "amount": 10000,
      "currency": "cny",
      "metadata": {
        "order_type": "donation",
        "order_id": "don_qwerty123"
      }
    }
  }
}
```

**Success Response (200):**

```json
{
  "received": true
}
```

**Note:** This endpoint:
1. Verifies the webhook signature from the provider
2. Processes the payment confirmation idempotently
3. Updates the referenced donation/order status
4. Triggers downstream actions (certificate generation, shipping, etc.)

**Error Responses:**

400 - Invalid signature:
```json
{
  "error": "Invalid signature"
}
```

---

## Contact

### POST /contact

Submit a contact form message.

**Authentication:** Not required
**Rate Limit:** 10 requests/hour per IP

**Request Body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "subject": "Partnership inquiry",
  "message": "I would like to discuss a potential partnership for our school district's art program."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Sender name (1-100 chars) |
| email | string | Yes | Sender email (5-255 chars) |
| subject | string | Yes | Message subject (1-200 chars) |
| message | string | Yes | Message body (10-5000 chars) |

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "message": "Contact form submitted successfully"
  }
}
```

**Error Responses:**

400 - Validation error:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Message must be at least 10 characters"
  }
}
```

**Example curl:**

```bash
curl -X POST https://api.tonghua.org/api/v1/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "subject": "Partnership inquiry",
    "message": "I would like to discuss a potential partnership for our school district art program."
  }'
```

---

### GET /contact/messages

List all contact form messages. Admin only in production.

**Authentication:** Required (Bearer token, admin role)
**Rate Limit:** 60 requests/minute per user

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "subject": "Partnership inquiry",
      "message": "I would like to discuss a potential partnership...",
      "created_at": "2026-03-21T10:30:00",
      "status": "unread"
    }
  ]
}
```

**Example curl:**

```bash
curl "https://api.tonghua.org/api/v1/contact/messages" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## Admin

### GET /admin/audit

Query audit logs with filtering.

**Authentication:** Required (Bearer token, admin role: ops_manager, compliance_officer, or super_admin)
**Rate Limit:** 60 requests/minute per user

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | int | 1 | Page number |
| per_page | int | 50 | Items per page (max 200) |
| user_id | string | - | Filter by acting user |
| action | string | - | Filter by action type |
| resource_type | string | - | Filter by resource: "user", "artwork", "donation", "campaign" |
| start_date | string | - | ISO 8601 start date |
| end_date | string | - | ISO 8601 end date |

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "aud_log_001",
      "user_id": "usr_admin_001",
      "action": "artwork.approve",
      "resource_type": "artwork",
      "resource_id": "art_new123abc",
      "details": {
        "previous_status": "pending",
        "new_status": "approved",
        "note": "Excellent artwork, approved for publication"
      },
      "ip_address": "192.168.1.100",
      "created_at": "2026-03-19T14:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 50,
    "total": 5240,
    "total_pages": 105
  }
}
```

**Example curl:**

```bash
curl "https://api.tonghua.org/api/v1/admin/audit?resource_type=artwork&start_date=2026-03-01" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

### GET /admin/analytics

Get platform analytics and statistics for the dashboard.

**Authentication:** Required (Bearer token, admin role)
**Rate Limit:** 10 requests/minute per user

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "total_donations": 158000.00,
    "total_artworks": 3420,
    "total_users": 12500,
    "total_orders": 8900,
    "active_campaign": {
      "id": "cmp_spring2026",
      "title": "Spring 2026: Colors of Home",
      "artwork_count": 156,
      "donation_total": 45000.00
    },
    "recent_donations": [
      {
        "id": "don_abc123",
        "amount": 100.00,
        "donor_name": "Anonymous",
        "created_at": "2026-03-19T14:00:00Z"
      }
    ]
  }
}
```

**Example curl:**

```bash
curl "https://api.tonghua.org/api/v1/admin/analytics" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

### PUT /admin/campaigns/{id}

Update campaign details (admin only).

**Authentication:** Required (Bearer token, admin role)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Campaign ID |

**Request Body:**

```json
{
  "title": "Spring 2026: Colors of Home (Extended)",
  "theme": "Updated theme description",
  "description": "Updated campaign description...",
  "end_date": "2026-06-30",
  "status": "active",
  "max_artworks": 1000,
  "vote_enabled": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | No | Updated title |
| theme | string | No | Updated theme |
| description | string | No | Updated description |
| end_date | string | No | Updated end date (YYYY-MM-DD) |
| status | string | No | "draft", "active", "ended", "archived" |
| max_artworks | int | No | Updated max artworks |
| vote_enabled | bool | No | Enable/disable voting |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "cmp_spring2026",
    "title": "Spring 2026: Colors of Home (Extended)",
    "theme": "Updated theme description",
    "end_date": "2026-06-30",
    "status": "active",
    "max_artworks": 1000,
    "vote_enabled": true
  }
}
```

**Error Responses:**

403 - Insufficient permissions:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "Only admins can update campaigns"
  }
}
```

**Example curl:**

```bash
curl -X PUT https://api.tonghua.org/api/v1/admin/campaigns/cmp_spring2026 \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Spring 2026: Colors of Home (Extended)",
    "end_date": "2026-06-30"
  }'
```

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `ALREADY_VOTED` | 400 | User already voted for this artwork |
| `CONSENT_REQUIRED` | 403 | Guardian consent not provided |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `PAYMENT_FAILED` | 402 | Payment processing failed |
| `INTERNAL_ERROR` | 500 | Server error |

---

*API Version: v1*
*Last updated: 2026-03-21*
