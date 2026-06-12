/**
 * After-Sales Service Management Page
 *
 * 功能说明：
 * - 展示所有售后工单列表（退货、换货、维修）
 * - 支持按状态筛选（待审核、已通过、已拒绝、已完成）
 * - 支持审核操作：通过、拒绝
 * - 换货通过后自动创建换货订单，可发货并标记完成
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import {
  fetchAfterSales,
  reviewAfterSales,
  confirmAfterSalesReceived,
  processAfterSalesRefund,
  updateAfterSalesStatus,
  updateOrderStatus,
} from '../services/api';
import type { AfterSalesItem } from '../types';
import { formatDateTime } from '../utils/dateTime';

export default function AfterSalesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['after-sales', page, statusFilter],
    queryFn: () => fetchAfterSales({ page, pageSize: 20, status: statusFilter || undefined }),
  });

  const items: AfterSalesItem[] = data?.data ?? [];
  const total = data?.total ?? 0;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['after-sales'] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, adminNote }: { id: string; action: 'approve' | 'reject'; adminNote?: string }) =>
      reviewAfterSales(id, action, adminNote),
    onSuccess: (_data, variables) => {
      invalidate();
      toast.success(
        variables.action === 'approve'
          ? t('afterSales.toastApproved')
          : t('afterSales.toastRejected'),
      );
    },
    onError: () => {
      toast.error(t('afterSales.toastError'));
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateAfterSalesStatus(id, status),
    onSuccess: () => {
      invalidate();
      toast.success(t('afterSales.toastUpdated', 'Status updated'));
    },
    onError: () => {
      toast.error(t('afterSales.toastError'));
    },
  });

  const shipMutation = useMutation({
    mutationFn: (orderId: string) => updateOrderStatus(orderId, 'shipped'),
    onSuccess: () => {
      invalidate();
      toast.success(t('afterSales.toastShipped'));
    },
    onError: () => {
      toast.error(t('afterSales.toastShipError'));
    },
  });

  const deliverMutation = useMutation({
    mutationFn: (orderId: string) => updateOrderStatus(orderId, 'completed'),
    onSuccess: () => {
      invalidate();
      toast.success(t('afterSales.toastDelivered'));
    },
    onError: () => {
      toast.error(t('afterSales.toastError'));
    },
  });

  const confirmReceivedMutation = useMutation({
    mutationFn: (id: string) => confirmAfterSalesReceived(id),
    onSuccess: () => {
      invalidate();
      toast.success(t('afterSales.toastReceived'));
    },
    onError: () => {
      toast.error(t('afterSales.toastError'));
    },
  });

  const refundMutation = useMutation({
    mutationFn: (id: string) => processAfterSalesRefund(id),
    onSuccess: () => {
      invalidate();
      toast.success(t('afterSales.toastRefunded'));
    },
    onError: () => {
      toast.error(t('afterSales.toastError'));
    },
  });

  const handleReject = (id: string) => {
    const note = window.prompt(t('afterSales.rejectNotePrompt', 'Rejection reason (optional):'));
    if (note === null) return;
    reviewMutation.mutate({ id, action: 'reject', adminNote: note || undefined });
  };

  const orderSearchLink = (orderNo?: string, orderId?: string) => {
    const q = orderNo || orderId;
    return q ? `/orders?search=${encodeURIComponent(q)}` : '/orders';
  };

  const getCategoryLabel = (v: string) => {
    const map: Record<string, string> = {
      return: t('afterSales.typeReturn'),
      exchange: t('afterSales.typeExchange'),
      repair: t('afterSales.typeRepair'),
      quality: t('afterSales.typeRepair'),
      logistics: t('afterSales.typeRepair'),
      other: t('afterSales.typeRepair'),
    };
    return map[v] || v;
  };

  const columns: Column<AfterSalesItem>[] = [
    { key: 'id', title: 'ID', width: 80 },
    {
      key: 'orderNo',
      title: t('afterSales.colOrderId'),
      width: 180,
      render: (_v, record) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          {record.orderNo ? (
            <Link to={orderSearchLink(record.orderNo, record.orderId)} style={{ color: 'var(--color-accent)' }}>
              {record.orderNo}
            </Link>
          ) : (
            record.orderId
          )}
        </span>
      ),
    },
    { key: 'userId', title: t('afterSales.colUserId'), width: 120 },
    { key: 'category', title: t('afterSales.colType'), width: 100, render: (v) => getCategoryLabel(v) },
    {
      key: 'reason',
      title: t('afterSales.colReason'),
      width: 220,
      render: (_v, record) => {
        const text = record.reason?.trim() || '—';
        return text.length > 48 ? `${text.slice(0, 48)}…` : text;
      },
    },
    {
      key: 'imageUrls',
      title: t('afterSales.colPhotos', 'Photos'),
      width: 120,
      render: (v) => {
        const urls: string[] = Array.isArray(v) ? v : [];
        if (urls.length === 0) return <span style={{ color: 'var(--color-text-3)' }}>—</span>;
        return (
          <div style={{ display: 'flex', gap: 4 }}>
            {urls.slice(0, 3).map((url) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                <img
                  src={url}
                  alt=""
                  style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--color-border)' }}
                />
              </a>
            ))}
            {urls.length > 3 && (
              <span style={{ fontSize: 12, color: 'var(--color-text-3)', alignSelf: 'center' }}>
                +{urls.length - 3}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'replacementOrderNo',
      title: t('afterSales.colReplacementOrder'),
      width: 160,
      render: (_v, record) =>
        record.replacementOrderNo ? (
          <Link
            to={orderSearchLink(record.replacementOrderNo, record.replacementOrderId)}
            style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', fontSize: 12 }}
          >
            {record.replacementOrderNo}
          </Link>
        ) : (
          '—'
        ),
    },
    {
      key: 'replacementOrderStatus',
      title: t('afterSales.colReplacementStatus'),
      width: 120,
      render: (_v, record) =>
        record.replacementOrderStatus ? (
          <StatusBadge status={record.replacementOrderStatus} context="order" />
        ) : (
          '—'
        ),
    },
    {
      key: 'refundStatus',
      title: t('afterSales.colRefund'),
      width: 120,
      render: (_v, record) => {
        if (record.category !== 'return') return '—';
        if (record.refundStatus === 'succeeded') {
          return (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-success, #16a34a)' }}>
              ¥{Number(record.refundAmount ?? 0).toLocaleString()}
            </span>
          );
        }
        if (record.refundStatus === 'pending') return t('afterSales.refundPending', 'Refunding');
        if (record.refundStatus === 'failed') return t('afterSales.refundFailed', 'Failed');
        return '—';
      },
    },
    {
      key: 'status',
      title: t('afterSales.colStatus'),
      width: 120,
      render: (v) => <StatusBadge status={v} context="afterSales" />,
    },
    { key: 'createdAt', title: t('afterSales.colApplyTime'), width: 180, render: (v) => formatDateTime(v) },
    {
      key: '_actions',
      title: t('afterSales.colActions'),
      width: 260,
      render: (_v, record) => {
        if (record.status === 'pending') {
          return (
            <div className="table-actions">
              <Button
                variant="primary"
                size="sm"
                loading={reviewMutation.isPending}
                onClick={() => reviewMutation.mutate({ id: record.id, action: 'approve' })}
              >
                {record.category === 'exchange'
                  ? t('afterSales.btnApproveExchange')
                  : t('afterSales.btnApprove')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={reviewMutation.isPending}
                onClick={() => handleReject(record.id)}
              >
                {t('afterSales.btnReject')}
              </Button>
            </div>
          );
        }

        if (record.status === 'approved') {
          const isReturn = record.category === 'return';
          const isExchange = record.category === 'exchange';

          return (
            <div className="table-actions">
              {(isReturn || isExchange) && !record.goodsReceivedAt && (
                <Button
                  variant="primary"
                  size="sm"
                  loading={confirmReceivedMutation.isPending}
                  onClick={() => confirmReceivedMutation.mutate(record.id)}
                >
                  {t('afterSales.btnConfirmReceived')}
                </Button>
              )}
              {isReturn && record.goodsReceivedAt && record.refundStatus !== 'succeeded' && (
                <Button
                  variant="primary"
                  size="sm"
                  loading={refundMutation.isPending}
                  onClick={() => refundMutation.mutate(record.id)}
                >
                  {t('afterSales.btnRefund')}
                </Button>
              )}
              {isExchange && record.replacementOrderId && record.replacementOrderStatus === 'paid' && (
                <Button
                  variant="primary"
                  size="sm"
                  loading={shipMutation.isPending}
                  onClick={() => shipMutation.mutate(record.replacementOrderId!)}
                >
                  {t('afterSales.btnShip')}
                </Button>
              )}
              {isExchange && record.replacementOrderId && record.replacementOrderStatus === 'shipped' && (
                <Button
                  variant="secondary"
                  size="sm"
                  loading={deliverMutation.isPending}
                  onClick={() => deliverMutation.mutate(record.replacementOrderId!)}
                >
                  {t('afterSales.btnConfirmDelivery')}
                </Button>
              )}
            </div>
          );
        }

        return <span style={{ color: 'var(--color-text-3)', fontSize: 12 }}>—</span>;
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4, fontFamily: 'var(--font-body)' }}>
          {t('afterSales.title')}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-2)' }}>
          {t('afterSales.description')}
        </p>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <option value="">{t('afterSales.filterAllStatuses')}</option>
          <option value="pending">{t('afterSales.statusPending')}</option>
          <option value="approved">{t('afterSales.statusApproved')}</option>
          <option value="completed">{t('afterSales.statusCompleted')}</option>
          <option value="rejected">{t('afterSales.statusRejected')}</option>
        </select>
      </div>

      {isError && (
        <div style={{ padding: 16, marginBottom: 16, background: 'var(--color-danger-bg, #fef2f2)', border: '1px solid var(--color-danger-border, #fecaca)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-danger, #dc2626)', fontSize: 14 }}>{t('generic.error')}</span>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ['after-sales'] })} style={{ padding: '4px 12px', fontSize: 13, cursor: 'pointer', border: '1px solid var(--color-border)', borderRadius: 4, background: 'transparent' }}>{t('generic.retry', 'Retry')}</button>
        </div>
      )}
      <DataTable columns={columns} data={items} loading={isLoading} rowKey="id" />

      <div style={{ marginTop: 24 }}>
        <Pagination
          page={page}
          totalPages={Math.ceil(total / 20)}
          pageSize={20}
          total={total}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
