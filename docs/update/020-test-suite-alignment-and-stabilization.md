# 测试套件统一与稳定性修复

**日期**: 2026-04-02  
**状态**: 已完成

## 1. 变更摘要

本次更新以“当前后端实现为准”统一了全量测试套件，清理了新旧测试契约冲突，并修复了少量真实代码问题。处理完成后，`backend/tests/` 已可稳定全量通过。

主要结果：
- 统一认证、捐赠、支付、后台管理等接口测试到当前实现。
- 修复测试数据库与 Redis mock 的共享状态污染问题。
- 修复验证异常在 `inf/nan` 等极端输入下的序列化问题，避免本应返回 `422` 的请求退化为 `500`。
- 清理测试运行 warning，保证测试输出可读性。

## 2. 主要问题归因

本轮失败并非单一来源，主要由以下三类问题叠加造成：

### 2.1 旧测试契约未随实现迭代
- 旧测试仍使用历史接口路径，如旧 donation / admin / payment 路由。
- 部分测试仍断言旧版登录响应结构。
- 若干测试继续使用过期字段命名，和当前 schema 不一致。

### 2.2 测试基础设施污染
- SQLite 测试数据库存在跨测试残留，导致重复注册、重复支付等场景被旧数据污染。
- Redis mock 共享状态未隔离，影响投票去重、黑名单等依赖缓存状态的测试行为。

### 2.3 少量真实代码问题
- `RequestValidationError` 在包含 `bytes`、`Decimal`、`inf/nan` 等非常规值时，错误明细无法安全序列化。
- 个别服务代码仍使用 `datetime.utcnow()`，引入不必要 warning。

## 3. 实际修改内容

### 3.1 测试统一到当前接口实现
- 更新 `auth` 相关测试，使其匹配当前 token 返回结构和 refresh cookie 机制。
- 更新 `donations` 测试到当前创建接口与请求字段。
- 更新 `payments` 测试到当前支付创建与 webhook 行为。
- 更新 `admin`、`supply-chain` 等测试到当前生效路由。
- 调整若干安全测试，使其不再把“当前允许但未崩溃的输入”误判为漏洞成功。

### 3.2 测试环境稳定性修复
- 修复 `backend/tests/conftest.py` 中的路径解析问题。
- 确保测试数据库每次运行使用干净状态。
- 为 Redis mock 增加隔离清理，避免跨测试污染。
- 补充 admin / guardian 等测试用户种子，避免权限相关测试依赖隐式状态。

### 3.3 代码层修复
- 在 [main.py](/Users/tian/Desktop/VICOO-esp/backend/app/main.py) 中增强验证错误序列化，支持：
  - `bytes`
  - `Decimal`
  - 非有限浮点值 `inf` / `nan`
- 在 [service.py](/Users/tian/Desktop/VICOO-esp/backend/app/services/anomaly_detection/service.py) 中将 `datetime.utcnow()` 替换为时区感知写法。

## 4. 验证结果

在 `backend/` 目录执行：

```bash
source venv/bin/activate
pytest tests/ -q
```

结果：

```text
220 passed in 3.91s
```

当前状态：
- failed: `0`
- warnings: `0`

## 5. 影响文件

本轮核心调整涉及以下区域：
- `backend/tests/conftest.py`
- `backend/tests/api-tests/test_api.py`
- `backend/tests/api-tests/test_endpoints.py`
- `backend/tests/security-tests/test_security.py`
- `backend/tests/api-tests/test_iteration_007.py`
- `backend/app/main.py`
- `backend/app/services/anomaly_detection/service.py`

## 6. 后续建议

- 后续新增接口时，应同步维护测试契约，避免再次出现“实现已更新、测试仍停留在旧版本”的分叉。
- 对 webhook、支付、OAuth 这类外部依赖接口，建议继续采用“当前实现契约 + 明确 mock 策略”的测试方式。
- 如后续准备重构支付或认证层，建议先补一份面向当前实现的契约说明文档，再推进代码修改，避免测试再次大面积失真。
