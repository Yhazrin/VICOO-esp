# 后端开发规划文档

## Tonghua / VICOO 后端下一阶段实施计划

**版本**: 1.0  
**创建日期**: 2026-03-31  
**适用范围**: `backend/` 单体 FastAPI 服务的持续完善与后续微服务演进  
**编排依据**: `docs/CLAUDE.md` 智能体团队分工

---

## 1. 文档目标

本规划文档用于回答两个现实问题：

- 当前仓库中的后端已经做到哪里，下一步应该先补什么
- 如何按照 `docs/CLAUDE.md` 中定义的智能体团队协作方式，推进后端开发而不陷入“大而全但无法落地”的状态

结论先行：

- 当前项目后端**不适合立刻拆成 8 个独立微服务**
- 当前最合理路径是先把 `backend/` 这套单体 FastAPI 完善成**模块清晰、测试覆盖、可部署、可审计**的“模块化单体”
- 当认证、支付、审计、儿童信息保护、异步任务、运维观测都稳定后，再选择性拆分 `payment / donation / artwork / admin` 等高边界模块

---

## 2. 当前现状评估

结合 `docs/tonghua-project-plan.md`、`docs/architecture/system-architecture.md`、`docs/architecture/database-design.md` 和当前仓库代码，现状如下。

### 2.1 已有基础

- 已存在单体 FastAPI 应用入口: `backend/app/main.py`
- 已存在较完整业务路由:
  - `auth`
  - `oauth`
  - `users`
  - `artworks`
  - `campaigns`
  - `donations`
  - `products`
  - `orders`
  - `payments`
  - `admin`
  - `supply_chain`
  - `contact`
  - `reviews`
  - `after_sales`
  - `clothing_intakes`
  - `sustainability`
  - `ai_assistant`
- 已有数据库模型、Pydantic schema、Alembic migration、Dockerfile、测试目录
- 已有部分安全基础:
  - JWT
  - AES-GCM 加密工具
  - CORS / Trusted Host / 安全响应头
  - 请求体大小限制
  - 限流中间件

### 2.2 与需求文档相比的偏差

需求文档中的目标是“高安全、强合规、面向多端、支付闭环、儿童信息敏感处理、供应链可追溯”。当前代码虽然已经覆盖了大量接口，但还存在典型的“功能先行，领域边界和工程治理还没收紧”的问题。

### 2.3 当前后端的主要问题

#### A. 架构层面

- 代码名义上对齐了多个服务域，但实际上仍是**单体路由拼接**
- 缺少统一的应用分层约束:
  - router
  - service
  - repository
  - domain policy
  - audit / event
- 一部分业务逻辑仍可能散落在 router 中，不利于测试和后续拆分

#### B. 安全与合规层面

- 儿童信息虽然有模型和文档设计，但还需要确认是否真正做到了:
  - 数据最小化
  - 字段级加密
  - 审批链
  - 审计日志全覆盖
  - 数据保留和删除策略
- HMAC 签名中间件在 `main.py` 中已被关闭，说明原方案和前端暴露风险存在冲突
- 认证、授权、角色、资源级权限判断仍需系统梳理

#### C. 数据一致性层面

- 支付、捐赠、订单、证书、供应链等关键流程需要更严格的事务边界和幂等设计
- 当前需要把“支付回调 -> 订单/捐赠状态更新 -> 凭证生成 -> 审计记录”明确成可靠流程

#### D. 工程质量层面

- 测试目录已存在，但从测试写法看，部分测试更偏“接口探测”，还没有形成强契约与业务规则保护网
- 缺少明确的分阶段完成标准
- 缺少后端主线开发文档，团队不知道先补基础设施还是先补业务能力

---

## 3. 开发总策略

按照 `docs/CLAUDE.md` 的三阶段工作流，本项目后端应采用以下策略：

### 3.1 总体路线

1. 先做“阶段一后端收口”
2. 再做“阶段二核心能力补强”
3. 最后做“阶段三测试、部署、审计闭环”

### 3.2 关键原则

- **先安全，后业务扩张**
- **先模块化单体，后选择性微服务化**
- **先补可观测性与测试，后补复杂异步流程**
- **先固化数据边界，再开放更多端能力**

### 3.3 为什么不建议现在直接拆微服务

