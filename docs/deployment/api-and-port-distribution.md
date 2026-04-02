# API 与端口分布说明 (VICOO-esp)

**版本**: 1.0  
**日期**: 2026-04-02

本文档详细说明了在 Docker 环境下部署 VICOO-esp 后的服务分布、端口映射及 API 访问路径。

## 1. 容器与端口映射

| 服务名称 | 内部端口 | 宿主机映射 | 访问地址 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| **vicoo-frontend** | 80 | **80** | [http://localhost](http://localhost) | 用户主站 (React) |
| **vicoo-admin** | 80 | **8080** | [http://localhost:8080](http://localhost:8080) | 管理后台 (React) |
| **vicoo-backend** | 8000 | **8000** | [http://localhost:8000](http://localhost:8000) | 核心 API 服务 |
| **vicoo-mysql** | 3306 | 3306 | `localhost:3306` | 持久化数据库 |
| **vicoo-redis** | 6379 | 6379 | `localhost:6379` | 缓存、限流与风控 |

---

## 2. API 访问说明

所有核心业务接口均通过 `vicoo-backend` 容器暴露。

### 2.1 基础路径
- **根路径**: `http://localhost:8000`
- **API 前缀**: `/api` (推荐) 或 `/api/v1` (兼容模式)
- **文档地址**: [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger)
- **探针地址**: `http://localhost:8000/api/health`

### 2.2 核心模块分布
系统目前由 19 个路由模块组成，分为：
- **用户域**: `auth`, `users`, `oauth`
- **公益域**: `campaigns`, `artworks`, `donations`, `child_participants`
- **商务域**: `products`, `orders`, `payments`, `clothing_intakes`, `reviews`, `after_sales`
- **基础域**: `supply_chain`, `sustainability`, `ai_assistant`, `contact`, `admin`, `health`

---

## 3. 开发环境特殊端口 (宿主机直跑)

如果你在宿主机上使用 `npm run dev` 模式启动前端，通常端口分布如下：
- **Web React**: [http://localhost:9111](http://localhost:9111)
- **Admin React**: [http://localhost:5173](http://localhost:5173) (默认)
- **Backend**: [http://localhost:8080](http://localhost:8080) (本地 venv 启动)

---

## 4. 故障排查
如无法访问端口，请执行：
```bash
docker compose ps
```
确保所有状态均为 `up (healthy)`。
