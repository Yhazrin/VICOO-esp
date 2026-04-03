# Iteration 0: 基线梳理与冻结

**目标**: 明确当前后端现状，标记高风险区域，冻结架构边界。

## 任务清单

- [ ] **代码审计 (Baseline Audit)**
  - [ ] 盘点现有 `routers/`, `models/`, `schemas/`, `migrations/`
  - [ ] 输出当前接口与 `docs/tonghua-project-plan.md` 的映射表
- [ ] **高风险模块标记**
  - [ ] `auth`: 认证与会话管理
  - [ ] `payments`: 支付回调与幂等
  - [ ] `donations`: 捐赠状态流转
  - [ ] `child_participants`: 儿童信息加密与权限
- [ ] **目录结构标准化**
  - [ ] 确认并固定 `backend/app/` 下的子目录规范
- [ ] **数据库同步验证**
  - [ ] 检查 Alembic 迁移是否与最新 Models 完全对齐

## 负责人
- 主责: `agents-orchestrator`
- 执行: `engineering-backend-architect`
- 审查: `engineering-code-reviewer`
