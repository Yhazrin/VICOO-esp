# 在 VPS（vicoo.yhazrin.xyz）上更新版本与活动数据

> **安全**：勿在聊天或仓库中提交服务器登录密码；请用 SSH 密钥登录（示例用户为 `ubuntu`），并定期轮换密码。

## 1. 拉代码并重建（示例）

在服务器上你的项目目录中：

```bash
cd /opt/vicoo   # 按你实际路径
git pull origin main
cd deploy/easy
docker compose -f docker-compose.yml -f docker-compose.host-nginx.yml up -d --build
```

## 2. 写入/修正公益活动（图文 + 可直连封面图）

新脚本会：

- 若库里**没有**这 5 条活动，则**插入**；
- 若已有同标题但 `cover_image` 仍是 `/static/campaigns/...` 等，则**更新为 Unsplash 地址**（解决 VPS 无本地图文件时配图空白）。

在 **backend 容器**内执行（服务名以 `docker compose ps` 为准，一般为 `backend`）：

```bash
cd deploy/easy
docker compose -f docker-compose.yml -f docker-compose.host-nginx.yml exec backend \
  python -m app.add_campaigns_demo
```

无 Docker、本地 venv 时：

```bash
cd /path/to/VICOO-esp/backend
source .venv/bin/activate   # 若有
python -m app.add_campaigns_demo
```

执行成功后在前端 **公益 → 活动** 列表应能看到配图；前端需将 `VITE_API_BASE_URL` 指到当前 API 的**完整地址**时，`resolveApiAssetUrl` 才会把相对路径补全为 API 域下的地址（你已在代码里修过则无需改）。

## 3. 域名与 Nginx

- 宿主机 Nginx 参考：`nginx-site-vicoo.yhazrin.xyz.conf`（反代到 `127.0.0.1:9080`）。
- `.env` 中应配置 `CORS_ORIGINS`、`FRONTEND_URL` 为公网 `https://vicoo.yhazrin.xyz`（以你实际方案为准）。

## 4. 本机已配置 SSH 公钥时的一键补种

在**你的电脑**上（已能无密码 `ssh ubuntu@152.136.203.160`）：

```bash
export VICOO_SSH=ubuntu@152.136.203.160
export VICOO_REMOTE_DIR=/path/to/VICOO-esp   # 服务器上 git 仓库路径
./deploy/easy/remote-exec-add-campaigns.sh
```

## 5. 为何自动化环境不能代你登录

CI/助手环境通常**没有**你的服务器私钥，且**禁止**在命令中嵌入密码。由你在本机执行上述脚本即可完成与「在服务器上跑 `python -m app.add_campaigns_demo`」相同效果。

若某步报错，把**脱敏**后的命令与日志贴出即可继续排查。
