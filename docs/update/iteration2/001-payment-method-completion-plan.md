# Iteration 2.1: 支付方式完善计划

**日期**: 2026-04-03  
**状态**: 规划中  
**范围**: Web React / WeChat Mini Program / Backend / Docker Easy Deploy

## 1. 迭代目标

本迭代的目标是将当前“可创建捐赠记录，但支付能力不完整”的状态，推进到“按平台区分支付方式、具备真实支付接入能力、并且失败路径可观测”的状态。

当前建议的支付策略：

- Web React：
  - 默认支持 `Stripe`
  - 规划支持 `Alipay`
  - 不直接复用当前小程序 `WeChat JSAPI` 逻辑
- WeChat Mini Program：
  - 只支持 `WeChat Pay`
- Backend：
  - 提供统一支付创建入口
  - 根据平台和支付方式返回对应参数

## 2. 当前问题

### 2.1 Web 端支付链路不完整
- `stripe` 当前只是创建 donation 记录，不会真实扣款
- `alipay` 当前只有未配置兜底提示，没有真正的下单服务
- `wechat` 当前更接近小程序用法，不适合浏览器页面直接调用

### 2.2 小程序与后端契约曾经不一致
- 旧版小程序 donate 页使用了历史字段和旧流程
- 当前已做基础对齐，但仍未进入“真实商户支付”阶段

### 2.3 配置与可观测性不完整
- Easy Docker 之前没有透传完整支付环境变量
- 前端缺少“服务端是否支持某支付方式”的动态能力探测
- 后端缺少统一的支付能力状态接口

## 3. 本迭代要完成的内容

## 3.1 页面与前端改造

### Web React

页面：
- `/donate`
- 可选新增：`/donate/result`

需要完善：
- 捐赠表单增加支付方式选择器
- 根据服务端能力动态显示：
  - 可用
  - 未配置
  - 当前平台不支持
- `Stripe` 支付时接入真实前端支付流程
- `Alipay` 支付时支持跳转或拉起支付
- 完成支付后展示：
  - 支付成功
  - 支付处理中
  - 支付失败
  - 用户取消

建议补充组件：
- `PaymentMethodSelector`
- `DonationPaymentStatus`
- `PaymentUnavailableNotice`

### WeChat Mini Program

页面：
- `frontend/weapp/pages/donate`

需要完善：
- 固定只显示 `WeChat Pay`
- 使用真实微信商户参数拉起 `wx.requestPayment`
- 支付完成后回到捐赠结果页
- 用户取消支付时给出明确提示
- 支付成功后增加订单/捐赠状态轮询或回跳确认

## 3.2 后端能力完善

### Donation Router

文件：
- `backend/app/routers/donations.py`

需要完善：
- donation 创建与 payment 创建解耦
- donation 成功创建后，根据支付方式返回：
  - `stripe client_secret`
  - `alipay order string / redirect info`
  - `wechat requestPayment params`
- 区分：
  - donation record created
  - payment initialized
  - payment confirmed

### Payment Service

文件：
- `backend/app/services/payment_service.py`
- 建议新增：
  - `backend/app/services/alipay_service.py`
  - `backend/app/services/stripe_service.py`

需要完善：
- `WeChatPayService`
  - 保留给小程序
  - 明确要求 `openid`
  - 区分 development mock 与 production real call
- `AlipayService`
  - 新增统一下单能力
  - 支持签名、回调验签、订单状态更新
- `StripeService`
  - 新增 `PaymentIntent` 创建能力
  - 支持 webhook 验签和状态同步

### Payment Router

文件：
- `backend/app/routers/payments.py`

需要完善：
- 增加 `GET /payments/capabilities`
- 增加 `POST /payments/stripe/create-intent`
- 增加 `POST /payments/alipay/create`
- 保留并强化：
  - `/payments/wechat-notify`
  - `/payments/alipay-notify`
  - `/payments/webhook`

## 3.3 配置与部署

文件：
- `deploy/easy/.env.example`
- `deploy/easy/docker-compose.yml`

需要完善：
- `WECHAT_*`
- `ALIPAY_*`
- 后续应补：
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`

建议新增：
- 支付方式能力开关，例如：
  - `PAYMENT_ENABLE_WECHAT_MINIPROGRAM`
  - `PAYMENT_ENABLE_ALIPAY_WEB`
  - `PAYMENT_ENABLE_STRIPE_WEB`

## 4. 建议实施顺序

### Phase 1: 平台能力收口
- 新增 `payments/capabilities` 接口
- Web 页面根据 capabilities 决定展示哪些支付方式
- 小程序端固定微信支付

### Phase 2: Stripe 真支付
- Backend 新增 `StripeService`
- Web `/donate` 接入真实 `PaymentIntent`
- webhook 更新 donation / payment 状态

### Phase 3: WeChat Mini Program 真支付
- 小程序端获取真实 `openid`
- 后端按真实商户配置生成参数
- 回调后更新 donation 状态

### Phase 4: Alipay Web
- 新增 `AlipayService`
- Web 端支持支付宝下单与回跳
- 完成回调验签与状态同步

## 5. 需要新增或完善的测试

### Backend
- donation 创建后不会因为序列化失败而返回 500
- Stripe intent 创建成功测试
- Alipay create 接口测试
- WeChat pay 参数生成测试
- webhook / notify 验签测试
- 支付状态同步测试

### Frontend Web
- 切换支付方式 UI 测试
- 未配置支付方式的禁用/提示测试
- donate 页错误提示测试
- 支付成功/取消/失败状态页测试

### WeChat Mini Program
- donate 页 payload 契约测试
- 微信支付成功/取消测试
- 回调完成后结果页展示测试

## 6. 验收标准

- Web React 上：
  - `stripe` 可以真实发起支付
  - `alipay` 未配置时不会 500
  - 页面能明确显示支付方式状态
- WeChat Mini Program 上：
  - donate 页只走微信支付
  - 可拉起 `wx.requestPayment`
- Backend 上：
  - donation 创建、payment 初始化、payment 确认三阶段状态清晰
  - 所有回调都有验签
  - 失败不再返回模糊 500

## 7. 本迭代产出文件建议

建议最终至少包含：
- 前端支付方式选择组件
- `StripeService`
- `AlipayService`
- `payments/capabilities` 接口
- 支付配置更新后的 `deploy/easy/.env.example`
- 对应测试用例
- 新一版 `docs/update/debug` 调试记录
