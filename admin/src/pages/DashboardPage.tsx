import { useQuery } from '@tanstack/react-query';
import StatusBadge from '../components/ui/StatusBadge';
import {
  fetchDashboardMetrics, fetchDonationTrend, fetchArtworkByCategory,
  fetchArtworks, fetchDonations,
} from '../services/api';
import dayjs from 'dayjs';

export default function DashboardPage() {
  const { data: metrics } = useQuery({ queryKey: ['metrics'], queryFn: fetchDashboardMetrics });
  const { data: recentArtworks } = useQuery({
    queryKey: ['recentArtworks'],
    queryFn: () => fetchArtworks({ page: 1, pageSize: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
  });
  const { data: recentDonations } = useQuery({
    queryKey: ['recentDonations'],
    queryFn: () => fetchDonations({ page: 1, pageSize: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
  });

  return (
    <div style={{ maxWidth: '1200px' }}>
      {/* Editorial Header */}
      <div style={{ marginBottom: '60px' }}>
        <div style={{ 
          fontSize: '12px', 
          fontFamily: 'var(--font-body)', 
          textTransform: 'uppercase', 
          letterSpacing: '0.3em',
          color: 'var(--color-sepia-mid)',
          marginBottom: '12px'
        }}>
          Authorized Access — Issue No. 01
        </div>
        <h1 style={{ 
          fontSize: 'var(--text-h1)', 
          fontFamily: 'var(--font-display)', 
          lineHeight: 1,
          margin: '0 0 20px 0'
        }}>
          The Archive <span style={{ fontStyle: 'italic', fontWeight: 400 }}>Overview</span>
        </h1>
        <div className="divider-heavy" />
      </div>

      {/* Metrics Row - Typographic Focus */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '40px',
        marginBottom: '80px',
      }}>
        {[
          { label: 'Total Works', value: metrics?.totalArtworks || 0, sub: `Pending: ${metrics?.pendingArtworks || 0}` },
          { label: 'Donations', value: `¥${(metrics?.totalDonationAmount || 0).toLocaleString()}`, sub: `${metrics?.totalDonations || 0} Records` },
          { label: 'Orders', value: metrics?.totalOrders || 0, sub: 'Active Fulfillment' },
          { label: 'Authorized Users', value: metrics?.totalUsers || 0, sub: 'Community Growth' },
        ].map((stat, idx) => (
          <div key={idx} style={{ borderLeft: '1px solid var(--color-ink)', paddingLeft: '20px' }}>
            <div style={{ 
              fontSize: '10px', 
              fontFamily: 'var(--font-body)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.15em',
              color: 'var(--color-sepia-mid)',
              marginBottom: '10px'
            }}>
              {stat.label}
            </div>
            <div style={{ 
              fontSize: '32px', 
              fontFamily: 'var(--font-display)', 
              fontWeight: 700,
              color: 'var(--color-ink)',
              lineHeight: 1
            }}>
              {stat.value}
            </div>
            <div style={{ 
              fontSize: '11px', 
              fontFamily: 'var(--font-body)', 
              marginTop: '8px',
              color: 'var(--color-archive-brown)'
            }}>
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Split: Asymmetrical Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '7fr 4fr',
        gap: '80px',
      }}>
        {/* Left Column: Recent Artworks Gallery Style */}
        <div>
          <h2 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '24px', 
            fontStyle: 'italic',
            marginBottom: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <span style={{ fontSize: '14px', fontStyle: 'normal', color: 'var(--color-sepia-mid)' }}>01 —</span>
            Curated Artworks
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {(recentArtworks?.data || []).map((art) => (
              <div key={art.id} style={{
                padding: '20px 0',
                borderBottom: '1px solid var(--color-warm-gray)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ 
                    width: '60px', 
                    height: '60px', 
                    backgroundColor: 'var(--color-aged-stock)',
                    border: '1px solid var(--color-warm-gray)',
                    overflow: 'hidden'
                  }}>
                    {art.imageUrl && <img src={art.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.3)' }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{art.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-sepia-mid)', fontFamily: 'var(--font-body)', marginTop: '4px' }}>
                      {art.childName.toUpperCase()} / {art.category}
                    </div>
                  </div>
                </div>
                <StatusBadge status={art.status} />
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: '30px' }}>
            <a href="/artworks" style={{ 
              fontSize: '11px', 
              fontFamily: 'var(--font-body)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.1em',
              textDecoration: 'underline',
              color: 'var(--color-rust)'
            }}>
              Access Full Archive →
            </a>
          </div>
        </div>

        {/* Right Column: Financial Records */}
        <div>
          <h2 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '24px', 
            fontStyle: 'italic',
            marginBottom: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <span style={{ fontSize: '14px', fontStyle: 'normal', color: 'var(--color-sepia-mid)' }}>02 —</span>
            Financials
          </h2>

          <div style={{ 
            backgroundColor: 'var(--color-aged-stock)', 
            padding: '30px',
            border: '1px solid var(--color-warm-gray)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {(recentDonations?.data || []).map((don) => (
                <div key={don.id} style={{
                  paddingBottom: '15px',
                  borderBottom: '1px solid var(--color-warm-gray)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                      {don.isAnonymous ? 'ANON' : don.donorName.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-rust)' }}>
                      {don.currency === 'CNY' ? '¥' : '$'}{don.amount.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-sepia-mid)', fontFamily: 'var(--font-body)', marginTop: '4px' }}>
                    {dayjs(don.createdAt).format('DD MMM YYYY')} — AUTH OK
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '20px', border: '1px dashed var(--color-warm-gray)' }}>
            <p style={{ fontSize: '12px', fontFamily: 'var(--font-body)', lineHeight: 1.6, color: 'var(--color-sepia-mid)', margin: 0 }}>
              "Transparency is the cornerstone of trust. Every record here represents a child's story supported."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
