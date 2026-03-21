# 代码库索引 — Agent 持久化记忆

> 最后更新: 2026-03-21
> 每次循环只需读本文件 + git diff，无需全量扫描。

## 前端页面清单

| 页面 | 文件路径 | 编辑风格级别 | Editorial 组件使用 |
|------|----------|-------------|-------------------|
| Home | `pages/Home/index.tsx` | ⭐⭐⭐⭐⭐ Gold Standard | 全部核心组件 |
| About | `pages/About/index.tsx` | ⭐⭐⭐⭐ | EditorialHero, NumberedSectionHeading, SepiaImageFrame, StoryQuoteBlock |
| Campaigns | `pages/Campaigns/index.tsx` | ⭐⭐⭐⭐ | EditorialHero, NumberedSectionHeading, SepiaImageFrame |
| CampaignDetail | `pages/CampaignDetail.tsx` | ⭐⭐⭐⭐ | BleedTitleBlock, NumberedSectionHeading, StoryQuoteBlock, PaperTextureBackground, DonationPanel, ArtworkCard |
| Stories | `pages/Stories/index.tsx` | ⭐⭐⭐⭐⭐ | EditorialHero, NumberedSectionHeading, SepiaImageFrame, StoryQuoteBlock, PagePeel, KineticTextMarquee, VintageInput |
| Shop | `pages/Shop/index.tsx` | ⭐⭐⭐⭐ | EditorialHero, NumberedSectionHeading, ProductCard, SepiaImageFrame, StoryQuoteBlock, VintageSelect |
| ProductDetail | `pages/ProductDetail.tsx` | ⭐⭐⭐⭐ | NumberedSectionHeading, SepiaImageFrame, PaperTextureBackground, TraceabilityTimeline, ImageSkeleton |
| Donate | `pages/Donate/index.tsx` | ⭐⭐⭐⭐⭐ | EditorialHero, NumberedSectionHeading, StoryQuoteBlock, SepiaImageFrame, DonationPanel, ImpactCounter, FAQAccordion, MagneticButton |
| Traceability | `pages/Traceability/index.tsx` | ⭐⭐⭐⭐⭐ | EditorialHero, NumberedSectionHeading, SepiaImageFrame, StoryQuoteBlock, ScrollPathDrawInline |
| Contact | `pages/Contact/index.tsx` | ⭐⭐⭐⭐⭐ | EditorialHero, NumberedSectionHeading, SepiaImageFrame, VintageInput, FAQAccordion |
| Profile | `pages/Profile/index.tsx` | ⭐⭐⭐ | NumberedSectionHeading, PaperTextureBackground |
| Login | `pages/Login/index.tsx` | ⭐⭐ | GrainOverlay, VintageInput |
| Register | `pages/Register/index.tsx` | ⭐⭐ | GrainOverlay, VintageInput |
| NotFound | `pages/NotFound/index.tsx` | ⭐⭐⭐⭐ | PaperTextureBackground, GrainOverlay, motion animations with reduced-motion guard, corner accents |
| ArtworkDetail | `pages/ArtworkDetail.tsx` | ⭐⭐⭐⭐ | BleedTitleBlock, NumberedSectionHeading, SepiaImageFrame, StoryQuoteBlock |

## 前端组件清单

### Editorial 组件 (19个)
路径: `src/components/editorial/`

