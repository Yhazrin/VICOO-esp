# 2026-04-22 — 已完成：AI 助手集成（Phase1~Phase3）

本文档列出截至 2026-04-22 已在项目中完成的 AI 集成功能、提示词样例、前后端接入方式、可实现的功能与实现建议。

---

## 一、已完成的功能（概览）

- Phase 1 — 工具化 AI 层（已实现）
  - 在后端 AIAssistantService 中实现安全、只读的工具调用层（_maybe_call_tools）。前端通过 metadata（如 product_id、impactMode、route）传入确定性触发。
  - 前端接入点：浮动助手 AIAssistantBall（src/components/layout/AIAssistantBall.tsx），以及独立页面 AiAssistant（src/pages/AiAssistant/index.tsx）。

- Phase 2 — Impact RAG（已实现，轻量型 SQL 检索）
  - 后端实现 _retrieve_rag(query, context)：对 products、campaigns、supply_chain_records 做基于关键词的 SQL 检索，并将短 snippet 注入 system prompt。
  - 用于 grounding（避免幻觉），适配场景：impact/shop/sustainability

- Phase 3 — 反馈闭环（已实现）
  - 新增 /api/v1/ai/feedback 接口，用于用户对 AI 回复进行“有帮助 / 无帮助”的反馈。
  - 后端 AIAssistantService.record_feedback：当用户标记为“无帮助”时，自动生成 ContactMessage（人工跟进），并返回 escalated:true 与 contact_id。
  - 前端在助手中为 AI 回复添加 👍 / 👎 按钮，调用 aiAssistantApi.feedback。
  - 场景化快捷入口已接入：Impact / UNIQLO / 商品详情页会展示不同快捷提问模板。
  - 新增 /api/v1/admin/analytics/ai，用于查看 AI rollout 的会话、反馈与人工升级指标。

---

## 二、关键文件与位置

- 后端
  - app/services/ai_assistant/service.py — 核心：SYSTEM_PROMPT、get_chat_completion、_maybe_call_tools、_retrieve_rag、record_feedback
  - app/routers/ai_assistant.py — 新增 /ai/feedback 路由
  - app/schemas/circular_commerce.py — 新增 AIFeedbackRequest、AIChatResponse

- 前端
  - frontend/web-react/src/components/layout/AIAssistantBall.tsx — 浮动助手、反馈按钮
  - frontend/web-react/src/pages/AiAssistant/index.tsx — 独立助手页（支持 prefill + metadata）
  - frontend/web-react/src/services/aiAssistant.ts — 新增 chat / feedback client 方法

- 测试
  - backend/tests/api-tests/test_ai_feedback.py — 覆盖反馈接口（帮助/无帮助并检查升级）

---

## 三、后端提示词（System prompt）示例

已注入到 LLM 的 system prompt（节选）:

```
你是「Uniqlo × VICOO 公益·公益行动」平台的助手。语气温暖、克制、具有人文关怀。
帮助用户理解：衣物捐献流程、商品与溯源、订单与物流、捐赠与售后、可持续实践。
如果你发现用户询问的是具体的订单或捐赠记录，请告知他们你可以看到基础状态，但不要泄露详细隐私信息。
涉及儿童信息、支付与法律问题时提醒用户以站内条款与客服为准。
```

系统还会在 prompt 中附加：
- [Tool Output] — 来自 _maybe_call_tools 的事实性数据（例如 product 概要、supply-chain timeline、impact search 列表）
- [Retrieval Results] — 来自 _retrieve_rag 的短 snippet（source tag + url hint）

提示词使用建议：要求模型在回答中“引用来源并基于 [Tool Output]/[Retrieval Results] 回答，避免主观臆断”。例如：

```
请基于以上 [Tool Output] 和 [Retrieval Results] 给出 1) 简短结论 2) 事实依据（列出处）3) 推荐的下一步操作（若适用）。
```

---

## 四、API 使用说明（示例）

1) 聊天接口（RAG + metadata 支持）

- Endpoint: POST /api/v1/ai/chat
- Body:
  - messages: [{role:'user'|'assistant'|'system', content: '...'}]
  - context: 可选（例如 'impact' / 'shop' / 'general'）
  - metadata: 可选 dict（例如 { product_id: 123, impactMode: true, route: '/product/123', use_rag: true }）

