import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { AfterSaleTicket } from '@/services/afterSales';

const RETURN_STEPS = ['submitted', 'reviewing', 'processing', 'completed'] as const;
const EXCHANGE_STEPS = ['submitted', 'reviewing', 'exchangeShipping', 'completed'] as const;

function getProgressIndex(ticket: AfterSaleTicket): number {
  if (ticket.status === 'closed') return -1;
  if (ticket.status === 'open') return 1;
  if (ticket.status === 'in_progress') {
    if (ticket.category === 'exchange' && ticket.replacement_order_status) {
      if (ticket.replacement_order_status === 'paid') return 2;
      if (ticket.replacement_order_status === 'shipped') return 2;
      if (ticket.replacement_order_status === 'completed') return 3;
    }
    return 2;
  }
  if (ticket.status === 'resolved') return 3;
  return 0;
}

interface AfterSaleProgressProps {
  ticket: AfterSaleTicket;
  compact?: boolean;
  showReplacementLink?: boolean;
}

export default function AfterSaleProgress({
  ticket,
  compact = false,
  showReplacementLink = true,
}: AfterSaleProgressProps) {
  const { t } = useTranslation();
  const isExchange = ticket.category === 'exchange';
  const steps = isExchange ? EXCHANGE_STEPS : RETURN_STEPS;
  const stepIndex = getProgressIndex(ticket);
  const rejected = ticket.status === 'closed';

  const categoryLabel =
    ticket.category === 'exchange'
      ? t('orderDetail.afterSale.typeExchange', '换货')
      : t('orderDetail.afterSale.typeReturn', '退货');

  return (
    <div className={compact ? 'space-y-3' : 'border border-warm-gray/20 p-5 md:p-6 space-y-4'}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-body text-[10px] tracking-[0.2em] uppercase text-sepia-mid">
            {t('orderDetail.afterSale.title', '售后进度')} · {categoryLabel}
          </p>
          <p className="font-body text-body-sm text-ink mt-1">{ticket.subject}</p>
        </div>
        {rejected ? (
          <span className="font-body text-[10px] tracking-wider uppercase px-3 py-1 border border-rust/30 text-rust bg-rust/5">
            {t('orderDetail.afterSale.rejected', '已拒绝')}
          </span>
        ) : ticket.status === 'resolved' ? (
          <span className="font-body text-[10px] tracking-wider uppercase px-3 py-1 border border-sage/30 text-sage bg-sage/5">
            {t('orderDetail.afterSale.completed', '已完成')}
          </span>
        ) : (
          <span className="font-body text-[10px] tracking-wider uppercase px-3 py-1 border border-archive-brown/30 text-archive-brown bg-archive-brown/5">
            {t('orderDetail.afterSale.inProgress', '处理中')}
          </span>
        )}
      </div>

      {!rejected && (
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center min-w-0">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-[10px] ${
                    i <= stepIndex ? 'bg-ink text-paper' : 'border border-warm-gray/30 text-sepia-mid'
                  }`}
                >
                  {i < stepIndex ? (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`mt-1.5 font-body text-[9px] tracking-wider uppercase text-center max-w-[4.5rem] leading-tight ${
                    i <= stepIndex ? 'text-ink' : 'text-sepia-mid'
                  }`}
                >
                  {t(`orderDetail.afterSale.steps.${step}`, step)}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${i < stepIndex ? 'bg-ink' : 'bg-warm-gray/25'}`} />
              )}
            </div>
          ))}
        </div>
      )}

      {isExchange && ticket.replacement_order_no && showReplacementLink && (
        <div className="rounded border border-warm-gray/15 bg-aged-stock/40 px-4 py-3 space-y-1">
          <p className="font-body text-[10px] tracking-[0.15em] uppercase text-sepia-mid">
            {t('orderDetail.afterSale.replacementOrder', '换货订单')}
          </p>
          <p className="font-mono text-xs text-ink">{ticket.replacement_order_no}</p>
          {ticket.replacement_order_status && (
            <p className="font-body text-caption text-ink-faded">
              {t(`orderDetail.status.${ticket.replacement_order_status}`, ticket.replacement_order_status)}
            </p>
          )}
          {(ticket.replacement_carrier || ticket.replacement_tracking_number) && (
            <p className="font-body text-caption text-ink-faded">
              {ticket.replacement_carrier && <span>{ticket.replacement_carrier} · </span>}
              {ticket.replacement_tracking_number && (
                <span className="font-mono">{ticket.replacement_tracking_number}</span>
              )}
            </p>
          )}
          {ticket.replacement_order_id && (
            <Link
              to={`/orders/${ticket.replacement_order_id}`}
              className="inline-block font-body text-[10px] tracking-wider uppercase text-rust hover:text-ink transition-colors mt-1"
            >
              {t('orderDetail.afterSale.viewReplacementOrder', '查看换货物流')} →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export function hasActiveAfterSale(tickets: AfterSaleTicket[]): boolean {
  return tickets.some((ticket) => ticket.status === 'open' || ticket.status === 'in_progress');
}
