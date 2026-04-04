# 捐赠支付链路调试记录 (2026-04-03)

## 1. 问题概览

本次排查覆盖了 Web React 捐赠页、小程序微信捐赠链路，以及 Easy Docker 部署下的支付配置透传。

实际发现的问题不是单一“未配置支付方式”，而是以下几类问题叠加：

- Web 捐赠接口 `POST /api/donations` 在创建成功后返回响应阶段触发 `MissingGreenlet`，导致前端看到 `500`
- Web 前端默认把捐赠支付方式写死为 `wechat`，不适合浏览器环境
- `deploy/easy/docker-compose.yml` 没有把微信/支付宝相关环境变量传给后端
- 小程序捐赠页仍在使用旧接口字段：
  - `amount` 按分传递
  - `anonymous` 字段名过期
  - 缺少 `donor_name`
  - 仍依赖不存在的 `/donations/verify`

## 2. 已完成修复

### 2.1 修复 Web 捐赠 500

文件：
- `backend/app/routers/donations.py`

修复内容：
- 创建 donation 后显式 `refresh`
- 改为手动构造 `DonationOut`，避免 ORM 延迟属性在异步上下文外被 Pydantic 访问

验证结果：
- `stripe` 捐赠已可成功返回 `201`
- 实测返回示例包含：
  - `id`
  - `payment_method`
  - `status`
  - `created_at`
  - `donationId`

### 2.2 Web 端支付方式显式选择

文件：
- `frontend/web-react/src/components/editorial/DonationPanel.tsx`
- `frontend/web-react/src/pages/Donate/index.tsx`
- `frontend/web-react/src/i18n/en.json`
- `frontend/web-react/src/i18n/zh.json`

修复内容：
- 新增支付方式选择：
  - `Stripe`
  - `WeChat Pay`
  - `Alipay`
- Web 默认推荐 `Stripe`
- 国内支付方式未配置时，页面显示明确说明，不再只报通用错误
- 前端直接展示后端返回的支付配置错误或提示

### 2.3 Alipay 未配置时不再返回 500

文件：
- `backend/app/routers/donations.py`

修复内容：
- 当 `payment_method == "alipay"` 且当前环境未配置完整支付宝参数时：
  - 生产环境返回明确配置错误
  - 开发环境返回 `payment_notice` 与 `simulation_mode`

实测返回：

```json
{
  "payment_notice": "Alipay web payment is not configured in this environment yet.",
  "simulation_mode": true
}
```

### 2.4 小程序微信捐赠链路对齐当前后端

文件：
- `frontend/weapp/pages/donate/index.js`

修复内容：
- 请求 payload 改为当前后端契约：
  - `donor_name`
  - `amount` 使用元，不再乘以 100
  - `currency: "CNY"`
  - `payment_method: "wechat"`
  - `is_anonymous`
  - `message`
- `wx.requestPayment` 默认签名类型改为 `SHA256`
- 移除当前仓库中不存在的 `/donations/verify` 依赖
- 支付成功后直接展示本地成功态，并保留 `donationId`

说明：
- 小程序当前应只走微信支付，这与后端现有 `WeChatPayService` 的方向一致
- 若要正式上线，仍需配置真实微信商户参数

### 2.5 Easy Docker 支付配置透传

文件：
- `deploy/easy/docker-compose.yml`
- `deploy/easy/.env.example`

新增环境变量透传：
- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`
- `WECHAT_MCH_ID`
- `WECHAT_PAY_API_KEY`
- `WECHAT_NOTIFY_URL`
- `ALIPAY_APP_ID`
- `ALIPAY_PRIVATE_KEY`
- `ALIPAY_PUBLIC_KEY`
- `ALIPAY_NOTIFY_URL`

## 3. 当前结论

### Web React

- 已修复 donate 页实际 `500`
- 已支持显式支付方式选择
- 当前本地开发最稳定方案仍是：
  - Web 端默认走 `Stripe`
  - 微信支付主要留给小程序

### WeChat 小程序

- 已对齐当前 donation 创建接口
- 目前最适合只保留微信支付

### 支付能力状态

- `WeChat Pay`：
  - 后端已有基础创建支付参数能力
  - 更适合小程序 `JSAPI`
- `Alipay`：
  - 当前仅补足了“未配置时不崩溃”
  - 真正的“创建支付宝支付单”服务仍未完整实现

## 4. 后续建议

建议按平台拆分支付策略：

1. Web React：
   - 默认 `Stripe`
   - `Alipay` 可作为下一阶段补充
   - `WeChat Pay` 不建议直接沿用当前小程序 `JSAPI` 逻辑

2. WeChat Mini Program：
   - 只保留 `WeChat Pay`
   - 用真实 `openid + mch` 配置打通正式支付

3. 后端下一阶段：
   - 新增 `AlipayService`
   - 为 Web 提供真正的支付宝下单能力
   - 增加支付能力探测接口，前端可根据服务端配置动态显示可选支付方式
