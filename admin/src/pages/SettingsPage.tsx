/**
 * System Settings Page
 *
 * Features:
 * - Display and edit global system configuration parameters
 * - Three config tabs: global parameters, payment gateway, security settings
 * - Payment channel integration config (WeChat, Alipay, Stripe, PayPal)
 * - Editable security settings (token expiry, rate limiting, etc.)
 * - Real-time config save
 *
 * Usage:
 * Super admin configures and adjusts core platform operational parameters
 */

import { useState, useEffect } from 'react';


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import { useTranslation } from 'react-i18next';
import { fetchSystemSettings, updateSystemSettings } from '../services/api';
import type { SystemSettings, PaymentMethodConfig } from '../types';

export default function SettingsPage() {
  const { t } = useTranslation();

  // React Query for data fetching and caching
  const queryClient = useQueryClient();

  const [form, setForm] = useState<SystemSettings | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  const { data, isError: settingsError } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSystemSettings
  });

  useEffect(() => {
    if (data) {
      setForm(structuredClone(data));
    }
  }, [data]);

  /**
   * Update config mutation — refreshes data and shows toast on success
   */
  const updateMutation = useMutation({
    mutationFn: updateSystemSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success(t('settings.toastSaved'));
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.detail ?? t('generic.error'));
    },
  });

  if (settingsError) {
    return (
      <div style={{ padding: 16, background: 'var(--color-danger-bg, #fef2f2)', border: '1px solid var(--color-danger-border, #fecaca)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'var(--color-danger, #dc2626)', fontSize: 14 }}>{t('generic.error')}</span>
        <button onClick={() => queryClient.invalidateQueries({ queryKey: ['settings'] })} style={{ padding: '4px 12px', fontSize: 13, cursor: 'pointer', border: '1px solid var(--color-border)', borderRadius: 4, background: 'transparent' }}>{t('generic.retry', 'Retry')}</button>
      </div>
    );
  }

  // Show loading state while data is being fetched
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

  // Save config handler
  const handleSave = () => {
    if (!form.siteName?.trim()) {
      toast.error(t('settings.errorSiteName', 'Site name is required'));
      return;
    }
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      toast.error(t('settings.errorInvalidEmail', 'Invalid email format'));
      return;
    }
    updateMutation.mutate(form);
  };

  /** Payment channel name mapping — maps method keys to i18n keys */
  const paymentLabels: Record<string, string> = {
    wechat: t('settings.paymentWechat'),
    alipay: t('settings.paymentAlipay'),
    stripe: t('settings.paymentStripe'),
    paypal: t('settings.paymentPaypal'),
  };

  /** Tab configuration */
  const tabs = [
    { key: 'general', label: t('settings.tabGeneral') },
    { key: 'payment', label: t('settings.tabPayment') },
    { key: 'security', label: t('settings.tabSecurity') },
  ];

  return (
    <div style={{ maxWidth: '1000px' }}>
      {/* Page title and save button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 40
      }}>
        <div>
          {/* Main title */}
          <h1 style={{
            fontSize: 28,
            fontWeight: 600,
            marginBottom: 8,
            fontFamily: 'var(--font-body)'
          }}>
            {t('settings.title')}
          </h1>
          {/* Subtitle */}
          <p style={{
            fontSize: 14,
            color: 'var(--color-text-2)',
            maxWidth: '600px',
            lineHeight: 1.6
          }}>
            {t('settings.description')}
          </p>
        </div>
        {/* Save button */}
        <Button
          variant="primary"
          loading={updateMutation.isPending}
          onClick={handleSave}
          style={{ minWidth: '160px' }}
        >
          {t('settings.btnCommit')}
        </Button>
      </div>

      {/* Tab switcher */}
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

      {/* Config card area */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '40px',
        position: 'relative'
      }}>
        {/* Decorative corner accent */}
        <div style={{ position: 'absolute', top: 4, left: 4, width: 8, height: 8, borderTop: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }} />
        <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderTop: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)' }} />
        <div style={{ position: 'absolute', bottom: 4, left: 4, width: 8, height: 8, borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }} />
        <div style={{ position: 'absolute', bottom: 4, right: 4, width: 8, height: 8, borderBottom: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)' }} />

        {/* General tab content */}
        {activeTab === 'general' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 48 }}>
            {/* Platform identity section */}
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

            {/* Operations module section */}
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

        {/* Payment gateway tab content */}
        {activeTab === 'payment' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {/* Iterate payment channel configs */}
            {(['wechat', 'alipay', 'stripe', 'paypal'] as const).map((method) => {
              const paymentConfig: PaymentMethodConfig = form.paymentMethods[method];
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
                    {/* Payment channel name (localized via mapping) */}
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

                  {/* Payment config form fields */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 24,
                    opacity: paymentConfig.enabled ? 1 : 0.5,
                    transition: 'opacity 0.3s'
                  }}>
                    {/* AppID field (if present) */}
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
                    {/* Merchant ID field (if present) */}
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
                    {/* Public key field (if present) */}
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
                    {/* Client ID field (if present) */}
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

        {/* Security tab content */}
        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            {/* Security notice */}
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

            {/* Auth lifecycle config section */}
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

            {/* Rate limiting config section */}
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
      </div>
    </div>
  );
}

/**
 * Configuration section component
 * Groups related config fields together
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
 * Field label component
 * Wraps a form input element with its label
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
 * Toggle switch component
 * For boolean configuration options
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
 * Standard input field style
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
