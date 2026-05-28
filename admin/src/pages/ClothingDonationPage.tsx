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
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import { fetchClothingIntakes, updateClothingIntakeStatus } from '../services/api';
import type { ClothingDonationItem } from '../types';
import { formatDateTime } from '../utils/dateTime';

export default function ClothingDonationPage() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<ClothingDonationItem | null>(null);

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
      toast.success(t('clothingDonation.toastUpdated'));
    },
    onError: () => {
      toast.error(t('clothingDonation.toastError'));
    },
  });

  const columns: Column<ClothingDonationItem>[] = [
    { key: 'id', title: t('clothingDonation.colId'), width: 80 },
    { key: 'garmentTypes', title: t('clothingDonation.colType'), width: 90, render: (v) => v || '-' },
    { key: 'quantityEstimate', title: t('clothingDonation.colItemCount'), width: 80, render: (v) => v ?? '-' },
    { key: 'conditionNotes', title: t('clothingDonation.colDescription'), width: 200, render: (v) => (v ? String(v).slice(0, 50) + (String(v).length > 50 ? '…' : '') : '-') },
    { key: 'contactPhone', title: t('clothingDonation.colPhone'), width: 120, render: (v) => v || '-' },
    { key: 'pickupAddress', title: t('clothingDonation.colAddress'), width: 160, render: (v) => (v ? String(v).slice(0, 40) + (String(v).length > 40 ? '…' : '') : '-') },
    { key: 'status', title: t('clothingDonation.colStatus'), width: 100, render: (v) => <StatusBadge status={v} /> },
    { key: 'createdAt', title: t('clothingDonation.colSubmittedAt'), width: 160, render: (v) => formatDateTime(v) },
    {
      key: '_actions',
      title: t('clothingDonation.colActions'),
      width: 280,
      render: (_v, record) => (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Button variant="ghost" size="sm" onClick={() => setSelected(record)}>
            {t('common.detail')}
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                variant="primary"
                size="sm"
                loading={statusMutation.isPending}
                onClick={() => statusMutation.mutate({ id: record.id, status: 'received' })}
              >
                {t('clothingDonation.btnReceive')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={statusMutation.isPending}
                onClick={() => statusMutation.mutate({ id: record.id, status: 'rejected' })}
              >
                {t('clothingDonation.btnReject')}
              </Button>
            </>
          )}
          {record.status === 'received' && (
            <Button
              variant="secondary"
              size="sm"
              loading={statusMutation.isPending}
              onClick={() => statusMutation.mutate({ id: record.id, status: 'processing' })}
            >
              {t('clothingDonation.btnProcess')}
            </Button>
          )}
          {record.status === 'processing' && (
            <Button
              variant="primary"
              size="sm"
              loading={statusMutation.isPending}
              onClick={() => statusMutation.mutate({ id: record.id, status: 'converted' })}
            >
              {t('clothingDonation.btnConvert')}
            </Button>
          )}
        </div>
      ),
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

      {/* Detail Modal */}
      <Modal
        open={!!selected}
        title={isZh ? '衣物捐赠详情' : 'Donation Details'}
        onClose={() => setSelected(null)}
        width={500}
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{t('clothingDonation.colId')}</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{selected.id}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{t('clothingDonation.colStatus')}</div>
                <StatusBadge status={selected.status} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{t('clothingDonation.colType')}</div>
                <div style={{ fontSize: 13 }}>{selected.garmentTypes || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{t('clothingDonation.colItemCount')}</div>
                <div style={{ fontSize: 13 }}>{selected.quantityEstimate ?? '-'}</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{t('clothingDonation.colPhone')}</div>
              <div style={{ fontSize: 13 }}>{selected.contactPhone || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{t('clothingDonation.colAddress')}</div>
              <div style={{ fontSize: 13 }}>{selected.pickupAddress || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{t('clothingDonation.colDescription')}</div>
              <div style={{ fontSize: 13, padding: 12, background: 'var(--color-bg)', borderRadius: 6 }}>{selected.conditionNotes || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{t('clothingDonation.colSubmittedAt')}</div>
              <div style={{ fontSize: 13 }}>{formatDateTime(selected.createdAt)}</div>
            </div>
            <div style={{ marginTop: 8 }}>
              <Button variant="secondary" size="sm" onClick={() => setSelected(null)}>
                {t('common.close')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}