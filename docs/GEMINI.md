# 童画公益 × 可持续时尚 — 智能体团队编排

> 本文档定义了项目的智能体团队组成、角色职责、协作流程与调度规则。
> Claude Code 将根据本文档自动选择合适的智能体执行任务。

---

## 项目概要

- **项目名称**：Tonghua Public Welfare · Sustainable Fashion
- **技术栈**：React 18 / 微信小程序 / Kotlin Android / FastAPI / MySQL / Redis
- **设计风格**：1990 年代印刷杂志美学（Editorial / Print-inspired / Humanistic）
- **安全等级**：高（涉及儿童信息、捐赠资金、支付交易）

---

## 智能体团队总览（15 人）

| 编号 | 智能体 ID | 角色代号 | 职责领域 | 阶段归属 |
|------|-----------|---------|---------|---------|
| 01 | `agents-orchestrator` | 总指挥 | 任务分解、团队调度、结果整合 | 全阶段 |
| 02 | `engineering-backend-architect` | 后端架构师 | API 设计、数据库 Schema、微服务拆分 | 阶段一 + 二 |
| 03 | `engineering-frontend-developer` | React 前端工程师 | React 页面开发、组件实现、状态管理 | 阶段一 + 二 |
| 04 | `engineering-wechat-mini-program-developer` | 小程序工程师 | 微信小程序全栈开发、微信支付集成 | 阶段二 |
| 05 | `engineering-mobile-app-builder` | Android 工程师 | Kotlin + Jetpack Compose 移动端开发 | 阶段二 |
| 06 | `engineering-security-engineer` | 安全工程师 | JWT、AES 加密、API 安全、RBAC | 阶段一 + 二 |
| 07 | `design-ui-designer` | UI 设计师 | 杂志美学设计系统、组件规范、Design Token | 阶段一 |
| 08 | `design-ux-architect` | UX 架构师 | CSS 体系、布局框架、响应式策略 | 阶段一 + 二 |
| 09 | `design-brand-guardian` | 品牌守护者 | 全站视觉一致性、品牌调性审查 | 全阶段 |
| 10 | `legal-policy-writer` | 法务合规员 | 隐私政策、儿童保护条款、捐赠协议 | 阶段一 + 三 |
| 11 | `engineering-devops-automator` | DevOps 工程师 | CI/CD 流水线、Docker、部署配置 | 阶段三 |
| 12 | `testing-api-tester` | API 测试员 | 接口测试、契约验证、安全测试场景 | 阶段三 |
| 13 | `testing-accessibility-auditor` | 无障碍审核员 | WCAG 审核、响应式适配、可访问性 | 阶段三 |
| 14 | `engineering-code-reviewer` | 代码审查员 | 代码质量、架构一致性、安全审查 | 全阶段 |
| 15 | `engineering-technical-writer` | 技术文档员 | API 文档、架构文档、README、使用指南 | 阶段三 |

---

## 三阶段工作流

### 阶段一：架构设计（并行启动 4 条线）

