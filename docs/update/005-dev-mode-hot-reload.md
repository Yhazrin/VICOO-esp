# 修复记录：本地开发环境热更新配置

## 问题描述

在进行本地开发时，希望实现：
1. 后端代码修改后自动重载，无需重建 Docker 容器
2. 前端可以使用 `npm run dev` 进行开发（热更新更快）

## 问题表现

### 问题 1：后端代码修改不生效

- **现象**：修改后端 Python 代码后，API 响应没有变化
- **原因**：Docker 容器中的后端代码是通过 Dockerfile 构建时复制的，不是挂载源代码

### 问题 2：前端开发时 API 请求 404

- **现象**：使用 `npm run dev` 启动前端开发服务器，请求 API 返回 404
- **原因**：前端请求路径 `/api/auth/login` 与后端实际路径 `/api/v1/auth/login` 不一致

### 问题 3：CORS 跨域错误

- **现象**：`npm run dev` 时请求后端返回 CORS 错误
- **原因**：后端的 CORS 配置没有包含前端开发服务器的地址和端口

### 问题 4：登录返回 401

- **现象**：API 请求成功到达后端，但返回 401 未授权
- **原因**：需要使用正确的 mock 用户账号密码

---

## 修复方案

### 1. 后端热更新配置

**修改文件**：
- `deploy/easy/docker-compose.yml`
- `deploy/easy/entrypoint.sh`

**原理**：
- 在 docker-compose.yml 中添加 volume 挂载，将宿主机 `backend/` 目录映射到容器内的 `/app/backend`
- 在 entrypoint.sh 中检测 `APP_ENV=development` 时，使用 uvicorn 的 `--reload` 参数启用热重载

**关键代码**：

```yaml
# docker-compose.yml - 后端服务
volumes:
  - ./data:/data
  - ../../backend:/app/backend  # 挂载源代码
```

```bash
# entrypoint.sh - 开发模式热重载
if [ "${APP_ENV}" = "development" ]; then
    exec python -m uvicorn app.main:app \
        --host 0.0.0.0 \
        --port 8000 \
        --reload \
        --log-level debug \
        --proxy-headers
else
    exec python -m uvicorn app.main:app \
        --host 0.0.0.0 \
        --port 8000 \
        --workers 2 \
        --log-level info \
        --proxy-headers
fi
```

**结果**：修改后端代码后，uvicorn 会自动检测文件变化并重载服务

---

### 2. 前端 API 路径修复

**修改文件**：
- `deploy/easy/.env`
- `frontend/web-react/.env.development`（新建）

**原理**：
- 后端路由前缀是 `/api/v1`（在 `backend/app/main.py` 中配置）
- 前端需要配置正确的 base URL 来访问 API

**关键配置**：

```bash
# deploy/easy/.env - Docker 容器内使用（经过 Nginx 代理）
VITE_API_BASE_URL=/api/v1
```

```bash
# frontend/web-react/.env.development - 本地开发使用（直接访问后端）
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

**为什么需要两个配置**：
- Docker 环境：Nginx 监听 80 端口，前端请求 `/api/v1/...` 会被 Nginx 代理到后端 8000 端口
- 本地开发：前端开发服务器（vite）监听独立端口，需要直接请求后端 8000 端口

---

### 3. CORS 配置修复

**修改文件**：
- `deploy/easy/.env`

**原理**：
- FastAPI 的 CORS 中间件需要明确列出允许的前端来源
- 本地开发时，前端可能运行在多个端口（如 5173、9111 等）

**关键配置**：

```bash
# deploy/easy/.env
CORS_ORIGINS=http://localhost,http://localhost:80,http://localhost:8080,http://localhost:8000,http://localhost:9111,http://127.0.0.1,http://127.0.0.1:9111
```

**注意**：不要在 CORS_ORIGINS 中添加空格，每个 origin 用逗号分隔

---

### 4. 登录账号配置

**测试账号**（开发模式 mock 用户）：
- 邮箱：`admin@tonghua.org` 或 `editor@tonghua.org`
- 密码：`vicoo-mock`（由 `MOCK_USER_PASSWORD` 环境变量设置）

**密码配置**：
```bash
# deploy/easy/.env
MOCK_USER_PASSWORD=vicoo-mock
```

---

## README 更新

### 开发模式说明

在 `deploy/easy/README.md` 中添加了本地开发说明：

```markdown
## 本地开发

后端代码修改后会自动重载，无需重启容器。

前端开发推荐使用宿主机开发服务器（热更新更快）：

```bash
# 1. 停止 Docker 前端容器（避免端口冲突）
docker compose stop frontend

# 2. 启动前端开发服务器
cd frontend/web-react
npm run dev
```

访问 http://localhost:9111 即可。

> 注意：后端已配置 CORS 允许 http://127.0.0.1:9111 请求 API。
```

---

## 修复后的使用方式

### 方式一：全部使用 Docker（生产/部署）

```bash
cd deploy/easy
docker compose up -d
# 访问 http://localhost
```

### 方式二：后端热更新，前端本地开发（推荐开发时）

```bash
# 1. 启动后端（已配置热重载）
cd deploy/easy
docker compose up -d

# 2. 停止 Docker 前端（避免端口冲突）
docker compose stop frontend

# 3. 启动前端开发服务器
cd frontend/web-react
npm run dev

# 4. 访问 http://localhost:9111
```

### 修改代码后的行为

| 修改内容 | 行为 |
|---------|------|
| 后端 Python 代码 | 自动重载（无需重启） |
| 前端代码 | 浏览器自动刷新（Vite HMR） |
| .env 配置文件 | 需要重建容器：`docker compose build <service>` |

---

## 相关文件变更列表

| 文件路径 | 变更类型 | 说明 |
|---------|---------|------|
| `deploy/easy/docker-compose.yml` | 修改 | 添加后端源代码挂载，添加开发端口 5173 到 CORS |
| `deploy/easy/entrypoint.sh` | 修改 | 开发模式使用 `--reload` 参数 |
| `deploy/easy/.env` | 修改 | VITE_API_BASE_URL 改为 `/api/v1`，CORS 添加 9111 端口 |
| `deploy/easy/README.md` | 修改 | 添加本地开发说明章节 |
| `frontend/web-react/.env.development` | 新建 | 本地开发时的 API 地址配置 |

---

## 常见问题排查

### Q：后端代码修改不生效

```bash
# 确认容器是否正确挂载
docker exec vicoo-backend ls /app/backend

# 手动重启
docker compose restart backend
```

### Q：前端请求 404

- 确认 `.env.development` 中的 `VITE_API_BASE_URL` 包含完整路径（含 `/v1`）
- 确认后端已经重新构建：`docker compose build backend`

### Q：CORS 错误

- 确认 `deploy/easy/.env` 中的 `CORS_ORIGINS` 包含前端端口
- 确认后端已重建：`docker compose build backend`
- 等待后端完全启动（约 30 秒）

### Q：登录 401

- 使用正确的 mock 账号：`admin@tonghua.org` / `vicoo-mock`
- 查看后端日志：`docker compose logs backend`