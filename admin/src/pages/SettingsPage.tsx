/**
 * 系统设置页面 (Settings Page)
 *
 * 功能说明：
 * - 展示和编辑系统全局配置参数
 * - 支持三个配置标签页：全局参数、支付网关、安全设置
 * - 提供各支付渠道的集成配置（微信、支付宝、Stripe、PayPal）
 * - 显示只读的安全配置信息（令牌有效期、频率限制等）
 * - 实时保存配置更新
 *
 * 使用场景：
 * 超级管理员对平台核心运营参数进行配置和调整
 */

// 导入 React 状态和副作用钩子
import { useState, useEffect } from 'react';

// 导入 React Query 数据管理钩子
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// 导入 toast 通知组件
import toast from 'react-hot-toast';

// 导入 UI 按钮组件
import Button from '../components/ui/Button';

// 导入国际化翻译钩子
import { useTranslation } from 'react-i18next';

// 导入 API 服务函数
import { fetchSystemSettings, updateSystemSettings } from '../services/api';

// 导入系统设置类型定义
import type { SystemSettings } from '../types';

export default function SettingsPage() {
  // 获取翻译函数
  const { t } = useTranslation();

  // 使用 React Query 管理数据获取和缓存
  const queryClient = useQueryClient();

  // 表单数据状态
  const [form, setForm] = useState<SystemSettings | null>(null);

  // 当前激活的标签页
  const [activeTab, setActiveTab] = useState('general');

  // 获取系统设置数据
  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSystemSettings
  });

  // 当数据加载完成后初始化表单
  useEffect(() => {
    if (data) {
      setForm(JSON.parse(JSON.stringify(data)));
    }
  }, [data]);

  /**
   * 更新配置的 mutation
   * 成功时刷新数据并显示 toast 提示
   */
  const updateMutation = useMutation({
    mutationFn: updateSystemSettings,
    onSuccess: () => {
      // 使 settings 查询失效，触发重新获取最新数据
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      // 显示保存成功的 toast 提示（使用国际化文本）
      toast.success(t('settings.toastSaved'));
    },
  });

  // 数据加载中显示加载状态
  if (!form) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '100px',
        color: 'var(--color-sepia-mid)'
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          animation: 'pulse 2s infinite'
        }}>
          {t('settings.loading')}
        </div>
      </div>
    );
  }

  // 保存配置处理函数
  const handleSave = () => {
    updateMutation.mutate(form);
  };

  /**
   * 支付渠道名称映射
   * 将方法键映射到翻译文件中使用的键
   * 注意：wechat 和 alipay 需要特殊处理首字母大写
   */
  const paymentLabels: Record<string, string> = {
    wechat: t('settings.paymentWechat'),
    alipay: t('settings.paymentAlipay'),
    stripe: t('settings.paymentStripe'),
    paypal: t('settings.paymentPaypal'),
  };

  /**
   * 标签页配置
   * 使用翻译函数获取各标签页的显示文本
   */
  const tabs = [
    { key: 'general', label: t('settings.tabGeneral') },
    { key: 'payment', label: t('settings.tabPayment') },
    { key: 'security', label: t('settings.tabSecurity') },
  ];

  return (
    <div style={{ maxWidth: '1000px' }}>
      {/* 页面标题和保存按钮区域 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 40
      }}>
        <div>
          {/* 主标题：系统配置 */}
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 8,
            fontFamily: 'var(--font-serif)'
          }}>
            {t('settings.title')}
          </h1>
          {/* 副标题描述 */}
          <p style={{
            fontSize: 14,
            color: 'var(--color-sepia-mid)',
            maxWidth: '600px',
            lineHeight: 1.6
          }}>
            {t('settings.description')}
          </p>
        </div>
        {/* 保存按钮 */}
        <Button
          variant="primary"
          loading={updateMutation.isPending}
          onClick={handleSave}
          style={{ minWidth: '160px' }}
        >
          {t('settings.btnCommit')}
        </Button>
      </div>

      {/* 标签页切换器 */}
      <div style={{
        display: 'flex',
        gap: 0,
        marginBottom: 32,
        borderBottom: '2px solid var(--color-ink)',
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '12px 24px',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'var(--font-body)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: activeTab === tab.key ? 'var(--color-paper)' : 'var(--color-ink)',
              backgroundColor: activeTab === tab.key ? 'var(--color-ink)' : 'transparent',
              border: 'none',
              borderTop: activeTab === tab.key ? '2px solid var(--color-ink)' : '2px solid transparent',
              borderLeft: activeTab === tab.key ? '2px solid var(--color-ink)' : '2px solid transparent',
              borderRight: activeTab === tab.key ? '2px solid var(--color-ink)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 配置卡片区域 */}
      <div style={{
        background: 'var(--color-paper)',
        border: '1px solid var(--color-ink)',
        boxShadow: '8px 8px 0px rgba(26, 26, 22, 0.05)',
        padding: '40px',
        position: 'relative'
      }}>
        {/* 装饰性角标 */}
        <div style={{ position: 'absolute', top: 4, left: 4, width: 8, height: 8, borderTop: '1px solid var(--color-ink)', borderLeft: '1px solid var(--color-ink)' }} />
        <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderTop: '1px solid var(--color-ink)', borderRight: '1px solid var(--color-ink)' }} />
        <div style={{ position: 'absolute', bottom: 4, left: 4, width: 8, height: 8, borderBottom: '1px solid var(--color-ink)', borderLeft: '1px solid var(--color-ink)' }} />
        <div style={{ position: 'absolute', bottom: 4, right: 4, width: 8, height: 8, borderBottom: '1px solid var(--color-ink)', borderRight: '1px solid var(--color-ink)' }} />

        {/* 全局参数标签页内容 */}
        {activeTab === 'general' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 48 }}>
            {/* 平台身份配置区块 */}
            <Section title={t('settings.sectionPlatformIdentity')}>
              <Field label={t('settings.labelSiteName')}>
                <input
                  value={form.siteName}
                  onChange={(e) => setForm({ ...form, siteName: e.target.value })}
                  style={inputStyle}
                />
              </Field>
              <Field label={t('settings.labelManifesto')}>
                <textarea
                  value={form.siteDescription}
                  onChange={(e) => setForm({ ...form, siteDescription: e.target.value })}
                  style={{ ...inputStyle, height: 100, resize: 'vertical' }}
                />
              </Field>
              <Field label={t('settings.labelContactEmail')}>
                <input
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  style={inputStyle}
                  type="email"
                />
              </Field>
            </Section>

            {/* 运营模块配置区块 */}
            <Section title={t('settings.sectionOperationalModules')}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <Toggle
                  label={t('settings.togglePhilanthropy')}
                  checked={form.donationEnabled}
                  onChange={(v) => setForm({ ...form, donationEnabled: v })}
                />
                <Toggle
                  label={t('settings.toggleCircularCommerce')}
                  checked={form.shopEnabled}
                  onChange={(v) => setForm({ ...form, shopEnabled: v })}
                />
                <Toggle
                  label={t('settings.togglePublicRegistration')}
                  checked={form.registrationEnabled}
                  onChange={(v) => setForm({ ...form, registrationEnabled: v })}
                />
                <Toggle
                  label={t('settings.toggleMaintenance')}
                  checked={form.maintenanceMode}
                  onChange={(v) => setForm({ ...form, maintenanceMode: v })}
                  description={t('settings.maintenanceDesc')}
                  dangerous
                />
              </div>
            </Section>
          </div>
        )}

        {/* 支付网关标签页内容 */}
        {activeTab === 'payment' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {/* 遍历所有支付渠道配置 */}
            {(['wechat', 'alipay', 'stripe', 'paypal'] as const).map((method) => {
              const paymentConfig = form.paymentMethods[method] as any;
              return (
                <div
                  key={method}
                  style={{
                    padding: '24px',
                    background: 'var(--color-aged-stock)',
                    border: '1px dashed var(--color-warm-gray)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 24
                  }}>
                    {/* 支付渠道名称（使用翻译映射表获取本地化名称） */}
                    <h3 style={{
                      fontSize: 18,
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      margin: 0
                    }}>
                      {paymentLabels[method]} {t('settings.paymentIntegration')}
                    </h3>
                    <Toggle
                      label={t('settings.toggleGatewayStatus')}
                      checked={paymentConfig.enabled}
                      onChange={(v) => setForm({
                        ...form,
                        paymentMethods: {
                          ...form.paymentMethods,
                          [method]: { ...paymentConfig, enabled: v },
                        },
                      })}
                    />
                  </div>

                  {/* 支付配置表单字段 */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 24,
                    opacity: paymentConfig.enabled ? 1 : 0.5,
                    transition: 'opacity 0.3s'
                  }}>
                    {/* AppID 字段（如果存在） */}
                    {paymentConfig.appId !== undefined && (
                      <Field label={t('settings.labelAppId')}>
                        <input
                          type="password"
                          value={paymentConfig.appId || ''}
                          onChange={(e) => setForm({
                            ...form,
                            paymentMethods: {
                              ...form.paymentMethods,
                              [method]: { ...paymentConfig, appId: e.target.value },
                            },
                          })}
                          style={inputStyle}
                          placeholder={t('settings.placeholderRequired')}
                        />
                      </Field>
                    )}
                    {/* 商户号字段（如果存在） */}
                    {paymentConfig.merchantId !== undefined && (
                      <Field label={t('settings.labelMerchantId')}>
                        <input
                          type="password"
                          value={paymentConfig.merchantId || ''}
                          onChange={(e) => setForm({
                            ...form,
                            paymentMethods: {
                              ...form.paymentMethods,
                              [method]: { ...paymentConfig, merchantId: e.target.value },
                            },
                          })}
                          style={inputStyle}
                          placeholder={t('settings.placeholderRequired')}
                        />
                      </Field>
                    )}
                    {/* 公钥字段（如果存在） */}
                    {paymentConfig.publicKey !== undefined && (
                      <Field label={t('settings.labelPublicKey')}>
                        <input
                          type="password"
                          value={paymentConfig.publicKey || ''}
                          onChange={(e) => setForm({
                            ...form,
                            paymentMethods: {
                              ...form.paymentMethods,
                              [method]: { ...paymentConfig, publicKey: e.target.value },
                            },
                          })}
                          style={inputStyle}
                          placeholder={t('settings.placeholderPk')}
                        />
                      </Field>
                    )}
                    {/* Client ID 字段（如果存在） */}
                    {paymentConfig.clientId !== undefined && (
                      <Field label={t('settings.labelClientId')}>
                        <input
                          type="password"
                          value={paymentConfig.clientId || ''}
                          onChange={(e) => setForm({
                            ...form,
                            paymentMethods: {
                              ...form.paymentMethods,
                              [method]: { ...paymentConfig, clientId: e.target.value },
                            },
                          })}
                          style={inputStyle}
                          placeholder={t('settings.placeholderRequired')}
                        />
                      </Field>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 安全设置标签页内容 */}
        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            {/* 系统锁定提示框 */}
            <div style={{
              padding: '20px',
              background: 'var(--color-ink)',
              color: 'var(--color-paper)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              lineHeight: 1.6,
              borderLeft: '4px solid var(--color-rust)'
            }}>
              <span style={{
                color: 'var(--color-rust)',
                fontWeight: 'bold',
                marginRight: '8px'
              }}>
                {t('settings.securityLockLabel')}
              </span>
              {t('settings.securityLockDesc')}
            </div>

            {/* 认证生命周期配置区块 */}
            <Section title={t('settings.sectionAuthLifecycles')}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <Field label={t('settings.labelAccessTokenValidity')}>
                  <input
                    value={t('settings.token15Min')}
                    disabled
                    style={readonlyInputStyle}
                  />
                </Field>
                <Field label={t('settings.labelRefreshTokenValidity')}>
                  <input
                    value={t('settings.token7Days')}
                    disabled
                    style={readonlyInputStyle}
                  />
                </Field>
              </div>
            </Section>

            {/* 频率限制配置区块 */}
            <Section title={t('settings.sectionRateLimiting')}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <Field label={t('settings.labelGlobalThreshold')}>
                  <input
                    value={t('settings.thresholdGlobal')}
                    disabled
                    style={readonlyInputStyle}
                  />
                </Field>
                <Field label={t('settings.labelPerUserThreshold')}>
                  <input
                    value={t('settings.thresholdPerUser')}
                    disabled
                    style={readonlyInputStyle}
                  />
                </Field>
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 配置区块组件
 * 用于分组显示相关的配置字段
 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 style={{
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        color: 'var(--color-sepia-mid)',
        marginBottom: 20,
        paddingBottom: 8,
        borderBottom: '1px solid var(--color-warm-gray)',
        fontFamily: 'var(--font-body)',
        fontWeight: 700
      }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {children}
      </div>
    </div>
  );
}

/**
 * 字段标签组件
 * 包装表单输入元素及其标签
 */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontWeight: 600,
        marginBottom: 8,
        color: 'var(--color-ink)'
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

/**
 * 开关切换组件
 * 用于布尔值配置项
 */
function Toggle({
  label,
  checked,
  onChange,
  description,
  dangerous
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
  dangerous?: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      padding: '16px',
      border: '1px solid var(--color-warm-gray)',
      backgroundColor: dangerous && checked ? 'var(--color-danger-light)' : 'transparent',
      transition: 'background-color 0.3s'
    }}>
      <div>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: dangerous && checked ? 'var(--color-danger)' : 'var(--color-ink)'
        }}>
          {label}
        </div>
        {description && (
          <div style={{
            fontSize: 11,
            color: dangerous && checked ? 'var(--color-danger)' : 'var(--color-sepia-mid)',
            marginTop: 4
          }}>
            {description}
          </div>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 48,
          height: 24,
          borderRadius: 0,
          background: checked ? (dangerous ? 'var(--color-danger)' : 'var(--color-ink)') : 'transparent',
          border: `1px solid ${checked ? (dangerous ? 'var(--color-danger)' : 'var(--color-ink)') : 'var(--color-warm-gray)'}`,
          position: 'relative',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          padding: 0,
          marginTop: 2
        }}
        aria-label={label}
      >
        <span style={{
          width: 16,
          height: 16,
          background: checked ? 'var(--color-paper)' : 'var(--color-warm-gray)',
          position: 'absolute',
          top: 3,
          left: checked ? 27 : 3,
          transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </button>
    </div>
  );
}

/**
 * 标准输入框样式
 */
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  border: '1px solid var(--color-ink)',
  backgroundColor: 'var(--color-paper)',
  color: 'var(--color-ink)',
  borderRadius: '0px',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-mono)',
  transition: 'all 0.2s',
};

/**
 * 只读输入框样式（用于安全设置中的只读字段）
 */
const readonlyInputStyle: React.CSSProperties = {
  ...inputStyle,
  backgroundColor: 'var(--color-aged-stock)',
  color: 'var(--color-sepia-mid)',
  border: '1px solid var(--color-warm-gray)',
  cursor: 'not-allowed',
};