```
                    ┌─────────────────────────────────┐
                    │    01 总指挥 (orchestrator)        │
                    │    分解任务 → 分配并行线 → 整合产出   │
                    └──────┬──────────────────────────┘
                           │
           ┌───────────────┼───────────────┬──────────────┐
           ▼               ▼               ▼              ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │ 02 后端架构师  │ │ 03 React前端 │ │ 06 安全工程师  │ │ 07 UI 设计师  │
    │              │ │    架构师     │ │              │ │              │
    │ · 微服务划分   │ │ · 路由设计    │ │ · JWT 方案    │ │ · 杂志美学规范 │
    │ · API 设计    │ │ · 组件分层    │ │ · 加密策略    │ │ · Design Token│
    │ · 数据库 Schema│ │ · 状态管理    │ │ · RBAC 模型  │ │ · 组件规范    │
    │ · 支付接口方案  │ │ · 目录结构    │ │ · API 安全   │ │ · 色彩排版    │
    └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
           │               │               │              │
           ▼               ▼               ▼              ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │ 08 UX 架构师  │ │              │ │ 10 法务合规员  │ │ 09 品牌守护者  │
    │              │ │              │ │              │ │              │
    │ · CSS 体系    │ │              │ │ · 隐私政策    │ │ · 视觉一致性   │
    │ · 响应式策略   │ │              │ │ · 儿童保护条款 │ │ · 风格统一检查 │
    │ · 布局框架    │ │              │ │ · 合规清单    │ │              │
    └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

**阶段一产出物：**
- 技术架构文档（后端架构师 + 安全工程师）
- React 站点架构文档（前端工程师 + UX 架构师）
- 全站视觉风格规范（UI 设计师 + 品牌守护者）
- 安全与合规方案文档（安全工程师 + 法务合规员）

---

### 阶段二：核心功能开发（串行依赖 + 并行前端）

```
    优先级 1（安全基础）：
    ┌──────────────────────────────────────────┐
    │ 06 安全工程师                              │
    │ · JWT 认证授权模块                         │
    │ · AES-256-GCM 加密工具                     │
    │ · API 安全中间件（限流、签名、输入验证）       │
    │ · RBAC + ABAC 权限控制                     │
    └─────────────────┬────────────────────────┘
                      │ 安全基础设施就绪后
                      ▼
    优先级 2（三条前端并行 + 后端 API）：
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │ 03 React 前端 │ │ 04 小程序工程师│ │ 05 Android   │ │ 02 后端架构师 │
    │   工程师      │ │              │ │   工程师      │ │  → 后端开发者 │
    │              │ │              │ │              │ │              │
    │ 8 个页面开发： │ │ 核心业务功能： │ │ 主要功能：    │ │ 全部 API 开发：│
    │ · Home       │ │ · 活动参与    │ │ · 用户中心    │ │ · user-svc   │
    │ · About      │ │ · 作品上传    │ │ · 内容浏览    │ │ · artwork-svc│
    │ · Campaigns  │ │ · 投票       │ │ · 商品浏览    │ │ · donation   │
    │ · Stories    │ │ · 捐赠       │ │ · 订单管理    │ │ · product-svc│
    │ · Donate     │ │ · 商品购买    │ │ · 公益互动    │ │ · supply-chain│
    │ · Shop       │ │ · 微信登录    │ │              │ │ · payment-svc│
    │ · Traceability│ │ · 微信支付   │ │              │ │ · gateway-svc│
    │ · Contact    │ │              │ │              │ │ · admin-svc  │
    └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
           │                │                │                │
           ▼                ▼                ▼                ▼
    ┌──────────────┐ ┌──────────────┐
    │ 14 代码审查员  │ │ 10 法务合规员  │
    │ · PR 审查     │ │ · 合规模块固化 │
    │ · 安全审查    │ │ · 合规清单落地 │
    │ · 架构一致性   │ │              │
    └──────────────┘ └──────────────┘
```

**阶段二产出物：**
- 安全认证授权模块
- React 网页端 8 个页面
- 微信小程序核心功能
- Android 应用主要功能
- 后端 8 个微服务 API
- 代码审查报告

---

### 阶段三：测试与部署

```
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │ 12 API 测试员 │ │ 13 无障碍审核 │ │ 11 DevOps    │
    │              │ │    员        │ │   工程师      │
    │ · 接口测试    │ │ · WCAG 审核  │ │ · CI/CD 流水线│
    │ · 安全测试    │ │ · 响应式验收  │ │ · Docker 配置 │
    │ · 压力测试    │ │ · 多端一致性  │ │ · 部署方案    │
    │ · 契约验证    │ │ · 交互测试    │ │              │
    └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
           │                │                │
           ▼                ▼                ▼
    ┌──────────────────────────────────────────────┐
    │              15 技术文档员                     │
    │  · API 参考文档                               │
    │  · 架构设计文档                                │
    │  · 各端部署指南                                │
    │  · 项目 README                                │
    └──────────────────────────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────────────────┐
    │              14 代码审查员（最终审查）           │
    │  · 全量代码审查                                │
    │  · 安全合规最终检查                             │
    │  · 代码质量报告                                │
    └──────────────────────────────────────────────┘
