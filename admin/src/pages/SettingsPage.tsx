/**
 * 系统设置页面 (Settings Page)
 *
 * 功能说明：
 * - 展示和编辑系统全局配置参数
 * - 支持四个配置标签页：全局参数、支付网关、安全设置、系统状态
 * - 提供各支付渠道的集成配置（微信、支付宝、Stripe、PayPal）
 * - 安全配置可编辑（令牌有效期、频率限制等）
 * - 实时保存配置更新
 * - 系统状态监控（健康检查）
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
import { fetchSystemSettings, updateSystemSettings, fetchSystemHealth } from '../services/api';

// 导入系统设置类型定义
import type { SystemSettings, SystemHealth } from '../types';

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
  const { data, isError, error } = useQuery({
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

  // 请求失败时显示明确错误，避免页面一直停在 loading。
  if (isError) {
    const message = error instanceof Error ? error.message : t('settings.loadFailed', 'Failed to load settings');
    return (
      <div style={{ maxWidth: '760px' }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 600,
          marginBottom: 8,
          fontFamily: 'var(--font-body)'
        }}>
          {t('settings.title')}
        </h1>
        <div style={{
          marginTop: 24,
          padding: 24,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-error)',
          borderRadius: 8,
          color: 'var(--color-text)'
        }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            {t('settings.loadFailed', 'Failed to load settings')}
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.6 }}>
            {message}
          </div>
        </div>
      </div>
    );
  }

  // 数据加载中显示加载状态
  if (!form) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '100px',
        color: 'var(--color-text-3)'
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
    { key: 'health', label: t('settings.tabHealth', 'System Health') },
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
            fontWeight: 600,
            marginBottom: 8,
            fontFamily: 'var(--font-body)'
          }}>
            {t('settings.title')}
          </h1>
          {/* 副标题描述 */}
          <p style={{
            fontSize: 14,
            color: 'var(--color-text-2)',
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
        borderBottom: '1px solid var(--color-border)',
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
              color: activeTab === tab.key ? 'var(--color-text)' : 'var(--color-text-2)',
              backgroundColor: activeTab === tab.key ? 'var(--color-surface)' : 'transparent',
              border: 'none',
              borderTop: activeTab === tab.key ? '1px solid var(--color-border)' : '1px solid transparent',
              borderLeft: activeTab === tab.key ? '1px solid var(--color-border)' : '1px solid transparent',
              borderRight: activeTab === tab.key ? '1px solid var(--color-border)' : '1px solid transparent',
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
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '40px',
        position: 'relative'
      }}>
        {/* 装饰性角标 */}
        <div style={{ position: 'absolute', top: 4, left: 4, width: 8, height: 8, borderTop: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }} />
        <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderTop: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)' }} />
        <div style={{ position: 'absolute', bottom: 4, left: 4, width: 8, height: 8, borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }} />
        <div style={{ position: 'absolute', bottom: 4, right: 4, width: 8, height: 8, borderBottom: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)' }} />

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
                    background: 'var(--color-elevated)',
                    border: '1px dashed var(--color-border)'
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
                      fontFamily: 'var(--font-body)',
                      fontWeight: 600,
                      fontStyle: 'normal',
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
            {/* 安全提示框 */}
            <div style={{
              padding: '20px',
              background: 'var(--color-elevated)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              lineHeight: 1.6,
              borderLeft: '4px solid var(--color-accent-2)',
              color: 'var(--color-text)'
            }}>
              <span style={{
                color: 'var(--color-accent-2)',
                fontWeight: 'bold',
                marginRight: '8px'
              }}>
                {t('settings.securityNoticeLabel', 'NOTE')}
              </span>
              {t('settings.securityNoticeDesc', 'Changes take effect immediately. Invalid values may lock out users or degrade service performance.')}
            </div>

            {/* 认证生命周期配置区块 */}
            <Section title={t('settings.sectionAuthLifecycles')}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <Field label={t('settings.labelAccessTokenValidity')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      min={1}
                      max={1440}
                      value={form.accessTokenTtlMinutes}
                      onChange={(e) => setForm({ ...form, accessTokenTtlMinutes: Math.max(1, parseInt(e.target.value) || 1) })}
                      style={inputStyle}
                    />
                    <span style={{ fontSize: 11, color: 'var(--color-text-3)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                      {t('settings.unitMinutes', 'minutes')}
                    </span>
                  </div>
                </Field>
                <Field label={t('settings.labelRefreshTokenValidity')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={form.refreshTokenTtlDays}
                      onChange={(e) => setForm({ ...form, refreshTokenTtlDays: Math.max(1, parseInt(e.target.value) || 1) })}
                      style={inputStyle}
                    />
                    <span style={{ fontSize: 11, color: 'var(--color-text-3)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                      {t('settings.unitDays', 'days')}
                    </span>
                  </div>
                </Field>
              </div>
            </Section>

            {/* 频率限制配置区块 */}
            <Section title={t('settings.sectionRateLimiting')}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <Field label={t('settings.labelGlobalThreshold')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      min={1}
                      max={100000}
                      value={form.globalRateLimit}
                      onChange={(e) => setForm({ ...form, globalRateLimit: Math.max(1, parseInt(e.target.value) || 1) })}
                      style={inputStyle}
                    />
                    <span style={{ fontSize: 11, color: 'var(--color-text-3)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                      {t('settings.unitReqPerSec', 'req/s')}
                    </span>
                  </div>
                </Field>
                <Field label={t('settings.labelPerUserThreshold')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={form.perUserRateLimit}
                      onChange={(e) => setForm({ ...form, perUserRateLimit: Math.max(1, parseInt(e.target.value) || 1) })}
                      style={inputStyle}
                    />
                    <span style={{ fontSize: 11, color: 'var(--color-text-3)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                      {t('settings.unitReqPerMin', 'req/min')}
                    </span>
                  </div>
                </Field>
              </div>
            </Section>
          </div>
        )}

        {/* 系统状态标签页内容 */}
        {activeTab === 'health' && <SystemHealthCard />}
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
        color: 'var(--color-text-3)',
        marginBottom: 20,
        paddingBottom: 8,
        borderBottom: '1px solid var(--color-border)',
        fontFamily: 'var(--font-body)',
        fontWeight: 600
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
        color: 'var(--color-text)'
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
      border: '1px solid var(--color-border)',
      backgroundColor: dangerous && checked ? 'var(--color-error-bg)' : 'transparent',
      transition: 'background-color 0.3s'
    }}>
      <div>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: dangerous && checked ? 'var(--color-danger)' : 'var(--color-text)'
        }}>
          {label}
        </div>
        {description && (
          <div style={{
            fontSize: 11,
            color: dangerous && checked ? 'var(--color-danger)' : 'var(--color-text-3)',
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
          borderRadius: '6px',
          background: checked ? (dangerous ? 'var(--color-danger)' : 'var(--color-text)') : 'transparent',
          border: `1px solid ${checked ? (dangerous ? 'var(--color-danger)' : 'var(--color-text)') : 'var(--color-border)'}`,
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
          background: checked ? 'var(--color-bg)' : 'var(--color-text-3)',
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
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text)',
  borderRadius: '6px',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-mono)',
  transition: 'all 0.2s',
};

// ---------------------------------------------------------------------------
// System Health Card Component
// ---------------------------------------------------------------------------

function SystemHealthCard() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const queryClient = useQueryClient();

  const { data: health, isLoading, isError, dataUpdatedAt } = useQuery({
    queryKey: ['system-health'],
    queryFn: fetchSystemHealth,
    staleTime: 7200000,
    refetchInterval: 7200000,  // 2 hours
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['system-health'] });
    toast.success(t('settings.healthRefreshed'));
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return '#10b981';
      case 'degraded':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusBg = (status: string): string => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return 'rgba(16, 185, 129, 0.1)';
      case 'degraded':
        return 'rgba(245, 158, 11, 0.1)';
      case 'error':
        return 'rgba(239, 68, 68, 0.1)';
      default:
        return 'rgba(107, 114, 128, 0.1)';
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatLatency = (ms: number | null | undefined): string => {
    if (ms === null || ms === undefined) return '--';
    return `${ms}ms`;
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 40px',
        gap: '16px',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid var(--color-border)',
          borderTopColor: 'var(--color-text)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--color-text-3)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          {t('settings.healthChecking')}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{
        padding: '24px',
        background: 'rgba(239, 68, 68, 0.05)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div>
          <div style={{ fontWeight: 600, color: '#ef4444', marginBottom: '4px' }}>
            {t('settings.healthError')}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-2)' }}>
            {t('settings.healthErrorHint')}
          </div>
        </div>
      </div>
    );
  }

  // Build checks from health data
  const checks = health?.checks ?? [];
  const dbCheck = checks.find(c => c.name.includes('MySQL') || c.name.includes('Database'));
  const redisCheck = checks.find(c => c.name.includes('Redis') || c.name.includes('Cache'));
  const backendCheck = checks.find(c => c.name.includes('Backend') || c.name.includes('API'));

  // Reliability metrics calculation
  const totalChecks = checks.length;
  const healthyCount = checks.filter(c => c.status === 'connected' || c.status === 'healthy').length;
  const reliabilityPct = totalChecks > 0 ? Math.round((healthyCount / totalChecks) * 100) : 0;

  // Service grid data from checks
  const serviceItems = [
    {
      name: 'Backend API',
      icon: 'backend',
      status: health?.backend?.status ?? 'degraded',
      latency: health?.backend?.responseTimeMs,
      version: health?.backend?.version ?? health?.version,
    },
    {
      name: isZh ? 'MySQL 数据库' : 'MySQL Database',
      icon: 'database',
      status: dbCheck?.status ?? 'error',
      latency: dbCheck?.latencyMs,
      version: dbCheck?.version ?? null,
    },
    {
      name: isZh ? 'Redis 缓存' : 'Redis Cache',
      icon: 'redis',
      status: redisCheck?.status ?? 'error',
      latency: redisCheck?.latencyMs,
      version: redisCheck?.version ?? null,
    },
    {
      name: isZh ? 'Docker 容器' : 'Docker Compose',
      icon: 'docker',
      status: 'connected',
      latency: null,
      version: null,
    },
  ];

  // Status icon SVG
  const StatusIcon = ({ status }: { status: string }) => {
    const color = getStatusColor(status);
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {status === 'connected' || status === 'healthy' ? (
          <path d="M20 6L9 17l-5-5" />
        ) : status === 'degraded' ? (
          <>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </>
        ) : (
          <>
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </>
        )}
      </svg>
    );
  };

  // Service icon SVG
  const ServiceIcon = ({ name }: { name: string }) => {
    const iconColor = 'var(--color-text-2)';
    if (name.includes('Backend')) {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    }
    if (name.includes('MySQL') || name.includes('Database') || name.includes('数据')) {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      );
    }
    if (name.includes('Redis') || name.includes('Cache') || name.includes('缓存')) {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
          <line x1="12" y1="22" x2="12" y2="15.5" />
          <polyline points="22 8.5 12 15.5 2 8.5" />
          <polyline points="2 15.5 12 8.5 22 15.5" />
          <line x1="12" y1="2" x2="12" y2="8.5" />
        </svg>
      );
    }
    // Docker icon
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12.5v-5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v5c0 1.5.5 3 2 4.5M22 12.5a2.5 2.5 0 0 1-5 0c0-1.5-.5-3-2-4.5" />
        <path d="M6 7.5V5a2 2 0 0 0-2-2h12a2 2 0 0 0-2 2v2.5" />
        <rect x="8" y="12" width="8" height="6" rx="1" />
      </svg>
    );
  };

  const lastChecked = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : (health?.checkedAt ? new Date(health.checkedAt).toLocaleTimeString() : '--:--:--');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Health Overview */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Status indicator */}
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: getStatusBg(health?.status ?? 'unhealthy'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <StatusIcon status={health?.status ?? 'unhealthy'} />
          </div>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '6px',
            }}>
              <span style={{
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--color-text)',
                textTransform: 'capitalize',
              }}>
                {health?.status ?? 'unhealthy'}
              </span>
              {health?.environment && (
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: health.environment === 'production'
                    ? 'rgba(239, 68, 68, 0.1)'
                    : 'rgba(16, 185, 129, 0.1)',
                  color: health.environment === 'production'
                    ? '#ef4444'
                    : '#10b981',
                }}>
                  {health.environment}
                </span>
              )}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-text-3)',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: 'var(--color-text-2)' }}>v</span>{health?.version ?? '1.0.0'}
              </span>
              {health?.uptimeSeconds && (
                <>
                  <span style={{ opacity: 0.4 }}>|</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {formatUptime(health.uptimeSeconds)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--color-text-3)',
            textTransform: 'uppercase',
          }}>
            {t('settings.healthUpdated')} {lastChecked}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            style={{ minWidth: '90px' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {t('settings.btnRefresh')}
          </Button>
        </div>
      </div>

      {/* Service Status Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px',
      }}>
        {serviceItems.map((service) => (
          <div
            key={service.name}
            style={{
              padding: '14px 16px',
              background: 'var(--color-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: getStatusBg(service.status),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ServiceIcon name={service.name} />
              </div>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                color: 'var(--color-text)',
              }}>
                {service.name}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {service.latency !== null && (
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'var(--color-text-3)',
                }}>
                  {formatLatency(service.latency)}
                </span>
              )}
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 8px',
                borderRadius: '5px',
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'capitalize',
                fontFamily: 'var(--font-mono)',
                backgroundColor: getStatusBg(service.status),
                color: getStatusColor(service.status),
              }}>
                <StatusIcon status={service.status} />
                {service.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Runtime Summary Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
      }}>
        {[
          { label: t('settings.healthService'), value: health?.backend?.service ?? 'FastAPI' },
          { label: t('settings.healthRuntime'), value: health?.backend?.runtime ?? 'Uvicorn' },
          { label: t('settings.healthEngine'), value: health?.database?.engine ?? 'MySQL' },
          { label: t('settings.healthVersion'), value: health?.database?.version ?? '--' },
        ].map((item) => (
          <div key={item.label} style={{
            padding: '12px 16px',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '9px',
              color: 'var(--color-text-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '4px',
            }}>
              {item.label}
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-text)',
              fontFamily: 'var(--font-mono)',
            }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Mini Reliability Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '16px',
      }}>
        {/* Availability metric */}
        <div style={{
          padding: '16px 20px',
          background: 'var(--color-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: reliabilityPct >= 90 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={reliabilityPct >= 90 ? '#10b981' : '#f59e0b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <div style={{
              fontSize: '10px',
              color: 'var(--color-text-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '4px',
            }}>
              {t('settings.healthAvailability')}
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: reliabilityPct >= 90 ? '#10b981' : '#f59e0b',
            }}>
              {reliabilityPct}%
            </div>
          </div>
        </div>

        {/* Recent checks summary */}
        <div style={{
          padding: '16px 20px',
          background: 'var(--color-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: '10px',
        }}>
          <div style={{
            fontSize: '10px',
            color: 'var(--color-text-3)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '12px',
          }}>
            {t('settings.healthRecentChecks')}
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            {checks.slice(0, 4).map((check, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <StatusIcon status={check.status} />
                <span style={{
                  fontSize: '11px',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {check.name}
                </span>
                {check.latencyMs !== undefined && check.latencyMs !== null && (
                  <span style={{
                    fontSize: '9px',
                    color: 'var(--color-text-3)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {formatLatency(check.latencyMs)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deployment Info */}
      <div style={{
        padding: '16px 20px',
        background: 'var(--color-bg)',
        border: '1px dashed var(--color-border)',
        borderRadius: '10px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
      }}>
        {[
          { label: t('settings.healthDeploymentMode'), value: health?.deployment?.mode ?? 'Docker Compose' },
          { label: t('settings.healthPublicHealth'), value: health?.deployment?.publicHealth ?? '/health' },
          { label: t('settings.healthAdminEndpoint'), value: health?.deployment?.adminHealth ?? '/api/v1/system/health' },
        ].map((item) => (
          <div key={item.label} style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '9px',
              color: 'var(--color-text-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '4px',
            }}>
              {item.label}
            </div>
            <div style={{
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--color-text)',
              fontFamily: 'var(--font-mono)',
            }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Auto-refresh indicator */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
        fontSize: '10px',
        color: 'var(--color-text-3)',
        fontFamily: 'var(--font-mono)',
      }}>
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: '#10b981',
          animation: 'pulse 2s infinite',
        }} />
        {t('settings.healthAutoRefresh')}
      </div>
    </div>
  );
}