- 当前仓库已有单体实现，直接拆服务会把问题从“开发不清晰”变成“联调更复杂”
- 团队目前更缺的是统一边界、权限模型、事件流和测试基线，而不是更多独立仓库
- 对支付、儿童信息、捐赠审计这类高风险场景，先在单体内把规则写稳更安全

---

## 4. 智能体团队编排方式

以下编排严格参考 `docs/CLAUDE.md`，但针对“后端优先”场景做了实际落地排序。

### 4.1 核心后端开发小组

| 智能体 ID | 角色 | 在本规划中的职责 |
|---|---|---|
| `agents-orchestrator` | 总指挥 | 拆分迭代目标、排序依赖、整合产出 |
| `engineering-backend-architect` | 后端架构师 | 服务边界、目录分层、数据库与 API 演进 |
| `engineering-security-engineer` | 安全工程师 | JWT、RBAC/ABAC、加密、审计、限流、签名 |
| `engineering-code-reviewer` | 代码审查员 | 架构一致性、安全回归、PR 审查门禁 |
| `testing-api-tester` | API 测试员 | 接口契约、集成测试、安全测试用例 |
| `engineering-devops-automator` | DevOps 工程师 | Docker、CI、环境配置、监控、发布流程 |
| `engineering-technical-writer` | 技术文档员 | API 文档、迁移说明、运行手册、变更记录 |

### 4.2 协作规则

- `agents-orchestrator` 负责把每个迭代拆成可在 1 周内完成的子任务
- `engineering-backend-architect` 先定义边界和数据模型，再允许开发落地
- `engineering-security-engineer` 对所有认证、支付、儿童信息相关改动拥有前置审查权
- `engineering-code-reviewer` 在每个迭代末进行一致性审查，不允许绕过
- `testing-api-tester` 与后端开发并行，不等功能全做完再补测试
- `engineering-technical-writer` 在每个迭代同步更新文档，不把文档拖到最后

---

## 5. 后端实施路线图

建议拆成 5 个迭代，每个迭代都能独立交付并验收。

### 迭代 0: 基线梳理与冻结

**目标**: 让团队明确“现在有什么、缺什么、哪些属于高风险区域”。

**负责人**

- 主责: `agents-orchestrator`
- 执行: `engineering-backend-architect`
- 审查: `engineering-code-reviewer`

**任务**

- 盘点现有 router / model / schema / migration / tests
- 输出当前接口与需求映射表
- 标注高风险模块:
  - auth
  - payments
  - donations
  - admin
  - child participant
- 冻结短期目录结构，避免开发过程中持续改名

**产出物**

- 当前后端能力地图
- 接口缺口与风险清单
- 重构边界说明

**完成标准**

- 所有人能回答“下一步先改哪些模块，为什么”

---

### 迭代 1: 安全与基础设施收口

**目标**: 建立真正可承载生产数据的后端底座。

**负责人**

- 主责: `engineering-security-engineer`
- 协作: `engineering-backend-architect`
- 验收: `engineering-code-reviewer`

**任务**

- 统一认证链路:
  - access token
  - refresh token
  - token refresh 策略
  - logout / token revoke 策略
- 梳理授权模型:
  - 区分普通用户、监护人、审核员、运营、法务、超级管理员
  - 为管理端接口补足 RBAC
  - 对关键资源补充 ABAC
- 加固儿童信息保护:
  - 明确哪些字段必须加密
  - 明确哪些接口只能返回脱敏信息
  - 明确审批与访问审计
- 重新设计请求签名策略:
  - 前端直连接口不再使用暴露共享密钥的 HMAC
  - 保留服务间签名或 webhook 签名校验
- 为关键操作补审计日志:
  - 审核儿童资料
  - 修改用户角色
  - 更新作品状态
  - 处理支付回调
  - 创建退款或订单状态变更

**建议代码层改造**

- 建立统一权限依赖层
- 建立统一审计记录工具
- 建立敏感字段序列化与脱敏工具

**产出物**

- 安全基线文档
- 权限矩阵
- 审计字段规范

**完成标准**

- 高风险接口全部具备认证、授权、审计三件套

---

### 迭代 2: 领域分层重构

**目标**: 把当前“路由堆叠式单体”整理成可维护的模块化单体。

