# VICOO — Easy Deploy

一键部署：把 VICOO 的前端、后端、MySQL、Redis、管理员后台全部跑起来，无需配置任何密钥或环境变量。

## 前置要求

- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.20+)

```bash
docker --version        # >= 20.10
docker compose version  # >= 2.20
```

## 快速启动

```bash
# 1. 创建配置文件（复制模板）
cd deploy/easy
cp .env.example .env

# 2. 启动所有服务
docker compose up -d
```

等待约 1-2 分钟（首次启动 MySQL 初始化需要一点时间），然后访问：

| 服务 | 地址 |
|------|------|
| 用户网站 | http://localhost |
| 管理后台 | http://localhost:8080 |
| API | http://localhost:8000 |
| API 文档 | http://localhost:8000/docs |

## 本地开发

后端代码修改后会自动重载，无需重启容器。

前端开发推荐使用宿主机开发服务器（热更新更快）：

```bash
# 1. 重新构建后端（首次配置或修改 CORS 后需要）
docker compose build backend
docker compose up -d backend

# 2. 停止 Docker 前端容器（避免端口冲突）
docker compose stop frontend

# 3. 启动前端开发服务器
cd frontend/web-react
npm run dev
```

访问前端开发服务器显示的端口（通常是 9111）即可。

> 注意：后端已配置 CORS 允许 http://localhost:9111 请求 API。

## 测试账号

| 服务 | 角色 | 邮箱 | 密码 |
|------|------|------|------|
| 用户网站 | 管理员 | admin@tonghua.org | (由 SEED_ADMIN_PASSWORD 环境变量设置) |
| 用户网站 | 编辑 | editor@tonghua.org | (由 SEED_EDITOR_PASSWORD 环境变量设置) |
| 用户网站 | 普通用户 | lihua@example.com | (由 SEED_USER_PASSWORD 环境变量设置) |
| 管理后台 | 管理员 | admin@tonghua.org | vicoo-admin |
| 管理后台 | 编辑 | editor@tonghua.org | vicoo-editor |

> **注意**：用户网站和管理后台使用不同的密码体系。用户网站密码由 `.env` 中的 `SEED_*_PASSWORD` 设置；管理后台使用固定的测试密码 `vicoo-admin` / `vicoo-editor`（仅用于本地开发环境）。

## 验证服务状态

```bash
docker compose ps
```

所有服务显示 `healthy` 即为正常。

## 停止

```bash
docker compose down
```

**保留数据（下次启动自动恢复）：**

```bash
docker compose down -v   # 删除数据卷（清空数据库！）
docker compose up -d     # 重新启动
```

# 数据库查看
使用方法（在 deploy/easy 目录下）：

  # 查看所有表
  ./db.sh tables

  # 查看表结构
  ./db.sh schema users

  # 查看表数据
  ./db.sh data users

  # 运行自定义 SQL
  ./db.sh query "SELECT id, email, nickname FROM users LIMIT 5;"

  # 快捷命令
  ./db.sh users
  ./db.sh products
  ./db.sh orders

  ---
  修改 models 后更新数据库（开发环境最简单的方式）：

  # 删除旧数据，重新初始化
  docker compose down -v
  docker compose up -d

  ▎ ⚠️ 警告：这会删除所有数据，仅适合开发环境。
  

## 自定义端口

编辑 `docker-compose.yml` 中的端口映射：

```yaml
services:
  frontend:
    ports:
      - "8080:80"    # 把 :80 改成 :8080，访问 http://localhost:8080
  admin:
    ports:
      - "9090:80"    # 把 :80 改成 :9090，访问 http://localhost:9090
  backend:
    ports:
      - "8081:8000"  # API 改成 8081
```

## 修改密码

编辑 `.env` 文件中的 `SEED_ADMIN_PASSWORD`、`SEED_USER_PASSWORD` 等字段，然后重建：

```bash
docker compose down -v
docker compose up -d --build
```

## 数据库迁移

