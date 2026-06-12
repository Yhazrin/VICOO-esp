# VICOO 云端功能验证报告

**日期：** 2026-06-09  
**环境：** 云端 Agent（SQLite 本地栈，非 Docker）

## 服务状态

| 服务 | 地址 | 状态 |
|------|------|------|
| 用户网站 | http://127.0.0.1:9111 | ✅ |
| 管理后台 | http://127.0.0.1:5173/admin/ | ✅ |
| API | http://127.0.0.1:8000 | ✅ |
| API 文档 | http://127.0.0.1:8000/docs | ✅ |

> 说明：当前云端环境 Docker overlay 文件系统不可用，采用 **backend + SQLite**、**frontend/admin Vite dev** 方式启动，与 `deploy/easy` 文档中的 Docker 一键部署等价演示。

## API 验证

- `GET /api/v1/health` → `status: ok`
- `GET /api/v1/products?is_impact_product=true` → 20 件公益商品
- `POST /api/v1/auth/login`（lihua@example.com / vicoo-user）→ 成功

## 用户文档功能覆盖（视频演示）

| 章节 | 功能 | 验证 |
|------|------|------|
| 首页 | 品牌首页、Impact 模式切换 | ✅ |
| Impact Shop | 公益商品列表 | ✅ |
| 产品详情 | 图文、价格、画作关联 | ✅ |
| 追溯 Globe + 时间线 | 供应链可视化与阶段节点 | ✅ |
| AI 助手 | 浮层 UI、建议问题 | ✅ |
| 捐赠 / 活动 | /donate、/campaigns | ✅ |
| 管理后台 | Dashboard、商品、订单、衣物回收、审计日志 | ✅ |
| API 文档 | OpenAPI /docs | ✅ |

## 演示视频

### 云电脑真实操作录屏（推荐）

Cursor Cloud Agent 云桌面 X11 屏幕捕获，可见终端 + Chrome 浏览器：

- **MP4：** `artifacts/cloud-screencast/vicoo-cloud-agent-demo.mp4`（约 1分26秒）
- **录制命令：** `./scripts/record-cloud-desktop.sh`

### Playwright 无头浏览器录屏（备选）

- **MP4：** `artifacts/demo-video/vicoo-demo.mp4`（约 3分33秒）
- **录制命令：** `./scripts/record-demo-video.sh`

## 测试账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@tonghua.org | vicoo-admin |
| 普通用户 | lihua@example.com | vicoo-user |
