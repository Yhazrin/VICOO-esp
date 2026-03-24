import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import GrainOverlay from '@/components/editorial/GrainOverlay';
import { ordersApi } from '@/services/orders';
import TraceabilityTimeline from '@/components/editorial/TraceabilityTimeline';
import type { SupplyChainTimelineRecord } from '@/types';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(id!),
    enabled: !!id,
  });

  const logisticsAsTimeline: SupplyChainTimelineRecord[] =
    order?.logistics_events?.map((ev, i) => ({
      id: i + 1,
      stage: ev.status,
      description: ev.description ?? ev.status,
      location: ev.location ?? '—',
      date: ev.at?.slice(0, 10) ?? '',
      verified: true,
      partnerName: order.carrier ?? 'Logistics',
    })) ?? [];

  if (isLoading || !order) {
    return (
      <PageWrapper>
        <PaperTextureBackground variant="paper" className="py-20">
          <SectionContainer>
            <p className="font-body text-sepia-mid">{t('common.loading', 'Loading...')}</p>
          </SectionContainer>
        </PaperTextureBackground>
      </PageWrapper>
    );
  }

  if (isError) {
    return (
      <PageWrapper>
        <PaperTextureBackground variant="paper" className="py-20">
          <SectionContainer>
            <p className="font-body text-rust">{t('orderDetail.error', '无法加载订单')}</p>
            <Link to="/profile" className="font-body text-caption text-rust mt-4 inline-block">
              ← {t('profile.title')}
            </Link>
          </SectionContainer>
        </PaperTextureBackground>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PaperTextureBackground variant="paper" className="py-16 md:py-24 relative">
        <GrainOverlay />
        <SectionContainer>
          <NumberedSectionHeading number="01" title={t('orderDetail.title', '订单与物流')} subtitle={order.order_no} />
          <div className="border border-warm-gray/30 p-6 md:p-8 bg-paper/80 space-y-4">
            <p className="font-body text-body-sm text-ink-faded">
              {t('orderDetail.status', '状态')}: <span className="text-ink uppercase tracking-wider">{order.status}</span>
            </p>
            <p className="font-body text-body-sm text-ink-faded">
              {t('orderDetail.total', '合计')}: CNY {Number(order.total_amount).toFixed(2)}
            </p>
            {order.shipping_address && (
              <p className="font-body text-body-sm text-ink-faded">
                {t('orderDetail.address', '收货地址')}: {order.shipping_address}
              </p>
            )}
            {(order.carrier || order.tracking_number) && (
              <p className="font-body text-body-sm text-ink">
                {order.carrier && <span>{order.carrier} · </span>}
                {order.tracking_number && (
                  <span className="font-mono">{order.tracking_number}</span>
                )}
              </p>
            )}
            <div className="pt-4 border-t border-warm-gray/20">
              <p className="font-body text-overline text-sepia-mid mb-3">{t('orderDetail.items', '明细')}</p>
              <ul className="space-y-2">
                {order.items.map((it) => (
                  <li key={it.id} className="flex justify-between font-body text-caption text-ink-faded">
                    <span>
                      #{it.product_id} × {it.quantity}
                    </span>
                    <span>CNY {(Number(it.price) * it.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SectionContainer>
      </PaperTextureBackground>

      {logisticsAsTimeline.length > 0 && (
        <PaperTextureBackground variant="aged" className="py-16 md:py-24">
          <SectionContainer>
            <NumberedSectionHeading number="02" title={t('orderDetail.logistics', '物流轨迹')} />
            <TraceabilityTimeline records={logisticsAsTimeline} />
          </SectionContainer>
        </PaperTextureBackground>
      )}

      <SectionContainer className="py-8">
        <Link to="/profile" className="font-body text-caption tracking-[0.15em] uppercase text-ink-faded hover:text-rust">
          ← {t('profile.title')}
        </Link>
      </SectionContainer>
    </PageWrapper>
  );
}
