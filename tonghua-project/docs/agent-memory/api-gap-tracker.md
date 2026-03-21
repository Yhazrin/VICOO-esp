# API 缺口追踪 — Agent 持久化记忆

> 最后更新: 2026-03-21
> 追踪前端调用与后端端点之间的差距

## 前端 API 调用映射

### 前端 services 目录
路径: `tonghua-project/frontend/web-react/src/services/`

| Service 文件 | 调用的 API 方法 | 后端端点状态 |
|-------------|----------------|-------------|
| auth.ts | login, register, refreshToken, wxLogin, getMe | ✅ 全部存在 |
| artworks.ts | getAll, getById, create, vote, getFeatured | ✅ 全部存在 |
| campaigns.ts | getAll, getById, getFeatured | ✅ 全部存在 |
| donations.ts | create, getMyDonations, getStats, getTiers | ✅ 全部存在 |
| products.ts | getAll, getById, getFeatured | ✅ 全部存在 |
| orders.ts | create, getMyOrders, getById, cancel | ✅ 全部存在 |
| payments.ts | createWechatPay, createAlipayPay, createStripePay | ✅ 全部存在 |

## 后端端点完整清单

```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/refresh
POST   /api/v1/auth/wx-login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me

GET    /api/v1/users
GET    /api/v1/users/{id}
PUT    /api/v1/users/{id}
DELETE /api/v1/users/{id}

GET    /api/v1/artworks
GET    /api/v1/artworks/featured        ← 新增
GET    /api/v1/artworks/{id}
POST   /api/v1/artworks
PUT    /api/v1/artworks/{id}
DELETE /api/v1/artworks/{id}
POST   /api/v1/artworks/{id}/vote
PUT    /api/v1/artworks/{id}/status     ← 已加 admin 认证

GET    /api/v1/campaigns
GET    /api/v1/campaigns/featured       ← 新增
GET    /api/v1/campaigns/{id}
POST   /api/v1/campaigns
PUT    /api/v1/campaigns/{id}
DELETE /api/v1/campaigns/{id}

POST   /api/v1/donations
GET    /api/v1/donations
GET    /api/v1/donations/stats
GET    /api/v1/donations/tiers          ← 新增
GET    /api/v1/donations/mine           ← 新增 (需认证)

GET    /api/v1/products
GET    /api/v1/products/featured        ← 新增
GET    /api/v1/products/{id}
POST   /api/v1/products
PUT    /api/v1/products/{id}
DELETE /api/v1/products/{id}

POST   /api/v1/orders
GET    /api/v1/orders
GET    /api/v1/orders/mine              ← 新增 (需认证)
GET    /api/v1/orders/{id}
POST   /api/v1/orders/{id}/cancel       ← 新增 (需认证)

POST   /api/v1/payments/wechat
POST   /api/v1/payments/alipay
POST   /api/v1/payments/stripe

GET    /api/v1/admin/dashboard
GET    /api/v1/admin/users

GET    /api/v1/supply-chain
GET    /api/v1/supply-chain/{id}
POST   /api/v1/supply-chain

POST   /api/v1/contact
GET    /api/v1/contact/messages         ← 已加 admin 认证

GET    /health
```

## 已解决的问题

| # | 问题 | 修复日期 |
|---|------|---------|
| 1 | GET /artworks/featured 缺失 | 2026-03-21 |
| 2 | GET /campaigns/featured 缺失 | 2026-03-21 |
| 3 | GET /donations/tiers 缺失 | 2026-03-21 |
| 4 | GET /donations/mine 缺失 | 2026-03-21 |
| 5 | GET /products/featured 缺失 | 2026-03-21 |
| 6 | GET /orders/mine 缺失 | 2026-03-21 |
| 7 | POST /orders/{id}/cancel 缺失 | 2026-03-21 |
| 8 | PUT /artworks/{id}/status 无认证 | 2026-03-21 |
| 9 | GET /contact/messages 无认证 | 2026-03-21 |
