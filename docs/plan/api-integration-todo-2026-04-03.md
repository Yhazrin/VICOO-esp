# API 实接总清单（2026-04-03）

> 目标：把 admin / web 的 mock 依赖逐步替换为真实 API；每一步都可回滚。

## 使用规则
- 每次只做一个“页面级切片”，避免大爆改。
- 统一策略：**真实 API 优先 + 受控 fallback**。
- 每个切片必须包含：接口映射、失败兜底、构建验证。

---

## A. Admin 端待接入（按优先级）

- [x] A1. `ArtworkPage` 的 AI 审核接入真实 `/api/ai/analyze-artwork`（已完成，本次提交）
- [x] A2. `SystemSettings` 改为真实保存并补“字段回显一致性”校验（已完成，本次提交）
- [x] A3. `AfterSalesPage` 完整接入真实筛选/分页（状态筛选 + 分页一致性，已完成）
- [x] A4. `ClothingDonationPage` 完整接入真实筛选/分页（已完成）
- [x] A5. Admin 图表接口改为后端聚合接口（避免前端对大列表二次聚合，已完成）

## B. Web 端待接入（按优先级）

- [ ] B1. `Traceability` 去静态字段映射，改为真实链路字段渲染
- [ ] B2. `Shop` 补库存/售罄状态的真实字段约束（避免 mock 误导）
- [ ] B3. `Stories` 增加后端 editorial feed（减少 mock 文案占比）
- [ ] B4. `Home` 的品牌指标增加来源标识（实时/回退）

## C. 后端配套（必须同步）

- [ ] C1. 补 admin analytics 聚合端点（donation/order/user/artwork）
- [ ] C2. 明确 mock 开关边界（development/staging/production）
- [ ] C3. 统一分页字段输出（`page_size` vs `pageSize` 规范）

---

## 本轮已完成步骤（Step 1）

### Step 1: Admin AI 审核实接
- 变更：`admin/src/services/api.ts` 的 `analyzeArtwork` 改为先调用真实 `/api/ai/analyze-artwork`，失败时再 fallback mock。
- 价值：Artwork 审核页面已具备真实 AI 返回链路，不再是纯模拟。

---

## 下一步建议（Step 5）

- 执行 A5：Admin 图表改后端聚合接口（减少前端二次聚合与大列表拉取）。
- 验收标准：图表接口只拉取聚合结果，不再依赖前端循环聚合 200 条数据。
