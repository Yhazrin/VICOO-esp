# Iteration 9: 性能优化与缓存集成

**日期**: 2026-04-02  
**状态**: 已完成

## 1. 变更摘要

本迭代聚焦于 VICOO-esp 平台在真实高并发环境下的表现，通过数据库索引加固与 Redis 缓存集成，显著提升了核心接口的响应速度。主要包括：
- **数据库索引加固**: 通过 Alembic 迁移，针对 `donations`, `artworks`, `orders`, `audit_logs` 的高频查询字段（status, created_at 等）建立了复合索引。
- **Redis 缓存实施**: 实现了基于装饰器的缓存机制，覆盖了首页活动列表与作品展示列表。
- **架构决策对齐**: 将 `Campaign` 逻辑从 Router 完整剥离至 `CampaignService`，确保了 Service 层模式的一致性。
- **README 更新**: 明确了 Docker 部署后的详细访问地址、端口映射及 19 个核心 API 模块的分布。

## 2. 详细优化说明

### 2.1 数据库索引 (Alembic 14e3312c2b59)
- `donations`: 新增 `(status, created_at)` 和 `(donor_user_id, status)` 索引。
- `artworks`: 新增 `(status, campaign_id, created_at)` 索引。
- `orders`: 新增 `(user_id, status, created_at)` 索引。
- `audit_logs`: 新增 `(target_type, created_at)` 索引。

### 2.2 Redis 缓存层
- **缓存装饰器**: 在 `app/utils/cache.py` 实现了 `@cached` 装饰器，支持自定义 TTL 和自动 key 生成。
- **智能失效**: 在执行 `create`, `update`, `moderate` 等写操作时，自动触发相关缓存键的 `invalidate_cache`。
- **应用范围**: 
    - `CampaignService.list_campaigns` (TTL: 600s)
    - `ArtworkService.list_artworks` (TTL: 300s)

### 2.3 架构重构
- 建立了 `app/services/campaign/service.py`。
- 移除了 Router 中直接操作 SQLAlchemy model 的逻辑。

## 3. 运维信息更新

| 组件 | 容器端口 | 宿主机映射 | 备注 |
|------|---------|-----------|------|
| API Backend | 8000 | 8080 | 支持 Swagger /docs |
| Redis | 6379 | 6379 | 用于缓存与限流 |
| MySQL | 3306 | 3306 | 持久化存储 |

## 4. 后续计划 (Iteration 10)

- **生产环境模拟演练**: 验证正式环境 SSL 与域名。
- **UI 全连通**: 增加 AI 助手悬浮球、审计日志真数据对接。
- **SEO 优化**: 完善前端 Meta 标签与 Sitemap。
