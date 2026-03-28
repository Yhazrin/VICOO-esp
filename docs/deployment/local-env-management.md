# Local Environment & Database Management Guide

虽然本项目推荐使用 Docker 进行部署和运行，但为了获得最佳的开发体验（代码补全、迁移管理、自动化测试），你需要在本地配置 Python 虚拟环境。

## 1. Python 虚拟环境配置

### 创建与安装
在 `backend` 目录下执行：

```bash
# 创建虚拟环境
python3 -m venv .venv

# 激活环境
source .venv/bin/activate  # Windows 使用 .venv\Scripts\activate

# 安装开发依赖
pip install -r requirements.txt
```

### IDE 设置 (VSCode 示例)
1. 按 `Cmd+Shift+P` (macOS) 或 `Ctrl+Shift+P` (Windows)。
2. 输入 `Python: Select Interpreter`。
3. 选择刚刚创建的 `./backend/.venv/bin/python`。

---

## 2. 数据库管理流程

数据库服务由 Docker 容器提供，但管理命令通常在本地虚拟环境下发起。

### 2.1 环境变量准备
在 `backend/` 目录下确保存在 `.env` 文件，且其 `DATABASE_URL` 指向 localhost：
```bash
DATABASE_URL=mysql+aiomysql://vicoo:vicoo_pass_2026@localhost:3306/vicoo
```

### 2.2 表结构迁移 (Alembic)
当你修改了 `app/models/` 中的 SQLAlchemy 模型后，必须生成并执行迁移。

1. **生成迁移脚本**：
   ```bash
   alembic revision --autogenerate -m "add google_id to user"
   ```
2. **应用到数据库**：
   ```bash
   alembic upgrade head
   ```

### 2.3 数据初始化 (Seed)
如果你需要重新填充演示数据（管理员账号、初始商品等）：
```bash
python -m app.seed
```

---

## 3. 常用开发指令

| 任务 | 命令 | 说明 |
| :--- | :--- | :--- |
| **启动全栈** | `docker compose up -d` | 启动 DB, API 和 Frontend |
| **重置数据库** | `docker compose down -v` | **警告**：这会删除所有数据 |
| **进入 API 容器** | `docker exec -it vicoo-backend bash` | 在容器内调试 |
| **查看实时日志** | `docker compose logs -f backend` | 调试后端报错 |
| **运行测试** | `pytest` | 在虚拟环境下运行后端测试 |

---

## 4. 数据库连接参考

| 字段 | 值 |
| :--- | :--- |
| **类型** | MySQL 8.0 |
| **主机** | `localhost` |
| **端口** | `3306` |
| **用户** | `vicoo` |
| **密码** | `vicoo_pass_2026` |
| **数据库** | `vicoo` |
