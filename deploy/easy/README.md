# VICOO — Easy Deploy

一键部署：把 VICOO 的前端、后端、MySQL、Redis 全部跑起来，无需配置任何密钥或环境变量。

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
| 网站 | http://localhost |
| API | http://localhost:8000 |
| API 文档 | http://localhost:8000/docs |

## 验证服务状态

```bash
docker compose ps
```

所有服务显示 `healthy` 即为正常。

## 测试账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@vicoo.test | vicoo-admin |
| 编辑 | editor@vicoo.test | vicoo-editor |
| 用户 | user@vicoo.test | vicoo-user |

## 停止

```bash
docker compose down
```

**保留数据（下次启动自动恢复）：**

```bash
docker compose down -v   # 删除数据卷（清空数据库！）
docker compose up -d     # 重新启动
```

## 自定义端口

编辑 `docker-compose.yml` 中的端口映射：

```yaml
services:
  frontend:
    ports:
      - "8080:80"    # 把 :80 改成 :8080，访问 http://localhost:8080
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

## 文件说明

```
deploy/easy/
├── docker-compose.yml   # 服务编排
├── .env                  # 所有配置（密钥、数据库名、密码）
├── backend.dockerfile    # 后端镜像构建
├── frontend.dockerfile   # 前端镜像构建
├── nginx.conf           # Nginx 配置（API 代理 + SPA）
└── README.md            # 本文件
```

## 故障排查

### "MySQL connection refused" 错误

MySQL 启动较慢，等待约 30 秒后重试：

```bash
docker compose logs backend | grep -i mysql
```

### 端口被占用

```bash
# 查找占用 80 端口的进程
lsof -i :80

# 或修改 docker-compose.yml 中 frontend 的端口映射
```

### 清理重装

```bash
docker compose down -v --rmi all
docker compose up -d --build
```
