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
      toast.success('Configuration Saved');
    },
  });

  if (!form) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px', color: 'var(--color-sepia-mid)' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.2em', animation: 'pulse 2s infinite' }}>
        Loading System Configuration...
      </div>
    </div>
  );

  const handleSave = () => {
    updateMutation.mutate(form);
  };

  const tabs = [
    { key: 'general', label: 'Global Parameters' },
    { key: 'payment', label: 'Financial Gateways' },
    { key: 'security', label: 'Security & Constraints' },
  ];

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, fontFamily: 'var(--font-serif)' }}>System Configuration</h1>
          <p style={{ fontSize: 14, color: 'var(--color-sepia-mid)', maxWidth: '600px', lineHeight: 1.6 }}>
            Core parameters governing the VICOO platform's operational state, financial routing, and security protocols. Modifying these values may instantly affect active user sessions.
          </p>
        </div>
        <Button 
          variant="primary" 
          loading={updateMutation.isPending} 
          onClick={handleSave}
          style={{ minWidth: '160px' }}
        >
          Commit Changes
        </Button>
      </div>

      {/* Editorial Tabs */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 32,
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

      <div style={{
        background: 'var(--color-paper)', 
        border: '1px solid var(--color-ink)',
        boxShadow: '8px 8px 0px rgba(26, 26, 22, 0.05)',
        padding: '40px',
        position: 'relative'
      }}>
        {/* Decorative corner accents */}
        <div style={{ position: 'absolute', top: 4, left: 4, width: 8, height: 8, borderTop: '1px solid var(--color-ink)', borderLeft: '1px solid var(--color-ink)' }} />
        <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderTop: '1px solid var(--color-ink)', borderRight: '1px solid var(--color-ink)' }} />
        <div style={{ position: 'absolute', bottom: 4, left: 4, width: 8, height: 8, borderBottom: '1px solid var(--color-ink)', borderLeft: '1px solid var(--color-ink)' }} />
        <div style={{ position: 'absolute', bottom: 4, right: 4, width: 8, height: 8, borderBottom: '1px solid var(--color-ink)', borderRight: '1px solid var(--color-ink)' }} />

        {/* General Settings */}
        {activeTab === 'general' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 48 }}>
            <Section title="Platform Identity">
              <Field label="Site Name">
                <input value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} style={inputStyle} />
              </Field>
              <Field label="Manifesto / Description">
                <textarea value={form.siteDescription} onChange={(e) => setForm({ ...form, siteDescription: e.target.value })} style={{ ...inputStyle, height: 100, resize: 'vertical' }} />
              </Field>
              <Field label="Official Correspondence Email">
                <input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} style={inputStyle} type="email" />
              </Field>
            </Section>

            <Section title="Operational Modules">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <Toggle label="Philanthropy Engine" checked={form.donationEnabled} onChange={(v) => setForm({ ...form, donationEnabled: v })} />
                <Toggle label="Circular Commerce" checked={form.shopEnabled} onChange={(v) => setForm({ ...form, shopEnabled: v })} />
                <Toggle label="Public Registration" checked={form.registrationEnabled} onChange={(v) => setForm({ ...form, registrationEnabled: v })} />
                <Toggle label="Maintenance Protocol" checked={form.maintenanceMode} onChange={(v) => setForm({ ...form, maintenanceMode: v })} description="Suspends all public traffic." dangerous />
              </div>
            </Section>
          </div>
        )}

        {/* Payment Settings */}
        {activeTab === 'payment' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {(['wechat', 'alipay', 'stripe', 'paypal'] as const).map((method) => {
              const paymentConfig = form.paymentMethods[method] as any;
              return (
                <div key={method} style={{ padding: '24px', background: 'var(--color-aged-stock)', border: '1px dashed var(--color-warm-gray)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <h3 style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontStyle: 'italic', margin: 0 }}>
                      {method === 'wechat' ? 'WeChat Pay' : method === 'alipay' ? 'Alipay' : method.charAt(0).toUpperCase() + method.slice(1)} Integration
                    </h3>
                    <Toggle
                      label="Gateway Status"
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
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, opacity: paymentConfig.enabled ? 1 : 0.5, transition: 'opacity 0.3s' }}>
                    {paymentConfig.appId !== undefined && (
                      <Field label="Application Identifier (AppID)">
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
                          placeholder="Required"
                        />
                      </Field>
                    )}
                    {paymentConfig.merchantId !== undefined && (
                      <Field label="Merchant Identifier (MCHID)">
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
                          placeholder="Required"
                        />
                      </Field>
                    )}
                    {paymentConfig.publicKey !== undefined && (
                      <Field label="Public Validation Key">
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
                          placeholder="pk_..."
                        />
                      </Field>
                    )}
                    {paymentConfig.clientId !== undefined && (
                      <Field label="Client Identifier">
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
                          placeholder="Required"
                        />
                      </Field>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            <div style={{ 
              padding: '20px', 
              background: 'var(--color-ink)', 
              color: 'var(--color-paper)', 
              fontFamily: 'var(--font-mono)', 
              fontSize: '12px',
              lineHeight: 1.6,
              borderLeft: '4px solid var(--color-rust)'
            }}>
              <span style={{ color: 'var(--color-rust)', fontWeight: 'bold', marginRight: '8px' }}>[SYSTEM_LOCK]</span>
              Cryptographic and fundamental security parameters are hardcoded within the backend deployment environment variables for compliance reasons. The following values are read-only reflections of the current server state.
            </div>

            <Section title="Authentication Lifecycles">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <Field label="Access Token Validity">
                  <input value="15 Minutes" disabled style={readonlyInputStyle} />
                </Field>
                <Field label="Refresh Token Validity">
                  <input value="7 Days" disabled style={readonlyInputStyle} />
                </Field>
              </div>
            </Section>

            <Section title="Rate Limiting (Throttle Controls)">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <Field label="Global Threshold">
                  <input value="1000 Queries / Second" disabled style={readonlyInputStyle} />
                </Field>
                <Field label="Per-User Threshold">
                  <input value="60 Queries / Minute" disabled style={readonlyInputStyle} />
                </Field>
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

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

function Toggle({ label, checked, onChange, description, dangerous }: { label: string; checked: boolean; onChange: (v: boolean) => void; description?: string, dangerous?: boolean }) {
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
        <div style={{ fontSize: 13, fontWeight: 600, color: dangerous && checked ? 'var(--color-danger)' : 'var(--color-ink)' }}>{label}</div>
        {description && <div style={{ fontSize: 11, color: dangerous && checked ? 'var(--color-danger)' : 'var(--color-sepia-mid)', marginTop: 4 }}>{description}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 48, height: 24, 
          borderRadius: 0, // Hard edges for editorial style
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
          width: 16, height: 16, 
          background: checked ? 'var(--color-paper)' : 'var(--color-warm-gray)',
          position: 'absolute', top: 3,
          left: checked ? 27 : 3,
          transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </button>
    </div>
  );
}

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

const readonlyInputStyle: React.CSSProperties = {
  ...inputStyle,
  backgroundColor: 'var(--color-aged-stock)',
  color: 'var(--color-sepia-mid)',
  border: '1px solid var(--color-warm-gray)',
  cursor: 'not-allowed',
};