**负责人**

- 主责: `engineering-backend-architect`
- 协作: `engineering-code-reviewer`

**任务**

- 为核心模块建立统一结构:
  - `routers/`
  - `services/`
  - `repositories/` 或 `crud/`
  - `policies/`
  - `events/`
- 优先重构 6 个核心域:
  - auth / users
  - artworks / campaigns
  - donations
  - orders / products
  - payments
  - admin
- 将复杂业务逻辑从 router 挪入 service
- 将数据库访问收口到仓储层或统一查询层
- 统一响应、错误码、分页、审计上下文

**重点说明**

- 这一步不是为了“好看”，而是为后续测试、异步任务、服务拆分做准备
- 如果不先分层，后面的支付与合规开发成本会越来越高

**产出物**

- 模块化单体目录规范
- 核心领域服务层
- 错误码与异常处理规范

**完成标准**

- 新增功能默认只在 service / repository 层扩展，不再把业务逻辑塞进 router

---

### 迭代 3: 核心业务闭环补强

**目标**: 把需求文档中最关键的业务流程做成“可运行、可验证、可追责”的闭环。

**负责人**

- 主责: `engineering-backend-architect`
- 安全审查: `engineering-security-engineer`
- 测试: `testing-api-tester`

**优先业务流 1: 儿童作品提交流**

- 监护人提交孩子资料与授权
- 审核员审批同意
- 作品上传
- 作品审核
- 投票
- 公开展示

**优先业务流 2: 捐赠闭环**

- 创建捐赠记录
- 发起支付
- 接收回调
- 幂等更新状态
- 生成捐赠证明
- 写入审计和统计

**优先业务流 3: 商品与供应链闭环**

- 商品发布
- 下单
- 支付
- 发货 / 物流
- 售后
- 展示供应链追溯记录

**优先业务流 4: 管理后台闭环**

- 作品审核
- 用户角色管理
- 活动管理
- 儿童信息审批
- 数据统计看板

**必须补的能力**

- 幂等键
- 状态机或显式状态流转约束
- 事务边界
- webhook 校验
- 后台操作审计

**产出物**

- 关键业务流程时序文档
- 业务状态流转表
- 回调与补偿策略说明

**完成标准**

- 至少 3 条关键链路可在测试环境端到端走通

---

### 迭代 4: 测试体系与发布能力

**目标**: 让后端从“能跑”变成“可持续迭代”。

**负责人**

- 主责: `testing-api-tester`
- 协作: `engineering-devops-automator`
- 审查: `engineering-code-reviewer`

**任务**

- 补齐三层测试:
  - 单元测试
  - 集成测试
  - 关键接口契约测试
- 为高风险模块建立回归测试包:
  - auth
  - admin
  - payment callbacks
  - donation status
  - child participant approval
- CI 中强制执行:
  - lint
  - type / schema checks
  - pytest
  - migration check
- 统一环境配置:
  - local
  - test
  - staging
  - production
- 输出最小发布手册

**建议增加的工程能力**

- 测试数据库初始化脚本
- 伪造支付回调工具
- 审计日志断言工具
- OpenAPI diff 校验

**产出物**

- CI 流水线规则
- 后端测试矩阵
- 发布检查清单

**完成标准**

- 任意一次后端变更都能通过自动化测试得到基础信心

---

### 迭代 5: 微服务候选拆分评估

**目标**: 在模块化单体稳定后，再评估是否需要真正拆服务。

**负责人**

- 主责: `engineering-backend-architect`
- 协作: `engineering-devops-automator`
- 审查: `engineering-code-reviewer`

**建议只评估，不急着拆**

优先候选模块:

- `payment`
- `donation`
- `artwork`
- `admin`

评估维度:

- 是否有独立伸缩需求
- 是否有独立安全边界
- 是否有独立部署收益
- 是否已经具备清晰事件边界
- 是否会引入过高的分布式事务复杂度

**结论标准**

- 若没有明显独立伸缩和组织边界，继续保持模块化单体
- 若支付与捐赠已形成稳定回调和对账链路，可优先拆 `payment`

---

## 6. 推荐优先级

如果你现在就准备开始开发，建议严格按下面顺序推进：

