# Iteration 2: 领域分层重构

**目标**: 将“路由堆叠式单体”重构为模块化单体，确立 Service 层与 Repository 层边界。

## 任务清单

- [ ] **建立统一目录规范**
  - [ ] 确保每个核心域拥有独立的 `services/` 和 `repositories/`
- [ ] **核心域重构 (迁移逻辑至 Service)**
  - [ ] `auth / users`: 迁移认证与 Token 管理逻辑
  - [ ] `payments`: 迁移支付平台对接逻辑
  - [ ] `donations`: 迁移捐赠流程处理
  - [ ] `artworks / campaigns`: 迁移作品审核与展示逻辑
- [ ] **统一响应与错误处理**
  - [ ] 实现标准化的 API Response 包装器
  - [ ] 统一业务异常映射机制 (Exception Handlers)
- [ ] **数据库访问收口**
  - [ ] 将所有直接的 `db.query()` 迁移至 Repository/CRUD 层，禁止 Router 直接操作 DB

## 负责人
- 主责: `engineering-backend-architect`
- 协作: `engineering-code-reviewer`
