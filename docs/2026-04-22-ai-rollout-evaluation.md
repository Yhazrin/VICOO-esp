# 2026-04-22 — AI rollout 评估与质量门槛

本文记录当前 AI 功能的 rollout 评估方式、指标定义和质量门槛。

## 已实现的评估入口

- `GET /api/v1/admin/analytics/ai`
  - 返回 AI 会话、反馈和人工转接的聚合指标。
- `GET /api/v1/admin/dashboard`
  - 保留原有后台总览，可作为管理端入口继续扩展。

## 当前指标

- `chat_count`
  - AI 聊天请求总数
- `feedback_total`
  - 用户反馈总数
- `helpful_feedback`
  - 标记为有帮助的反馈数
- `negative_feedback`
  - 标记为无帮助的反馈数
- `handoff_count`
  - 转人工 / Contact 工单数
- `helpful_rate`
  - 有帮助反馈占比
- `handoff_rate`
  - 无帮助反馈触发转人工的比例

## 指标来源

- `audit_logs`
  - 记录 `ai_chat` 和 `ai_feedback`
- `contact_messages`
  - 记录 AI 无法解决后升级到人工的消息

## 质量门槛建议

上线观察时，重点看：
- 是否存在明显的无帮助反馈高峰
- 转人工率是否过高
- Impact 页面回答是否能稳定引用商品/溯源信息
- 商品详情页问题是否能命中正确商品

## 当前实现的反馈闭环

1. 用户在 AI 对话中点击 👍 / 👎
2. 后端记录反馈
3. 若为 👎，自动生成 ContactMessage
4. 管理端可以在 AI analytics 中查看总量和转接情况

