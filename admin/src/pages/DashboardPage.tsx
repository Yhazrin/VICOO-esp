import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import StatusBadge from '../components/ui/StatusBadge';

const API_BASE = '/api/v1';

interface Artwork {
  id: number;
  title: string;
  artist_name: string;
  medium: string;
  status: string;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setError(null);
        const response = await fetch(`${API_BASE}/admin/artworks?limit=4&sort_by=created_at&order=desc`, { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setArtworks(data.data?.items || data.items || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(t('dashboard.fetchError'));
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [t]);

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '40px'
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '42px',
            fontStyle: 'italic',
            fontWeight: 700,
            margin: 0,
            color: 'var(--color-ink)',
            letterSpacing: '-0.02em'
          }}>
            {t('dashboard.title')}
            <span style={{ color: 'var(--color-sepia-mid)', fontStyle: 'normal', fontSize: '24px' }}>
              {' / '}
              {t('dashboard.titleItalic')}
            </span>
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            marginTop: '8px',
            color: 'var(--color-sepia-mid)'
          }}>
            {t('dashboard.issueLabel')}
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '50px'
      }}>
        {[
          { label: t('dashboard.metricTotalWorks'), value: '—', icon: '📚' },
          { label: t('dashboard.metricPending'), value: '—', icon: '⏳' },
          { label: t('dashboard.metricDonations'), value: '¥ —', icon: '💰' },
          { label: t('dashboard.metricOrders'), value: '—', icon: '📦' },
          { label: t('dashboard.metricUsers'), value: '—', icon: '👥' }
        ].map((metric, i) => (
          <div key={i} style={{
            padding: '28px 24px',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              fontSize: '22px'
            }}>{metric.icon}</div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: 'var(--color-sepia-mid)',
              marginBottom: '10px'
            }}>
              {metric.label}
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '32px',
              fontWeight: 700,
              color: 'var(--color-ink)',
              lineHeight: 1
            }}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '30px',
        alignItems: 'start'
      }}>
        <div style={{
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-card)'
        }}>
          <div style={{
            padding: '20px 30px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '18px',
                fontStyle: 'italic',
                color: 'var(--color-sepia-mid)'
              }}>
                {t('dashboard.sectionArtworksLabel')}
              </span>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-ink)'
              }}>
                {t('dashboard.sectionArtworksTitle')}
              </span>
            </div>
            <a href="/artworks" style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--color-archive-brown)',
              textDecoration: 'none',
              transition: 'opacity 0.2s'
            }}>
              {t('dashboard.accessFullArchive')}
            </a>
          </div>
          <div style={{ padding: '0' }}>
            {error ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: 'var(--color-rust)',
                fontFamily: 'var(--font-body)',
                fontSize: '14px'
              }}>
                {error}
              </div>
            ) : loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-sepia-mid)' }}>...</div>
            ) : artworks.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-sepia-mid)' }}>
                {t('common.noData')}
              </div>
            ) : (
              artworks.map((artwork: any) => (
                <div key={artwork.id} style={{
                  padding: '16px 30px',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-warm-gray)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    <img src={artwork.asset_url || '/placeholder.png'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '13px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {artwork.title}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: 'var(--color-sepia-mid)',
                      marginTop: '3px'
                    }}>
                      {artwork.artist_name} · {artwork.medium}
                    </div>
                  </div>
                  <StatusBadge status={artwork.status} />
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-card)',
          padding: '30px'
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '25px' }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              fontStyle: 'italic',
              color: 'var(--color-sepia-mid)'
            }}>
              {t('dashboard.sectionFinancialsLabel')}
            </span>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--color-ink)'
            }}>
              {t('dashboard.sectionFinancialsTitle')}
            </span>
          </div>

          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            lineHeight: 1.9,
            color: 'var(--color-archive-brown)',
            fontStyle: 'italic'
          }}>
            &ldquo;{t('dashboard.transparencyQuote')}&rdquo;
          </div>

          <div style={{ marginTop: '30px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-sepia-mid)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '8px'
            }}>
              {t('donation.anonLabel')} / {t('donation.authOkLabel')}
            </div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              color: 'var(--color-text-secondary)'
            }}>
              {t('donation.summaryVerifiedSuccess')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
