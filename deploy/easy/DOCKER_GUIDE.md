# 🐳 VICOO Docker 完整操作指南

> **版本**：v2.0 (2026-04-04 更新)  
> **适用范围**：VICOO 项目一键部署环境  
> **维护状态**：✅ 活跃维护

---

## 📖 目录

1. [快速开始](#1-快速开始)
2. [系统架构](#2-系统架构)
3. [环境配置](#3-环境配置)
4. [服务管理](#4-服务管理)
5. [开发调试](#5-开发调试)
6. [数据库操作](#6-数据库操作)
7. [日志监控](#7-日志监控)
8. [性能优化](#8-性能优化)
9. [生产部署](#9-生产部署)
10. [故障排查](#10-故障排查)
11. [常见问题 FAQ](#11-常见问题-faq)

---

## 1. 快速开始

### 1.1 前置要求

确保您的系统已安装以下软件：

```bash
# 检查 Docker 版本（要求 >= 20.10）
docker --version

# 检查 Docker Compose 版本（要求 >= 2.20）
docker compose version
```

**推荐配置：**
- CPU：4 核心以上
- 内存：8 GB 以上
- 磁盘空间：20 GB 可用空间
- 操作系统：macOS / Linux / Windows (WSL2)

### 1.2 一键启动（3 步完成）

```bash
# ===== 第一步：进入部署目录 =====
cd /Users/tian/Desktop/VICOO-esp/deploy/easy

# ===== 第二步：创建环境变量配置 =====
cp .env.example .env

# ===== 第三步：启动所有服务 =====
docker compose up -d
```

### 1.3 验证启动成功

等待约 1-2 分钟（首次构建镜像需要时间），然后执行：

```bash
# 查看所有容器运行状态
docker compose ps
```

**预期输出示例：**
```
NAME           IMAGE                  STATUS                    PORTS
vicoo-mysql    mysql:8.0              Up (healthy)             0.0.0.0:3306->3306/tcp
vicoo-redis    redis:7-alpine         Up (healthy)             0.0.0.0:6379->6379/tcp
vicoo-backend  tonghua-backend        Up (healthy)             0.0.0.0:8000->8000/tcp
vicoo-frontend tonghua-frontend       Up (healthy)             0.0.0.0:80->80/tcp
vicoo-admin    tonghua-admin          Up (healthy)             0.0.0.0:8080->80/tcp
```

✅ 所有服务显示 `Up (healthy)` 即为正常！

### 1.4 访问应用

| 服务 | 访问地址 | 说明 |
|------|---------|------|
| 🌐 **用户网站** | http://localhost | 主网站（Nginx 托管） |
| 🛠️ **Admin 管理后台** | http://localhost:8080 | 管理界面（本次优化） |
| 📡 **Backend API** | http://localhost:8000 | FastAPI 后端接口 |
| 📊 **API 文档** | http://localhost:8000/docs | Swagger 自动生成文档 |

---

## 2. 系统架构

### 2.1 服务拓扑图

```
┌─────────────────────────────────────────────────────────────────┐
│                      用户浏览器 (Browser)                        │
└────────────┬──────────────────────┬──────────────────┬─────────┘
             │                      │                  │
     ┌───────▼────────┐   ┌────────▼────────┐  ┌──────▼──────┐
     │  Frontend :80  │   │  Admin :8080    │  │  API Docs   │
     │  (Nginx)       │   │  (Nginx)        │  │  :8000/docs │
     └───────┬────────┘   └────────┬────────┘  └─────────────┘
             │                     │
     ┌───────▼─────────────────────▼──────────────────────────┐  │
     │              Backend API Server (:8000)                 │  │
     │              FastAPI + Uvicorn                          │  │
     └───────┬────────────────────┬──────────────────────────┘  │
             │                    │                              │
     ┌───────▼──────┐    ┌───────▼──────┐                       │
     │  MySQL 8.0   │    │   Redis 7     │                       │
     │  :3306       │    │   :6379       │                       │
     └──────────────┘    └──────────────┘                       │
                                                               │
┌──────────────────────────────────────────────────────────────┘
│                    Docker Network: vicoo-network               │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 服务说明

| 服务名 | 镜像 | 端口 | 功能描述 | 数据持久化 |
|--------|------|------|---------|-----------|
| **mysql** | mysql:8.0 | 3306 | 关系型数据库，存储业务数据 | ✅ mysql_data volume |
| **redis** | redis:7-alpine | 6379 | 缓存和会话存储 | ✅ redis_data volume |
| **backend** | tonghua-backend | 8000 | FastAPI RESTful API 服务 | ❌ （代码挂载） |
| **frontend** | tonghua-frontend | 80 | React 用户前端（Nginx） | ❌ |
| **admin** | tonghua-admin | 8080 | React 管理后台（Nginx） | ❌ |

### 2.3 数据流向

```
用户请求 → Nginx (Frontend/Admin)
                ↓
         Backend API (FastAPI)
                ↓
    ┌───────────┼───────────┐
    ↓           ↓           ↓
  MySQL      Redis     外部服务
 (数据)     (缓存)   (邮件/OAuth)
```

---

## 3. 环境配置

### 3.1 配置文件位置

```
deploy/easy/
├── .env              # ⭐ 主要配置文件（必须创建）
├── .env.example      # 配置模板（参考用）
└── docker-compose.yml # 服务编排定义
```

### 3.2 核心配置项说明

#### 🔐 **数据库配置**
```bash
# MySQL root 密码（用于管理员权限）
MYSQL_ROOT_PASSWORD=your_secure_root_password

# 应用专用数据库
MYSQL_DATABASE=vicoo_db          # 数据库名称
MYSQL_USER=vicoo_user            # 应用用户名
MYSQL_PASSWORD=vicoo_pass_2026   # 应用密码
```

#### 🌍 **应用环境**
```bash
# 运行模式：development（开发）/ production（生产）
APP_ENV=development

# 安全密钥（生产环境必须修改！）
APP_SECRET_KEY=change-this-to-random-string-min-32-chars

# 加密密钥（用于敏感数据加密）
ENCRYPTION_KEY=your-32-character-encryption-key-here!!
```

#### 🌐 **跨域配置 (CORS)**
```bash
# 允许的前端请求来源（逗号分隔）
CORS_ORIGINS=http://localhost,http://localhost:80,http://localhost:8080,http://127.0.0.1:5173

# 前端基础 URL
FRONTEND_URL=http://localhost
```

#### 📧 **第三方服务（可选）**

**OAuth 登录：**
```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

**邮件服务 (Resend)：**
```bash
RESEND_API_KEY=re_xxxxxxxxxxxx
MAIL_FROM=noreply@tonghua.org
```

**支付服务：**
```bash
# 微信支付（开发模式可留空）
WECHAT_APP_ID=
WECHAT_APP_SECRET=

# 支付宝（可选）
ALIPAY_APP_ID=
ALIPAY_PRIVATE_KEY=
```

#### 👥 **种子账户密码**
```bash
SEED_ADMIN_PASSWORD=admin123      # 管理员密码
SEED_EDITOR_PASSWORD=editor123    # 编辑密码
SEED_USER_PASSWORD=user123        # 普通用户密码
MOCK_USER_PASSWORD=test123        # 测试账户密码
```

### 3.3 完整 .env 示例

```bash
# ============================================
# VICOO Docker 环境配置
# 复制自 .env.example 并根据实际情况修改
# ============================================

# ---- 数据库配置 ----
MYSQL_ROOT_PASSWORD=vicoo_root_2026_secure
MYSQL_DATABASE=vicoo_db
MYSQL_USER=vicoo_app
MYSQL_PASSWORD=vicoo_app_pass_2026

# ---- 应用设置 ----
APP_ENV=development
APP_SECRET_KEY=dev-secret-key-change-in-production-32chars!!
ENCRYPTION_KEY=encryption-key-must-be-exactly-32-bytes!!

# ---- CORS 跨域 ----
CORS_ORIGINS=http://localhost,http://localhost:80,http://localhost:8080,http://127.0.0.1:5173
FRONTEND_URL=http://localhost

# ---- OAuth（可选）----
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# ---- 邮件服务（可选）----
RESEND_API_KEY=
MAIL_FROM=noreply@tonghua.org

# ---- 种子账户密码 ----
SEED_ADMIN_PASSWORD=admin123
SEED_EDITOR_PASSWORD=editor123
SEED_USER_PASSWORD=user123
MOCK_USER_PASSWORD=test123

# ---- 微信支付（开发可留空）----
WECHAT_APP_ID=
WECHAT_APP_SECRET=
WECHAT_MCH_ID=
WECHAT_PAY_API_KEY=
WECHAT_NOTIFY_URL=

# ---- 支付宝（可选）----
ALIPAY_APP_ID=
ALIPAY_PRIVATE_KEY=
ALIPAY_PUBLIC_KEY=
ALIPAY_NOTIFY_URL=
```

---

## 4. 服务管理

### 4.1 基本命令速查表

| 操作 | 命令 | 说明 |
|------|------|------|
| **启动所有服务** | `docker compose up -d` | 后台运行 |
| **停止所有服务** | `docker compose down` | 停止并删除容器 |
| **重启某个服务** | `docker compose restart admin` | 仅重启 Admin |
| **查看状态** | `docker compose ps` | 列出所有容器状态 |
| **查看日志** | `docker compose logs -f backend` | 实时跟踪后端日志 |
| **重新构建** | `docker compose up -d --build` | 强制重新构建镜像 |

### 4.2 启动与停止

#### 🚀 **启动服务**

```bash
# 方式一：后台启动（推荐）
docker compose up -d

# 方式二：前台启动（查看实时日志）
docker compose up

# 方式三：仅启动特定服务
docker compose up -d backend mysql redis
```

#### 🛑 **停止服务**

```bash
# 停止所有服务（保留数据和容器）
docker compose stop

# 停止并删除容器（保留数据卷）
docker compose down

# 停止、删除容器和数据卷（⚠️ 会清空数据库！）
docker compose down -v
```

### 4.3 重启与重建

```bash
# 重启单个服务（配置未改变时使用）
docker compose restart backend

# 重建并重启（代码或配置改变后使用）
docker compose up -d --build backend

# 强制无缓存重建（解决缓存问题）
docker compose build --no-cache admin
docker compose up -d admin
```

### 4.4 批量操作示例

```bash
# 场景 1：更新后端代码后重启
docker compose restart backend

# 场景 2：修改了 Admin 前端代码
docker compose up -d --build admin

# 场景 3：修改了 docker-compose.yml 配置
docker compose down
docker compose up -d

# 场景 4：完全重装（清除所有数据）
docker compose down -v --rmi all
docker compose up -d --build
```

---

## 5. 开发调试

### 5.1 本地开发模式（热更新）

项目已配置源代码挂载，支持代码修改后自动重载：

#### **后端开发（Python/FastAPI）**

```bash
# 后端代码已通过 volume 挂载到容器
# 修改 Python 文件后会自动重载（Uvicorn hot-reload）

# 手动触发重载
docker compose restart backend

# 进入容器内部调试
docker exec -it vicoo-backend bash

# 在容器内执行 Python 命令
docker exec -it vicoo-backend python -c "print('hello')"
```

#### **前端开发（React/Vite）**

**方案 A：Docker 内开发（适合测试）**
```bash
# 修改前端代码后需要重建镜像
docker compose up -d --build frontend
```

**方案 B：宿主机开发（推荐，热更新更快）**
```bash
# 1. 确保 Docker 后端正在运行
docker compose up -d backend mysql redis

# 2. 停止 Docker 前端容器（避免端口冲突）
docker compose stop frontend admin

# 3. 在宿主机启动前端开发服务器
cd /Users/tian/Desktop/VICOO-esp/frontend/web-react
npm run dev

# 4. 访问控制台输出的地址（通常是 http://localhost:5173）
```

#### **Admin 管理台开发**

```bash
# 方式一：Docker 运行（适合预览）
docker compose up -d --build admin
# 访问 http://localhost:8080

# 方式二：宿主机开发（推荐）
cd /Users/tian/Desktop/VICOO-esp/admin
npm run dev
# 访问控制台输出的地址（通常是 http://localhost:5174）
```

### 5.2 进入容器调试

```bash
# === 后端容器 ===
docker exec -it vicoo-backend bash

# 在容器内可用的命令：
# - python / uvicorn：运行 Python 代码
# - alembic：数据库迁移
# - pip install xxx：安装依赖（临时，重启后丢失）

# === MySQL 容器 ===
docker exec -it vicoo-mysql mysql -u root -p${MYSQL_ROOT_PASSWORD}

# === Redis 容器 ===
docker exec -it vicoo-redis redis-cli

# === Admin 容器 ===
docker exec -it vicoo-admin sh
```

### 5.3 数据复制与同步

```bash
# 从容器复制文件到宿主机
docker cp vicoo-backend:/app/backend/app/config.py ./config-backup.py

# 从宿主机复制文件到容器
docker cp ./new-config.py vicoo-backend:/app/backend/app/config.py

# 注意：由于已配置 volume 挂载，backend 代码修改会自动同步
# 路径：../../backend:/app/backend
```

---

## 6. 数据库操作

### 6.1 使用 db.sh 工具脚本

项目提供了便捷的数据库操作脚本 `db.sh`：

```bash
cd /Users/tian/Desktop/VICOO-esp/deploy/easy

# 查看所有表
./db.sh tables

# 查看指定表结构
./db.sh schema users

# 查看表数据（前 20 行）
./db.sh data users

# 执行自定义 SQL 查询
./db.sh query "SELECT id, email, nickname FROM users LIMIT 5;"

# 快捷命令
./db.sh users        # 查看用户表
./db.sh products     # 查看商品表
./db.sh orders       # 查看订单表
```

### 6.2 Alembic 数据库迁移

项目使用 [Alembic](https://alembic.sqlalchemy.org/) 进行数据库版本管理。

#### **常用迁移命令**

```bash
# ===== 查看迁移状态 =====

# 查看当前数据库版本
docker compose exec backend alembic current

# 查看所有迁移历史
docker compose exec backend alembic history

# ===== 执行迁移 =====

# 升级到最新版本
docker compose exec backend alembic upgrade head

# 升级到指定版本
docker compose exec backend alembic upgrade <revision_id>

# 回滚一个版本
docker compose exec backend alembic downgrade -1

# 回滚到指定版本
docker compose exec backend alembic downgrade <revision_id>
```

#### **修改模型后的迁移流程**

```bash
# 第一步：在本地修改 backend/app/models/ 中的模型文件

# 第二步：生成本次迁移脚本（自动检测变化）
docker compose exec backend alembic revision --autogenerate -m "添加用户头像字段"

# 第三步：检查生成的迁移文件（可选但推荐）
docker compose exec backend cat alembic/versions/xxxxx_add_user_avatar.py

# 第四步：执行迁移
docker compose exec backend alembic upgrade head
```

### 6.3 数据备份与恢复

#### **备份数据库**

```bash
# 创建带时间戳的备份文件
docker exec vicoo-mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} \
  --single-transaction --routines --triggers \
  vicoo_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 示例输出：backup_20260404_143022.sql
```

#### **恢复数据库**

```bash
# 从备份文件恢复（⚠️ 会覆盖现有数据！）
docker exec -i vicoo-mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} \
  vicoo_db < backup_20260404_143022.sql
```

#### **导出单张表**

```bash
# 导出 users 表结构和数据
docker exec vicoo-mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} \
  vicoo_db users > users_backup.sql
```

### 6.4 重置数据库（开发环境）

⚠️ **警告：以下操作会删除所有数据！仅限开发环境使用！**

```bash
# 方法一：删除数据卷后重启（推荐）
docker compose down -v
docker compose up -d

# 方法二：使用 Alembic 回滚到初始状态
docker compose exec backend alembic downgrade base
docker compose exec backend alembic upgrade head
```

---

## 7. 日志监控

### 7.1 实时日志查看

```bash
# 查看所有服务的实时日志（混合输出）
docker compose logs -f

# 仅查看后端日志
docker compose logs -f backend

# 仅查看 Admin 日志
docker compose logs -f admin

# 查看最近 100 行日志
docker compose logs --tail=100 backend

# 查看特定时间后的日志（从最近 1 小时开始）
docker compose logs --since 1h backend
```

### 7.2 日志过滤

```bash
# 只看错误级别的日志
docker compose logs backend 2>&1 | grep -i error

# 只看 WARNING 及以上级别
docker compose logs backend 2>&1 | grep -E "(ERROR|WARNING)"

# 搜索关键字
docker compose logs backend 2>&1 | grep "Exception"
```

### 7.3 日志导出

```bash
# 导出后端日志到文件
docker compose logs backend > backend_logs_$(date +%Y%m%d).txt

# 导出所有服务日志
docker compose logs > all_services_logs_$(date +%Y%m%d).txt
```

### 7.4 日志配置（高级）

编辑 `docker-compose.yml` 可以调整日志驱动：

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "100m"    # 单个日志文件最大 100MB
        max-file: "3"        # 最多保留 3 个日志文件
```

---

## 8. 性能优化

### 8.1 资源限制配置

为防止容器占用过多系统资源，可以添加资源限制：

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'        # 最多使用 2 个 CPU 核心
          memory: 2G         # 最大内存 2GB
        reservations:
          cpus: '0.5'        # 保留 0.5 个 CPU
          memory: 512M       # 保留 512MB 内存

  mysql:
    deploy:
      resources:
        limits:
          memory: 1G         # MySQL 最大内存 1GB

  redis:
    deploy:
      resources:
        limits:
          memory: 256M       # Redis 最大内存 256MB
```

### 8.2 MySQL 性能调优

在 `docker-compose.yml` 的 MySQL 服务中添加自定义配置：

```yaml
mysql:
  command: >
    --character-set-server=utf8mb4
    --collation-server=utf8mb4_unicode_ci
    --default-authentication-plugin=mysql_native_password
    --innodb-buffer-pool-size=256M        # InnoDB 缓冲池大小
    --max-connections=200                 # 最大连接数
    --slow-query-log=1                   # 开启慢查询日志
    --long-query-time=2                   # 超过 2 秒记录慢查询
```

### 8.3 Redis 性能配置

```yaml
redis:
  command: redis-server 
    --appendonly yes           # 开启 AOF 持久化
    --maxmemory 128mb          # 最大内存限制
    --maxmemory-policy allkeys-lru  # 内存满时的淘汰策略
```

### 8.4 构建优化

#### **利用 Docker 构建缓存**

```bash
# 第一次构建（会下载依赖，较慢）
docker compose build

# 后续构建（利用缓存，较快）
docker compose build

# 仅构建变化的部分（Docker Compose 自动判断）
docker compose up -d --build
```

#### **多阶段构建（已在 Dockerfile 中实现）**

项目的 Dockerfile 已采用多阶段构建：
- **阶段 1**：安装依赖（缓存 node_modules）
- **阶段 2**：构建应用产物
- **阶段 3**：运行时镜像（仅包含必要文件）

这样可以显著减小最终镜像大小。

---

## 9. 生产部署

### 9.1 生产环境检查清单

在部署到生产环境前，请确认已完成以下配置：

- [ ] **修改所有默认密码**
  - [ ] `MYSQL_ROOT_PASSWORD` - 使用强密码
  - [ ] `MYSQL_PASSWORD` - 使用强密码
  - [ ] `APP_SECRET_KEY` - 生成随机字符串（>= 32 字符）
  - [ ] `ENCRYPTION_KEY` - 生成 32 字符的随机字符串
  - [ ] `SEED_*_PASSWORD` - 设置安全的种子账户密码

- [ ] **配置第三方服务**
  - [ ] `RESEND_API_KEY` - 邮件发送服务
  - [ ] `GOOGLE/GITHUB_CLIENT_*` - OAuth 登录（如需要）
  - [ ] `WECHAT_*` - 微信支付（如需要）

- [ ] **修改运行模式**
  ```bash
  APP_ENV=production
  ```

- [ ] **配置域名和 SSL**
  - [ ] 修改 `CORS_ORIGINS` 为实际域名
  - [ ] 修改 `FRONTEND_URL` 为实际域名
  - [ ] 配置 HTTPS 证书（Let's Encrypt 或云服务商证书）

- [ ] **安全加固**
  - [ ] 确保不暴露不必要的端口（如 3306、6379）
  - [ ] 配置防火墙规则
  - [ ] 定期备份数据库

### 9.2 生产环境 docker-compose.yml 建议

```yaml
# 生产环境建议移除端口映射或限制访问
services:
  mysql:
    # 不映射端口到宿主机，仅允许容器间访问
    ports: []

  redis:
    # 同上
    ports: []

  backend:
    # 绑定到内网 IP 或使用反向代理
    ports:
      - "127.0.0.1:8000:8000"

  frontend:
    # 使用 Nginx 反向代理处理 SSL
    # 需要挂载证书文件
    volumes:
      - ./ssl/cert.pem:/etc/nginx/ssl/cert.pem
      - ./ssl/key.pem:/etc/nginx/ssl/key.pem
```

### 9.3 自动化备份脚本

创建 `backup.sh` 脚本实现定时备份：

```bash
#!/bin/bash
# 数据库自动备份脚本
# 使用方法：chmod +x backup.sh && ./backup.sh

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="vicoo_db_${TIMESTAMP}.sql"

mkdir -p $BACKUP_DIR

echo "[$(date)] 开始备份数据库..."
docker exec vicoo-mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} \
  --single-transaction --routines --triggers \
  vicoo_db > "${BACKUP_DIR}/${FILENAME}"

# 压缩备份文件
gzip "${BACKUP_DIR}/${FILENAME}"

echo "[$(date)] 备份完成: ${BACKUP_DIR}/${FILENAME}.gz"

# 清理 7 天前的旧备份（保留最近 7 份）
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "[$(date)] 旧备份清理完成"
```

### 9.4 监控与健康检查

项目已配置健康检查，可以通过以下方式监控：

```bash
# 检查所有服务健康状态
docker compose ps

# 手动触发健康检查
curl -f http://localhost:8000/api/health && echo "Backend OK" || echo "Backend FAIL"
wget -q -O- http://localhost:80 && echo "Frontend OK" || echo "Frontend FAIL"
```

---

## 10. 故障排查

### 10.1 常见问题诊断流程

```
问题现象
    ↓
1. 检查容器状态：docker compose ps
    ↓
2. 查看服务日志：docker compose logs -f <service>
    ↓
3. 检查资源占用：docker stats
    ↓
4. 检查网络连通：docker network inspect vicoo-net
    ↓
5. 查看事件日志：docker events
```

### 10.2 问题解决方案

#### **❌ 问题 1：MySQL 连接被拒绝**

**症状**：Backend 日志显示 `MySQL connection refused`

**原因**：MySQL 还没完全启动就尝试连接

**解决方案**：
```bash
# 等待 MySQL 完全启动（约 30 秒）
docker compose logs backend | grep -i mysql

# 手动重启 Backend
docker compose restart backend

# 如果仍然失败，检查 MySQL 健康状态
docker compose ps mysql
```

#### **❌ 问题 2：Backend 显示 unhealthy**

**症状**：`docker compose ps` 显示 backend 状态为 `unhealthy`

**原因**：
1. 使用了旧的容器镜像
2. 健康检查路径配置错误
3. 依赖服务未就绪

**解决方案**：
```bash
# 重新构建并启动 Backend
docker compose up -d --build backend

# 等待 30 秒后再次检查
sleep 30 && docker compose ps backend

# 手动测试健康检查端点
curl -f http://localhost:8000/api/health
```

#### **❌ 问题 3：端口被占用**

**症状**：启动时报错 `port already in use`

**解决方案**：
```bash
# 查找占用端口的进程
lsof -i :80          # 前端端口
lsof -i :8080        # Admin 端口
lsof -i :8000        # Backend 端口
lsof -i :3306        # MySQL 端口

# 选择 A：终止占用进程
kill -9 <PID>

# 选择 B：修改 docker-compose.yml 中的端口映射
# 例如将 Admin 改为 9090 端口：
#   admin:
#     ports:
#       - "9090:80"
```

#### **❌ 问题 4：Alembic 找不到配置文件**

**症状**：执行 `alembic` 命令报错 `No config file found`

**原因**：使用了旧版本的 Backend 容器

**解决方案**：
```bash
# 重建 Backend 容器
docker compose up -d --build backend

# 再次执行命令
docker compose exec backend alembic current

# 或者手动指定工作目录（兼容旧容器）
docker compose exec backend sh -lc 'cd /app/backend && alembic current'
```

#### **❌ 问题 5：前端页面空白或 502**

**症状**：浏览器访问 Frontend/Admin 显示空白页或 502 Bad Gateway

**原因**：
1. Backend 未启动或 unhealthy
2. Nginx 配置错误
3. 前端构建失败

**解决方案**：
```bash
# 1. 检查 Backend 是否正常运行
docker compose ps backend
curl http://localhost:8000/api/health

# 2. 查看 Nginx 错误日志
docker compose logs frontend 2>&1 | grep -i error

# 3. 重新构建前端
docker compose up -d --build frontend
docker compose up -d --build admin
```

#### **❌ 问题 6：Admin 无法登录**

**症状**：Admin 管理后台登录失败

**解决方案**：
```bash
# 1. 确认 Backend 已启动
docker compose ps backend

# 2. 检查 Backend 日志有无报错
docker compose logs --tail=50 backend

# 3. 确认使用正确的测试账号：
#    管理员：admin@tonghua.org / vicoo-admin
#    编辑：  editor@tonghua.org / vicoo-editor

# 4. 测试 Backend API 是否响应
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tonghua.org","password":"vicoo-admin"}'
```

#### **❌ 问题 7：磁盘空间不足**

**症状**：Docker 操作报错 `no space left on device`

**解决方案**：
```bash
# 查看 Docker 占用的磁盘空间
docker system df

# 清理未使用的资源（安全）
docker system prune

# 清理所有未使用的资源（包括镜像，⚠️ 会删除未运行的镜像）
docker system prune -a

# 清理构建缓存
docker builder prune -f
```

### 10.3 重置与清理

当遇到无法解决的问题时，可以完全重置环境：

```bash
# ⚠️ 完全重置（会删除所有数据、镜像、容器）
docker compose down -v --rmi all --remove-orphans

# 清理 Docker 系统
docker system prune -a --volumes

# 重新启动
docker compose up -d --build
```

---

## 11. 常见问题 FAQ

### Q1: 如何查看容器的实时资源占用？

```bash
# 查看所有容器的 CPU、内存、网络 I/O
docker stats

# 仅查看特定容器
docker stats vicoo-backend vicoo-mysql
```

### Q2: 如何在容器和宿主机之间传输文件？

```bash
# 容器 → 宿主机
docker cp vicoo_backend:/app/backend/app/config.py ./config.py

# 宿主机 → 容器
docker cp ./new_file.txt vicoo_backend:/app/new_file.txt
```

### Q3: 如何查看容器的详细配置信息？

```bash
docker inspect vicoo-backend | jq '.[0].HostConfig.PortBindings'
```

### Q4: 如何扩展服务实例数量？

```bash
# 启动 3 个 Backend 实例（负载均衡）
docker compose up -d --scale backend=3
```

### Q5: 如何导出/导入整个 Docker 环境？

```bash
# 导出（保存当前状态为镜像）
docker save -o vicoo_images.tar $(docker compose config --images)

# 导入
docker load -i vicoo_images.tar
```

### Q6: 如何配置定时任务（Cron Job）？

```bash
# 创建定时备份 Cron Job
crontab -e

# 添加以下行（每天凌晨 2 点执行备份）
0 2 * * * cd /path/to/deploy/easy && ./backup.sh >> /var/log/vicoo_backup.log 2>&1
```

### Q7: 如何升级 Docker 镜像？

```bash
# 拉取最新的基础镜像
docker pull mysql:8.0
docker pull redis:7-alpine

# 重新构建应用镜像
docker compose build --no-cache

# 平滑重启（零停机）
docker compose up -d --no-deps <service>
```

### Q8: 如何查看 Docker 网络详情？

```bash
# 列出所有网络
docker network ls

# 查看 vicoo 网络详情
docker network inspect vicoo-network

# 测试容器间连通性
docker exec vicoo-backend ping vicoo-mysql
docker exec vicoo-backend ping vicoo-redis
```

---

## 📚 附录

### A. 文件结构说明

```
deploy/easy/
├── docker-compose.yml   # 服务编排配置（核心文件）
├── .env                 # 环境变量配置（需手动创建）
├── .env.example         # 环境变量模板
├── README.md            # 快速入门指南
├── DOCKER_GUIDE.md      # 本文档（完整操作指南）
├── backend.dockerfile   # Backend 镜像构建文件
├── frontend.dockerfile  # Frontend 镜像构建文件
├── admin.dockerfile     # Admin 镜像构建文件
├── nginx.conf           # Frontend 的 Nginx 配置
├── nginx-admin.conf     # Admin 的 Nginx 配置
├── entrypoint.sh        # Backend 启动初始化脚本
└── db.sh                # 数据库快捷操作脚本
```

### B. 默认端口列表

| 端口 | 服务 | 用途 |
|------|------|------|
| 80 | Frontend (Nginx) | 用户网站 HTTP |
| 8080 | Admin (Nginx) | 管理后台 HTTP |
| 8000 | Backend (FastAPI) | RESTful API |
| 3306 | MySQL | 数据库连接 |
| 6379 | Redis | 缓存连接 |

### C. 测试账号一览

| 角色 | 邮箱 | 密码 | 用途 |
|------|------|------|------|
| 管理员 | admin@tonghua.org | admin123 (用户网站)<br>vicoo-admin (管理后台) | 全权限管理 |
| 编辑 | editor@tonghua.org | editor123 (用户网站)<br>vicoo-editor (管理后台) | 内容审核 |
| 普通用户 | lihua@example.com | user123 | 正常浏览购物 |
| 测试用户 | test@vicoo.test | test123 | 功能测试 |

### D. 有用的外部链接

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [Alembic 迁移工具](https://alembic.sqlalchemy.org/)
- [Nginx 配置指南](https://nginx.org/en/docs/)

---

## 📝 更新日志

### v2.0 (2026-04-04)
- ✅ 新增完整的 Docker 操作指南文档
- ✅ 补充系统架构图和服务拓扑说明
- ✅ 新增性能优化和生产部署章节
- ✅ 完善故障排查和 FAQ 内容
- ✅ 更新 Admin 管理后台相关说明

### v1.0 (初始版本)
- 基础的快速启动和使用说明

---

## 💡 技术支持

如果在使用过程中遇到问题：

1. **首先查阅本文档**的故障排查章节（第 10 章）
2. **查看官方文档**链接（附录 D）
3. **检查 GitHub Issues** 是否有类似问题的解决方案
4. **提交新的 Issue**，请提供：
   - 操作系统和 Docker 版本
   - 完整的错误日志（`docker compose logs` 输出）
   - 复现步骤
   - 期望行为 vs 实际行为

---

> **最后更新时间**：2026-04-04  
> **文档维护者**：VICOO 开发团队  
> **适用版本**：VICOO v2026.03+
