# 024 · AI 助手分场景视觉改造与推荐路由增强

**日期：** 2026-04-23  
**范围：** 前端 AI 悬浮球 + 后端 AI 提示词/检索路由 + 测试

---

## 1. 本次目标

1. 在 Uniqlo 页面与 Impact 页面提供不同风格的 AI 悬浮球与对话窗口。  
2. 强化 AI 提示词与检索策略，让 AI 能根据页面语境 + 用户关键词进行商品推荐路由，并返回可访问链接。

---

## 2. 前端改动（视觉与可读性）

### 2.1 分场景 UI 主题（Uniqlo vs Impact）

**文件：** `frontend/web-react/src/components/layout/AIAssistantBall.tsx`

- 新增主题配置 `getAssistantTheme(isImpactSurface)`，按场景切换：
  - **Uniqlo 语境**：蓝/靛色系
  - **Impact 语境**：绿/青色系
- 悬浮球、对话窗头部、消息气泡、建议按钮、输入区、发送按钮统一按主题切换。
- 浮球标签在 Impact 场景显示 `AI+`，增强模式辨识度。

### 2.2 亮色可见性优化

**文件：** `frontend/web-react/src/components/layout/AIAssistantBall.tsx`

- 将消息文本、占位符、空态文案、输入区文字统一改为高对比亮色方案。  
- 提升深色背景下的可读性，避免“看不清字”的问题。

### 2.3 元数据增强

**文件：** `frontend/web-react/src/config/aiAssistantScenarios.ts`

- `getAIAssistantMetadata` 增加：
  - `preferredCatalog`
  - `sustainabilityPriorityKeywords`
- `surface` 判断从“仅 impactMode”升级为“impactMode + route（如 `/impact/...`）”，避免场景识别偏差。

---

## 3. 后端改动（提示词 + 工具检索 + RAG）

**文件：** `backend/app/services/ai_assistant/service.py`

### 3.1 系统提示词升级

- 明确平台路由规则：
  - Uniqlo 语境默认推荐常规商品 `/shop/{id}`
  - Impact 语境默认推荐公益商品 `/impact/shop/{id}`
  - 若用户强调“可持续/公益/环保/捐赠/sustainable/impact/charity”，优先切换到 Impact 推荐
- 要求推荐尽量附带链接与理由（材质/价格/公益比例/溯源等）。

### 3.2 新增路由决策与关键词解析能力

- 新增方法：
  - `_get_last_user_message`
  - `_contains_sustainability_intent`
  - `_determine_catalog_scope`
  - `_extract_search_terms`
  - `_build_product_url`
- 在 `get_chat_completion` 中先判定 `catalog_scope`，再驱动工具检索和 RAG。

### 3.3 工具检索与 RAG 按语境执行

- `_maybe_call_tools(...)` 增加 `catalog_scope` 参数，按语境检索对应商品库。  
- `_retrieve_rag(...)` 增加 `catalog_scope` 参数，优先返回当前场景相关结果。  
- 搜索结果中增加站点链接（由 `FRONTEND_URL` 拼接绝对地址）。

### 3.4 无 OpenAI Key 时的降级优化

- 演示模式下优先返回“工具检索/RAG”结果，而不是固定模板文案，确保仍有可用推荐信息。

---

## 4. 新增测试

**文件：** `backend/tests/api-tests/test_ai_catalog_routing.py`

覆盖点：

1. Uniqlo 语境默认走常规商品。  
2. “可持续/公益”关键词触发 Impact 优先。  
3. `/impact/...` 路由语境识别。  
4. 生成商品链接路径正确（`/shop/{id}` vs `/impact/shop/{id}`）。

---

## 5. 变更文件清单

- `frontend/web-react/src/components/layout/AIAssistantBall.tsx`
- `frontend/web-react/src/config/aiAssistantScenarios.ts`
- `backend/app/services/ai_assistant/service.py`
- `backend/tests/api-tests/test_ai_catalog_routing.py`
- `docs/update/024-ai-surface-routing-and-ui-theme.md`
