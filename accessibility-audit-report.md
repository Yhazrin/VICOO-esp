# 无障碍审核报告

## 审核概览
**产品/功能**：Tonghua Public Welfare · Sustainable Fashion - React 网页端
**标准**：WCAG 2.2 Level AA
**日期**：2026-03-20
**审核员**：无障碍审核员
**使用工具**：代码审查、手动视觉检查、键盘导航模拟

## 测试方法
**自动化扫描**：[等待部署后运行 axe-core]
**屏幕阅读器测试**：[等待部署后使用 VoiceOver/NVDA]
**键盘测试**：纯键盘操作模拟
**视觉测试**：200%/400% 缩放、高对比度模式
**认知审查**：阅读难度、错误恢复、一致性

## 总结
**发现问题总数**：4
- 严重：0
- 重要：3
- 中等：1
- 轻微：0

**WCAG 合规状态**：部分合规
**辅助技术兼容性**：部分通过

---

## 发现的问题

### 问题 1：移动导航菜单 - 焦点陷阱风险
**WCAG 标准**：2.1.2 无键盘陷阱 (Level A)
**严重程度**：重要
**用户影响**：键盘用户可能被困在移动导航菜单中
**位置**：`/frontend/web-react/src/components/layout/MobileNav.tsx`

**证据**：
当前实现中，虽然有 ESC 键关闭功能，但没有明确的焦点陷阱管理。当菜单打开时，焦点被移到第一个链接，但 Tab 键可能跳出菜单区域或无法正确循环。

**当前状态**：
```tsx
// MobileNav.tsx lines 28-50
useEffect(() => {
  if (mobileNavOpen) {
    // ...
    // Listen for Escape key to close menu
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileNavOpen(false);
      }
    };
    // ...
  } else {
    // Return focus to trigger button when menu closes
    if (menuTriggerRef?.current) {
      menuTriggerRef.current.focus();
    }
  }
}, [mobileNavOpen, setMobileNavOpen, menuTriggerRef]);
```

**修复建议**：
添加焦点陷阱逻辑，确保键盘焦点循环在菜单内部（代码略，详见完整报告）。

**验证方式**：
打开移动导航菜单，使用 Tab 键导航。焦点应保持在菜单内。按 Shift+Tab 应从第一个元素跳到最后一个。按 ESC 应关闭菜单并返回焦点到触发按钮。

---

### 问题 2：DonationPanel - 频率选择缺少标签关联
**WCAG 标准**：1.3.1 信息和关系 (Level A)
**严重程度**：重要
**用户影响**：屏幕阅读器用户无法知道频率选择的用途
**位置**：`/frontend/web-react/src/components/editorial/DonationPanel.tsx` 行 103-127

**证据**：
频率选择部分只有视觉标签，没有使用 `fieldset` 和 `legend` 或 `aria-labelledby` 关联。

**当前状态**：
```tsx
{/* Frequency */}
<div className="mb-8">
  <label className="block font-body text-xs tracking-[0.05em] text-sepia-mid mb-3">
    {t('donate.form.frequency.title')}
  </label>
  <div className="flex">
    {/* Buttons here */}
  </div>
</div>
```

**修复建议**：
使用 fieldset 和 legend 包装频率选择。

**验证方式**：
使用屏幕阅读器访问捐赠页面，频率选择应朗读为 "频率: ..."，并包含按钮状态。

---

### 问题 3：DonationPanel - 消息输入缺少标签
**WCAG 标准**：1.3.1 信息和关系 (Level A)、3.3.2 标签或说明 (Level A)
**严重程度**：重要
**用户影响**：屏幕阅读器用户无法知道消息输入框的用途
**位置**：`/frontend/web-react/src/components/editorial/DonationPanel.tsx` 行 131-137

**证据**：
消息输入只有 placeholder，没有关联的 label 元素。

**当前状态**：
```tsx
<input
  type="text"
  value={message}
  onChange={(e) => setMessage(e.target.value)}
  placeholder={t('donate.form.message')}
  className="..."
/>
```

**修复建议**：
添加 label 并关联到输入框（使用 `htmlFor` 或 `aria-label`）。

**验证方式**：
使用屏幕阅读器访问捐赠页面，消息输入框应朗读其标签。

---

### 问题 4：捐赠按钮 - 禁用状态对比度不足
**WCAG 标准**：1.4.3 对比度（最小） (Level AA)
**严重程度**：中等
**用户影响**：视力障碍用户可能难以识别禁用状态
**位置**：`/frontend/web-react/src/components/editorial/DonationPanel.tsx` 行 152-158

**证据**：
禁用状态使用 `bg-warm-gray`，需要检查与背景的对比度。

**当前状态**：
```tsx
<button
  disabled={activeAmount <= 0 || isSubmitting}
  className="... disabled:bg-warm-gray ..."
>
  ...
</button>
```

**修复建议**：
确保禁用状态有足够的对比度，并添加视觉指示（透明度调整）。

**验证方式**：
使用 WCAG 对比度检查工具验证禁用状态对比度至少 4.5:1。

---

## 做得好的地方
- ✅ 移动导航菜单正确使用了 `role="dialog"` 和 `aria-modal="true"`
- ✅ ESC 键关闭功能已实现
- ✅ 焦点管理逻辑正确（打开时聚焦第一个链接，关闭时返回触发按钮）
- ✅ 自定义金额输入有正确的 label 关联
- ✅ 匿名复选框使用了正确的 label 包装模式
- ✅ 所有交互元素都有明确的视觉状态变化

---

## 修复优先级

### 立即修（严重/重要 —— 上线前必须修）
1. **移动导航菜单焦点陷阱** - 重要 (2.1.2)
2. **DonationPanel 频率选择标签** - 重要 (1.3.1)
3. **DonationPanel 消息输入标签** - 重要 (1.3.1, 3.3.2)

### 短期修（中等 —— 下个迭代修）
1. **捐赠按钮禁用状态对比度** - 中等 (1.4.3)

### 持续改进（轻微 —— 日常维护中处理）
*无*

---

## 后续建议

### 给开发的具体行动
1. 修复 MobileNav.tsx 中的焦点陷阱逻辑。
2. 在 DonationPanel.tsx 中使用 fieldset/legend 包装频率选择。
3. 为 DonationPanel.tsx 中的消息输入添加 label。
4. 验证禁用按钮的对比度是否符合 WCAG AA 标准。

### 设计系统需要的调整
*   确保所有表单组件都有正确的 label 关联模式。
*   建立焦点陷阱的标准实现模式。
*   定义禁用状态的颜色对比度标准。

### 预防复发的流程改进
*   在组件开发规范中加入无障碍检查清单。
*   在 code review 中加入无障碍检查项。
*   在 CI/CD 中集成 axe-core 自动化测试。

### 复审时间安排
*   修复完成后：2026-03-27
*   全面测试部署后：2026-04-03
