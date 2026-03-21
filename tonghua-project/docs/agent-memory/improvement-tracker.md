# 优化追踪 — Agent 持久化记忆

> 最后更新: 2026-03-21
> 状态: pending | in_progress | done | skip

## 高优先级

| # | 问题 | 文件 | 状态 | 完成日期 |
|---|------|------|------|----------|
| 1 | NotFound 页面无 editorial 处理 | pages/NotFound/index.tsx | done | 2026-03-21 |
| 2 | DonationStoryCard reduced-motion bug (initial 未 guard) | pages/Donate/index.tsx:170 | done | 2026-03-21 |
| 3 | AnimatedCounter 缺少 reduced-motion guard | pages/Traceability/index.tsx | done | 2026-03-21 |
| 4 | Contact 页面 inline FAQ 替换为 FAQAccordion | pages/Contact/index.tsx | done | 2026-03-21 |
| 5 | Tailwind 缺失 17 个颜色 token | tailwind.config.js | done | 2026-03-21 |
| 6 | 后端 PUT /artworks/{id}/status 缺少认证 | backend/app/routers/artworks.py | done | 2026-03-21 |
| 7 | 后端 GET /contact/messages 缺少认证 | backend/app/routers/contact.py | done | 2026-03-21 |

## 中优先级

| # | 问题 | 文件 | 状态 | 完成日期 |
|---|------|------|------|----------|
| 8 | 后端缺少 GET /artworks/featured | backend/app/routers/artworks.py | done | 2026-03-21 |
| 9 | 后端缺少 GET /campaigns/featured | backend/app/routers/campaigns.py | done | 2026-03-21 |
| 10 | 后端缺少 GET /donations/tiers | backend/app/routers/donations.py | done | 2026-03-21 |
| 11 | 后端缺少 GET /donations/mine | backend/app/routers/donations.py | done | 2026-03-21 |
| 12 | 后端缺少 GET /products/featured | backend/app/routers/products.py | done | 2026-03-21 |
| 13 | 后端缺少 GET /orders/mine | backend/app/routers/orders.py | done | 2026-03-21 |
| 14 | 后端缺少 POST /orders/{id}/cancel | backend/app/routers/orders.py | done | 2026-03-21 |
| 15 | EditorialCard 组件未被使用，评估是否需要 | components/editorial/EditorialCard.tsx | pending | |
| 16 | MagazineDivider 组件未被使用，评估是否需要 | components/editorial/MagazineDivider.tsx | pending | |

## 低优先级（i18n 相关）

| # | 问题 | 文件 | 状态 | 完成日期 |
|---|------|------|------|----------|
| 17 | Traceability 大量硬编码英文 | pages/Traceability/index.tsx | pending | |
| 18 | Shop 硬编码英文 (sustainability pillars, quote) | pages/Shop/index.tsx | pending | |
| 19 | Donate 硬编码英文 (impact labels, transparency) | pages/Donate/index.tsx | pending | |
| 20 | Stories 硬编码英文 (quotes, mock stories) | pages/Stories/index.tsx | pending | |
| 21 | Contact 硬编码英文 (section titles, labels) | pages/Contact/index.tsx | pending | |

## 已完成

| # | 问题 | 文件 | 完成日期 |
|---|------|------|----------|
| 1 | NotFound 页面 editorial 升级 (PaperTexture, Grain, animations, corner accents) | pages/NotFound/index.tsx | 2026-03-21 |
| 2 | DonationStoryCard reduced-motion guard | pages/Donate/index.tsx | 2026-03-21 |
| 3 | AnimatedCounter reduced-motion guard | pages/Traceability/index.tsx | 2026-03-21 |
| 4 | Contact FAQ 替换为 FAQAccordion | pages/Contact/index.tsx | 2026-03-21 |
| 5 | Tailwind 补全 17 个颜色 token | tailwind.config.js | 2026-03-21 |
| 6 | PUT /artworks/{id}/status 添加 admin 认证 | backend/app/routers/artworks.py | 2026-03-21 |
| 7 | GET /contact/messages 添加 admin 认证 | backend/app/routers/contact.py | 2026-03-21 |
| 8-14 | 7 个缺失后端端点全部补全 | 各 router 文件 | 2026-03-21 |
