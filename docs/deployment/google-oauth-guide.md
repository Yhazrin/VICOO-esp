# Google OAuth Implementation & Deployment Guide

本系统集成了谷歌第三方登录功能，允许用户通过谷歌账户快速注册与登录。本文档详细说明了其实现架构、配置步骤及部署要求。

## 1. 技术实现方案

系统采用 **OAuth 2.0 授权码模式 (Authorization Code Flow)**，确保身份验证过程的安全性。

### 1.1 交互流程
1. **[Frontend]** 用户点击 Google 登录按钮，访问 `window.location.href = '/api/auth/google'`。
2. **[Backend]** 构造谷歌授权 URL（包含 `client_id`, `scope`, `state` 等），并将用户重定向至谷歌。
3. **[Google]** 用户完成授权，谷歌将浏览器重定向回 `https://<your-domain>/api/auth/google/callback?code=xxx`。
4. **[Backend]** 后端在后台通过 `httpx` 执行以下操作：
   - 使用 `code` 向谷歌服务器换取 `access_token`。
   - 使用 `access_token` 请求谷歌 UserInfo API 获取用户信息（ID, Email, Name, Picture）。
   - **用户关联逻辑**：
     - 若 `google_id` 已存在：获取该用户。
     - 若 `google_id` 不存在但 `email` 已存在：将谷歌 ID 绑定至现有账户。
     - 若均不存在：创建 `status="active"` 且 `password_hash=""` 的新账户。
5. **[Backend]** 生成本系统的 JWT 令牌，写入 `httpOnly` Cookie。
6. **[Backend]** 重定向至前端回调页：`/auth/callback?access_token=...`。
7. **[Frontend]** `AuthCallback` 组件解析 URL 中的令牌，更新 `authStore` 状态，完成登录。

## 2. 关键代码位置

| 组件 | 文件路径 | 说明 |
| :--- | :--- | :--- |
| **后端路由** | `backend/app/routers/oauth.py` | 核心逻辑：引导重定向、回调处理、令牌交换。 |
| **数据模型** | `backend/app/models/user.py` | `User` 模型中包含 `google_id` 字段。 |
| **前端入口** | `frontend/web-react/src/pages/Login/index.tsx` | 登录按钮触发逻辑。 |
| **前端回调** | `frontend/web-react/src/pages/AuthCallback/index.tsx` | 处理重定向回来的令牌，同步状态。 |

## 3. 配置指南

### 3.1 谷歌开发者控制台设置
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)。
2. 创建项目并启用 **Google People API**。
3. 在 **OAuth consent screen** 配置应用信息。
4. 在 **Credentials** 中创建 **OAuth 2.0 Client ID** (Web application)。
5. **重要**：添加 **Authorized redirect URIs**：
   - 开发环境：`http://localhost:8000/api/auth/google/callback`
   - 生产环境：`https://your-domain.com/api/auth/google/callback`

### 3.2 环境变量配置
在 `backend/.env` 中添加以下变量：

```bash
# Google OAuth 凭证
GOOGLE_CLIENT_ID=你的客户端ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=你的客户端密钥

# 前端基础 URL (用于构建重定向地址)
FRONTEND_URL=https://your-domain.com
```

## 4. 部署注意事项

1. **HTTPS 强制要求**：谷歌要求回调地址（除 localhost 外）必须使用 HTTPS。请确保 Nginx 配置了有效的 SSL 证书。
2. **Cookie 安全性**：系统在生产环境下会自动为 Cookie 开启 `Secure` 属性。
3. **域名一致性**：`FRONTEND_URL` 必须与用户访问的域名完全一致，否则会导致重定向后的跨域或状态丢失问题。
4. **Nginx 转发**：确保 Nginx 正确转发 `/api/` 路径至后端，且保留原始 Header（Host, X-Real-IP 等）。

## 5. 常见问题排查

- **Redirect URI Mismatch**：检查谷歌控制台配置的 URI 是否与后端生成的 `redirect_uri` 完全一致。
- **State Mismatch**：系统通过 Cookie 存储 `oauth_state` 以防止 CSRF。如果跨域配置不当（Samesite 策略），可能导致回调时 Cookie 无法读取。