示例 curl:

```
POST /api/v1/ai/chat
{
  "messages": [{"role":"user","content":"这件商品的溯源是什么？"}],
  "context": "shop",
  "metadata": {"product_id": 1, "impactMode": true, "use_rag": true}
}
```

返回：AIChatResponse { reply, model, source }

2) 反馈接口（用户评价 AI 回复）

- Endpoint: POST /api/v1/ai/feedback
- Body:
  - is_helpful: bool
  - reason: 可选
  - messages: 对话上下文数组（必需）
  - metadata: 可选，用于补充用户信息（user_email/user_name/context 等）

示例 curl:

```
POST /api/v1/ai/feedback
{
  "is_helpful": false,
  "reason": "回答不准确",
  "messages": [...],
  "metadata": {"user_email":"user@example.com"}
}
```

返回：{ escalated: true/false, contact_id?: int }

3) rollout 评估接口

- Endpoint: GET /api/v1/admin/analytics/ai
- 返回字段：
  - chat_count
  - feedback_total
  - helpful_feedback
  - negative_feedback
  - handoff_count
  - helpful_rate
  - handoff_rate

---

## 五、前端接入示例（React）

- chat:

```ts
import { aiAssistantApi } from '@/services/aiAssistant';
const messages = [{ role: 'user', content: '请推荐几款公益商品' }];
const res = await aiAssistantApi.chat(messages, 'impact', { impactMode: true, route: '/impact/shop', use_rag: true });
console.log(res.reply);
```

- feedback:

```ts
await aiAssistantApi.feedback(false, messages, { user_email: 'user@example.com' }, 'Not helpful');
```

UI 已在 AIAssistantBall 中添加 👍/👎，并在 ProductDetail 页面添加“问 AI 关于这件商品”按钮，传入 product_id 与预设问题。

---

## 六、AI 能做到/实现方式（举例）

- 商品溯源查询：前端传 product_id → 后端 _maybe_call_tools 抓取 product 与 supply-chain timeline 注入到 prompt → LLM 生成概述并引用 timeline 项。
- Impact 商品检索（RAG）：用户输入关键词 → _retrieve_rag 返回短 snippet → LLM 基于 snippet 推荐产品并列出来源链接。
- 下单草稿（草案，不自动执行）：AI 可生成可执行的下单 payload（商品ID、数量、地址摘要），前端展示并要求用户确认后调用订单 API（严格要求 auth 与二次确认）。
- 反馈与工单：用户点“不帮助” → record_feedback 自动生成 ContactMessage（含会话片段与 metadata）以便客服跟进。

---

## 七、如何扩展与建议（Roadmap）

1. 将轻量 SQL RAG 升级为 embedding + 向量检索（FAISS / Milvus / Pinecone），用于更高召回与语义匹配。
2. 增加证据展示 UI：在回复下方展示 [Retrieval Results] 列表与源链接，增强可验证性。
3. 对高风险动作（下单、退款）实现明确的两步确认与权限校验、审计日志与速率限制。
4. 增加集成测试：自动化覆盖 ai/chat 返回包含 [Tool Output] 的场景并验证不可泄露 PII。

---

## 八、如何运行本地测试（conda）

1. 安装 Miniconda/Anaconda。
2. 在项目根目录运行：

```bash
conda create -y -n vicoo-ai-test python=3.11
source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate vicoo-ai-test
pip install -r backend/requirements-dev.txt  # 若存在
# 或者安装最小依赖
pip install pytest pytest-asyncio httpx
pytest -q backend/tests/api-tests/test_ai_feedback.py
```

注：若缺少 OPENAI API key，AIAssistantService 会返回 simulation-mode 回复以避免致命失败（便于离线测试）。

---

## 九、变更记录（简短）

- 2026-04-22：完成 Phase1 (工具层)、Phase2 (Impact RAG) 与 Phase3 (反馈闭环)。新增 API、前端按钮与单元测试。

---

如需我将 ht-ai 分支发起 PR，或将 RAG 升级到 embeddings、或添加下单确认 flow，我可以继续实现。祝好！
