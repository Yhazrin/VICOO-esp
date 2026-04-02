# 生产环境发布检查清单 (Production Checklist)

**版本**: 1.0  
**最后更新**: 2026-04-02

在将 VICOO-esp 部署到生产环境之前，必须逐项核对并勾选以下内容。

## 1. 环境变量与安全 (Security & Env)

- [ ] **API Keys**: 已替换所有的 Mock API Keys（OpenAI, Resend, WeChat Pay, Stripe）。
- [ ] **Secret Keys**: `APP_SECRET_KEY` 和 `ENCRYPTION_KEY` 已设为强随机字符串且已加密存储。
- [ ] **CORS**: `CORS_ORIGINS` 已配置为真实的生产域名，严禁使用 `*`。
- [ ] **SSL**: 已配置 TLS 1.3 证书，且所有 API 强制走 HTTPS。
- [ ] **Password Strength**: 已确认数据库及各中间件密码符合复杂度要求。

## 2. 数据库与迁移 (Database & Migration)

- [ ] **Alembic**: 已运行 `alembic upgrade head` 且无报错。
- [ ] **Backups**: 已配置定时备份策略（每天至少一次全量备份）。
- [ ] **Indexes**: 已针对 `status`, `user_id`, `campaign_id` 等高频查询字段建立索引。
- [ ] **Pool Size**: SQLAlchemy 连接池大小已根据预估 QPS 调整。

## 3. 中间件与基础设施 (Infrastructure)

- [ ] **Redis**: 已启用持久化（AOF/RDB）且配置了最大内存淘汰策略。
- [ ] **Rate Limiting**: 全局限流 (1000 QPS) 和用户限流 (60 QPM) 已生效且在 Sandbox 环境测试通过。
- [ ] **Log Rotation**: 日志轮转已配置，防止磁盘被撑满。
- [ ] **Monitoring**: Prometheus/Grafana 看板已接入，基础指标（CPU, Mem, Latency）可见。

## 4. 业务功能验证 (Business Validation)

- [ ] **AI Assistant**: 已确认 OpenAI API 余额充足且限额设置合理。
- [ ] **Payments**: 已完成从 Sandbox 到生产环境商户号的切换测试（小额实测）。
- [ ] **Emails**: 欢迎邮件和通知邮件发送正常，且 SPF/DKIM 已配置以防进入垃圾箱。
- [ ] **Health Check**: `/health` 接口返回所有子系统均为 `healthy`。

## 5. 回滚计划 (Rollback Plan)

- [ ] **Backup Artifacts**: 保留前三个稳定版本的 Docker 镜像。
- [ ] **DB Migration**: 确认每个 Alembic 脚本都有对应的 `downgrade` 逻辑。
- [ ] **Contact List**: 确定紧急情况下的核心技术联系人。

---

**签署人**: ____________________  
**日期**: ____________________
