# 2026-04-24 更新记录：搜索、AI 与购物车体验完善

## 变更范围
- 前端搜索路由与交互（Header / Shop / ImpactShop）
- AI 助手问询流程与输入体验（前端 + 后端）
- 购物车与结算页“继续购物”跳转语义修复

## Phase 1：搜索功能完善

### 1) 搜索提交按当前模式跳转
- 文件：`frontend/web-react/src/components/layout/Header.tsx`
- 调整：
  - 搜索提交不再固定跳转 `/shop`。
  - 现在按当前模式路由：
    - Uniqlo -> `/shop?search=...`
    - Impact -> `/impact/shop?search=...`

### 2) Header 搜索框不再覆盖导航字段
- 文件：`frontend/web-react/src/components/layout/Header.tsx`
- 调整：
  - 搜索输入框从“绝对定位覆盖”改为“流式占位横向展开”。
  - 展开时右侧控件会自然让位，不再挡住 header 字段。
  - 增加搜索区域外点击收起逻辑，保留 ESC 收起与焦点行为。

### 3) 中英文同义匹配搜索
- 新增：`frontend/web-react/src/utils/productSearch.ts`
- 接入：
  - `frontend/web-react/src/pages/Shop/index.tsx`
  - `frontend/web-react/src/pages/ImpactShop/index.tsx`
- 说明：
  - 新增统一搜索归一化与同义词匹配（如 `T-shirt/T恤`、`bag/包`、`clothes/衣物`）。
  - `ImpactShop` 新增对 `?search=` 参数的读取与过滤支持。

## Phase 2：AI 功能完善

### 1) 未指定来源时先追问 Uniqlo / Impact
- 文件：`backend/app/services/ai_assistant/service.py`
- 调整：
  - 新增规则分流：当用户提出“推荐/找商品/包/衣物”等需求且未明确来源时，优先返回追问（Uniqlo 还是 Impact）。
  - 强化系统提示词：强调中英同义理解、站内数据库优先、链接化推荐输出。

### 2) AI 检索中英同义能力增强
- 文件：`backend/app/services/ai_assistant/service.py`
- 调整：
  - `_extract_search_terms` 增强：处理中英同义词扩展（如 `tshirt -> t恤/短袖`，`bag -> 包/袋/帆布包`）。
  - 商品检索与 RAG 检索由“逐词 AND”改为更宽容的 OR 匹配，提高召回率。
  - 检索条件加入 `name_en/description_en` 字段匹配。

### 3) AI 对话中断（Stop Generating）
- 文件：
  - `frontend/web-react/src/services/aiAssistant.ts`
  - `frontend/web-react/src/pages/AiAssistant/index.tsx`
  - `frontend/web-react/src/i18n/zh.json`
  - `frontend/web-react/src/i18n/en.json`
- 调整：
  - `chat` API 增加 `AbortSignal` 支持。
  - 页面层新增 `AbortController`，支持中断当前生成。
  - loading 时显示“停止生成 / Stop generating”按钮。

### 4) 中文输入法回车误发送修复
- 文件：`frontend/web-react/src/pages/AiAssistant/index.tsx`
- 调整：
  - 发送条件改为：`Enter + 非 Shift + 非 isComposing`，避免中文输入法组合态回车误触发送。

### 测试补充（按要求在已有文件中追加）
- 文件：`backend/tests/api-tests/test_ai_catalog_routing.py`
- 新增测试：
  - 未指定来源时触发追问逻辑
  - 已指定 Uniqlo/Impact 时不追问
  - `T-shirt` 关键词扩展为同义词检索词

## Phase 3：购物车“继续购物”跳转修复

- 文件：
  - `frontend/web-react/src/components/cart/CartDrawer.tsx`
  - `frontend/web-react/src/pages/Checkout/index.tsx`
- 调整：
  - “继续购物”不再固定 `/shop`。
  - 按当前 `impactMode` 动态跳转到：
    - Uniqlo -> `/shop`
    - Impact -> `/impact/shop`

## 数据库迁移说明
- 本次改动未涉及数据库 schema 变更，无需新增 Alembic 迁移文件。
- 所有改动为前端交互、后端 AI 逻辑与测试补充，不影响现有 CI/CD 迁移链路。

## 本次执行的验证
- 前端构建：`frontend/web-react` 执行 `npm run build` 通过。
- 后端测试：在现有 conda 环境 `vicoo-ai-test` 执行
  `pytest tests/api-tests/test_ai_catalog_routing.py -q` 通过（9 passed）。