1. 认证与权限模型收口
2. 儿童敏感信息保护与审计日志
3. 支付 / 捐赠 / 订单的状态流转和幂等
4. 将 router 中的业务逻辑迁移到 service 层
5. 集成测试与 CI
6. 供应链追溯、售后、AI 等扩展模块继续完善

不建议当前优先投入的事项：

- 立即拆 8 个独立微服务
- 先做复杂 AI 能力再补基础安全
- 在没有完整测试之前大量新增业务入口

---

## 7. 建议的代码结构目标

建议在现有 `backend/app/` 下逐步演进到如下形态：

```text
backend/app/
├── main.py
├── config.py
├── database.py
├── core/
│   ├── security/
│   ├── auth/
│   ├── permissions/
│   ├── audit/
│   ├── errors/
│   └── logging/
├── routers/
├── services/
│   ├── auth/
│   ├── artwork/
│   ├── donation/
│   ├── order/
│   ├── payment/
│   └── admin/
├── repositories/
├── models/
├── schemas/
├── tasks/
└── utils/
```

说明：

- `core/` 放跨域基础设施
- `services/` 放业务编排
- `repositories/` 放数据库访问
- `tasks/` 为后续 RabbitMQ 或异步任务预留

---

## 8. 每个智能体的近期任务单

### `agents-orchestrator`

- 建立后端迭代看板
- 标记任务依赖关系
- 每周汇总风险与阻塞项

### `engineering-backend-architect`

- 定义模块边界
- 输出服务层与仓储层约束
- 梳理支付、捐赠、订单状态机

### `engineering-security-engineer`

- 输出权限矩阵
- 校验敏感字段加密与脱敏
- 审核支付回调与 webhook 校验

### `engineering-code-reviewer`

- 建立 PR 检查项
- 审查是否有 router 过胖、权限绕过、审计缺失问题

### `testing-api-tester`

- 先为 auth / payment / donation / admin 建立回归集
- 再扩展到 artworks / orders / supply chain

### `engineering-devops-automator`

- 统一本地、测试、生产环境配置
- 完善 Docker Compose 与 CI
- 补监控、日志采集、健康检查

### `engineering-technical-writer`

- 同步更新 API 文档
- 输出运行与排障手册
- 记录 schema 变更和迁移说明

---

## 9. 风险清单

以下风险应视为当前后端开发的最高优先级风险：

- 儿童个人敏感信息处理不完整，导致合规风险
- 支付回调缺少幂等和严格签名校验，导致资金风险
- 管理接口权限边界不完整，导致越权风险
- 审计日志不足，导致问题发生后不可追溯
- 测试覆盖薄弱，导致多端联调时频繁回归

---

## 10. 第一阶段建议直接开工的事项

如果本周就开始做，我建议从下面 4 项切入：

1. 输出一份“后端权限矩阵 + 敏感接口清单”
2. 重构 `auth / admin / payments / donations` 的 service 层
3. 给支付回调、捐赠状态、儿童审批补集成测试
4. 给审计日志建立统一写入与查询机制

这 4 项做完后，后续开发会清晰很多，团队也更容易并行协作。

---

## 11. 里程碑验收标准

### M1: 安全基线完成

- 高风险接口具备认证、授权、审计
- 敏感字段加密与脱敏策略落地

### M2: 模块化单体完成

- 核心业务逻辑从 router 中收口
- 目录分层稳定

### M3: 关键流程闭环完成

- 作品提交流
- 捐赠闭环
- 商品交易闭环

### M4: 自动化保障完成

- 测试、CI、迁移检查、发布流程可重复运行

### M5: 是否拆微服务有明确结论

- 基于实际复杂度做判断，而不是先入为主

---

## 12. 总结

这个项目的后端现在最需要的不是“再加多少接口”，而是把已经存在的接口体系整理成一个**安全、可测试、可审计、能持续演进**的后端底座。

按照 `docs/CLAUDE.md` 的团队模式，最合理的推进方式是：

- `orchestrator` 控节奏
- `backend-arch` 收边界
- `security-engineer` 先封住高风险区域
- `api-tester` 和开发并行
- `code-reviewer` 强制保持一致性
- `devops` 与 `technical-writer` 不再拖到最后

这条路线更稳，也更符合当前仓库的真实成熟度。
