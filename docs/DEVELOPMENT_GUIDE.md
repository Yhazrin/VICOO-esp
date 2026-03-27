# 童花公益 · 开发启动指南

## 目录

1. [项目结构](#项目结构)
2. [准备工作：启动 Docker 数据库](#准备工作启动-docker-数据库)
3. [启动后端 API](#启动后端-api)
4. [启动前端](#启动前端)
5. [验证服务状态](#验证服务状态)
6. [常见问题](#常见问题)

---

## 项目结构

```
tonghua-project/
├── admin/                     # 管理后台 (React)
├── backend/                  # FastAPI 后端
│   ├── app/                  # 应用代码
│   │   ├── routers/          # 路由（auth/artworks/campaigns/...）
│   │   ├── models/           # SQLAlchemy 模型
│   │   └── schemas/          # Pydantic schemas
│   ├── .venv/               # Python 虚拟环境
│   ├── .env                 # 环境变量
│   └── requirements.txt
├── frontend/
│   ├── web-react/           # React 前端 (Vite)
│   ├── weapp/               # 微信小程序
│   └── android/             # Android 应用 (Kotlin)
├── deploy/
│   └── docker/              # Docker 配置
│       ├── docker-compose.yml
│       ├── .env             # Docker 环境变量
│       ├── secrets/         # 密钥文件
│       └── init-db/         # 数据库初始化脚本
├── docs/                    # 完整文档
│   ├── api/                 # API 参考
│   ├── architecture/         # 系统架构
│   ├── deployment/          # 部署指南
│   └── design-system/       # 设计系统
└── tests/                   # 测试套件
```

---

## 准备工作：启动 Docker 数据库

### 1. 进入 Docker 配置目录

```bash
cd /Users/yanghaoze/Desktop/PROJECT/tonghua-project/deploy/docker
```

### 2. 启动所有 Docker 服务（MySQL + Redis）

```bash
docker compose up -d
```

**或者只启动数据库相关服务：**

```bash
docker compose up -d mysql redis
```

### 3. 验证 Docker 服务状态

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

预期输出：
```
NAMES              STATUS
tonghua-redis      Up (healthy)
tonghua-mysql      Up (healthy)
```

### 4. 确认端口已映射到主机

```bash
nc -z localhost 3306 && echo "MySQL OK" || echo "MySQL FAIL"
nc -z localhost 6379 && echo "Redis OK" || echo "Redis FAIL"
```

---

## 启动后端 API

### 1. 进入后端目录

```bash
cd /Users/yanghaoze/Desktop/PROJECT/tonghua-project/backend
```

### 2. 激活虚拟环境

```bash
source .venv/bin/activate
```

### 3. 启动后端服务

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**后台运行版本：**

```bash
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
```

### 4. 验证后端是否启动

```bash
curl -s http://localhost:8000/api/v1/products | python3 -m json.tool | head -5
```

预期输出：
```json
{
    "success": true,
    "data": [...]
}
```

### 后端地址
- **API 基础地址**: http://localhost:8000
- **API 文档**: http://localhost:8000/docs
- **健康检查**: http://localhost:8000/health

---

## 启动前端

### React 网页端

```bash
cd /Users/yanghaoze/Desktop/PROJECT/tonghua-project/frontend/web-react
npm install       # 首次运行或依赖变更后
npm run dev       # 启动开发服务器
```

浏览器访问：http://localhost:9111

### 微信小程序

```bash
cd /Users/yanghaoze/Desktop/PROJECT/tonghua-project/frontend/weapp
npm install       # 首次运行
```

使用微信开发者工具导入 `frontend/weapp` 目录。

### Android 应用

```bash
cd /Users/yanghaoze/Desktop/PROJECT/tonghua-project/frontend/android
./gradlew assembleDebug
```

APK 输出在 `app/build/outputs/apk/debug/`。

---

## 验证服务状态

### 一键检查所有服务

```bash
echo "=== Docker ===" && docker ps --filter "name=tonghua" --format "{{.Names}}: {{.Status}}" && \
echo "=== Backend ===" && curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/products && echo " (8000)" && \
echo "=== Frontend ===" && curl -s -o /dev/null -w "%{http_code}" http://localhost:9111 && echo " (9111)"
```

### 测试登录 API

```bash
# 注册
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test12345","nickname":"Test"}'

# 登录
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test12345"}'
```

---

## 常见问题

### 1. Docker 容器冲突（container name already in use）

```bash
docker rm -f tonghua-mysql tonghua-redis tonghua-rabbitmq
docker compose up -d
```

### 2. 后端连接 MySQL/Redis 失败

确认 Docker 服务已启动且端口映射正常：
```bash
docker ps
nc -z localhost 3306
nc -z localhost 6379
```

### 3. 前端 503 Service Unavailable

后端未启动或 MySQL/Redis 未连接。按本指南重新启动后端。

### 4. 端口被占用

```bash
# 查找占用端口的进程
lsof -i :8000
lsof -i :9111

# 杀死进程（替换 PID）
kill -9 <PID>
```

### 5. 重新初始化数据库

```bash
docker compose down -v   # 删除数据卷（会清空数据！）
docker compose up -d     # 重新创建并启动
```

---

## 快速启动命令汇总

```bash
# 1. 启动 Docker 数据库
cd /Users/yanghaoze/Desktop/PROJECT/tonghua-project/deploy/docker
docker compose up -d

# 2. 启动后端
cd /Users/yanghaoze/Desktop/PROJECT/tonghua-project/backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 3. 启动前端（新终端）
cd /Users/yanghaoze/Desktop/PROJECT/tonghua-project/frontend/web-react
npm run dev
```

## 服务地址

| 服务 | 地址 |
|------|------|
| 前端网站 | http://localhost:9111 |
| 后端 API | http://localhost:8000 |
| API 文档 | http://localhost:8000/docs |
| MySQL | localhost:3306 |
| Redis | localhost:6379 |
