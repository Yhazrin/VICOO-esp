# VICOO-esp 缺陷修复与环境配置报告 (2026-04-03)

## 1. 发现的问题与修复方案

### 1.1 语言状态刷新不留存
- **问题根源**：`frontend/web-react/src/i18n/index.ts` 在初始化 i18next 时，硬编码了 `lng: 'en'`。虽然 `uiStore` 将语言状态持久化到了 `localStorage`，但页面刷新时 `i18n` 并没有读取该值。
- **修复方案**：修改 `i18n/index.ts`，增加 `getInitialLanguage` 函数，在初始化前从 `localStorage` (`tonghua-ui-settings`) 中读取 `currentLocale`。
- **验证结果**：通过。刷新后中文状态能够保留。

### 1.2 捐赠功能 500 错误
- **问题根源**：`backend/app/routers/donations.py` 中的 `create_donation` 函数使用了 `settings.APP_ENV` 判断环境，但该文件顶部**未导入 `settings`**。这导致在执行到该行时触发 `NameError`，被底部的 `Exception` 捕获并返回 500。
- **修复方案**：在 `donations.py` 顶部导入 `from app.config import settings`。
- **验证结果**：待在登录状态下进一步验证（非登录状态会返回 401，这是预期的安全机制）。

### 1.3 登录/登出无提示
- **问题根源**：前端 `web-react` 缺失通知系统（Toast）。
- **修复方案**：
    1. 为 `web-react` 安装了 `react-hot-toast` 库。
    2. 在 `App.tsx` 中挂载了全局 `<Toaster />`。
    3. 修改了 `useAuth.ts` 钩子，在登录、注册、登出成功及失败时触发 `toast.success` 或展示错误。
- **验证结果**：通过。操作后右上角会出现浮窗提示。

### 1.4 登录错误提示不清晰（语言与视觉）
- **问题根源**：
    1. 错误提示直接显示后端原始字符串（如 "Invalid credentials"），未经过国际化处理。
    2. 视觉上使用棕色文字，示警性不足。
- **修复方案**：
    1. 编写了 `frontend/web-react/src/utils/error.ts` 通用错误解析工具，提取 FastAPI 返回的 `detail` 字段。
    2. 在 `useAuth.ts` 中根据后端返回的 key（如 "Invalid credentials"）匹配国际化翻译文件（`zh.json`/`en.json`）。
    3. 在 `Login/index.tsx` 中将错误颜色由棕色改为 `text-rust`（品牌红/橙色），提高视觉警示度。
- **验证结果**：通过。输入错误账号密码时，会显示红色的中文报错“邮箱或密码错误”。

### 1.5 找回密码逻辑前后端不匹配与 Mock 支持
- **问题根源**：
    1. 前端 `ForgotPassword/index.tsx` 页面硬编码了成功提示语，且未处理后端返回的实际数据或错误状态（如 404）。
    2. 后端 `auth.py` 之前的接口只是 Stub（桩代码），缺乏对 Mock 账户的特殊处理逻辑，也未集成 `Resend` 邮件服务。
- **修复方案**：
    1. **后端**：重构 `forgot-password` 接口。识别以 `@vicoo.test`、`@tonghua.org` 或 `vicoo-` 开头的邮箱为测试账户，在响应中直接返回密码提示。对真实邮箱，通过 `send_password_recovery_email` 服务投递包含临时访问凭证的邮件。
    2. **前端**：修改提交逻辑，根据后端返回的 `is_mock` 状态动态展示内容：测试账户直接在 UI 的虚线方框中显示密码，真实账户显示“邮件已发送”提示。同时捕获 404 错误，显示“该邮箱未在记录中找到”。
- **验证结果**：通过。输入 `admin@tonghua.org` 能够立即看到密码提示，输入无效邮箱会正确报错。

---

## 2. 新增依赖与环境变更

### 2.1 前端依赖下载
为了实现通知功能，我在 `frontend/web-react` 目录下安装了以下包：
- `react-hot-toast`: 用于显示通知。

**手动安装命令**（如果在 Docker 外部运行）：
```bash
npm install --prefix frontend/web-react react-hot-toast
```

### 2.2 验证工具安装 (可选)
为了进行自动化验证，我安装了：
- `@playwright/test`: 浏览器自动化测试。
- `puppeteer-core`: `browser` 技能依赖。

---

## 3. Docker 环境跑通指南

如果在 Docker 环境下运行，请确保以下操作：

### 3.1 重新构建或更新依赖
由于前端增加了 `react-hot-toast`，你需要重新构建前端镜像或在容器内安装依赖：
```bash
# 进入前端容器执行
npm install
# 或者在宿主目录执行后重启容器（如果 code 是 mount 进去的）
```

### 3.2 环境变量确认
- 确保 `backend/.env` 中正确配置了数据库连接，否则捐赠功能在写入数据库时仍可能报错。
- 如果是本地开发模式，`APP_ENV` 应设置为 `development` 以绕过真实的微信支付调用（进入模拟模式）。

### 3.3 数据库迁移 (Alembic)
如果你发现捐赠报错是由于数据库表结构不一致：
```bash
# 在后端容器内执行
alembic upgrade head
```
