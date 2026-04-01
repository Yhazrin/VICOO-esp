# Iteration 4: 测试体系与发布能力

**目标**: 建立多层次测试保障网，覆盖核心 Service 逻辑与端到端业务流，确保代码健壮性。

## 任务清单

- [ ] **Service 层集成测试 (Integration Tests)**
  - [ ] `AuthService`: 覆盖登录、注册、Token 轮转、黑名单失效逻辑。
  - [ ] `DonationService` & `PaymentService`: 模拟支付回调，验证证书自动生成逻辑。
  - [ ] `ChildService` & `ArtworkService`: 验证加密存储与作品状态自动同步逻辑。
- [ ] **安全与合规测试**
  - [ ] 验证脱敏工具 `masking.py` 在 API 响应中的实际应用。
  - [ ] 验证审计日志装饰器是否正确记录到数据库。
- [ ] **自动化保障 (CI 准备)**
  - [ ] 优化 `conftest.py` 以支持真实的异步数据库测试环境。
  - [ ] 输出后端测试覆盖率报告。

## 负责人
- 主责: `testing-api-tester`
- 协作: `engineering-backend-architect`
- 审查: `engineering-code-reviewer`
