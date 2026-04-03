/**
 * 顶部导航栏组件 (TopBar)
 * 
 * 功能说明：
 * - 显示系统运行状态指示器
 * - 提供中英文语言切换功能
 * - 展示当前登录用户信息（用户名和角色）
 * - 提供退出登录按钮
 * 
 * 使用场景：
 * 作为管理后台顶部的全局导航栏，固定在页面顶部显示
 */

// 导入国际化翻译钩子，用于支持多语言切换
import { useTranslation } from 'react-i18next';

// 导入认证状态管理 Store，用于获取当前用户信息和登出方法
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';

export default function TopBar() {
  // 解构获取翻译函数 t 和 i18n 实例（用于语言切换）
  const { t, i18n } = useTranslation();
  
  // 从 Zustand 全局状态中获取当前登录用户信息
  // 参数 s 为 store 状态对象，使用 any 类型避免 TypeScript 类型推断问题
  const user = useAuthStore((s: any) => s.user);
  
  // 获取登出方法，用于处理用户退出登录操作
  const logout = useAuthStore((s: any) => s.logout);

  const setLocale = useUIStore((s) => s.setLocale);

  /**
   * 语言切换处理函数
   * 在中文(zh)和英文(en)之间切换界面语言
   */
  const toggleLanguage = () => {
    // 判断当前语言，切换到另一种语言
    const newLang = i18n.language === 'zh' ? 'en' : 'zh';
    // 调用 i18n 的 changeLanguage 方法更新全局语言设置
    i18n.changeLanguage(newLang);
    // 将新语言保存到持久化存储中
    setLocale(newLang);
  };

  return (
    <header style={{
      height: 'var(--topbar-height)',           // 使用 CSS 变量定义的顶部栏高度
      backgroundColor: 'var(--color-paper)',     // 米白色背景（纸张质感）
      borderBottom: '1px solid var(--color-ink)', // 底部墨色边框分隔线
      display: 'flex',                           // 弹性布局
      alignItems: 'center',                      // 垂直居中对齐
      justifyContent: 'flex-end',               // 内容右对齐
      padding: '0 40px',                         // 左右内边距
      flexShrink: 0,                             // 不允许收缩
      position: 'relative',                      // 相对定位
      zIndex: 10                                 // 层级高于其他元素
    }}>
      {/* 右侧功能区域容器 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        
        {/* 系统运行状态指示器 */}
        <div style={{
          fontFamily: 'var(--font-body)',         // 正文字体
          fontSize: '10px',                       // 小字号
          textTransform: 'uppercase',             // 大写字母
          letterSpacing: '0.2em',                 // 字间距加宽
          color: 'var(--color-sepia-mid)',        // 棕褐色文字（复古风格）
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {/* 绿色圆点指示系统在线状态 */}
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-success)' }}></span>
          {/* 显示"系统运行中"文本 */}
          {t('topbar.systemOnline')}
        </div>

        {/* 中英文语言切换按钮 */}
        <button
          onClick={toggleLanguage}                 // 点击触发语言切换
          style={{
            padding: '4px 12px',
            border: '1px solid var(--color-warm-gray)', // 暖灰色边框
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',        // 等宽字体（技术感）
            cursor: 'pointer',
            background: 'transparent',             // 透明背景
            color: 'var(--color-ink)',
            letterSpacing: '0.05em',
          }}
        >
          {/* 根据当前语言显示切换目标语言：中文模式下显示"EN"，英文模式下显示"中文" */}
          {i18n.language === 'zh' ? t('topbar.switchToEn') : t('topbar.switchToZh')}
        </button>

        {/* 用户信息与登出区域 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          borderLeft: '1px solid var(--color-warm-gray)', // 左侧分隔线
          paddingLeft: 32
        }}>
          {/* 用户信息展示区 */}
          <div style={{ textAlign: 'right' }}>
            {/* 显示用户名，若未登录则显示默认文本"管理员" */}
            <div style={{
              fontSize: '13px',
              fontFamily: 'var(--font-display)',     // 展示字体（衬线体）
              fontWeight: 700,                        // 加粗
              fontStyle: 'italic',                    // 斜体（杂志风格）
              lineHeight: 1
            }}>
              {user?.username || t('topbar.administrator')}
            </div>
            {/* 显示用户角色，若未登录则显示默认文本"授权用户" */}
            <div style={{
              fontSize: '9px',
              color: 'var(--color-sepia-mid)',
              fontFamily: 'var(--font-body)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginTop: '4px'
            }}>
              {user?.role || t('topbar.authorizedUser')}
            </div>
          </div>
          
          {/* 退出登录按钮 */}
          <button
            onClick={logout}                          // 点击触发登出操作
            style={{
              padding: '6px 12px',
              border: '1px solid var(--color-ink)',   // 墨色实线边框
              fontSize: '10px',
              fontFamily: 'var(--font-body)',
              textTransform: 'uppercase',             // 大写字母
              letterSpacing: '0.1em',
              transition: 'all 0.2s',                  // 平滑过渡动画
              cursor: 'pointer',
              background: 'transparent'               // 默认透明背景
            }}
            /* 鼠标悬停效果：填充墨色背景并反转文字颜色为白色 */
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-ink)'; e.currentTarget.style.color = 'var(--color-paper)'; }}
            /* 鼠标离开效果：恢复透明背景和黑色文字 */
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-ink)'; }}
          >
            {t('topbar.logout')}
          </button>
        </div>
      </div>
    </header>
  );
}