项目使用 [Alembic](https://alembic.sqlalchemy.org/) 管理数据库版本。首次启动时自动执行迁移。

### 修改数据模型后

当修改 `backend/app/models/` 中的模型后，需要生成并应用迁移：

```bash
# 1. 生成本次迁移脚本（修改模型后执行）
docker compose exec backend alembic revision --autogenerate -m "描述本次修改"

# 2. 查看生成的迁移文件
docker compose exec backend alembic history

# 3. 执行迁移
docker compose exec backend alembic upgrade head
```

### 常用命令

```bash
# 查看当前迁移版本
docker compose exec backend alembic current

# 查看所有迁移历史
docker compose exec backend alembic history

# 回滚上一次迁移
docker compose exec backend alembic downgrade -1

# 回滚到指定版本
docker compose exec backend alembic downgrade <revision>
```

### 重置数据库（开发环境）

```bash
# 删除所有数据并重新创建（所有数据会丢失！）
docker compose down -v
docker compose up -d
```

### 本地开发（非 Docker）

```bash
cd backend

# 生成本地迁移（需要设置 DATABASE_URL 环境变量）
export DATABASE_URL="mysql+aiomysql://vicoo:vicoo_pass_2026@localhost:3306/vicoo"
alembic revision --autogenerate -m "描述本次修改"
alembic upgrade head
```

## 文件说明

```
deploy/easy/
├── docker-compose.yml   # 服务编排
├── .env                 # 所有配置（密钥、数据库名、密码）
├── .env.example         # 配置模板
├── backend.dockerfile   # 后端镜像构建
├── frontend.dockerfile  # 前端镜像构建
├── admin.dockerfile     # 管理后台镜像构建
├── nginx.conf           # Nginx 配置（用户网站 + API 代理）
├── nginx-admin.conf     # Nginx 配置（管理后台）
├── entrypoint.sh        # 后端启动脚本（MySQL 等待 + 数据库初始化）
└── README.md            # 本文件
```

## 故障排查

### `docker compose exec backend alembic ...` 报 `No config file 'alembic.ini' found`

这通常说明你正在使用旧版本 backend 容器，默认工作目录不是 `/app/backend`。

先重建 backend：

```bash
docker compose up -d --build backend
```

然后再执行：

```bash
docker compose exec backend alembic current
docker compose exec backend alembic upgrade head
```

如需兼容旧容器或手动指定工作目录，也可使用：

```bash
docker compose exec backend sh -lc 'cd /app/backend && alembic current'
docker compose exec backend sh -lc 'cd /app/backend && alembic upgrade head'
```

### backend 一直是 `unhealthy`

如果 MySQL 已经正常，但 backend 一直显示 `unhealthy`，请检查是否使用了最新 compose 配置。

当前健康检查路径应为：

```text
http://localhost:8000/api/health
```

如果容器还是旧配置，请重建：

```bash
docker compose up -d --build backend
```

### "MySQL connection refused" 错误

MySQL 启动较慢，等待约 30 秒后重试：

```bash
docker compose logs backend | grep -i mysql
```

### 端口被占用

```bash
# 查找占用端口的进程
lsof -i :80          # 前端
lsof -i :8080        # 管理后台
lsof -i :8000        # API

# 或修改 docker-compose.yml 中服务的端口映射
```

### 修改后端代码但接口仍旧报错

后端已配置源代码挂载，修改 Python 代码后会自动重载。

如果遇到问题，可尝试：

```bash
docker compose restart backend
```

如果前端构建产物改了，需要重新构建：

```bash
docker compose up -d --build frontend
```

### 管理后台无法登录

1. 确认后端已启动并 healthy：`docker compose ps backend`
2. 检查后端日志：`docker compose logs backend`
3. 确认使用的是管理后台专用测试账号：
   - 管理员：admin@tonghua.org / vicoo-admin
   - 编辑：editor@tonghua.org / vicoo-editor

### 清理重装

```bash
docker compose down -v --rmi all
docker compose up -d --build
```
