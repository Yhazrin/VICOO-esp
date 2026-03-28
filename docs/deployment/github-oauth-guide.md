# GitHub OAuth Implementation & Developer Guide

本指南旨在教会你如何理解、配置和部署本系统的 GitHub 第三方登录功能。

## 1. 什么是 GitHub OAuth？
OAuth 2.0 是一种授权框架。通过 GitHub OAuth，我们的系统不需要知道用户的 GitHub 密码，而是通过 GitHub 发给我们的“授权令牌”来确认用户的身份并获取其公开资料。

## 2. 详细实现逻辑

### 2.1 授权流
1. **请求授权 (Authorize)**: 后端生成一个安全的授权链接，引导用户前往 GitHub。
2. **回调 (Callback)**: 用户授权后，GitHub 将用户重定向回我们的后端，并带上一个短期有效的 `code`。
3. **令牌交换 (Token Exchange)**: 后端在后台（Server-to-Server）将 `code` 发送给 GitHub，换取一个 `access_token`。
4. **获取用户信息**: 
   - 访问 `https://api.github.com/user` 获取 ID、昵称和头像。
   - **特殊步骤**：由于 GitHub 隐私策略，用户邮箱可能不在个人资料中公开。后端会额外请求 `https://api.github.com/user/emails` 接口，从中筛选出用户已验证的主邮箱作为账户标识。

### 2.2 用户匹配与创建
后端拿到 GitHub ID 和 Email 后，会执行以下逻辑：
- **匹配 ID**：如果数据库里已有用户的 `github_id` 匹配，直接登录。
- **匹配邮箱**：如果 ID 没匹配上，但邮箱匹配上了，就把这个 GitHub 账号绑定到该现有邮箱账户上。
- **自动注册**：如果都是新的，就创建一个 `password_hash=""`（无密码）的新账户。

## 3. 如何配置（教学步骤）

### 第一步：在 GitHub 上注册应用
1. 登录 GitHub，前往 **Settings** -> **Developer settings** -> **OAuth Apps**。
2. 点击 **New OAuth App**。
3. 填写信息：
   - **Application name**: `VICOO Public Welfare`
   - **Homepage URL**: `http://localhost:3000` (开发环境) 或你的域名
   - **Authorization callback URL**: 
     - **重要**：必须填 `https://你的域名/api/auth/github/callback`
     - 开发环境填 `http://localhost:8000/api/auth/github/callback`
4. 创建成功后，获取 **Client ID** 和 **Client Secret**。

### 第二步：配置环境变量
在 `backend/.env` 文件中配置你刚才拿到的凭证：

```bash
GITHUB_CLIENT_ID=你的ClientID
GITHUB_CLIENT_SECRET=你的ClientSecret
FRONTEND_URL=https://your-domain.com
```

## 4. 关键代码参考

- **路由定义**: `backend/app/routers/oauth.py` 中的 `github_login` 和 `github_callback`。
- **用户模型**: `backend/app/models/user.py` 中的 `github_id` 字段。
- **前端回调页**: `frontend/web-react/src/pages/AuthCallback/index.tsx`。

## 5. 为什么 GitHub 比 Google 复杂一点？
主要在于**邮箱获取**。Google 通常在第一个用户信息请求中就返回经过验证的邮箱，而 GitHub 为了保护隐私，将邮箱列表放在了单独的子接口中，且需要开发者手动遍历列表寻找 `primary: true` 且 `verified: true` 的邮箱。本系统已处理好该逻辑。