```

---

## 智能体详细角色定义

### 01 总指挥 — agents-orchestrator

- **代号**：`orchestrator`
- **调用方式**：当任务涉及多个领域或需要拆分时，自动启动
- **职责**：
  - 将复杂任务拆解为子任务
  - 为每个子任务匹配最合适的智能体
  - 协调并行执行与串行依赖
  - 整合各智能体的产出物
  - 发现冲突时进行仲裁
- **触发关键词**：整体规划、任务拆分、团队协作、多端开发、架构设计

### 02 后端架构师 — engineering-backend-architect

- **代号**：`backend-arch`
- **职责**：
  - 设计 8 个微服务的 API 接口规范（RESTful）
  - 设计数据库 Schema（users, child_participants, artworks, donations, orders, supply_chain_records）
  - 设计支付接口集成方案（微信支付/支付宝/Stripe/PayPal）
  - 设计消息队列（RabbitMQ）异步任务方案
  - 技术选型论证（FastAPI + MySQL + Redis + RabbitMQ）
- **产出**：API 文档、数据库 Schema 文档、架构设计文档
- **协作对象**：安全工程师（API 安全规范）、后端开发者（接口实现）

### 03 React 前端工程师 — engineering-frontend-developer

- **代号**：`react-fe`
- **职责**：
  - React 18 + Vite + TypeScript 项目搭建
  - 8 个页面的组件开发（Home/About/Campaigns/Stories/Donate/Shop/Traceability/Contact）
  - Zustand 状态管理方案
  - Framer Motion 翻书过渡动画
  - react-i18next 国际化
  - TanStack Query 数据请求
- **产出**：8 个页面组件、公共组件库、路由配置、状态管理
- **协作对象**：UI 设计师（Design Token）、UX 架构师（CSS 体系）

### 04 小程序工程师 — engineering-wechat-mini-program-developer

- **代号**：`wechat-dev`
- **职责**：
  - 微信小程序项目搭建与架构
  - 核心业务功能：活动参与、作品上传、投票、捐赠、商品购买
  - 微信登录流程（wx.login + code2Session）
  - 微信支付集成（统一下单 → 支付 → 回调）
  - 订阅消息推送
- **产出**：小程序完整功能代码、微信支付集成代码
- **协作对象**：后端架构师（API 对接）、安全工程师（微信安全规范）

### 05 Android 工程师 — engineering-mobile-app-builder

- **代号**：`android-dev`
- **职责**：
  - Kotlin + Jetpack Compose 项目搭建
  - 用户中心、内容浏览、商品管理、订单管理
  - Material Design 3 主题适配
  - 支付宝 SDK 集成
- **产出**：Android 应用主要功能代码
- **协作对象**：后端架构师（API 对接）、UI 设计师（设计一致性）

### 06 安全工程师 — engineering-security-engineer

- **代号**：`security-eng`
- **职责**：
  - JWT 无状态 Token 方案（Access 15min + Refresh 7d）
  - RBAC + ABAC 权限控制模型
  - AES-256-GCM 敏感数据加密（身份证号、手机号）
  - API 安全中间件：限流（1000 QPS 全局 / 60 QPM 用户）、HMAC-SHA256 请求签名
  - SQL 注入防护、XSS 防护、输入验证
  - TLS 1.3 传输加密
  - 儿童信息保护方案（加密存储、二级审批、前台脱敏）
- **产出**：安全架构文档、安全中间件代码、加密工具库
- **协作对象**：后端架构师（API 安全集成）、法务合规员（合规要求）

### 07 UI 设计师 — design-ui-designer

- **代号**：`ui-designer`
- **职责**：
  - 1990 年代印刷杂志美学设计系统
  - Design Token 定义（颜色、字号、间距、边框）
  - 核心组件规范：
    - `EditorialHero` — 刊首式标题区
    - `MagazineNav` — 杂志目录式导航
    - `BleedTitleBlock` — 溢出视口标题
    - `SepiaImageFrame` — 棕褐色图片框
    - `PaperTextureBackground` — 纸张纹理背景
    - `GrainOverlay` — 颗粒噪点叠加
    - `StoryQuoteBlock` — 故事引用块
    - `DonationPanel` — 捐赠面板
    - `TraceabilityTimeline` — 溯源时间线
    - `EditorialFooter` — 编辑式页脚
  - 字体系统：Playfair Display + IBM Plex Mono
  - 色彩系统：低饱和度、纸张色系
- **产出**：设计系统文档、Design Token 文件、组件规范
- **协作对象**：UX 架构师（实现方案）、品牌守护者（一致性审查）

### 08 UX 架构师 — design-ux-architect

- **代号**：`ux-arch`
- **职责**：
  - CSS 体系设计（Tailwind CSS + CSS Modules 分层策略）
  - 响应式布局框架（768px / 1024px 断点）
  - 杂志式多栏 Grid 布局实现方案
  - 纸张纹理 + 颗噪点的 CSS 实现
  - 图片 sepia 滤镜 + 噪点叠加的 CSS 方案
  - 动效系统：翻书过渡、滚动揭示、Hover 效果
- **产出**：CSS 架构文档、全局样式文件、布局框架
- **协作对象**：UI 设计师（设计规范）、React 前端工程师（组件样式）

### 09 品牌守护者 — design-brand-guardian

- **代号**：`brand-guard`
- **职责**：
  - 全站视觉一致性审查（不只是首页，所有页面必须统一）
  - 品牌调性把控：editorial / print-inspired / humanistic / warm / literary
  - 文案语气审查：英文公益叙事，非企业宣传口吻
  - 中英文品牌表达一致性
  - 跨端视觉一致性（React 端 / 小程序 / Android）
- **产出**：品牌一致性审查报告、视觉走查清单
- **协作对象**：UI 设计师（设计规范）、技术文档员（品牌文案）

### 10 法务合规员 — legal-policy-writer

- **代号**：`legal-compl`
- **职责**：
  - 隐私政策（中英文）
  - 儿童个人信息保护专项条款（14 岁以下需监护人同意）
  - 捐赠协议与资金用途说明
  - 用户协议
  - Cookie 政策
  - GDPR 合规评估（面向国际访客）
  - 《个人信息保护法》合规检查
  - 支付合规审查
- **产出**：隐私政策、用户协议、儿童保护条款、合规检查清单
- **协作对象**：安全工程师（技术实现对齐）、React 前端工程师（条款页面）

### 11 DevOps 工程师 — engineering-devops-automator

- **代号**：`devops`
- **职责**：
  - CI/CD 流水线（GitHub Actions / GitLab CI）
  - Docker Compose 多服务编排
  - 各服务 Dockerfile 编写
  - 环境变量管理
  - 健康检查与日志配置
  - 部署文档
- **产出**：CI/CD 配置、Docker Compose 文件、部署文档
- **协作对象**：后端架构师（服务配置）、技术文档员（部署指南）

### 12 API 测试员 — testing-api-tester

- **代号**：`api-tester`
- **职责**：
  - API 测试用例设计（覆盖全部 20+ 端点）
  - 安全测试场景：SQL 注入、XSS、越权、金额篡改
  - 压力测试：核心接口高并发压测
  - 契约测试：接口与文档一致性
  - 支付沙箱测试用例（微信/支付宝/Stripe）
- **产出**：测试用例集、测试报告、安全漏洞报告
- **协作对象**：安全工程师（安全场景）、后端架构师（接口规范）

### 13 无障碍审核员 — testing-accessibility-auditor

- **代号**：`a11y-auditor`
- **职责**：
  - WCAG 2.1 AA 标准审核
  - 响应式多端适配验收
  - 交互一致性检查（React / 小程序 / Android）
  - 键盘导航、屏幕阅读器兼容性
  - 色彩对比度检查（低饱和度杂志风格下的可读性）
- **产出**：无障碍审核报告、修复建议清单
- **协作对象**：React 前端工程师（修复实施）、UI 设计师（对比度调整）

### 14 代码审查员 — engineering-code-reviewer

- **代号**：`code-reviewer`
- **职责**：
  - 阶段性代码审查（每个阶段产出后）
  - 架构一致性检查（是否遵循设计文档）
  - 安全审查（是否有安全隐患）
  - 代码质量评估
  - 最终全量代码审查
- **产出**：代码审查报告、修复建议
- **协作对象**：全部开发类智能体

### 15 技术文档员 — engineering-technical-writer

- **代号**：`tech-writer`
- **职责**：
  - API 参考文档（OpenAPI/Swagger）
  - 架构设计文档
  - 数据库设计文档
  - 各端部署指南
  - 项目 README
  - 品牌故事英文文案协助
- **产出**：完整项目文档集
- **协作对象**：全部智能体（收集信息）

---

## 调度规则

### 规则 1：启动新任务时的智能体选择

当用户描述一个任务时，按以下逻辑选择智能体：

```
任务类型判断：
├─ 涉及后端/API/数据库 → 后端架构师 (backend-arch)
├─ 涉及 React 页面/组件 → React 前端工程师 (react-fe)
├─ 涉及小程序 → 小程序工程师 (wechat-dev)
├─ 涉及 Android → Android 工程师 (android-dev)
├─ 涉及安全/加密/认证 → 安全工程师 (security-eng)
├─ 涉及 UI 设计/样式/布局 → UI 设计师 (ui-designer) + UX 架构师 (ux-arch)
├─ 涉及品牌/文案/视觉一致性 → 品牌守护者 (brand-guard)
├─ 涉及法律/合规/隐私 → 法务合规员 (legal-compl)
├─ 涉及 CI/CD/部署/Docker → DevOps 工程师 (devops)
├─ 涉及测试 → API 测试员 (api-tester) + 无障碍审核员 (a11y-auditor)
├─ 涉及文档 → 技术文档员 (tech-writer)
├─ 涉及代码审查 → 代码审查员 (code-reviewer)
└─ 跨多个领域 → 总指挥 (orchestrator) 先拆分再调度
```

### 规则 2：跨领域任务的协作模式

当一个任务涉及多个智能体时：

1. **总指挥**先拆分子任务
2. 按依赖关系排序（安全 → 后端 → 前端）
3. 无依赖的子任务并行执行
4. 产出物统一由总指挥整合
5. 代码审查员对最终产出做质量把关

### 规则 3：阶段推进检查点

每个阶段完成后，强制执行：

1. **代码审查员**审查本阶段所有产出
2. **品牌守护者**检查视觉一致性
3. **法务合规员**检查合规要求
4. 确认通过后进入下一阶段

### 规则 4：设计风格约束（全局）

所有涉及 UI 的任务，必须遵循：

- 1990 年代印刷杂志美学（非现代 SaaS 风格）
- Playfair Display（标题）+ IBM Plex Mono（正文）
- 低饱和度色彩、纸张纹理、颗粒噪点
- 翻书式页面过渡
- 杂志目录式导航（带序号 01/02/03）
- 全页面风格统一，不能只有首页强化

---

## 常用指令模板

### 快速启动某个阶段

```
开始阶段一：架构设计
→ 自动调度：后端架构师 + React 前端架构师 + 安全工程师 + UI 设计师（并行）
→ 后续：UX 架构师 + 品牌守护者 + 法务合规员
```

```
开始阶段二：核心开发
→ 优先：安全工程师（安全基础设施）
→ 并行：React 前端 + 小程序 + Android + 后端 API
→ 跟随：代码审查员审查
```

```
开始阶段三：测试部署
→ 并行：API 测试员 + 无障碍审核员 + DevOps 工程师
→ 跟随：技术文档员 + 代码审查员（最终审查）
```

### 单任务调用示例

```
帮我设计捐赠页的 API 接口
→ 调度：后端架构师

