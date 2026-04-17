# VICOO CI/CD 完整配置指南

## 问题说明

**CI/CD无法自动运行的原因**：GitHub Actions的workflow文件必须放在仓库根目录的 `.github/workflows/` 目录下，GitHub才能自动识别并执行。

已修复：workflow文件现在位于 [../.github/workflows/deploy.yml](../.github/workflows/deploy.yml)

---

## 完整配置流程

### 第一步：生成SSH密钥对（本地执行）

在本地Mac上生成用于GitHub Actions连接远程服务器的SSH密钥：

```bash
# 生成ED25519类型的SSH密钥
ssh-keygen -t ed25519 -C "github-actions@vicoo" -f ~/.ssh/vicoo_deploy_key

# 查看公钥（稍后需要添加到GitHub）
cat ~/.ssh/vicoo_deploy_key.pub
```

### 第二步：将公钥添加到GitHub

1. 复制上一步生成的公钥内容
2. 进入GitHub仓库 → Settings → Deploy keys
3. 点击 "Add deploy key"
4. 标题随便填（如：`vm-deploy-key`）
5. 粘贴公钥内容，勾选 "Allow write access"
6. 点击 "Add key"

### 第三步：将私钥添加到GitHub Secrets

1. 查看私钥内容：
   ```bash
   cat ~/.ssh/vicoo_deploy_key
   ```
2. 进入GitHub仓库 → Settings → Secrets and variables → Actions
3. 点击 "New repository secret"
4. 名称填：`SSH_PRIVATE_KEY`
5. 值粘贴私钥内容
6. 点击 "Add secret"

### 第四步：配置虚拟机上的仓库

通过跳板机连接到虚拟机，执行以下命令：

```bash
# 从你的Mac连接（跳板机方式）
ssh -J CS23219620@ipa-rdp.ucd.ie student@csi420-02-vm8.ucd.ie

# 在虚拟机上：
cd /home/student/VICOO-esp

# 配置Git用户信息（必须）
git config --global user.name "GitHub Actions"
git config --global user.email "github-actions@vicoo"

# 如果还没有克隆仓库，先克隆
# git clone https://github.com/<你的用户名>/VICOO-esp.git .
```

### 第五步：添加其他必需的GitHub Secrets

在GitHub仓库的Settings → Secrets and variables → Actions中，添加以下secrets：

| Secret名称 | 说明 | 如何获取 |
|-----------|------|---------|
| `TEST_DB_ROOT_PASSWORD` | 测试数据库root密码 | 随便填，用于CI测试 |
| `TEST_DB_PASSWORD` | 测试数据库密码 | 随便填，用于CI测试 |
| `JWT_SECRET_KEY` | JWT密钥 | `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | 加密密钥 | `openssl rand -hex 32` |
| `CHILD_DATA_ENCRYPTION_KEY` | 儿童数据加密密钥 | `openssl rand -hex 32` |

### 第六步：推送代码触发CI/CD

```bash
# 在本地Mac上
cd /Users/tian/Desktop/VICOO-esp

# 提交CI/CD配置
git add .github/workflows/deploy.yml
git commit -m "feat: 添加GitHub Actions CI/CD配置"
git push origin ht-cicd

# 或者合并到main分支
git checkout main
git merge ht-cicd
git push origin main
```

---

## 自动化部署流程

配置完成后，每次更新main分支都会自动触发：

```
代码Push到main
    ↓
GitHub Actions自动执行
    ↓
┌───────────────────────────────────────┐
│  1. Backend: Lint → Test → Build镜像   │
│  2. Frontend: Lint → Test → Build镜像  │
│  3. Admin: Build镜像                   │
└───────────────────────────────────────┘
    ↓
推送Docker镜像到GHCR
    ↓
通过跳板机连接虚拟机
    ↓
虚拟机执行: git pull && docker-compose up -d
    ↓
自动部署完成！
```

---

## 本地手动部署（备用方案）

如果GitHub Actions有问题，可以手动部署：

```bash
# 连接虚拟机
ssh -J CS23219620@ipa-rdp.ucd.ie student@csi420-02-vm8.ucd.ie

# 在虚拟机上执行：
cd /home/student/VICOO-esp
git pull origin main
docker-compose down
docker-compose up -d --build
```

---

## 验证CI/CD是否正常运行

1. 打开GitHub仓库页面
2. 点击 "Actions" 标签
3. 应该能看到CI/CD Pipeline正在运行或已经运行
4. 点击具体的workflow run可以看到日志

---

## 常见问题

### Q: GitHub Actions显示 "Error: Connection refused"
A: SSH密钥配置不正确。请检查：
1. 公钥是否添加到GitHub Deploy keys
2. 私钥是否添加到GitHub Secrets（名称必须是`SSH_PRIVATE_KEY`）

### Q: 部署成功但网站没更新
A: 可能是浏览器缓存，尝试强制刷新（Cmd+Shift+R）

### Q: Docker镜像构建失败
A: 检查docker-compose.yml和Dockerfile路径是否正确

---

## 环境变量说明

虚拟机上需要配置 `.env` 文件。可以在虚拟机上创建：

```bash
cd /home/student/VICOO-esp/deploy/easy
cp .env.example .env
# 然后编辑 .env 填入实际值
```

主要需要配置：
- `MYSQL_ROOT_PASSWORD`
- `MYSQL_PASSWORD`
- `APP_SECRET_KEY`
- `JWT_SECRET_KEY`
- `ENCRYPTION_KEY`
- 第三方API密钥（微信、支付宝等）