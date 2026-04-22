# 022 · Impact 公益商品虚拟溯源改造记录

## 文档信息

- 生成时间：2026-04-22 23:30:08 +0800
- 核查分支：`main`
- 关联实现分支：`ht-product`
- 关联提交：`369f1ed`（2026-04-22 18:51:11 +0800）

## 时间线（时间 + 修改内容）

| 时间 | 修改内容 |
|---|---|
| 2026-04-22 18:51:11 +0800 | 在 `ht-product` 提交 `369f1ed`，完成 Impact 商品“虚拟溯源故事”全链路改造（数据库、后端 API、前端详情页、Admin 上架页、测试）。 |
| 2026-04-22 23:30:08 +0800 | 在 `main` 分支核查数据库当前状态，确认 `backend/test.db` 中 Impact 商品已写入故事与产地字段；同时记录本次改造文档。 |

## 本次改造新增/修改内容

### 1. 数据库与模型（Backend）

**新增表**
- `countries`：国家字典（如 `CN` / `JP` / `GLOBAL`）
- `regions`：地区字典（关联 `country_id`，如新疆阿克苏、东京、全球棉花节点）

**products 新增字段**
- `origin_country_id`（INTEGER, FK -> countries.id）
- `origin_region_id`（INTEGER, FK -> regions.id）
- `trace_story_title`（VARCHAR(300)）
- `trace_story_content`（TEXT）

**相关文件**
- 新增：`backend/alembic/versions/d9e8f1a2b3c4_add_origin_story_fields.py`
- 新增：`backend/app/models/country.py`
- 新增：`backend/app/models/region.py`
- 修改：`backend/app/models/product.py`
- 修改：`backend/app/models/__init__.py`
- 修改：`backend/alembic/env.py`

### 2. 后端接口与防错逻辑

**新增字典接口**
- `GET /api/v1/products/origins/countries`
- `GET /api/v1/products/origins/regions?country_id=...`

**商品写入逻辑增强**
- `POST/PUT /api/v1/products` 支持写入上述 origin/story 字段
- 新增 `region-country` 一致性校验，避免跨国家地区错配导致前端显示异常

**相关文件**
- 修改：`backend/app/routers/products.py`
- 修改：`backend/app/schemas/product.py`
- 修改：`backend/app/schemas/__init__.py`

### 3. 种子与回填（虚拟故事内容）

**新增**
- `backend/app/data/impact_origin_story_seed.py`（国家/地区与 Impact 商品故事映射）
- `backend/app/backfill_impact_origin_story.py`（历史数据回填脚本）

**修改**
- `backend/app/seed.py`
- `backend/app/add_impact_products_demo.py`

### 4. 前端商品详情页（web-react）

**改动**
- 商品详情页新增“溯源故事”展示区（标题 + 正文）
- 增加 origin/story 字段类型与 API 映射，避免空字段结构导致渲染异常

**相关文件**
- 修改：`frontend/web-react/src/pages/ProductDetail.tsx`
- 修改：`frontend/web-react/src/services/products.ts`
- 修改：`frontend/web-react/src/types/index.ts`

### 5. Admin 上架商品页

**新增能力**
- 新增商品管理页面，管理员可填写与提交公益商品信息（包含国家、地区、溯源故事）
- 补齐路由、导航、面包屑、多语言文案与 API 类型定义

**相关文件**
- 新增：`admin/src/pages/ProductPage.tsx`
- 修改：`admin/src/App.tsx`
- 修改：`admin/src/components/layout/Sidebar.tsx`
- 修改：`admin/src/components/layout/Breadcrumb.tsx`
- 修改：`admin/src/services/api.ts`
- 修改：`admin/src/types/index.ts`
- 修改：`admin/src/i18n/zh.json`
- 修改：`admin/src/i18n/en.json`

### 6. 测试

**新增测试**
- `backend/tests/api-tests/test_product_origin_story.py`
  - 覆盖 origins 字典接口
  - 覆盖商品创建含 origin/story 字段
  - 覆盖 `country-region mismatch` 返回 400

**相关文件**
- 新增：`backend/tests/api-tests/test_product_origin_story.py`
- 修改：`backend/tests/conftest.py`

## main 分支数据库核查结果（展示）

> 核查库：`backend/test.db`

### A. products 中已存在溯源字段

- `origin_country_id`
- `origin_region_id`
- `trace_story_title`
- `trace_story_content`

### B. Impact 商品字段填充统计

| 指标 | 数值 |
|---|---|
| impact_total | 10 |
| title_filled | 10 |
| content_filled | 10 |
| country_filled | 10 |
| region_filled | 10 |

### C. 示例（前 5 条 Impact 商品）

| id | name | origin_country_id | origin_region_id | trace_story_title |
|---|---|---:|---:|---|
| 1 | 彩虹鱼棉质 T 恤 | 1 | 1 | 从中国棉田到东京展柜 |
| 2 | 星星之夜帆布袋 | 3 | 5 | 全球棉源与在地再造 |
| 3 | 春天的花园丝巾 | 2 | 4 | 儿童艺术在东京被看见 |
| 4 | 妈妈的手环保笔记本 | 1 | 2 | 中国棉花与全球公益协作 |
| 5 | 太空旅行马克杯 | 1 | 2 | 中国棉花与全球公益协作 |

## 备注

- 同次核查中发现：根目录 `test.db` 尚未包含上述新增字段；当前已填充并可演示的数据位于 `backend/test.db`。
