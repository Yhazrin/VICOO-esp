# 后端测试修复规划

## 适用范围

- 目录: `backend/`
- 命令: `source venv/bin/activate && pytest tests/`
- 基线结果: `220` 个测试中，`160 passed / 60 failed`

---

## 1. 文档目标

本规划文档用于把当前全量测试失败情况整理成可交接、可执行的修复计划，便于其他 agent 继续处理。

目标不是一次性“全改完”，而是先区分：

- 哪些是代码本身有问题
- 哪些是测试已经落后于当前实现
- 哪些是代码与测试都需要同时调整

---

## 2. 结论摘要

当前失败并不说明后端整体不可用。

实际情况是：

- 认证、捐赠、部分集成测试已经能跑通
- 失败主要集中在旧 API 契约测试、旧安全测试、配置路径测试、以及少量真实代码缺陷

建议采用“两条线并行”的方式处理：

1. 先修真实代码缺陷
2. 再批量更新过时测试

---

## 3. 当前失败分类

### A. 真实代码问题

这些问题应优先修代码，不应该只改测试。

#### A1. `422` 异常响应不可序列化

现象：

- 负金额、零金额、非法输入等用例会触发 `RequestValidationError`
- 当前异常处理里直接返回 `exc.errors()`
- 其中包含 `bytes` 时，`JSONResponse` 序列化失败，进一步炸成 `500`

涉及位置：

- `backend/app/main.py`

建议修改：

- 在 `422` handler 中对 `exc.errors()` 做可序列化清洗
- 把 `bytes`、`set`、复杂对象统一转成字符串或基础类型
- 保证所有校验错误稳定返回 `422`

验收标准：

- 负金额、零金额、空 body、null byte 等输入验证测试不再出现 `500`

---

#### A2. 登录接口兼容逻辑不完整

现象：

- 部分测试向 `/api/v1/auth/login` 发送 `login_type + code`
- 当前实现只对 `body.wechat_code` 有分支
- 导致微信登录相关断言失败

涉及位置：

- `backend/app/routers/auth.py`

建议修改：

- 明确 `/auth/login` 的兼容策略：
  - 要么支持旧 `login_type=wechat + code`
  - 要么明确废弃，并同步修改所有测试
- 对缺失 email / password 的情况返回稳定的 `422` 或 `400`
- 不要在输入不完整时落到通用 `401 Invalid credentials`

验收标准：

- 登录类测试只因业务失败返回 `401`
- 输入缺失/格式错误返回 `422` 或明确的 `400`

---

#### A3. 重复投票保护在测试环境下没有体现

现象：

- 重复投票测试返回 `200`
- 说明“同一用户重复投票”的保护在测试环境未生效

可能原因：

- 业务逻辑仅依赖 Redis 去重
- 测试里的 Redis mock 永远返回“未投票”
- 缺少数据库级唯一约束或额外业务状态记录

涉及位置：

- `backend/app/routers/artworks.py`
- `backend/tests/conftest.py`

建议修改：

- 检查实际去重逻辑是否仅依赖 Redis
- 测试环境中为第二次投票提供可控 mock 行为
- 更稳妥方案是补数据库层唯一性保护或持久化投票记录判断

验收标准：

- 第一次投票成功
- 第二次相同用户对同一作品投票返回 `400`

---

#### A4. 安全相关行为和当前实现不一致

现象：

- JWT 篡改、签名、CORS、guardian consent、payment amount 等部分安全测试失败

这里要分两层：

- 有些测试调用的是旧接口
- 有些失败可能反映当前实现确实没有把安全策略固化完整

建议修改：

- 先逐项确认安全测试是否打到当前真实接口
- 对仍失败的现行接口，按安全要求修实现

优先检查：

- JWT 无效 token 是否稳定返回 `401/403`
- 受保护接口是否对空 token / malformed header 正确拒绝
- guardian consent 是否真正阻止作品提交
- 支付相关端点是否有签名校验或明确的替代安全策略

---

### B. 测试落后于当前实现

这些问题优先改测试，不代表业务代码本身错误。

#### B1. 登录响应结构断言过时

现象：

- 测试断言 `data.access_token`
- 当前实现返回：
  - `data.user`
  - `data.token.access_token`
  - `data.token.refresh_token`

涉及文件：

- `backend/tests/api-tests/test_api.py`
- `backend/tests/api-tests/test_endpoints.py`

建议修改：

- 全量更新登录/注册/刷新相关断言
- 统一按当前响应结构检查

---

#### B2. 旧 donation 接口路径仍在测试中使用

现象：

- 测试使用 `/api/v1/donations/initiate`
- 当前路由已是 `/api/v1/donations` 和 `/api/v1/donations/create`

涉及文件：

- `backend/tests/security-tests/test_security.py`
- 可能还有旧测试文件中的相关调用

建议修改：

- 把所有 `donations/initiate` 统一迁移到当前接口
- 同时更新请求体字段名：
  - 旧 `payment_provider`
  - 新 `payment_method`

---

#### B3. 大量测试仍使用旧模型 ID 和旧字段假设

现象：

- 测试中大量使用 UUID 风格 ID
- 当前主要模型很多是 `Integer` 主键
- 某些 detail/not found 测试因此失真

涉及文件：

- `backend/tests/api-tests/test_endpoints.py`
- `backend/tests/security-tests/test_security.py`

建议修改：

- 统一测试数据为当前模型主键风格
- 对 detail/not found 测试使用存在的 seeded ID 与明确不存在的整型 ID

