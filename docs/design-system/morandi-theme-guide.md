# Morandi Color System — 莫兰迪风格多主题配色方案

**Version:** 1.0.0
**Last Updated:** 2026-03-22
**Design Language:** Low Saturation / Grayish / Soft Contrast / Eye-Friendly
**Inspired by:** Claude / Notion / Linear Aesthetic

---

## Table of Contents

1. [设计理念](#1-设计理念)
2. [7 个主题总览](#2-7-个主题总览)
3. [主题详细规格](#3-主题详细规格)
4. [设计约束](#4-设计约束)
5. [集成指南](#5-集成指南)
6. [使用示例](#6-使用示例)

---

## 1. 设计理念

### 莫兰迪色系核心原则

莫兰迪色系源自意大利画家乔治·莫兰迪的静物画作，其特点是：

| 原则 | 说明 | 应用 |
|------|------|------|
| **低饱和 (Muted)** | 所有颜色添加灰色调，降低纯度 | 主色均在 15-25% 饱和度范围 |
| **带灰调 (Grayish)** | 基于同一灰度体系派生 | 所有颜色共享相似的灰色基底 |
| **柔和对比 (Soft Contrast)** | 避免强对比，保持柔和 | 文字/背景对比度控制在 3:1 - 7:1 |
| **舒适阅读 (Eye-Friendly)** | 长时间使用不疲劳 | 不使用高纯度鲜艳色 |
| **统一灰度 (Unified Gray)** | 所有颜色同一灰度体系 | 确保主题内颜色和谐搭配 |

### 灰度统一策略

每个主题的颜色都基于同一灰度体系派生：

```
背景色 (bg)     → 浅灰底 (L: 92-96%)
面板色 (panel)  → 中灰底 (L: 88-92%)
主文字 (text)   → 深灰调 (L: 15-25%)
次文字 (muted)  → 中灰调 (L: 35-45%)
边框 (border)   → 边界灰 (L: 70-80%)
主色 (primary)  → 品牌灰 (L: 45-65%)
```

### 与 Claude/Notion/Linear 的对比

| 特征 | Claude | Notion | Linear | 本方案 |
|------|--------|--------|--------|--------|
| 色调 | 温暖米色 | 冷灰蓝 | 冷中性灰 | **两者兼顾** |
| 对比度 | 中等 (5-7:1) | 中等 (4-6:1) | 高 (7-10:1) | **柔和 (3-7:1)** |
| 主色饱和度 | 低 | 极低 | 极低 | **低** |
| 暗色模式 | 有 | 有 | 有 | **有** |
| 主题数量 | 2 | 3 | 2 | **9+** |

---

## 2. 7 个主题总览

### 主题速查表

| 编号 | 主题名称 | Theme ID | 主色 | 风格描述 | 推荐场景 |
|------|---------|----------|------|---------|---------|
| 01 | **雾蓝主题** | `mist-blue` | #8FB4B5 | 冷静、通用 | 默认主题、内容平台 |
| 02 | **深海静蓝主题** | `deep-sea` | #647684 | 专业、工程感 | 后台系统、数据仪表盘 |
| 03 | **青瓷灰绿主题** | `celadon-green` | #9FAEA9 | 温和、舒适 | 创作工具、内容编辑 |
| 04 | **墨绿主题** | `ink-green` | #647467 | 牛皮纸感、高级 | 品牌展示、高端产品 |
| 05 | **远山烟紫主题** | `mountain-purple` | #9E95A6 | 创意、艺术 | 设计工具、创意平台 |
| 06 | **冷灰主题** | `cool-gray` | #9DA7B1 | 极简、中性 | 企业系统、表格数据 |
| 07 | **Claude 原版** | `claude-original` | #8B8178 | 温暖米调 | 默认主题、通用场景 |

### 主色色轮分布

```
                    雾蓝 #8FB4B5
                   /
                  /
         青瓷 #9FAEA9 — 墨绿 #647467
          |    \     /    |
          |     \   /     |
          |      \ /      |
远山紫 #9E95A6 ———— Claude #8B8178 ———— 深海 #647684
          |      / \      |
          |     /   \     |
          |    /     \    |
         冷灰 #9DA7B1
```

---

## 3. 主题详细规格

### 3.1 雾蓝主题 (Mist Blue)

**Theme ID:** `mist-blue`

**设计理念:** 像清晨薄雾中的天空，冷静而通透，适合作为默认主题。

**主色:** #8FB4B5 (雾蓝)
**参考色:** #E8EDF0, #DDE5EA, #A0B0BD

#### 完整变量表

```css
[data-theme="mist-blue"] {
  /* ── 背景色 ── */
  --mor-bg: #EDF2F4;           /* 主背景 - 雾白蓝 */
  --mor-bg-elevated: #E2E8EC;  /* 提升容器背景 */
  --mor-bg-subtle: #F4F7F9;    /* 次级背景 */
  --mor-bg-muted: #D8E0E6;    /* 静音背景 */

  /* ── 面板色 ── */
  --mor-panel: #E5EBEF;        /* 主容器 */
  --mor-panel-2: #DCE4EA;      /* 次级容器 */
  --mor-panel-3: #D0DBE3;      /* 三级容器 */
  --mor-panel-inset: #D4DDE4;  /* 内嵌面板 */

  /* ── 文字色 ── */
  --mor-text: #2D3A42;         /* 主文字 */
  --mor-text-muted: #5A6B75;   /* 次文字 */
  --mor-text-subtle: #8494A0;  /* 淡文字 */
  --mor-text-disabled: #A0ADB8; /* 禁用文字 */
  --mor-text-inverse: #EDF2F4; /* 反色文字 */

  /* ── 边框色 ── */
  --mor-border: #C4CED6;
  --mor-border-strong: #A8B8C4;
  --mor-border-subtle: #D8E2EA;
  --mor-border-muted: #E8F0F4;

  /* ── 主色 ── */
  --mor-primary: #8FB4B5;
  --mor-primary-hover: #7A9FA1;
  --mor-primary-active: #658B8C;
  --mor-primary-muted: #B8CDCE;
  --mor-primary-subtle: #D8E4E5;

  /* ── 点缀色 ── */
  --mor-accent: #9DB8BA;
  --mor-accent-hover: #8AA9AB;
  --mor-accent-muted: #C4D5D6;

  /* ── 功能色 ── */
  --mor-success: #5A7A6B;
  --mor-success-bg: #E8F0EC;
  --mor-warning: #A69278;
  --mor-warning-bg: #F2EDE6;
  --mor-danger: #9B6B6B;
  --mor-danger-bg: #F5EAEA;
  --mor-info: #6B7B8A;
  --mor-info-bg: #EAEEF2;

  /* ── 图表颜色 ── */
  --mor-chart-1: #8FB4B5;  /* 雾蓝 */
  --mor-chart-2: #A8B8B0;  /* 青灰 */
  --mor-chart-3: #B0A8A8;  /* 玫瑰灰 */
  --mor-chart-4: #8A9BA0;  /* 石板蓝 */
  --mor-chart-5: #9EAAB0;  /* 钢蓝 */
}
```

#### 适用场景

- ✅ 默认主题
- ✅ 内容创作平台
- ✅ 博客与文章系统
- ✅ 社交类应用
- ✅ 移动端 App

---

### 3.2 深海静蓝主题 (Deep Sea)

**Theme ID:** `deep-sea`

**设计理念:** 像深海中的静谧，专业而沉稳，适合后台系统与工程类应用。

**主色:** #647684 (深海蓝)
**参考色:** #DCE5EA, #C8D4DD, #6D8494

#### 完整变量表

```css
[data-theme="deep-sea"] {
  /* ── 背景色 ── */
  --mor-bg: #E4E9ED;
  --mor-bg-elevated: #D9E1E7;
  --mor-bg-subtle: #EEF2F5;
  --mor-bg-muted: #CED8DE;

  /* ── 面板色 ── */
  --mor-panel: #D9E2EA;
  --mor-panel-2: #CDD8E0;
  --mor-panel-3: #BFCCD6;
  --mor-panel-inset: #C8D3DD;

  /* ── 文字色 ── */
  --mor-text: #2A3440;
  --mor-text-muted: #4A5866;
  --mor-text-subtle: #6A7A88;
  --mor-text-disabled: #8A9AAC;
  --mor-text-inverse: #E4E9ED;

  /* ── 边框色 ── */
  --mor-border: #B4C0CA;
  --mor-border-strong: #98A8B8;
  --mor-border-subtle: #C8D2DC;
  --mor-border-muted: #DCE4EC;

  /* ── 主色 ── */
  --mor-primary: #647684;
  --mor-primary-hover: #526474;
  --mor-primary-active: #405464;
  --mor-primary-muted: #98AAC2;
  --mor-primary-subtle: #D2DCEA;

  /* ── 点缀色 ── */
  --mor-accent: #748A96;
  --mor-accent-hover: #627A86;
  --mor-accent-muted: #B4C4CC;

  /* ── 功能色 ── */
  --mor-success: #526272;
  --mor-success-bg: #E6EBEE;
  --mor-warning: #967858;
  --mor-warning-bg: #F0EBE4;
  --mor-danger: #8A6060;
  --mor-danger-bg: #F2E8E8;
  --mor-info: #5A6872;
  --mor-info-bg: #E8ECF0;

  /* ── 图表颜色 ── */
  --mor-chart-1: #647684;  /* 深海蓝 */
  --mor-chart-2: #7A8A96;  /* 灰蓝 */
  --mor-chart-3: #96A0AA;  /* 钢灰 */
  --mor-chart-4: #586A78;  /* 暗蓝 */
  --mor-chart-5: #788898;  /* 青灰 */
}
```

#### 适用场景

- ✅ 后台管理系统
- ✅ 数据仪表盘
- ✅ 代码编辑器
- ✅ 开发者工具
- ✅ 企业级应用

---

### 3.3 青瓷灰绿主题 (Celadon Green)

**Theme ID:** `celadon-green`

**设计理念:** 像宋代青瓷的温润质感，温和而舒适，适合创作与内容类应用。

**主色:** #9FAEA9 (青瓷绿)
**参考色:** #E3EAE5, #D3DDD6, #9AB5A4

#### 完整变量表

```css
[data-theme="celadon-green"] {
  /* ── 背景色 ── */
  --mor-bg: #EAEFEC;
  --mor-bg-elevated: #E0E8E4;
  --mor-bg-subtle: #F2F6F3;
  --mor-bg-muted: #D4DCD8;

  /* ── 面板色 ── */
  --mor-panel: #E2E8E4;
  --mor-panel-2: #D6DED9;
  --mor-panel-3: #C8D2CE;
  --mor-panel-inset: #DCE4DF;

  /* ── 文字色 ── */
  --mor-text: #2E3834;
  --mor-text-muted: #5A6862;
  --mor-text-subtle: #7A8882;
  --mor-text-disabled: #A0AAA4;
  --mor-text-inverse: #EAEFEC;

  /* ── 边框色 ── */
  --mor-border: #BCC8C2;
  --mor-border-strong: #A0B0A8;
  --mor-border-subtle: #D0DAD5;
  --mor-border-muted: #E2E8E4;

  /* ── 主色 ── */
  --mor-primary: #9FAEA9;
  --mor-primary-hover: #8A9D95;
  --mor-primary-active: #758C82;
  --mor-primary-muted: #C4CDC7;
  --mor-primary-subtle: #DDE2DE;

  /* ── 点缀色 ── */
  --mor-accent: #A8B8AE;
  --mor-accent-hover: #95A79D;
  --mor-accent-muted: #C8D4CD;

  /* ── 功能色 ── */
  --mor-success: #5A7A62;
  --mor-success-bg: #E6EEE8;
  --mor-warning: #A69578;
  --mor-warning-bg: #F2EDE6;
  --mor-danger: #9A7070;
  --mor-danger-bg: #F5ECEC;
  --mor-info: #6A7A72;
  --mor-info-bg: #EAEFEC;

  /* ── 图表颜色 ── */
  --mor-chart-1: #9FAEA9;  /* 青瓷绿 */
  --mor-chart-2: #A8B4A4;  /* 苔藓灰 */
  --mor-chart-3: #B0ACA8;  /* 灰岩 */
  --mor-chart-4: #8A9E8A;  /* 青苔绿 */
  --mor-chart-5: #96A49C;  /* 灰绿 */
}
```

#### 适用场景

- ✅ 笔记应用
- ✅ 文档编辑器
- ✅ 创意写作
- ✅ 教育平台
- ✅ 冥想/健康 App

---

### 3.4 墨绿主题 (Ink Green)

**Theme ID:** `ink-green`

**设计理念:** 像传统书法墨迹的低饱和延伸，牛皮纸质感，品牌感强。

**主色:** #647467 (墨绿)
**参考色:** #E2E8E2, #D2DBD3, #7A847B

#### 完整变量表

```css
[data-theme="ink-green"] {
  /* ── 背景色 ── */
  --mor-bg: #E6EBE6;
  --mor-bg-elevated: #DBE2DB;
  --mor-bg-subtle: #EEF2EE;
  --mor-bg-muted: #CED8CE;

  /* ── 面板色 ── */
  --mor-panel: #DEE5DE;
  --mor-panel-2: #D1D9D1;
  --mor-panel-3: #C2CCC2;
  --mor-panel-inset: #D8DFD8;

  /* ── 文字色 ── */
  --mor-text: #2A322A;
  --mor-text-muted: #4A584A;
  --mor-text-subtle: #6A766A;
  --mor-text-disabled: #9AAA9A;
  --mor-text-inverse: #E6EBE6;

  /* ── 边框色 ── */
  --mor-border: #BAC8BA;
  --mor-border-strong: #9EAC9E;
  --mor-border-subtle: #D0D8D0;
  --mor-border-muted: #E2E8E2;

  /* ── 主色 ── */
  --mor-primary: #647467;
  --mor-primary-hover: #546457;
  --mor-primary-active: #445447;
  --mor-primary-muted: #9CA69C;
  --mor-primary-subtle: #D8E2D8;

  /* ── 点缀色 ── */
  --mor-accent: #748475;
  --mor-accent-hover: #637465;
  --mor-accent-muted: #B0BEB0;

  /* ── 功能色 ── */
  --mor-success: #4A6A4A;
  --mor-success-bg: #E4EDE4;
  --mor-warning: #968668;
  --mor-warning-bg: #F2EEE6;
  --mor-danger: #986868;
  --mor-danger-bg: #F2E8E8;
  --mor-info: #5A6A5A;
  --mor-info-bg: #E8EDE8;

  /* ── 图表颜色 ── */
  --mor-chart-1: #647467;  /* 墨绿 */
  --mor-chart-2: #788878;  /* 青灰 */
  --mor-chart-3: #96A896;  /* 灰绿 */
  --mor-chart-4: #586858;  /* 暗苔 */
  --mor-chart-5: #6A7A6A;  /* 绿灰 */
}
```

#### 适用场景

- ✅ 品牌官网
- ✅ 高端产品展示
- ✅ 公益/慈善平台
- ✅ 环保主题应用
- ✅ 艺术画廊

---

### 3.5 远山烟紫主题 (Mountain Purple)

**Theme ID:** `mountain-purple`

**设计理念:** 像远处山峦在晨雾中呈现的紫灰色调，创意而富有艺术气质。

**主色:** #9E95A6 (远山紫)
**参考色:** #E7E0EA, #D7CDD9, #BFB0C7

#### 完整变量表

```css
[data-theme="mountain-purple"] {
  /* ── 背景色 ── */
  --mor-bg: #EDE8EF;
  --mor-bg-elevated: #E2DCE8;
  --mor-bg-subtle: #F4F0F6;
  --mor-bg-muted: #D8D0DE;

  /* ── 面板色 ── */
  --mor-panel: #E4DCE8;
  --mor-panel-2: #D8CEDD;
  --mor-panel-3: #CAC0D0;
  --mor-panel-inset: #DED6E4;

  /* ── 文字色 ── */
  --mor-text: #322A38;
  --mor-text-muted: #5A4E62;
  --mor-text-subtle: #7A6E82;
  --mor-text-disabled: #A49AAC;
  --mor-text-inverse: #EDE8EF;

  /* ── 边框色 ── */
  --mor-border: #C0B4C6;
  --mor-border-strong: #A89AB8;
  --mor-border-subtle: #D4C8DA;
  --mor-border-muted: #E4DCE8;

  /* ── 主色 ── */
  --mor-primary: #9E95A6;
  --mor-primary-hover: #8A8096;
  --mor-primary-active: #766B86;
  --mor-primary-muted: #C4B8C8;
  --mor-primary-subtle: #DED6E4;

  /* ── 点缀色 ── */
  --mor-accent: #A89FB0;
  --mor-accent-hover: #968AA0;
  --mor-accent-muted: #CCC4D4;

  /* ── 功能色 ── */
  --mor-success: #627268;
  --mor-success-bg: #E8EDE8;
  --mor-warning: #A69070;
  --mor-warning-bg: #F2EDE6;
  --mor-danger: #9A7078;
  --mor-danger-bg: #F5ECEE;
  --mor-info: #6A7082;
  --mor-info-bg: #EAECF0;

  /* ── 图表颜色 ── */
  --mor-chart-1: #9E95A6;  /* 远山紫 */
  --mor-chart-2: #A8A0B8;  /* 薰衣灰 */
  --mor-chart-3: #B8A8B8;  /* 玫瑰灰 */
  --mor-chart-4: #8A80A0;  /* 暗紫 */
  --mor-chart-5: #988E9E;  /* 灰紫 */
}
```

#### 适用场景

- ✅ 设计工具
- ✅ 创意平台
- ✅ 艺术类应用
- ✅ 音乐/播客平台
- ✅ 时尚/奢侈品

---

### 3.6 冷灰主题 (Cool Gray)

**Theme ID:** `cool-gray`

**设计理念:** 极简中性，像冬日天空的灰调，适合企业级应用与数据展示。

**主色:** #9DA7B1 (冷灰)
**参考色:** #E8EBEB, #D9DEDE, #A9A9A9

#### 完整变量表

```css
[data-theme="cool-gray"] {
  /* ── 背景色 ── */
  --mor-bg: #ECEEEF;
  --mor-bg-elevated: #E2E4E6;
  --mor-bg-subtle: #F2F4F5;
  --mor-bg-muted: #D8DADC;

  /* ── 面板色 ── */
  --mor-panel: #E4E6E8;
  --mor-panel-2: #D8DADC;
  --mor-panel-3: #CACCCE;
  --mor-panel-inset: #DEE0E2;

  /* ── 文字色 ── */
  --mor-text: #2C2E30;
  --mor-text-muted: #5A5C5E;
  --mor-text-subtle: #7A7C7E;
  --mor-text-disabled: #A0A2A4;
  --mor-text-inverse: #ECEEEF;

  /* ── 边框色 ── */
  --mor-border: #C4C6C8;
  --mor-border-strong: #A8AAAC;
  --mor-border-subtle: #D4D6D8;
  --mor-border-muted: #E4E6E8;

  /* ── 主色 ── */
  --mor-primary: #9DA7B1;
  --mor-primary-hover: #8999A5;
  --mor-primary-active: #758B95;
  --mor-primary-muted: #C4C8CE;
  --mor-primary-subtle: #DDE0E4;

  /* ── 点缀色 ── */
  --mor-accent: #A8B0B8;
  --mor-accent-hover: #94A0AA;
  --mor-accent-muted: #C8CED4;

  /* ── 功能色 ── */
  --mor-success: #5A6A62;
  --mor-success-bg: #E8EEEC;
  --mor-warning: #9A906A;
  --mor-warning-bg: #F2F0E8;
  --mor-danger: #9A6A6A;
  --mor-danger-bg: #F5ECEC;
  --mor-info: #687282;
  --mor-info-bg: #EAECF0;

  /* ── 图表颜色 ── */
  --mor-chart-1: #9DA7B1;  /* 冷灰 */
  --mor-chart-2: #A8AEB8;  /* 灰蓝 */
  --mor-chart-3: #B0B4B8;  /* 银灰 */
  --mor-chart-4: #8A9098;  /* 暗灰 */
  --mor-chart-5: #96A0A8;  /* 钢灰 */
}
```

#### 适用场景

- ✅ 企业管理系统
- ✅ 表格/数据展示
- ✅ CRM/ERP 系统
- ✅ 财务应用
- ✅ B2B 平台

---

### 3.7 Claude 原版主题 (Claude Original)

**Theme ID:** `claude-original`

**设计理念:** 复刻 Claude/Notion 风格的温暖米色基调，保持当前童画项目的杂志质感。

**主色:** #8B8178 (暖灰棕)
**参考色:** 基于当前项目的 tokens.css 提炼

#### 完整变量表

```css
[data-theme="claude-original"] {
  /* ── 背景色 ── */
  --mor-bg: #F7F5F2;           /* 温暖米白 */
  --mor-bg-elevated: #EFECEA;  /* 提升容器 */
  --mor-bg-subtle: #FAF8F5;   /* 次级背景 */
  --mor-bg-muted: #E8E4E0;    /* 静音背景 */

  /* ── 面板色 ── */
  --mor-panel: #F0ECE8;        /* 主容器 */
  --mor-panel-2: #E6E2DE;       /* 次级容器 */
  --mor-panel-3: #DCD8D4;      /* 三级容器 */
  --mor-panel-inset: #EAE6E2;  /* 内嵌面板 */

  /* ── 文字色 ── */
  --mor-text: #2D2A26;         /* 暖黑 */
  --mor-text-muted: #5C5850;   /* 暖灰 */
  --mor-text-subtle: #7A756C;  /* 淡文字 */
  --mor-text-disabled: #A8A096; /* 禁用文字 */
  --mor-text-inverse: #F7F5F2; /* 反色文字 */

  /* ── 边框色 ── */
  --mor-border: #D4CFC8;
  --mor-border-strong: #B8B0A4;
  --mor-border-subtle: #E2DED8;
  --mor-border-muted: #EEEAE6;

  /* ── 主色 ── */
  --mor-primary: #8B8178;
  --mor-primary-hover: #7A7066;
  --mor-primary-active: #696054;
  --mor-primary-muted: #C4BDB4;
  --mor-primary-subtle: #E8E4DE;

  /* ── 点缀色 ── */
  --mor-accent: #9A9080;
  --mor-accent-hover: #887E6E;
  --mor-accent-muted: #CCC5B8;

  /* ── 功能色 ── */
  --mor-success: #5A6A56;
  --mor-success-bg: #E8EEE6;
  --mor-warning: #A69262;
  --mor-warning-bg: #F2EDE4;
  --mor-danger: #9A605A;
  --mor-danger-bg: #F5EBEA;
  --mor-info: #6A7268;
  --mor-info-bg: #EAEEEC;

  /* ── 图表颜色 ── */
  --mor-chart-1: #8B8178;  /* 暖灰棕 */
  --mor-chart-2: #9A9080;  /* 灰棕 */
  --mor-chart-3: #A8A090;  /* 暖灰 */
  --mor-chart-4: #7A7268;  /* 深棕灰 */
  --mor-chart-5: #887E70;  /* 褐灰 */
}
```

#### 与原 tokens.css 的映射关系

| Morandi 变量 | 原 tokens 变量 | 映射关系 |
|-------------|---------------|---------|
| `--mor-bg` | `#F5F0E8` | 略浅优化 |
| `--mor-panel` | `#EDE6D6` | 暖灰调整 |
| `--mor-text` | `#1A1A16` | 略浅为暖黑 |
| `--mor-primary` | `#8B8178` | 新增品牌色 |
| `--mor-success` | `#3D5A3D` | 优化饱和度 |

---

## 4. 设计约束

### 4.1 颜色约束

| 约束 | 说明 | 示例 |
|------|------|------|
| **禁止纯黑** | 不使用 #000000 | 使用 #2A322A 等 |
| **禁止纯白** | 不使用 #FFFFFF | 使用 #F7F5F2 等 |
| **禁止高饱和** | 饱和度不超过 30% | 主色均带灰调 |
| **禁止强对比** | 对比度不超过 12:1 | 保持柔和 |
| **禁止鲜艳色** | 不使用高纯度颜色 | 所有色均低饱和 |

### 4.2 对比度要求

| 类型 | 最小对比度 | 最大对比度 |
|------|-----------|-----------|
| 主文字 | 4.5:1 | 7:1 |
| 次文字 | 3:1 | 5:1 |
| 大文字 | 3:1 | 5:1 |
| UI 组件 | 3:1 | 7:1 |

### 4.3 灰度一致性

每个主题内的所有颜色共享同一灰度基底：

```
灰度轴: L* = 10% - 96%

背景色  → L* = 92-96% (极浅灰)
面板色  → L* = 88-92% (浅灰)
次面板  → L* = 82-88% (中浅灰)
边框    → L* = 70-80% (中灰)
主色    → L* = 45-65% (中深灰)
文字    → L* = 15-25% (深灰)
```

---

## 5. 集成指南

### 5.1 CSS 变量方式

```html
<!-- 1. 引入莫兰迪 CSS -->
<link rel="stylesheet" href="morandi-themes.css">

<!-- 2. 在 HTML 根元素设置主题 -->
<html data-theme="mist-blue">
<!-- 或 -->
<html class="theme-mist-blue">
```

### 5.2 Tailwind CSS 集成

```javascript
// tailwind.config.js
import morandiPlugin from './src/styles/morandi-tailwind-plugin.js';

export default {
  // ...
  plugins: [morandiPlugin],
};
```

```jsx
// 使用 Tailwind 类
<div class="mor-bg mor-panel mor-text">
  <button class="mor-button mor-button-primary">主要按钮</button>
</div>
```

### 5.3 React 主题切换 Hook

```tsx
// hooks/useMorandiTheme.ts
import { useState, useEffect } from 'react';

type ThemeId = 'mist-blue' | 'deep-sea' | 'celadon-green' | 
               'ink-green' | 'mountain-purple' | 'cool-gray' | 
               'claude-original';

export function useMorandiTheme() {
  const [theme, setTheme] = useState<ThemeId>('claude-original');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return { theme, setTheme };
}
```

### 5.4 CSS 类方式

```html
<!-- 直接使用工具类 -->
<div class="mor-bg mor-panel mor-text mor-border">
  <h1 class="mor-text">标题</h1>
  <p class="mor-text-muted">次要文字</p>
  <button class="mor-button mor-button-primary">按钮</button>
</div>
```

---

## 6. 使用示例

### 6.1 登录表单

```tsx
<div className="min-h-screen mor-bg flex items-center justify-center">
  <div className="mor-card mor-card-elevated" style={{ width: '400px' }}>
    <h2 className="mor-text mor-text-h3 mb-6">登录</h2>
    
    <div className="space-y-4">
      <div>
        <label className="mor-text-muted mb-1">邮箱</label>
        <input className="mor-input" type="email" />
      </div>
      
      <div>
        <label className="mor-text-muted mb-1">密码</label>
        <input className="mor-input" type="password" />
      </div>
      
      <button className="mor-button mor-button-primary w-full">
        登录
      </button>
    </div>
  </div>
</div>
```

### 6.2 数据表格

```tsx
<table className="mor-card">
  <thead>
    <tr className="mor-bg-muted">
      <th className="mor-text-muted">名称</th>
      <th className="mor-text-muted">状态</th>
      <th className="mor-text-muted">金额</th>
    </tr>
  </thead>
  <tbody>
    <tr className="mor-border-b">
      <td className="mor-text">项目 A</td>
      <td><span className="mor-tag mor-tag-success">完成</span></td>
      <td className="mor-text">¥12,000</td>
    </tr>
    <tr className="mor-border-b">
      <td className="mor-text">项目 B</td>
      <td><span className="mor-tag mor-tag-warning">进行中</span></td>
      <td className="mor-text">¥8,500</td>
    </tr>
  </tbody>
</table>
```

### 6.3 主题切换器

```tsx
const themes = [
  { id: 'mist-blue', name: '雾蓝', color: '#8FB4B5' },
  { id: 'deep-sea', name: '深海', color: '#647684' },
  { id: 'celadon-green', name: '青瓷', color: '#9FAEA9' },
  { id: 'ink-green', name: '墨绿', color: '#647467' },
  { id: 'mountain-purple', name: '远山紫', color: '#9E95A6' },
  { id: 'cool-gray', name: '冷灰', color: '#9DA7B1' },
  { id: 'claude-original', name: 'Claude 原版', color: '#8B8178' },
];

<div className="flex gap-2">
  {themes.map((theme) => (
    <button
      key={theme.id}
      onClick={() => setTheme(theme.id)}
      className="mor-button"
      style={{ 
        backgroundColor: theme.color,
        borderColor: theme.color,
      }}
      title={theme.name}
    />
  ))}
</div>
```

---

## 附录 A: 暗色主题

每个主题都有对应的暗色版本：

| 亮色主题 | 暗色主题 |
|---------|---------|
| `mist-blue` | `mist-blue-dark` |
| `celadon-green` | `celadon-green-dark` |
| `claude-original` | `claude-original-dark` |

使用方式：

```html
<html data-theme="mist-blue-dark">
```

---

## 附录 B: 图表配色建议

| 场景 | 建议颜色 |
|------|---------|
| 柱状图 | chart-1, chart-2, chart-3 |
| 饼图 | chart-1, chart-2, chart-3, chart-4, chart-5 |
| 折线图 | chart-1, chart-2, chart-4 |
| 多系列 | 交替使用 chart-1~5 |

---

## 附录 C: 与现有 tokens.css 的融合

如果要将莫兰迪系统与现有设计系统融合：

```css
/* 在 tokens.css 中添加莫兰迪变量 */
:root {
  /* 原有变量保留 */
  --color-paper: #F5F0E8;
  --color-ink: #1A1A16;
  
  /* 新增莫兰迪变量 */
  --mor-bg: var(--color-paper);
  --mor-text: var(--color-ink);
  /* ... */
}
```

---

*Document Version: 1.0*
*Based on: Morandi Color Theory & Claude/Notion/Linear Design Language*
