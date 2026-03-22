/* ═══════════════════════════════════════════════════════════════════════════════
   Morandi Theme Tailwind Plugin
   莫兰迪主题 Tailwind CSS 集成插件
   
   使用方式:
   1. 在 tailwind.config.js 中引入此插件
   2. 使用 mor- 前缀的 class 即可应用莫兰迪色系
   
   示例:
   <div class="mor-bg mor-panel mor-text">...</div>
   <button class="mor-btn mor-btn-primary">Click</button>
   ═══════════════════════════════════════════════════════════════════════════════ */

const morandiPlugin = function ({ addUtilities, addBase, theme }) {
  /* ── CSS 变量基础层 ── */
  addBase({
    /* 莫兰迪变量默认激活（可在特定主题下覆盖） */
    ':root, [data-theme="default"], .theme-default': {
      '--mor-bg': '#F7F5F2',
      '--mor-bg-elevated': '#EFECEA',
      '--mor-bg-subtle': '#FAF8F5',
      '--mor-bg-muted': '#E8E4E0',
      '--mor-panel': '#F0ECE8',
      '--mor-panel-2': '#E6E2DE',
      '--mor-panel-3': '#DCD8D4',
      '--mor-panel-inset': '#EAE6E2',
      '--mor-text': '#2D2A26',
      '--mor-text-muted': '#5C5850',
      '--mor-text-subtle': '#7A756C',
      '--mor-text-disabled': '#A8A096',
      '--mor-text-inverse': '#F7F5F2',
      '--mor-border': '#D4CFC8',
      '--mor-border-strong': '#B8B0A4',
      '--mor-border-subtle': '#E2DED8',
      '--mor-border-muted': '#EEEAE6',
      '--mor-primary': '#8B8178',
      '--mor-primary-hover': '#7A7066',
      '--mor-primary-active': '#696054',
      '--mor-primary-muted': '#C4BDB4',
      '--mor-primary-subtle': '#E8E4DE',
      '--mor-accent': '#9A9080',
      '--mor-accent-hover': '#887E6E',
      '--mor-accent-muted': '#CCC5B8',
      '--mor-success': '#5A6A56',
      '--mor-success-bg': '#E8EEE6',
      '--mor-success-muted': '#96A692',
      '--mor-warning': '#A69262',
      '--mor-warning-bg': '#F2EDE4',
      '--mor-warning-muted': '#C4B488',
      '--mor-danger': '#9A605A',
      '--mor-danger-bg': '#F5EBEA',
      '--mor-danger-muted': '#C4948E',
      '--mor-info': '#6A7268',
      '--mor-info-bg': '#EAEEEC',
      '--mor-info-muted': '#96A296',
      '--mor-chart-1': '#8B8178',
      '--mor-chart-2': '#9A9080',
      '--mor-chart-3': '#A8A090',
      '--mor-chart-4': '#7A7268',
      '--mor-chart-5': '#887E70',
    },
  });

  /* ── 工具类 ── */
  const utilities = {
    /* 背景色 */
    '.mor-bg': { backgroundColor: 'var(--mor-bg)' },
    '.mor-bg-elevated': { backgroundColor: 'var(--mor-bg-elevated)' },
    '.mor-bg-subtle': { backgroundColor: 'var(--mor-bg-subtle)' },
    '.mor-bg-muted': { backgroundColor: 'var(--mor-bg-muted)' },

    /* 面板色 */
    '.mor-panel': { backgroundColor: 'var(--mor-panel)' },
    '.mor-panel-2': { backgroundColor: 'var(--mor-panel-2)' },
    '.mor-panel-3': { backgroundColor: 'var(--mor-panel-3)' },
    '.mor-panel-inset': { backgroundColor: 'var(--mor-panel-inset)' },

    /* 文字色 */
    '.mor-text': { color: 'var(--mor-text)' },
    '.mor-text-muted': { color: 'var(--mor-text-muted)' },
    '.mor-text-subtle': { color: 'var(--mor-text-subtle)' },
    '.mor-text-disabled': { color: 'var(--mor-text-disabled)' },
    '.mor-text-inverse': { color: 'var(--mor-text-inverse)' },

    /* 边框色 */
    '.mor-border': { borderColor: 'var(--mor-border)' },
    '.mor-border-strong': { borderColor: 'var(--mor-border-strong)' },
    '.mor-border-subtle': { borderColor: 'var(--mor-border-subtle)' },
    '.mor-border-muted': { borderColor: 'var(--mor-border-muted)' },

    /* 主色 */
    '.mor-primary': { color: 'var(--mor-primary)' },
    '.mor-primary-bg': { backgroundColor: 'var(--mor-primary)' },
    '.mor-primary-hover:hover': { color: 'var(--mor-primary-hover)' },
    '.mor-accent': { color: 'var(--mor-accent)' },
    '.mor-accent-bg': { backgroundColor: 'var(--mor-accent)' },

    /* 功能色 */
    '.mor-success': { color: 'var(--mor-success)' },
    '.mor-success-bg': { backgroundColor: 'var(--mor-success-bg)' },
    '.mor-warning': { color: 'var(--mor-warning)' },
    '.mor-warning-bg': { backgroundColor: 'var(--mor-warning-bg)' },
    '.mor-danger': { color: 'var(--mor-danger)' },
    '.mor-danger-bg': { backgroundColor: 'var(--mor-danger-bg)' },
    '.mor-info': { color: 'var(--mor-info)' },
    '.mor-info-bg': { backgroundColor: 'var(--mor-info-bg)' },

    /* 图表颜色 */
    '.mor-chart-1': { color: 'var(--mor-chart-1)' },
    '.mor-chart-2': { color: 'var(--mor-chart-2)' },
    '.mor-chart-3': { color: 'var(--mor-chart-3)' },
    '.mor-chart-4': { color: 'var(--mor-chart-4)' },
    '.mor-chart-5': { color: 'var(--mor-chart-5)' },

    /* 交互状态 */
    '.mor-hover': { '--tw-bg-opacity': '1', backgroundColor: 'var(--mor-hover)' },
    '.mor-active': { '--tw-bg-opacity': '1', backgroundColor: 'var(--mor-active)' },
    '.mor-focus': { '--tw-bg-opacity': '1', backgroundColor: 'var(--mor-focus)' },

    /* 阴影 */
    '.mor-shadow-sm': { boxShadow: 'var(--mor-shadow-sm)' },
    '.mor-shadow-md': { boxShadow: 'var(--mor-shadow-md)' },
    '.mor-shadow-lg': { boxShadow: 'var(--mor-shadow-lg)' },
    '.mor-shadow-xl': { boxShadow: 'var(--mor-shadow-xl)' },
  };

  addUtilities(utilities, ['responsive', 'hover']);

  /* ── 组件类 ── */
  const components = {
    /* 按钮 */
    '.mor-button': {
      display: 'inline-flex',
      'align-items': 'center',
      'justify-content': 'center',
      padding: '8px 16px',
      'font-size': '14px',
      'font-weight': '500',
      'border-radius': '6px',
      border: '1px solid var(--mor-border)',
      'background-color': 'var(--mor-panel)',
      color: 'var(--mor-text)',
      transition: 'all 0.15s ease',
      cursor: 'pointer',
    },

    /* 按钮主要样式 */
    '.mor-button-primary': {
      'background-color': 'var(--mor-primary)',
      'border-color': 'var(--mor-primary)',
      color: 'var(--mor-text-inverse)',
    },

    /* 按钮次要样式 */
    '.mor-button-secondary': {
      'background-color': 'var(--mor-bg-muted)',
      'border-color': 'var(--mor-border)',
      color: 'var(--mor-text)',
    },

    /* 幽灵按钮 */
    '.mor-button-ghost': {
      'background-color': 'transparent',
      'border-color': 'transparent',
      color: 'var(--mor-text)',
    },

    /* 输入框 */
    '.mor-input': {
      width: '100%',
      padding: '10px 14px',
      'font-size': '14px',
      border: '1px solid var(--mor-border)',
      'border-radius': '6px',
      'background-color': 'var(--mor-bg)',
      color: 'var(--mor-text)',
      transition: 'all 0.15s ease',
    },

    /* 卡片 */
    '.mor-card': {
      'background-color': 'var(--mor-panel)',
      border: '1px solid var(--mor-border-subtle)',
      'border-radius': '8px',
      padding: '20px',
      boxShadow: 'var(--mor-shadow-sm)',
      transition: 'all 0.2s ease',
    },

    /* 提升卡片 */
    '.mor-card-elevated': {
      'background-color': 'var(--mor-panel-2)',
      boxShadow: 'var(--mor-shadow-md)',
    },

    /* 标签 */
    '.mor-tag': {
      display: 'inline-flex',
      'align-items': 'center',
      padding: '4px 10px',
      'font-size': '12px',
      'font-weight': '500',
      'border-radius': '4px',
      'background-color': 'var(--mor-bg-muted)',
      color: 'var(--mor-text-muted)',
    },

    /* 分割线 */
    '.mor-divider': {
      height: '1px',
      'background-color': 'var(--mor-border-muted)',
      margin: '16px 0',
    },
  };

  addUtilities(components, ['responsive']);
};

module.exports = morandiPlugin;
