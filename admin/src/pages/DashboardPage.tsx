import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import StatusBadge from '../components/ui/StatusBadge';
import {
  fetchDashboardMetrics,
  fetchArtworks,
} from '../services/api';

export default function DashboardPage() {
  const { t } = useTranslation();

  const metricsQuery = useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: fetchDashboardMetrics,
  });

  const artworksQuery = useQuery({
    queryKey: ['dashboardArtworks'],
    queryFn: () =>
      fetchArtworks({ pageSize: 4, sortBy: 'created_at', sortOrder: 'desc' }),
  });

  const metrics = metricsQuery.data;
  const artworks = artworksQuery.data?.data ?? [];
  const loading = metricsQuery.isLoading || artworksQuery.isLoading;
  const error = metricsQuery.isError || artworksQuery.isError;

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
            fontFamily: 'var(--font-body)',
            fontSize: '42px',
            fontWeight: 600,
            margin: 0,
            color: 'var(--color-text)',
            letterSpacing: '-0.02em'
          }}>
            {t('dashboard.title')}
            <span style={{ color: 'var(--color-text-2)', fontStyle: 'normal', fontSize: '24px' }}>
              {' / '}
              {t('dashboard.titleItalic')}
            </span>
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            marginTop: '8px',
            color: 'var(--color-text-2)'
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
          {
            label: t('dashboard.metricDonations'),
            value: metrics
              ? `¥ ${metrics.totalDonationAmount.toLocaleString()}`
              : '—',
            color: 'var(--color-success)',
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            ),
          },
          {
            label: t('dashboard.metricPending'),
            value: metrics ? String(metrics.pendingArtworks) : '—',
            color: 'var(--color-warning)',
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            ),
          },
          {
            label: t('dashboard.metricOrders'),
            value: metrics ? String(metrics.activeCampaigns) : '—',
            color: 'var(--color-info)',
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            ),
          },
          {
            label: t('dashboard.metricUsers'),
            value: metrics ? String(metrics.totalUsers) : '—',
            color: 'var(--color-accent-2)',
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            ),
          },
          {
            label: t('dashboard.metricTotalWorks'),
            value: metrics ? String(metrics.totalArtworks) : '—',
            color: 'var(--color-text-2)',
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
              </svg>
            ),
          },
        ].map((metric, i) => (
          <div key={i} style={{
            padding: '28px 24px',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              color: metric.color,
              opacity: 0.6,
            }}>{metric.icon}</div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: 'var(--color-text-2)',
              marginBottom: '10px'
            }}>
              {metric.label}
            </div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: '32px',
              fontWeight: 700,
              color: 'var(--color-text)',
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
          borderRadius: '8px',
          background: 'var(--color-surface)'
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
                fontFamily: 'var(--font-body)',
                fontSize: '18px',
                fontStyle: 'italic',
                color: 'var(--color-text-2)'
              }}>
                {t('dashboard.sectionArtworksLabel')}
              </span>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-text)'
              }}>
                {t('dashboard.sectionArtworksTitle')}
              </span>
            </div>
            <a href="/artworks" style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--color-text-2)',
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
                color: 'var(--color-accent-2)',
                fontFamily: 'var(--font-body)',
                fontSize: '14px'
              }}>
                {t('dashboard.fetchError')}
              </div>
            ) : loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-2)' }}>...</div>
            ) : artworks.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-2)' }}>
                {t('common.noData')}
              </div>
            ) : (
              artworks.map((artwork) => (
                <div key={artwork.id} style={{
                  padding: '16px 30px',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-elevated)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    <img src={artwork.imageUrl || `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none"><rect width="48" height="48" fill="#1A1A1A"/><text x="24" y="28" text-anchor="middle" fill="#666666" font-size="10">No Image</text></svg>')}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                      color: 'var(--color-text-2)',
                      marginTop: '3px'
                    }}>
                      {artwork.childName} · {artwork.category}
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
          borderRadius: '8px',
          background: 'var(--color-surface)',
          padding: '30px'
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '25px' }}>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: '18px',
              fontStyle: 'italic',
              color: 'var(--color-text-2)'
            }}>
              {t('dashboard.sectionFinancialsLabel')}
            </span>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--color-text)'
            }}>
              {t('dashboard.sectionFinancialsTitle')}
            </span>
          </div>

          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            lineHeight: 1.9,
            color: 'var(--color-text-2)',
            fontStyle: 'italic'
          }}>
            &ldquo;{t('dashboard.transparencyQuote')}&rdquo;
          </div>

          <div style={{ marginTop: '30px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-text-2)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '8px'
            }}>
              {t('donation.anonLabel')} / {t('donation.authOkLabel')}
            </div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              color: 'var(--color-text-2)'
            }}>
              {t('donation.summaryVerifiedSuccess')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
