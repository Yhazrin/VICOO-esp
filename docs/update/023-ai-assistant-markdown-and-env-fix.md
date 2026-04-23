# 023 - AI Assistant Markdown 渲染与 Think 标签过滤 + CI .env 保护修复

**日期：** 2026-04-23
**类型：** 功能修复 + CI 改进

---

## 1. 问题描述

### 问题 A：AI 消息中的 Markdown 加粗未正确渲染

AI 返回的消息使用 `**加粗**` 格式，但前端直接用 `{m.content}` 纯文本展示，导致 `**` 原样显示而非加粗效果。

### 问题 B：Think 标签（<think>...）被暴露给用户

部分 AI 模型（如 MiniMax-M2.7）返回的思考过程被直接展示给用户，影响体验。

### 问题 C：CI 每次部署覆盖 .env 文件

`.github/workflows/deploy.yml` 中的 `backend-build` 和 `deploy-staging` 步骤会无条件执行 `cp .env.example .env`，导致用户在虚拟机上配置的 `OPENAI_API_KEY` 等敏感信息被覆盖，AI 助手始终处于演示模式。

---

## 2. 解决方案

### 2.1 前端 Markdown 渲染

**文件：** `frontend/web-react/package.json`
- 安装 `react-markdown` + `remark-gfm`

**文件：** `frontend/web-react/src/pages/AiAssistant/index.tsx`
- 引入 `ReactMarkdown` + `remarkGfm`
- 添加 `stripThink()` 函数，过滤 `` 标签
- 消息内容改为 `<ReactMarkdown>{...}</ReactMarkdown>`

**文件：** `frontend/web-react/src/components/layout/AIAssistantBall.tsx`
- 同上修改，保持组件一致性

### 2.2 CI .env 保护

**文件：** `.github/workflows/deploy.yml`

修改 `backend-build` 中的 `创建临时 .env 文件` 步骤：
```yaml
# 修改前（无条件覆盖）
- name: 创建临时 .env 文件
  run: |
    cp deploy/easy/.env.example deploy/easy/.env

# 修改后（只在 .env 不存在时生成）
- name: 创建临时 .env 文件
  run: |
    if [ ! -f deploy/easy/.env ]; then
      cp deploy/easy/.env.example deploy/easy/.env
      echo "✅ 自动生成 .env 完成"
    else
      echo "ℹ️ .env 已存在，跳过生成（保护已配置的凭证）"
    fi
```

修改 `deploy-staging` 中的 `配置环境变量文件` 步骤：
```yaml
# 修改前
ssh vm "cp /home/student/vicoo/deploy/easy/.env.example /home/student/vicoo/deploy/easy/.env || true"

# 修改后
ssh vm "if [ ! -f /home/student/vicoo/deploy/easy/.env ]; then cp /home/student/vicoo/deploy/easy/.env.example /home/student/vicoo/deploy/easy/.env; fi"
```

### 2.3 Docker Runtime 读取 .env

**文件：** `deploy/easy/docker-compose.yml`

在 `backend` 服务中添加 `env_file` 配置，使容器在运行时从 `./.env` 读取环境变量（而非从构建时打包的镜像中读取）：

```yaml
backend:
  # ... 其他配置 ...
  env_file:
    - .env
```

---

## 3. 相关文件

| 文件 | 修改内容 |
|------|----------|
| `frontend/web-react/package.json` | 添加 react-markdown、remark-gfm 依赖 |
| `frontend/web-react/src/pages/AiAssistant/index.tsx` | Markdown 渲染 + think 过滤 |
| `frontend/web-react/src/components/layout/AIAssistantBall.tsx` | Markdown 渲染 + think 过滤 |
| `.github/workflows/deploy.yml` | CI .env 保护逻辑 |
| `deploy/easy/docker-compose.yml` | 添加 env_file 配置 |

---

## 4. 注意事项

- `.env` 文件不应提交到 GitHub（已在 `.gitignore` 中）
- 用户在虚拟机部署时需手动在 `deploy/easy/.env` 中配置 `OPENAI_API_KEY`、`OPENAI_API_BASE`、`OPENAI_MODEL`
- CI 现在只在 `.env` 不存在时才生成，避免覆盖已配置的凭证
- `docker-compose.yml` 中的 `env_file` 路径为 `.env`（相对于 docker-compose.yml 所在目录，即 `deploy/easy/.env`）