---

#### B4. `test_ci_config.py` 根路径计算错误

现象：

- 测试从 `backend/tests/` 推导 `PROJECT_ROOT`
- 实际得到的是 `.../backend`
- 但它要读的是仓库根目录的 `deploy/...`
- 结果直接 `FileNotFoundError`

涉及文件：

- `backend/tests/test_ci_config.py`

建议修改：

- 把 `PROJECT_ROOT = Path(__file__).resolve().parents[2]`
- 确保它指向仓库根目录，而不是 `backend/`

验收标准：

- 3 个 CI / Dockerfile 测试不再因为找不到文件失败

---

#### B5. `test_settings_config.py` 假设与当前 Settings 设计冲突

现象：

- 测试认为 `MOCK_USER_PASSWORD` 在 testing 可为空
- 当前 `Settings` 对它给了默认值 `vicoo-mock`
- 因此测试期望与实现不一致

涉及文件：

- `backend/tests/test_settings_config.py`
- `backend/app/config.py`

建议二选一：

1. 保持当前实现，修改测试
2. 修改 `Settings`，让开发环境严格要求显式提供该值

推荐：

- 如果当前项目希望更强配置约束，就改实现
- 如果只是为了保留开发便利，直接改测试更省成本

---

### C. 测试设计本身不够合理

#### C1. 某些安全测试把“返回 200”错误等同为“SQL 注入成功”

现象：

- 对公共列表接口传入恶意 query 时，测试要求“不能 200”
- 这并不总是合理
- 参数被安全处理后，接口完全可能正常返回 `200 + 空列表`

建议修改：

- 不要把“状态码 200”本身视为注入成功
- 应改为：
  - 响应中不泄露堆栈
  - 不出现异常 SQL 回显
  - 不返回超预期数据

涉及文件：

- `backend/tests/security-tests/test_security.py`

---

#### C2. 某些测试仍然允许 `404/500` 作为“通过”

现象：

- 一些老测试将 `404/500` 视为可接受结果
- 这会掩盖真实问题

建议修改：

- 新一轮测试收敛时，应把“容忍 404/500”的测试改成真实契约断言
- 特别是 auth、donation、payment、order 这些主链路

---

## 4. 推荐修复顺序

建议严格按下面优先级推进。

### 第一优先级：先修真实代码缺陷

1. 修 `422` 序列化问题
2. 修 `/auth/login` 输入兼容与错误码语义
3. 修重复投票去重逻辑或测试夹具
4. 修仍不符合预期的安全行为

原因：

- 这些问题会直接影响真实运行环境或掩盖真实错误

---

### 第二优先级：批量更新旧测试

1. 更新 auth 响应断言
2. 更新 donation 旧接口路径
3. 更新 payment 请求字段名
4. 更新整型 ID 假设
5. 修 `test_ci_config.py`
6. 修 `test_settings_config.py`

原因：

- 这些失败大多是测试落后，不应阻塞后续验证

---

### 第三优先级：重写质量较差的安全测试

1. 去掉“200 就算失败”的错误推断
2. 改成验证无注入泄露、无越权、无未处理异常
3. 对受保护接口使用真实现行路径

原因：

- 这些测试现在噪音比较大，会误导后续 agent

---

## 5. 推荐任务拆分

### Agent A: 修代码

负责：

- `backend/app/main.py`
- `backend/app/routers/auth.py`
- `backend/app/routers/artworks.py`
- 必要时检查 `deps.py`、安全校验逻辑

目标：

- 清掉真实业务失败

---

### Agent B: 更新 API 测试

负责：

- `backend/tests/api-tests/test_api.py`
- `backend/tests/api-tests/test_endpoints.py`

目标：

- 让测试契约与当前接口实现一致

---

### Agent C: 更新安全测试

负责：

- `backend/tests/security-tests/test_security.py`

目标：

- 把旧路径、旧字段、旧断言模式清理掉

---

### Agent D: 修配置与基础测试

负责：

- `backend/tests/test_ci_config.py`
- `backend/tests/test_settings_config.py`

目标：

- 清掉明显的测试基线问题

---

## 6. 建议的验收里程碑

### M1

- 修完代码级 bug
- 全量失败数显著下降
- 不再出现输入校验导致的 `500`

### M2

- API tests 与现行接口契约一致
- 登录、捐赠、支付、订单主链路断言稳定

### M3

- 安全测试完成一次按现行接口的重构
- CI / settings 测试全部通过

### M4

- 全量 `pytest tests/` 尽量收敛到仅剩极少数明确待定项

---

## 7. 建议给下一个 agent 的执行提示

可以直接按以下顺序处理：

1. 先修 `backend/app/main.py` 的 422 handler
2. 再修 `backend/app/routers/auth.py`
3. 然后处理 `backend/tests/test_ci_config.py` 与 `backend/tests/test_settings_config.py`
4. 再批量替换测试中的：
   - `/donations/initiate` -> `/donations`
   - `payment_provider` -> `payment_method`
   - `data.access_token` -> `data.token.access_token`
5. 最后重构安全测试断言逻辑

---

## 8. 当前判断

当前项目不是“代码已经坏掉”，而是：

- 核心后端是可运行的
- 一部分真实 bug 需要修
- 更大的一部分是测试套件没有跟着迭代同步更新

因此后续工作应以“修少量真实 bug + 批量更新过时测试”为主，而不是重写整个后端。
