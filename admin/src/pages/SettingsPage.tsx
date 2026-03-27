import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import { fetchSystemSettings, updateSystemSettings } from '../services/api';
import type { SystemSettings } from '../types';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SystemSettings | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  const { data } = useQuery({ queryKey: ['settings'], queryFn: fetchSystemSettings });

  useEffect(() => {
    if (data) setForm(JSON.parse(JSON.stringify(data)));
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: updateSystemSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('设置已保存');
    },
  });

  if (!form) return <div>加载中...</div>;

  const handleSave = () => {
    updateMutation.mutate(form);
  };

  const tabs = [
    { key: 'general', label: '基本设置' },
    { key: 'payment', label: '支付配置' },
    { key: 'security', label: '安全设置' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>系统设置</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            管理平台配置与 API 密钥
          </p>
        </div>
        <Button variant="primary" loading={updateMutation.isPending} onClick={handleSave}>
          保存设置
        </Button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 24,
        borderBottom: '2px solid var(--color-border)',
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px', fontSize: 13, fontWeight: 500,
              color: activeTab === tab.key ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === tab.key ? '2px solid var(--color-accent)' : '2px solid transparent',
              marginBottom: activeTab === tab.key ? -2 : 0,
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div style={{
          background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)', padding: 24,
        }}>
          <Section title="站点信息">
            <Field label="站点名称">
              <input value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="站点描述">
              <textarea value={form.siteDescription} onChange={(e) => setForm({ ...form, siteDescription: e.target.value })} style={{ ...inputStyle, height: 80 }} />
            </Field>
            <Field label="联系邮箱">
              <input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} style={inputStyle} type="email" />
            </Field>
          </Section>

          <Section title="功能开关">
            <Toggle label="捐赠功能" checked={form.donationEnabled} onChange={(v) => setForm({ ...form, donationEnabled: v })} />
            <Toggle label="商城功能" checked={form.shopEnabled} onChange={(v) => setForm({ ...form, shopEnabled: v })} />
            <Toggle label="用户注册" checked={form.registrationEnabled} onChange={(v) => setForm({ ...form, registrationEnabled: v })} />
            <Toggle label="维护模式" checked={form.maintenanceMode} onChange={(v) => setForm({ ...form, maintenanceMode: v })} description="开启后前台将显示维护页面" />
          </Section>
        </div>
      )}

      {/* Payment Settings */}
      {activeTab === 'payment' && (
        <div style={{
          background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)', padding: 24,
        }}>
          {(['wechat', 'alipay', 'stripe', 'paypal'] as const).map((method) => (
            <Section key={method} title={method === 'wechat' ? '微信支付' : method === 'alipay' ? '支付宝' : method.charAt(0).toUpperCase() + method.slice(1)}>
              <Toggle
                label="启用"
                checked={form.paymentMethods[method].enabled}
                onChange={(v) => setForm({
                  ...form,
                  paymentMethods: {
                    ...form.paymentMethods,
                    [method]: { ...form.paymentMethods[method], enabled: v },
                  },
                })}
              />
              {(form.paymentMethods[method] as any).appId !== undefined && (
                <Field label="App ID">
                  <input
                    type="password"
                    value={(form.paymentMethods[method] as any).appId || ''}
                    onChange={(e) => setForm({
                      ...form,
                      paymentMethods: {
                        ...form.paymentMethods,
                        [method]: { ...form.paymentMethods[method], appId: e.target.value },
                      },
                    })}
                    style={inputStyle}
                    placeholder="输入 App ID"
                  />
                </Field>
              )}
              {(form.paymentMethods[method] as any).merchantId !== undefined && (
                <Field label="Merchant ID">
                  <input
                    type="password"
                    value={(form.paymentMethods[method] as any).merchantId || ''}
                    onChange={(e) => setForm({
                      ...form,
                      paymentMethods: {
                        ...form.paymentMethods,
                        [method]: { ...form.paymentMethods[method], merchantId: e.target.value },
                      },
                    })}
                    style={inputStyle}
                    placeholder="输入 Merchant ID"
                  />
                </Field>
              )}
              {(form.paymentMethods[method] as any).publicKey !== undefined && (
                <Field label="Public Key">
                  <input
                    type="password"
                    value={(form.paymentMethods[method] as any).publicKey || ''}
                    onChange={(e) => setForm({
                      ...form,
                      paymentMethods: {
                        ...form.paymentMethods,
                        [method]: { ...form.paymentMethods[method], publicKey: e.target.value },
                      },
                    })}
                    style={inputStyle}
                    placeholder="pk_test_..."
                  />
                </Field>
              )}
              {(form.paymentMethods[method] as any).clientId !== undefined && (
                <Field label="Client ID">
                  <input
                    type="password"
                    value={(form.paymentMethods[method] as any).clientId || ''}
                    onChange={(e) => setForm({
                      ...form,
                      paymentMethods: {
                        ...form.paymentMethods,
                        [method]: { ...form.paymentMethods[method], clientId: e.target.value },
                      },
                    })}
                    style={inputStyle}
                    placeholder="输入 Client ID"
                  />
                </Field>
              )}
            </Section>
          ))}
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div style={{
          background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)', padding: 24,
        }}>
          <Section title="认证配置">
            <Field label="Access Token 过期时间">
              <input value="15 分钟" disabled style={{ ...inputStyle, opacity: 0.6 }} />
            </Field>
            <Field label="Refresh Token 过期时间">
              <input value="7 天" disabled style={{ ...inputStyle, opacity: 0.6 }} />
            </Field>
          </Section>
          <Section title="API 安全">
            <Field label="全局限流">
              <input value="1000 QPS" disabled style={{ ...inputStyle, opacity: 0.6 }} />
            </Field>
            <Field label="用户限流">
              <input value="60 QPM" disabled style={{ ...inputStyle, opacity: 0.6 }} />
            </Field>
          </Section>
          <div style={{ padding: '12px 16px', background: 'var(--color-info-light)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: '#1e40af', marginTop: 8 }}>
            安全配置由安全工程师在代码级别设置，管理员无法在此修改。如需调整请联系技术团队。
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--color-border-light)' }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange, description }: { label: string; checked: boolean; onChange: (v: boolean) => void; description?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        {description && <div style={{ fontSize: 12, color: 'var(--color-text-light)', marginTop: 2 }}>{description}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 12,
          background: checked ? 'var(--color-accent)' : '#d1d5db',
          position: 'relative', transition: 'background 0.2s',
        }}
      >
        <span style={{
          width: 20, height: 20, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 2,
          left: checked ? 22 : 2,
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }} />
      </button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)', fontSize: 13,
  outline: 'none', boxSizing: 'border-box',
};
