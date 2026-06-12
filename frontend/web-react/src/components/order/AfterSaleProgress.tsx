import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AfterSaleTicket } from '@/services/afterSales';
import { afterSalesApi } from '@/services/afterSales';

const RETURN_STEPS = ['submitted', 'reviewing', 'returnShip', 'processing', 'completed'] as const;
const EXCHANGE_STEPS = ['submitted', 'reviewing', 'returnShip', 'exchangeShipping', 'completed'] as const;
const SUPPORT_STEPS = ['submitted', 'reviewing', 'processing', 'completed'] as const;

function getProgressIndex(ticket: AfterSaleTicket): number {
  if (ticket.status === 'closed') return -1;
  if (ticket.status === 'open') return 1;
  if (ticket.status === 'in_progress') {
    if (ticket.category === 'return') {
      if (ticket.refund_status === 'succeeded' || ticket.status === 'resolved') return 4;
      if (ticket.goods_received_at) return 3;
      if (ticket.return_tracking_no) return 2;
      return 1;
    }
    if (ticket.category === 'exchange') {
      if (ticket.replacement_order_status === 'completed') return 4;
      if (ticket.replacement_order_status === 'shipped') return 3;
      if (ticket.goods_received_at || ticket.return_tracking_no) return 2;
      return 1;
    }
    return 2;
  }
  if (ticket.status === 'resolved') {
    if (ticket.category === 'return' || ticket.category === 'exchange') return 4;
    return 3;
  }
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
  const queryClient = useQueryClient();
  const [carrier, setCarrier] = useState('');
  const [trackingNo, setTrackingNo] = useState('');
  const isExchange = ticket.category === 'exchange';
  const isReturn = ticket.category === 'return';
  const isSupport = !isExchange && !isReturn;
  const steps = isSupport ? SUPPORT_STEPS : isExchange ? EXCHANGE_STEPS : RETURN_STEPS;
  const stepIndex = getProgressIndex(ticket);
  const rejected = ticket.status === 'closed';

  const shipmentMutation = useMutation({
    mutationFn: () =>
      afterSalesApi.submitReturnShipment(ticket.id, {
        return_carrier: carrier.trim(),
        return_tracking_no: trackingNo.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-after-sales', String(ticket.order_id)] });
      queryClient.invalidateQueries({ queryKey: ['my-after-sales'] });
    },
  });

  const categoryLabel = isExchange
    ? t('orderDetail.afterSale.typeExchange', '换货')
    : isReturn
      ? t('orderDetail.afterSale.typeReturn', '退货')
      : t('orderDetail.afterSale.typeSupport', '售后咨询');

  const canSubmitReturnShipment =
    (isReturn || isExchange) &&
    ticket.status === 'in_progress' &&
    !ticket.return_tracking_no &&
    !ticket.goods_received_at;

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

      {ticket.admin_note && (
        <div className="rounded-lg border border-warm-gray/20 bg-aged-stock/20 p-3">
          <p className="font-body text-[10px] tracking-[0.15em] uppercase text-sepia-mid mb-1">
            {t('orderDetail.afterSale.adminNote', '客服备注')}
          </p>
          <p className="font-body text-body-sm text-ink whitespace-pre-wrap">{ticket.admin_note}</p>
        </div>
      )}

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
                      <path d="M3 8l3 3 7-7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className="font-body text-[9px] text-sepia-mid mt-1 text-center max-w-[4.5rem] leading-tight">
                  {t(`orderDetail.afterSale.step.${step}`, step)}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px mx-1 ${i < stepIndex ? 'bg-ink' : 'bg-warm-gray/30'}`} />
              )}
            </div>
          ))}
        </div>
      )}

      {isReturn && ticket.refund_status === 'succeeded' && ticket.refund_amount && (
        <p className="font-body text-body-sm text-sage">
          {t('orderDetail.afterSale.refunded', '已退款 ¥{{amount}}', { amount: ticket.refund_amount })}
        </p>
      )}

      {canSubmitReturnShipment && (
        <form
          className="space-y-3 border-t border-warm-gray/15 pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!carrier.trim() || !trackingNo.trim()) return;
            shipmentMutation.mutate();
          }}
        >
          <p className="font-body text-body-sm text-ink-faded">
            {t('orderDetail.afterSale.returnShipHint', '请填写寄回物流信息')}
          </p>
          <input
            className="w-full border border-warm-gray/25 px-3 py-2 font-body text-body-sm bg-paper"
            placeholder={t('orderDetail.afterSale.carrierPlaceholder', '快递公司')}
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
          />
          <input
            className="w-full border border-warm-gray/25 px-3 py-2 font-body text-body-sm bg-paper"
            placeholder={t('orderDetail.afterSale.trackingPlaceholder', '运单号')}
            value={trackingNo}
            onChange={(e) => setTrackingNo(e.target.value)}
          />
          <button
            type="submit"
            disabled={shipmentMutation.isPending || !carrier.trim() || !trackingNo.trim()}
            className="font-body text-caption tracking-[0.12em] uppercase px-4 py-2 border border-ink text-ink hover:bg-ink hover:text-paper disabled:opacity-50"
          >
            {shipmentMutation.isPending
              ? t('common.loading', 'Submitting...')
              : t('orderDetail.afterSale.submitReturnShip', '提交寄回信息')}
          </button>
        </form>
      )}

      {ticket.return_tracking_no && !ticket.goods_received_at && (
        <p className="font-body text-body-sm text-ink-faded">
          {t('orderDetail.afterSale.returnShipped', '寄回物流：{{carrier}} {{tracking}}', {
            carrier: ticket.return_carrier ?? '',
            tracking: ticket.return_tracking_no,
          })}
        </p>
      )}

      {isExchange && showReplacementLink && ticket.replacement_order_id && (
        <p className="font-body text-body-sm">
          <Link to={`/orders/${ticket.replacement_order_id}`} className="text-rust hover:underline">
            {t('orderDetail.afterSale.viewReplacement', '查看换货订单')}
            {ticket.replacement_order_no ? ` (${ticket.replacement_order_no})` : ''}
          </Link>
        </p>
      )}
    </div>
  );
}

export function hasActiveAfterSale(tickets: AfterSaleTicket[]): boolean {
  return tickets.some((ticket) => ticket.status === 'open' || ticket.status === 'in_progress');
}
