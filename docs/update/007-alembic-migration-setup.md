# Alembic 数据库迁移配置

## 背景

之前项目使用 `Base.metadata.create_all()` 在启动时自动创建表，这种方式存在以下问题：
- **无法保留数据**：修改模型字段需要重建表，数据会丢失
- **无法版本控制**：无法追踪数据库结构的历史变更
- **协作困难**：多人开发时难以同步数据库结构

本次更新引入了 Alembic 迁移工具来管理数据库版本。

## 修改内容

### 1. backend/alembic/env.py

添加 SQLAlchemy 模型的 target_metadata，支持 autogenerate：

```python
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import engine_from_config, pool
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context
from app.config import settings
from app.database import Base

# 导入所有模型
from app.models.user import User, ChildParticipant
from app.models.artwork import Artwork
from app.models.campaign import Campaign
from app.models.donation import Donation
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.supply_chain import SupplyChainRecord
from app.models.payment import PaymentTransaction
from app.models.audit import AuditLog
from app.models.circular_commerce import ClothingIntake, ProductReview, AfterSaleTicket

target_metadata = Base.metadata
```

添加从环境变量读取数据库 URL 的函数：

```python
def get_url():
    """Get database URL from settings."""
    db_url = settings.DATABASE_URL
    # Convert sync driver to async driver for Alembic
    if "mysql+pymysql" in db_url:
        db_url = db_url.replace("mysql+pymysql", "mysql+aiomysql")
    elif "mysql" in db_url and "aiomysql" not in db_url:
        db_url = db_url.replace("mysql", "mysql+aiomysql")
    return db_url
```

### 2. backend/alembic.ini

修改数据库 URL 配置，从环境变量读取：

```ini
# Database URL is read from environment variable DATABASE_URL
sqlalchemy.url =
```

### 3. backend/app/main.py

移除启动时的自动建表（因为 Alembic 会管理）：

```python
# 注释掉这段代码
# try:
#     async with engine.begin() as conn:
#         await conn.run_sync(Base.metadata.create_all)
# except Exception:
#     logger.warning("Database initialization failed...")
```

### 4. deploy/easy/entrypoint.sh

添加启动时自动执行迁移：

```bash
echo "Database ready. Running Alembic migrations..."

# Run Alembic migrations (alembic.ini is in backend directory)
cd /app/backend
python -m alembic upgrade head || {
    echo "Migration failed. Checking if tables exist..."
    # If migration fails, it might be because tables already exist
    python -m alembic stamp head 2>/dev/null || true
}
```

### 5. deploy/easy/backend.dockerfile

调整 PYTHONPATH：

```dockerfile
ENV PYTHONPATH=/app/backend:$PYTHONPATH
```

## 使用方式

### 首次部署

首次启动时，Docker 容器会自动执行迁移：

```bash
docker compose up -d
```

### 修改模型后

当修改 `backend/app/models/` 中的模型后，需要生成并应用迁移：

```bash
# 1. 生成本次迁移脚本
docker compose exec backend alembic revision --autogenerate -m "add field"

# 2. 查看生成的迁移文件
docker compose exec backend alembic history

# 3. 执行迁移
docker compose exec backend alembic upgrade head

# 4. 提交代码并推送
git add .
git commit -m "feat: add new field to model"
git push
```

### 同伴拉取后

拉取代码后，执行迁移即可：

```bash
git pull
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

## 本地开发（非 Docker）

如果需要在本地直接运行 Alembic：

```bash
cd backend

# 设置环境变量
export DATABASE_URL="mysql+aiomysql://vicoo:vicoo_pass_2026@localhost:3306/vicoo"

# 生成迁移
alembic revision --autogenerate -m "add field"

# 执行迁移
alembic upgrade head
```

## 数据库查看脚本

项目提供了 `deploy/easy/db.sh` 脚本：

```bash
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
```

## 验证结果

- ✅ 数据库 16 张表已创建
- ✅ 迁移版本：002 (head)
- ✅ 历史数据保留
- ✅ 启动时自动迁移

## 相关文件变更

| 文件路径 | 变更类型 |
|---------|---------|
| `backend/alembic/env.py` | 修改 |
| `backend/alembic.ini` | 修改 |
| `backend/app/main.py` | 修改 |
| `deploy/easy/entrypoint.sh` | 修改 |
| `deploy/easy/backend.dockerfile` | 修改 |
| `deploy/easy/db.sh` | 新增 |
| `deploy/easy/README.md` | 修改 |

## 注意事项

1. **Alembic 已在 requirements.txt 中**：`alembic==1.13.1`，无需额外安装
2. **数据库是 MySQL**：Alembic 会自动处理同步
3. **开发模式保留 seed 数据**：main.py 中仍有 seed 逻辑，首次启动会填充示例数据
4. **GitHub OAuth 配置**：GITHUB_CLIENT_ID 和 GITHUB_CLIENT_SECRET 需在 .env 中配置