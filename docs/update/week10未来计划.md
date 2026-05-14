# SixSeven Group 项目更新总结（第 9 周）

**时间范围：2026-05-01 至 2026-05-08**

---

## 一、本周完成工作

### 1. AI 智能助手全链路完善

- **后端 AI 对话服务**：完成 [AIAssistantService](file:///Users/tian/Desktop/VICOO-esp/backend/app/services/ai_assistant/service.py) 全功能实现，支持 OpenAI 兼容接口，可配置基座模型
- **双线业务上下文路由**：智能识别 Uniqlo（常规商城）/ Impact（公益线）语境，自动路由至对应商品目录
- **RAG 检索增强生成**：结合站内数据库实时检索，AI 回复基于真实商品数据而非虚构内容
- **用户反馈升级机制**：当用户标记回复"不有帮助"时，自动创建 [ContactMessage](file:///Users/tian/Desktop/VICOO-esp/backend/app/models/contact.py) 工单进行人工跟进
- **Tool Calling 工具链**：支持商品溯源查询、供应链时间线获取、impact/uniqlo 商品搜索等工具调用

### 2. 供应链生命周期可视化

- **5 阶段溯源流水线**：完成 [SupplyChainService](file:///Users/tian/Desktop/VICOO-esp/backend/app/services/supply_chain/service.py)，支持原料采购→加工→制造→质检→物流全链路
- **碳足迹量化**：支持 `carbon_kg` 记录与对比动画展示
- **地理位置可视化**：存储经纬度坐标，支持 Globe 地球仪交互展示
- **多媒体 Gallery**：溯源节点支持图片/视频上传与管理

### 3. 捐赠系统基础框架

- **数据模型**：[Donation](file:///Users/tian/Desktop/VICOO-esp/backend/app/models/donation.py) 模型支持证书号和证书 URL 字段
- **证书号生成**：`complete_donation` 方法自动生成格式 `TH-DON-YYYYMMDD-ID` 的证书号
- **API 端点**：`GET /donations/{id}/certificate` 返回 JSON 格式证书数据
- **匿名捐赠保护**：未登录用户查看时自动数据脱敏

### 4. 前端核心交互实现

- **AI 助手对话界面**：[frontend/web-react/src/pages/AiAssistant/index.tsx](file:///Users/tian/Desktop/VICOO-esp/frontend/web-react/src/pages/AiAssistant/index.tsx) 实现完整对话流
- **AI 悬浮球组件**：[AIAssistantBall.tsx](file:///Users/tian/Desktop/VICOO-esp/frontend/web-react/src/components/layout/AIAssistantBall.tsx) 全局浮动入口
- **3D Globe 溯源地球仪**：[TraceabilityGlobe.tsx](file:///Users/tian/Desktop/VICOO-esp/frontend/web-react/src/components/editorial/TraceabilityGlobe.tsx) 实现供应链地理可视化

---

## 二、贡献度分配（成员 A-F）

| 成员 | 角色 | 完成内容 |
|------|------|----------|
| **A** | 前端 | AI 对话 UI、Globe 可视化、Impact Shop、捐赠页面、SupplyChainGlobe 交互动画 |
| **B** | 后端 | AI 对话核心服务、RAG 检索、Tool Calling 工具链、供应链 API |
| **C** | 数据库 | 捐赠数据模型设计、供应链 ER 图、证书字段扩展、性能索引优化 |
| **D** | 测试 | AI Catalog Routing 测试、API 集成测试、异常检测服务测试 |
| **E** | 集成 | Docker Compose 远程部署配置、Nginx 反向代理、CI/CD Pipeline 完善 |
| **F** | 设计 | 杂志风 UI 美学、Morandi 配色体系、Editorial 组件库、溯源时间线视觉规范 |

---

## 三、待解决问题

### 1. AI 响应延迟
RAG 检索在商品数据量大时响应较慢，需考虑引入向量数据库优化。

### 2. 供应链数据完整性
部分产品缺少地理坐标和碳足迹数据，需补充录入。

### 3. AI 功能依赖 API Key
以下功能虽已实现方法，但当前仅在配置 `OPENAI_API_KEY` 时可用，缺失时回退至模拟模式：
- **内容安全审核**：`moderate_content` 方法依赖 OpenAI Moderation API
- **艺术品 AI 分析**：`analyze_artwork` 方法依赖 gpt-4o/gpt-4-vision 模型

### 4. 中英文同义词硬编码
当前 [`_extract_search_terms`](file:///Users/tian/Desktop/VICOO-esp/backend/app/services/ai_assistant/service.py#L336-L380) 方法使用硬编码方式处理中英文同义词映射：
```python
if tok.lower() in {"tshirt", "tee"}:
    normalized.extend(["t恤", "短袖"])
if tok.lower() in {"bag", "bags", "tote", "backpack"}:
    normalized.extend(["包", "袋", "帆布包"])
```
这种方式不便于扩展和维护，需重构为配置化方案。

### 5. 异常检测边界
小额高频捐赠规则阈值（5元/5次/15分钟）可能误拦截正常用户行为，需调优。

### 6. AI 幻觉问题
需持续优化 System Prompt，减少 AI 生成不实商品信息的概率。

### 7. 捐赠证书无 PDF 生成
当前 `GET /donations/{id}/certificate` 仅返回 JSON 数据：
```json
{
    "donation_id": 1,
    "donor_name": "张三",
    "amount": "500.00",
    "certificate_no": "TH-DON-20260508-000001",
    "certificate_url": "/api/donations/1/certificate"
}
```
**问题**：
- 无真正的 PDF 证书生成
- 前端没有证书展示/下载页面
- 证书样式未设计

### 8. 支付集成不完整
**微信支付**：
- `create_donation` 中调用 `get_payment_service().create_unified_order()`
- 实际支付回调（notify_url）未完整实现

**支付宝**：
- 仅有配置检查和环境判断
- 无实际支付接口调用

**Stripe/PayPal**：
- 模型支持但无实际集成

### 9. 捐赠前端页面
- [Donate](file:///Users/tian/Desktop/VICOO-esp/frontend/web-react/src/pages/Donate/index.tsx) 和 [DonateClothing](file:///Users/tian/Desktop/VICOO-esp/frontend/web-react/src/pages/DonateClothing/index.tsx) 页面完整度待确认
- 捐赠 tier 选择器（50/200/500/2000）UI 交互待完善

---

## 四、未来计划（第 10 周）

### 1. AI 助手增强

#### 1.1 向量数据库集成
- 引入向量数据库（Milvus/Pinecone）优化 RAG 检索质量
- 实现商品描述 embeddings 存储与相似度检索
- 降低数据库查询压力，提升响应速度

#### 1.2 内容安全审核完善
- 集成 OpenAI Moderation API 到艺术品提交流程
- 对用户输入和艺术品描述进行自动安全分级
- 建立人工复审队列处理边界 case

#### 1.3 艺术品 AI 分析功能
- 集成 gpt-4o-vision 实现图片内容分析
- 智能提取作品风格标签、安全评级、标题建议
- 支持批量艺术品审核

#### 1.4 中英文同义词配置化
- 将硬编码的关键词映射迁移至数据库/配置文件
- 支持运营人员通过管理后台动态增删同义词库
- 初步方案：
  ```json
  {
    "synonyms": {
      "tshirt": ["T恤", "短袖", "T-shirt"],
      "bag": ["包", "袋", "帆布包", "tote"],
      "clothing": ["衣物", "衣服", "服装"]
    }
  }
  ```

#### 1.5 情感分析与满意度追踪
- 增加情感分析模块，识别用户满意度
- 支持多轮对话上下文记忆
- 生成 AI 助手质量报告

### 2. 供应链完善

- 补充缺失产品的地理坐标和碳足迹数据
- 开发管理后台供应链记录批量导入工具
- 优化 Globe 3D 渲染性能

### 3. 捐赠系统完善（重点）

#### 3.1 捐赠证书 PDF 生成
**后端实现**：
- 引入 PDF 生成库（WeasyPrint / ReportLab / pdfkit）
- 设计证书模板（包含logo、捐赠者姓名、金额、日期、证书号、公益项目信息）
- 实现 `GET /donations/{id}/certificate/pdf` 端点
- 证书号格式：`TH-DON-YYYYMMDD-XXXXXX`（年月日 + 6位序号）

**前端实现**：
- 证书预览页面（可分享到社交媒体）
- PDF 下载按钮
- 邮件发送证书 PDF 功能

**证书内容设计**：
```
+----------------------------------+
|        [公益组织LOGO]             |
|                                  |
|      公益捐赠证书                 |
|                                  |
|  感谢您 张三 先生的爱心捐赠       |
|  捐赠金额：人民币 500.00 元       |
|  捐赠项目：山区儿童艺术教育计划   |
|  证书编号：TH-DON-20260508-000001 |
|  捐赠日期：2026年05月08日        |
|                                  |
|  通化公益 × 可持续时尚 (CCFS)    |
+----------------------------------+
```

#### 3.2 支付集成完善

**微信支付**：
- 完成支付回调（notify_url）接口实现
- 实现订单状态同步（pending → completed）
- 沙箱测试环境配置

**支付宝**：
- 完成网页支付（Web/WAP）接口集成
- 实现支付回调状态同步
- 沙箱测试环境配置

**Stripe/PayPal**：
- 评估并完成其中一种国际支付集成
- 支持美元捐赠

#### 3.3 捐赠异常检测优化
- 调优小额高频捐赠规则阈值
- 增加异常行为可视化看板
- 人工复审机制

#### 3.4 捐赠前端体验优化
- 完善捐赠金额 tier 选择器 UI
- 捐赠留言板功能
- 捐赠进度实时更新
- 匿名捐赠开关 UI

### 4. 前端体验提升

- 完成全部 Module（2、5、6）骨架开发
- 添加页面过渡动画（Framer Motion）
- 响应式适配优化（移动端/平板）

---

## 五、捐赠系统开发细分任务

### Phase 1: 证书 PDF 生成（优先级：高）
- [ ] 设计证书模板（前端静态页面或后端 HTML→PDF）
- [ ] 实现 PDF 生成服务 `CertificateService`
- [ ] 新增 `GET /donations/{id}/certificate/pdf` 端点
- [ ] 前端证书预览页面
- [ ] 证书 PDF 下载功能

### Phase 2: 支付集成（优先级：高）
- [ ] 完成微信支付回调接口
- [ ] 完成支付宝 Web 支付集成
- [ ] 配置支付沙箱测试环境
- [ ] 支付状态机完善（pending/completed/failed/refunded）

### Phase 3: 捐赠体验优化（优先级：中）
- [ ] 捐赠 tier 选择器交互
- [ ] 捐赠留言功能
- [ ] 匿名捐赠 UI
- [ ] 捐赠证书邮件发送

---

*文档版本：v1.2 | 更新日期：2026-05-08*
