/**
 * 衣物捐献管理页面 (Clothing Donation Page)
 *
 * 功能说明：
 * - 展示用户提交的衣物捐献申请列表
 * - 支持按状态筛选（待处理、已收到、处理中、已转化、未通过）
 * - 支持状态流转操作：标记已收到、开始处理、标记转化、拒绝
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
import { fetchClothingIntakes, updateClothingIntakeStatus } from '../services/api';
import type { ClothingDonationItem } from '../types';
import { formatDateTime } from '../utils/dateTime';

export default function ClothingDonationPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['clothing-intakes', page, statusFilter],
    queryFn: () => fetchClothingIntakes({ page, pageSize: 10, status: statusFilter || undefined }),
  });

  const items: ClothingDonationItem[] = data?.data ?? [];
  const total = data?.total ?? 0;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateClothingIntakeStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clothing-intakes'] });
      toast.success(t('clothingDonation.toastUpdated', 'Status updated'));
    },
    onError: () => {
      toast.error(t('clothingDonation.toastError', 'Update failed'));
    },
  });

  const columns: Column<ClothingDonationItem>[] = [
    { key: 'id', title: t('clothingDonation.colId'), width: 80 },
    { key: 'garmentTypes', title: t('clothingDonation.colType'), width: 90, render: (v) => v || '-' },
    { key: 'quantityEstimate', title: t('clothingDonation.colItemCount'), width: 80, render: (v) => v ?? '-' },
    { key: 'conditionNotes', title: t('clothingDonation.colDescription'), width: 200, render: (v) => (v ? String(v).slice(0, 50) + (String(v).length > 50 ? '…' : '') : '-') },
    { key: 'contactPhone', title: t('clothingDonation.colPhone'), width: 120, render: (v) => v || '-' },
    { key: 'pickupAddress', title: t('clothingDonation.colAddress', 'Pickup Address'), width: 160, render: (v) => (v ? String(v).slice(0, 40) + (String(v).length > 40 ? '…' : '') : '-') },
    { key: 'status', title: t('clothingDonation.colStatus'), width: 100, render: (v) => <StatusBadge status={v} /> },
    { key: 'createdAt', title: t('clothingDonation.colSubmittedAt'), width: 160, render: (v) => formatDateTime(v) },
    {
      key: '_actions',
      title: t('clothingDonation.colActions', 'Actions'),
      width: 220,
      render: (_v, record) => {
        if (record.status === 'pending') {
          return (
            <div style={{ display: 'flex', gap: 6 }}>
              <Button
                variant="primary"
                size="sm"
                loading={statusMutation.isPending}
                onClick={() => statusMutation.mutate({ id: record.id, status: 'received' })}
              >
                {t('clothingDonation.btnReceive', 'Receive')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={statusMutation.isPending}
                onClick={() => statusMutation.mutate({ id: record.id, status: 'rejected' })}
              >
                {t('clothingDonation.btnReject', 'Reject')}
              </Button>
            </div>
          );
        }
        if (record.status === 'received') {
          return (
            <Button
              variant="secondary"
              size="sm"
              loading={statusMutation.isPending}
              onClick={() => statusMutation.mutate({ id: record.id, status: 'processing' })}
            >
              {t('clothingDonation.btnProcess', 'Process')}
            </Button>
          );
        }
        if (record.status === 'processing') {
          return (
            <Button
              variant="primary"
              size="sm"
              loading={statusMutation.isPending}
              onClick={() => statusMutation.mutate({ id: record.id, status: 'converted' })}
            >
              {t('clothingDonation.btnConvert', 'Convert')}
            </Button>
          );
        }
        return <span style={{ color: 'var(--color-text-2)', fontSize: 12 }}>—</span>;
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4, fontFamily: 'var(--font-body)' }}>
          {t('clothingDonation.title')}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-2)' }}>
          {t('clothingDonation.description')}
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
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <option value="">{t('clothingDonation.filterAllStatuses')}</option>
          <option value="pending">{t('clothingDonation.statusPending')}</option>
          <option value="received">{t('clothingDonation.statusReceived')}</option>
          <option value="processing">{t('clothingDonation.statusProcessing')}</option>
          <option value="converted">{t('clothingDonation.statusConverted')}</option>
          <option value="rejected">{t('clothingDonation.statusRejected')}</option>
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
