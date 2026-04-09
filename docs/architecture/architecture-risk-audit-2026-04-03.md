# VICOO 架构风险审视（2026-04-03）

> 目标：从“能跑”升级到“可持续交付”，识别高风险结构问题与整理优先级。

## 一、整体架构现状（结论）

当前项目采用多端架构（`backend` / `frontend/web-react` / `admin` / `weapp` / `android`），方向正确；
但后端与管理端仍广泛混用 mock 数据，导致“开发环境可用 ≠ 线上真实可用”的风险上升。

---

## 二、严重级别风险（建议尽快治理）

## S1：生产路径仍混入大量 mock 回退逻辑（后端）

### 现象
- 多个后端 router 直接持有 `_mock_*` 数据或 fallback 分支（artworks / orders / products / payments / users / admin / contact 等）。
- 支付服务在非生产场景会回退 mock 参数，容易掩盖真实支付链路问题。

### 风险
- 环境切换时出现行为漂移（staging 通过、prod 失败）。
- 测试结果与真实链路偏离，造成“假阳性稳定”。

### 治理建议
1. 统一引入 `FEATURE_MOCK_MODE` 开关，默认仅 `development=true`。
2. 把 mock 数据迁移到独立 adapter 层，业务 router 不直接持有 mock 常量。
3. CI 增加“mock 禁用 smoke test”（验证真实 DB/Redis/支付配置路径）。

---

## S1：Admin 端核心数据仍以 mock 为主，真实 API 覆盖不足

### 现象
- `admin/src/services/api.ts` 绝大多数能力走 `mockData`，仅少量接口请求真实后端。

### 风险
- 管理端功能上线后“看起来能用”，但真实联调失败率高。
- 数据口径与后端实体模型可能长期漂移。

### 治理建议
1. 按页面切片迁移：Dashboard → Order/Audit → User/Artwork。
2. 每个切片迁移后删对应 mock 分支，避免双轨长期共存。
3. 对 admin API 增加契约测试（字段、分页、排序、权限）。

---

## S1：后端中间件链条聚合在 `main.py`，演进成本高

### 现象
- 请求体限制、限流、安全头、日志、异常处理均集中在 `backend/app/main.py`。

### 风险
- 单文件职责过重，新增一个横切能力（审计、trace、A/B）成本高。
- 变更冲突频繁，回归风险增加。

### 治理建议
1. 把中间件拆分到 `app/middleware/*`（request_size, rate_limit, security_headers, request_log）。
2. 用注册器统一装配，`main.py` 仅保留 app 组装逻辑。
3. 对中间件建立独立测试与基准（错误码、headers、性能开销）。

---

## 三、中优先级架构整理点

## M1：品牌与命名历史包袱（Tonghua / VICOO 并存）

### 现象
- 日志名、描述、部分类型注释仍存在 Tonghua 命名。

### 风险
- 团队沟通与文档检索成本上升，跨端对齐变慢。

### 建议
- 建立命名迁移清单（代码、日志、文档、环境变量），分批完成。

## M1：前端页面与数据层耦合偏高

### 现象
- 多个页面保留静态 mock 内容逻辑（Stories / Shop / Traceability 等）。

### 风险
- 内容迭代时需同时改 UI 与数据逻辑，回归范围扩大。

### 建议
- 拆分 `view-model` 层；页面只消费接口化数据，不拼装业务 mock。

---

## 四、建议的整理顺序（90 天）

1. **第 0~30 天（止血）**
   - 明确 mock 开关边界（S1）。
   - Admin Dashboard 切到真实 API（S1）。

2. **第 31~60 天（降复杂度）**
   - 拆分 backend middleware（S1）。
   - 建立 admin 契约测试与 smoke test。

3. **第 61~90 天（标准化）**
   - 命名统一（M1）。
   - 页面数据层与展示层解耦（M1）。

---

## 五、当前是否存在“意外非常严重”的地方？

有，但属于“可控严重”，不是“不可恢复严重”：
- **最需要优先处理的是 mock 与真实链路混用**（后端 + admin 双侧），这会直接影响上线可信度。
- 其次是后端中间件集中度过高，虽不立即致命，但会放大后续迭代风险。

结论：建议先做“mock 边界治理 + admin 真实化”，再做结构拆分。
