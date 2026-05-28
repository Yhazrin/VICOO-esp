# 商品购买全链路审查

日期：2026-05-28
审查范围：后端 `app/` + 前端 `web-react/src/`

---

## 链路概览

```
购物车 → Checkout页 → 创建订单 → 支付 → 回调确认 → 订单详情
```

---

## 一、后端问题

### 1. 库存并发（ HIGH — 已有超卖风险）

**文件：** `app/services/order/service.py`

**问题：** `place_order()` 用普通 `UPDATE` 扣库存，无 `SELECT FOR UPDATE` 行锁。并发请求同时读到 stock=5，都会通过校验。

**修复方向：** 在事务内用 `SELECT FOR UPDATE` 锁定 product 行后再扣库存。

---

### 2. 支付回调金额未校验（ HIGH — 已有修复参考）

**文件：** `app/routers/payments.py`

**问题：** 支付回调直接信任第三方返回的 `total_fee`/`total_amount`。

**现状：** yhz 分支已修（Fix 113），main 分支未修。

**修复方向：** 回调时从数据库查对应 order/donation 的 `total_amount`，与回调金额比对，一致才落库。

---

### 3. 订单无幂等 key（ HIGH — 可重复下单）

**文件：** `app/routers/orders.py`

**问题：** 无幂等 key 机制，用户快速点两次「提交订单」会创建两条重复订单。

**修复方向：** 接收 `idempotency_key` 字段，查重后跳过重复创建。

---

### 4. phone 无格式校验（ MEDIUM — 脏数据问题）

**文件：** `app/schemas/address.py`

**问题：** `phone: str = Field(..., max_length=30)` — 只校验长度，不校验格式。

**修复方向：** 加正则。中国市场：`r"^1[3-9]\d{9}$"`；国际市场：`r"^\+?[1-9]\d{1,14}$"`。

---

### 5. 无 country 字段（ MEDIUM — 国际用户无法下单）

**文件：** `app/schemas/address.py`、`app/models/address.py`

**问题：** 地址 schema 无 country 字段，前端 country 硬编码 "China"。

**修复方向：** Address schema 加 `country: str = Field(..., max_length=100)`；数据库加 `country` 列；前端加国家选择器。

---

### 6. postal_code 无格式校验（ LOW — 数据不规范）

**文件：** `app/schemas/address.py`

**问题：** postal_code 可填任意字符串。

**修复方向：** 中国邮编加正则 `r"^\d{6}$"`；其他地区按需。

---

### 7. shipping_address 结构化问题（ MEDIUM — 查询困难）

**文件：** `app/models/order.py`

**问题：** `shipping_address` 存为自由文本，无法按省市区统计。

**修复方向：** 订单表单独存 `recipient_name`、`phone`、`province`、`city`、`district`、`detail_address`、`postal_code`、`country` 字段。

---

### 8. order_id / donation_id 可同时传（ MEDIUM — 数据歧义）

**文件：** `app/schemas/payment.py`

**问题：** `PaymentCreate` 两个 ID 都是 `Optional[int]` 且无互斥校验。

**修复方向：** 加 `Field(..., exclude=True)` 或用 `Union` + validator。

---

## 二、前端问题

### 1. 购物车无库存校验（ MEDIUM — 体验差）

**文件：** `web-react/src/stores/cartStore.ts`

**问题：** 加购时不校验库存，只在 checkout 时才失败。

**修复方向：** 调 `GET /products/{id}` 实时拿 stockCount 前端预判，或 checkout 前批量校验。

---

### 2. phone 无格式校验（ MEDIUM — 脏数据）

**文件：** `web-react/src/pages/Checkout/index.tsx`

**问题：** 输入框 `type="tel"`，无 `pattern` 属性，前端不拦错误格式。

**修复方向：** 加 `input pattern="1[3-9]\d{9}"` + error tip。

---

### 3. country 硬编码（ MEDIUM — 国际用户）

**文件：** `web-react/src/pages/Checkout/index.tsx`

**问题：** 第 65 行 `country: "China"` 硬编码，无国家选择器。

**修复方向：** 加 country 下拉选择框，根据 country 动态调整 address 必填字段。

---

### 4. Address 类型不一致（ MEDIUM — TS 类型不匹配）

**文件：** `web-react/src/types/index.ts`

**问题：** 前端 `Address` 字段（`name`, `street`, `city`, `province`）与后端 `AddressOut`（`recipient_name`, `detail_address`, `city`, `province`）不一致。

**修复方向：** 统一字段名，重对齐前端 interface。

---

### 5. total_amount 类型不一致（ LOW — 潜在 bug）

**文件：** `web-react/src/services/orders.ts`

**问题：** `OrderDetail.total_amount` 是 `string | number`，后端返回 Decimal。

**修复方向：** 改为 `number`，后端返回时统一转数字。

---

## 三、优先级建议

| 优先级 | 问题 | 原因 |
|--------|------|------|
| P0 | 支付金额校验 | main 落后 yhz Fix 113，金额可被篡改 |
| P0 | 库存并发锁 | 直接超卖，yhz/main 均未修 |
| P1 | 幂等 key | 重复下单，用户体验差 |
| P1 | phone 格式校验 | 中国手机号正则，前后端都加 |
| P1 | country 字段 | 要出海必须加 |
| P2 | Address 类型对齐 | 类型不一致是 bug 源 |
| P2 | postal_code 格式 | 中国邮编校验 |
| P2 | shipping_address 结构化 | 后续数据统计需用 |
| P3 | 购物车库存预判 | 体验优化 |

---

## 四、涉及文件索引

### 后端
- `app/schemas/address.py` — phone/country/postal_code 校验
- `app/schemas/payment.py` — order_id/donation_id 互斥
- `app/schemas/order.py` — shipping_address 结构化
- `app/routers/orders.py` — 幂等 key
- `app/routers/payments.py` — 支付金额校验（yhz 已修参考）
- `app/services/order/service.py` — 库存行锁
- `app/models/order.py` — 订单表加 address 字段
- `app/models/address.py` — 地址表加 country

### 前端
- `web-react/src/pages/Checkout/index.tsx` — phone 校验、country 选择器
- `web-react/src/stores/cartStore.ts` — 库存预判
- `web-react/src/types/index.ts` — Address 类型对齐
- `web-react/src/services/orders.ts` — total_amount 类型