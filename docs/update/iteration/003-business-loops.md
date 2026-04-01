# Iteration 3: 核心业务闭环补强

**目标**: 完善模型并在 Service 层实现完整的业务流，重点关注支付、捐赠与儿童保护。

## 任务清单

- [ ] **模型层深度完善 (模型结构调整)**
  - [ ] `PaymentTransaction`: 增加 `expires_at`, `payment_url`, `idempotency_key`
  - [ ] `Order`: 增加 `expires_at` (超时未支付自动关闭逻辑)
  - [ ] `ChildParticipant`: 增加 `guardian_user_id` (关联登录用户)
  - [ ] `Donation`: 增加 `certificate_no`, `certificate_url`
- [ ] **优先业务流 1: 儿童作品提交流**
  - [ ] 监护人授权与资料提交 (带加密存储)
  - [ ] 审核员两级审批逻辑
  - [ ] 投票与公开展示逻辑实现
- [ ] **优先业务流 2: 支付与捐赠闭环**
  - [ ] 支付窗口生成与有效期管理
  - [ ] 支付平台回调 (Webhook) 验证与状态流转
  - [ ] 幂等性与重试补偿策略
  - [ ] 捐赠证明电子化生成与发放
- [ ] **优先业务流 3: 商品交易与供应链闭环**
  - [ ] 下单、库存冻结与超时释放
  - [ ] 物流信息挂接与状态自动更新
  - [ ] 供应链追溯记录自动关联
- [ ] **优先业务流 4: 管理后台业务支撑**
  - [ ] 作品/儿童信息批量审批工作流
  - [ ] 审计日志查询与导出
  - [ ] 业务实时看板数据聚合

## 负责人
- 主责: `engineering-backend-architect`
- 安全审查: `engineering-security-engineer`
- 测试: `testing-api-tester`