| 组件 | 文件 | 用途 | 被哪些页面使用 |
|------|------|------|---------------|
| EditorialHero | EditorialHero.tsx | 刊首式标题区 | Home, Campaigns, Stories, Shop, Donate, Traceability, Contact |
| NumberedSectionHeading | NumberedSectionHeading.tsx | 带序号的章节标题 | 几乎所有页面 |
| BleedTitleBlock | BleedTitleBlock.tsx | 溢出视口标题 | Home, CampaignDetail, ArtworkDetail |
| SepiaImageFrame | SepiaImageFrame.tsx | 棕褐色图片框 | 多个页面 |
| PaperTextureBackground | PaperTextureBackground.tsx | 纸张纹理背景 | ProductDetail, Profile, CampaignDetail, NotFound |
| GrainOverlay | GrainOverlay.tsx | 颗粒噪点叠加 | Login, Register, Home, NotFound |
| StoryQuoteBlock | StoryQuoteBlock.tsx | 故事引用块 | 多个页面 |
| DonationPanel | DonationPanel.tsx | 捐赠面板 | CampaignDetail, Donate |
| TraceabilityTimeline | TraceabilityTimeline.tsx | 溯源时间线 | ProductDetail |
| ArtworkCard | ArtworkCard.tsx | 作品卡片 | CampaignDetail, Campaigns |
| ProductCard | ProductCard.tsx | 商品卡片 | Shop |
| EditorialFooter | EditorialFooter.tsx | 编辑式页脚 | App.tsx (全局) |
| ImageSkeleton | ImageSkeleton.tsx | 图片加载骨架 | ProductDetail, CampaignDetail |
| FAQAccordion | FAQAccordion.tsx | FAQ 手风琴 | Donate, Contact |
| ImpactCounter | ImpactCounter.tsx | 影响力计数器 | Donate |
| MagneticButton | MagneticButton.tsx | 磁性按钮 | Donate |
| ScrollPathDrawInline | ScrollPathDrawInline.tsx | SVG 路径绘制 | Traceability |
| VintageInput | VintageInput.tsx | 复古输入框 | Login, Register, Contact, Stories |
| VintageSelect | VintageSelect.tsx | 复古下拉框 | Shop |

### 未被使用的 Editorial 组件
| 组件 | 文件 | 状态 |
|------|------|------|
| EditorialCard | EditorialCard.tsx | ❌ 未被任何页面使用 |
| MagazineDivider | MagazineDivider.tsx | ❌ 未被任何页面使用 |

### Animation 组件 (9个)
路径: `src/components/animation/`

| 组件 | 状态 |
|------|------|
| KineticMarquee | ❌ 未被使用 |
| TiltCard | ❌ 未被使用 |
| PagePeel | ✅ Stories 页面使用 |
| KineticTextMarquee | ✅ Stories 页面使用 |
| 其他 5 个 | 需检查 |

## Tailwind 配置

**文件**: `tailwind.config.js`
**已有颜色 (28个)**: paper, aged-stock, warm-gray, ink, ink-faded, ink-light, sepia-mid, sepia-dark, sepia-light, rust, rust-light, rust-dark, archive-brown, pale-gold, pale-gold-light, sepia-on-dark, muted-gray, cream, eco-green, editorial-red, editorial-navy, editorial-olive, editorial-burgundy, success, error, warning, info

**状态**: ✅ 已与 tokens.css 完全同步

## 后端 API 清单

**文件**: `backend/app/main.py` — 11 个路由注册在 `/api/v1`

| 路由文件 | 前缀 | 端点 |
|----------|------|------|
| routers/auth.py | /auth | login, register, refresh, wx-login, logout, me |
| routers/users.py | /users | CRUD |
| routers/artworks.py | /artworks | CRUD + vote + **featured** + status (admin) |
| routers/campaigns.py | /campaigns | CRUD + **featured** |
| routers/donations.py | /donations | create, list, stats, **tiers**, **mine** |
| routers/products.py | /products | CRUD + **featured** |
| routers/orders.py | /orders | create, list, **mine**, **cancel** |
| routers/payments.py | /payments | wechat, alipay, stripe |
| routers/admin.py | /admin | dashboard, users |
| routers/supply_chain.py | /supply-chain | CRUD |
| routers/contact.py | /contact | submit, messages (admin) |

**API 缺口**: ✅ 全部已补齐

## 已知问题清单

见 `improvement-tracker.md`

## API 缺口追踪

见 `api-gap-tracker.md`