帮我实现 React 首页组件
→ 调度：React 前端工程师 + UI 设计师

帮我审查最近的代码变更
→ 调度：代码审查员

帮我写项目部署文档
→ 调度：技术文档员 + DevOps 工程师

帮我检查全站视觉一致性
→ 调度：品牌守护者
```

---

## 项目目录约定

```
tonghua-project/
├── CLAUDE.md                    ← 本文件（智能体编排）
├── backend/
│   ├── gateway-service/
│   ├── user-service/
│   ├── artwork-service/
│   ├── donation-service/
│   ├── product-service/
│   ├── supply-chain-service/
│   ├── payment-service/
│   └── admin-service/
├── frontend/
│   ├── weapp/                   ← 微信小程序
│   ├── web-react/               ← React 网页端
│   └── android/                 ← Android 应用
├── admin/                       ← 管理后台
├── deploy/
│   ├── docker/
│   └── ci/
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── design-system/
│   └── security/
└── tests/
    ├── api-tests/
    ├── security-tests/
    └── frontend-tests/
```

---

## 重要约束

1. **React 网页端坚持"编辑出版物"风格**，禁止使用通用 UI 组件库的默认样式
2. **全站风格必须覆盖所有页面**，不能首页精美内页粗糙
3. **真实支付上线前必须完成沙箱联调和法务合规**
4. **儿童信息处理严格遵守《个人信息保护法》**
5. **供应链展示必须真实可核验**，禁止空泛 ESG 文案
6. **所有代码必须 TypeScript 严格模式**
7. **所有前端代码必须考虑可访问性（a11y）**

---

## 环境与工作流指南

### 目录上下文

**全局 vs 项目**：当被要求安装 agents、写入 skills 或修改应在全局范围持久化的配置时，必须指向 `~/.claude/` 目录，而非当前项目目录。写入前确认路径。

### 后端开发

**环境变量**：确保在实例化任何 clients/services 之前加载环境变量。检查 dotenv 加载顺序问题 —— 在 `load_dotenv()` 调用之前创建的 clients 会使用错误/缺失的配置。

**依赖检查清单**：运行后端前，验证：Python 版本 (`python --version`)、已安装所需模块、YAML/JSON 中存在配置字段。

**Docker/容器配置**：启动服务前验证 Docker 已安装 (`docker --version`)、运行中 (`docker ps`)、网络可访问。检查 Dockerfile 路径是否从项目根目录正确引用。

### 前端开发

**UI 状态发现**：实现任何 UI panels、components 或 toggles 时，必须说明默认状态（可见/隐藏）以及如何访问。如果一个 VoicePanel 存在但默认隐藏，必须立即说明切换方式。
