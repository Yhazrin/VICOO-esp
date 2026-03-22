# 童画公益 x 可持续时尚

## Tonghua Public Welfare x Sustainable Fashion

> 跨平台公益生态系统 -- 将儿童的创意表达转化为可持续时尚，连接善意与透明

[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python%203.11-green)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Educational-purple)](#)

---

## 项目概览

**童画公益** 是一个跨平台公益应用平台，融合儿童创意表达、可持续时尚与透明公益运营。

**核心功能：**

- **儿童艺术平台** -- 主题活动征集作品，社区投票支持
- **可持续时尚商店** -- 销售收入用于儿童艺术项目
- **捐赠系统** -- 多渠道捐赠（微信支付、支付宝、Stripe、PayPal），资金追踪透明
- **供应链溯源** -- 原材料、制造、环境影响全链路可见，每项声明均可核验
- **故事平台** -- 产品背后的儿童、工匠、社区长文讲述
- **三端覆盖** -- React 网页端（杂志美学风格）、微信小程序、Android 应用
- **国际化** -- 中英双语，支持国内外用户

---

## 技术栈

| 层级 | 技术 |
|------|------|
| **网页前端** | React 18, TypeScript, Vite, Zustand, Framer Motion, Tailwind CSS |
| **小程序** | 微信小程序 (WXML/WXSS/JS) |
| **Android** | Kotlin, Jetpack Compose, Material Design 3 |
| **后端** | Python 3.11, FastAPI, SQLAlchemy (async), Uvicorn |
| **数据库** | MySQL 8.0 |
| **缓存** | Redis 7 |
| **消息队列** | RabbitMQ 3.12 |
| **对象存储** | 阿里云 OSS + CDN |
| **支付** | 微信支付、支付宝、Stripe、PayPal |
| **设计风格** | 1990 年代印刷杂志美学 (Editorial / Print Magazine) |

---

## 项目结构

```
tonghua-project/
├── tonghua-project/          # 实际项目代码
│   ├── backend/              # FastAPI 后端 (8 个微服务)
│   ├── frontend/
│   │   ├── web-react/        # React 网页端
│   │   ├── weapp/            # 微信小程序
│   │   └── android/           # Android 应用
│   ├── admin/                # 管理后台
│   ├── deploy/               # Docker 部署配置
│   ├── docs/                 # 架构文档
│   └── tests/                # 测试用例
├── CLAUDE.md                 # Agent 团队编排规则
├── CHANGELOG.md              # 变更日志
└── AGENTS.md                 # Agent 定义文档
```

---

## 设计系统

网页端采用 **1990 年代印刷杂志美学**，全站统一风格：

- **字体** -- Playfair Display (标题) + IBM Plex Mono (正文)
- **色彩** -- 低饱和度纸张色调 + 棕褐色点缀
- **布局** -- 杂志式多栏 Grid
- **图片** -- Sepia 滤镜 + 颗粒噪点叠加
- **导航** -- 序号目录式导航 (01, 02, 03...)
- **过渡** -- 翻书式页面切换动画
- **主题** -- 9 套主题色系 (Editorial, Morandi, Sepia, Monochrome, Ink, Forest, Autumn, Mist Blue, Deep Sea)

---

## 快速开始

### 环境要求

- Docker and Docker Compose (v2.20+)
- Node.js 18 LTS
- Python 3.11+

### Docker 部署

```bash
# 进入部署目录
cd tonghua-project/deploy/docker

# 配置环境变量
cp .env.example .env
# 编辑 .env，修改密钥相关配置

# 启动所有服务
docker compose up -d

# 验证服务状态
docker compose ps
curl http://localhost:8000/health
```

### 本地开发

```bash
# 后端
cd tonghua-project/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# 前端 (新终端)
cd tonghua-project/frontend/web-react
npm install
npm run dev
```

---

## 安全特性

| 领域 | 实现 |
|------|------|
| **认证** | JWT (RS256) 15分钟访问 + 7天刷新令牌 |
| **授权** | RBAC + ABAC 组合模型 |
| **加密** | AES-256-GCM 敏感数据加密 |
| **限流** | Redis 滑动窗口 (1000/秒全局，60/分钟每用户) |
| **请求签名** | 认证端点 HMAC-SHA256 |
| **儿童保护** | 隔离加密存储，二级审批，前台脱敏展示 |

---

## 合规

- **《个人信息保护法》(PIPL)** -- 中国用户完全合规
- **GDPR** -- 国际访客合规
- **儿童保护** -- 14 岁以下需监护人同意
- **支付合规** -- 所有支付通道持牌商户

---

## License

本项目仅供课程设计使用。保留所有权利。
