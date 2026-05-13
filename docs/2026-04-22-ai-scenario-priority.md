# 2026-04-22 — AI 场景优先级与入口策略

本文说明当前项目里 AI 在 **UNIQLO 标准页** 和 **Impact 公益页** 的优先能力、快捷入口和接入方式。

## 已完成的场景优先级

### 1. Impact 模式优先
优先能力：
- 公益商品推荐
- 商品溯源讲解
- 捐赠比例与公益影响解释
- 活动进展说明

### 2. UNIQLO 标准页优先
优先能力：
- 找商品
- 尺码/材质建议
- 订单物流问答
- 售后/退换货说明

### 3. 商品详情页优先
当用户进入商品详情页时，AI 会优先提供：
- 问材质
- 看尺码
- 查溯源
- 售后说明

## 已实现的前端接入

- `frontend/web-react/src/config/aiAssistantScenarios.ts`
  - 统一管理场景优先级和快捷问题。
- `frontend/web-react/src/components/layout/AIAssistantBall.tsx`
  - 浮动助手会按当前路由 + impactMode 展示快捷按钮。
- `frontend/web-react/src/pages/AiAssistant/index.tsx`
  - 深度会话页会显示场景快捷问题，并支持 prefill 自动发送。

## 已实现的后端接入

- `/api/v1/ai/chat`
  - 接收 `context` + `metadata`
  - `metadata` 会透传 `impactMode`、`route`、`surface`、`product_id`
- `AIAssistantService`
  - 根据场景注入工具输出和 RAG 结果
  - 优先用确定性数据，再交给模型生成自然语言

## 当前 AI 提示词策略

系统 prompt 负责限定角色和边界：
- 语气温暖、克制、具有人文关怀
- 只回答平台内可验证的信息
- 涉及隐私、支付、法律问题时提醒以站内规则和客服为准

当存在工具结果或检索结果时，会额外注入：
- `[Tool Output]`
- `[Retrieval Results]`

推荐回答模板：
1. 先给结论
2. 再给依据
3. 最后给下一步动作

## 需要的环境变量

当前 MVP 只需要：
- `OPENAI_API_KEY`
- `OPENAI_API_BASE`
- `OPENAI_MODEL`

备注：
- 目前没有启用 embedding/vector DB，所以不需要额外的 AI API key。

