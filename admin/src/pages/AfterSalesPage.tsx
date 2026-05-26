/**
 * After-Sales Service Management Page
 *
 * Features:
 * - Display all after-sales tickets (returns, exchanges, repairs)
 * - Filter by status (pending review, approved, rejected, completed)
 * - Review actions: approve, reject, mark completed
 * - Paginated browsing
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import { fetchAfterSales, updateAfterSalesStatus } from '../services/api';
import type { AfterSalesItem } from '../types';
import dayjs from 'dayjs';

export default function AfterSalesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['after-sales', page, statusFilter],
    queryFn: () => fetchAfterSales({ page, pageSize: 10, status: statusFilter || undefined }),
  });

  const items: AfterSalesItem[] = data?.data ?? [];
  const total = data?.total ?? 0;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateAfterSalesStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['after-sales'] });
      toast.success(t('afterSales.toastUpdated', 'Status updated'));
    },
    onError: () => {
      toast.error(t('afterSales.toastError', 'Update failed'));
    },
  });

  const getCategoryLabel = (v: string) => {
    const map: Record<string, string> = {
      return: t('afterSales.typeReturn'),
      exchange: t('afterSales.typeExchange'),
      repair: t('afterSales.typeRepair'),
    };
    return map[v] || v;
  };

  const columns: Column<AfterSalesItem>[] = [
    { key: 'id', title: t('afterSales.colId', 'ID'), width: 80 },
    { key: 'orderId', title: t('afterSales.colOrderId'), width: 120 },
    { key: 'userId', title: t('afterSales.colUserId'), width: 120 },
    { key: 'category', title: t('afterSales.colType'), width: 100, render: (v) => getCategoryLabel(v) },
    { key: 'subject', title: t('afterSales.colReason'), width: 200, render: (v) => (v ? String(v).slice(0, 40) + (String(v).length > 40 ? '…' : '') : '-') },
    { key: 'status', title: t('afterSales.colStatus'), width: 120, render: (v) => <StatusBadge status={v} /> },
    { key: 'createdAt', title: t('afterSales.colApplyTime'), width: 180, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      key: '_actions',
      title: t('afterSales.colActions', 'Actions'),
      width: 200,
      render: (_v, record) => {
        if (record.status === 'open') {
          return (
            <div style={{ display: 'flex', gap: 6 }}>
              <Button
                variant="primary"
                size="sm"
                loading={statusMutation.isPending}
                onClick={() => statusMutation.mutate({ id: record.id, status: 'in_progress' })}
              >
                {t('afterSales.btnApprove', 'Process')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={statusMutation.isPending}
                onClick={() => statusMutation.mutate({ id: record.id, status: 'closed' })}
              >
                {t('afterSales.btnReject', 'Close')}
              </Button>
            </div>
          );
        }
        if (record.status === 'in_progress') {
          return (
            <Button
              variant="secondary"
              size="sm"
              loading={statusMutation.isPending}
              onClick={() => statusMutation.mutate({ id: record.id, status: 'resolved' })}
            >
              {t('afterSales.btnComplete', 'Resolve')}
            </Button>
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
          <option value="open">{t('afterSales.statusOpen', 'Open')}</option>
          <option value="in_progress">{t('afterSales.statusInProgress', 'In Progress')}</option>
          <option value="resolved">{t('afterSales.statusResolved', 'Resolved')}</option>
          <option value="closed">{t('afterSales.statusClosed', 'Closed')}</option>
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
          totalPages={Math.ceil(total / 10)}
          pageSize={10}
          total={total}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
