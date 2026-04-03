# Iteration 0: 后端基线梳理报告

**日期**: 2026-04-01  
**状态**: 完成 (Baseline Frozen)

## 1. 核心目录基线
目前 `backend/app/` 结构如下：
- `models/`: 11 个核心业务模型已建立。
- `routers/`: 17 个功能路由已建立。
- `schemas/`: Pydantic 数据验证层已覆盖核心业务。
- `services/`: 仅存在 `mailer.py` 和 `payment_service.py`，**大部分业务逻辑目前仍散落在 Router 中**。

## 2. 功能域映射与缺口分析

| 功能域 (Domain) | 对应 Router | 需求覆盖情况 | 高风险标记 | 重构建议 |
| :--- | :--- | :--- | :--- | :--- |
| **认证 (Auth)** | `auth.py`, `oauth.py` | 基础登录已实现 | ⭐⭐⭐ | 需补充 Refresh Token 机制 |
| **用户 (Users)** | `users.py` | 个人资料管理 | ⭐ | 需补充角色权限 (RBAC) 细节 |
| **作品 (Artworks)** | `artworks.py` | 上传、列表、投票、审核状态 | ⭐⭐⭐ (儿童信息) | 审核逻辑需下沉至 Service |
| **支付 (Payments)** | `payments.py` | 微信/支付宝/Stripe 基础流 | ⭐⭐⭐ | 补充“支付窗口”与有效期管理 |
| **捐赠 (Donations)** | `donations.py` | 捐赠发起、列表、证明 | ⭐⭐⭐ | 补充证书自动生成 Service |
| **订单 (Orders)** | `orders.py` | 下单、物流更新、列表 | ⭐⭐ | 补充库存预扣与超时释放 |
| **管理端 (Admin)** | `admin.py` | 审计、分析、活动管理 | ⭐⭐ | 补充多级审批流 Service |
| **供应链 (Supply)** | `supply_chain.py` | 溯源记录查询 | ⭐ | 逻辑相对独立 |

## 3. 高风险模块与合规检查项

### A. 儿童参与者 (Child Participants)
- **现状**: 已实现 AES-256-GCM 加密，但权限校验分散。
- **目标**: 确保只有 `compliance` 角色且在“审核期间”可解密查看。

### B. 支付幂等性 (Payment Idempotency)
- **现状**: 尚未在数据库层面显式支持幂等键。
- **目标**: `PaymentTransaction` 需增加 `idempotency_key` 字段。

### C. 审计日志 (Audit Log)
- **现状**: 存在 `audit.py` 模型，但 Router 中缺乏统一的记录触发点。
- **目标**: 实现装饰器或中间件，自动记录关键操作。

## 4. 结论与下一步行动
1. **冻结目录结构**: 后续开发严格遵守 `routers -> services -> repositories` 三层架构。
2. **启动 Iteration 1**: 优先处理 `auth` 重构与敏感信息保护 (RBAC/Encryption)。
3. **模型迁移**: 在 Iteration 1 中补齐 `PaymentTransaction` 和 `ChildParticipant` 的缺失字段。
