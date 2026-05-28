/**
 * 售后服务管理页面 (AfterSales Page)
 *
 * 功能说明：
 * - 展示所有售后工单列表（退货、换货、维修）
 * - 支持按状态筛选（待审核、已通过、已拒绝、已完成）
 * - 支持审核操作：通过、拒绝、标记完成
 * - 提供分页浏览功能
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
import { formatDateTime } from '../utils/dateTime';

export default function AfterSalesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
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
    { key: 'id', title: 'ID', width: 80 },
    { key: 'orderId', title: t('afterSales.colOrderId'), width: 120 },
    { key: 'userId', title: t('afterSales.colUserId'), width: 120 },
    { key: 'category', title: t('afterSales.colType'), width: 100, render: (v) => getCategoryLabel(v) },
    { key: 'subject', title: t('afterSales.colReason'), width: 200, render: (v) => (v ? String(v).slice(0, 40) + (String(v).length > 40 ? '…' : '') : '-') },
    { key: 'status', title: t('afterSales.colStatus'), width: 120, render: (v) => <StatusBadge status={v} /> },
    { key: 'createdAt', title: t('afterSales.colApplyTime'), width: 180, render: (v) => formatDateTime(v) },
    {
      key: '_actions',
      title: t('afterSales.colActions', 'Actions'),
      width: 200,
      render: (_v, record) => {
        if (record.status === 'pending') {
          return (
            <div style={{ display: 'flex', gap: 6 }}>
              <Button
                variant="primary"
                size="sm"
                loading={statusMutation.isPending}
                onClick={() => statusMutation.mutate({ id: record.id, status: 'approved' })}
              >
                {t('afterSales.btnApprove', 'Approve')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={statusMutation.isPending}
                onClick={() => statusMutation.mutate({ id: record.id, status: 'rejected' })}
              >
                {t('afterSales.btnReject', 'Reject')}
              </Button>
            </div>
          );
        }
        if (record.status === 'approved') {
          return (
            <Button
              variant="secondary"
              size="sm"
              loading={statusMutation.isPending}
              onClick={() => statusMutation.mutate({ id: record.id, status: 'completed' })}
            >
              {t('afterSales.btnComplete', 'Complete')}
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
          <option value="pending">{t('afterSales.statusPending')}</option>
          <option value="approved">{t('afterSales.statusApproved')}</option>
          <option value="rejected">{t('afterSales.statusRejected')}</option>
          <option value="completed">{t('afterSales.statusCompleted')}</option>
        </select>
      </div>

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
