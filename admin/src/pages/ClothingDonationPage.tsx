/**
 * Clothing Donation Management Page
 *
 * Features:
 * - Display user-submitted clothing donation intake list
 * - Filter by status (pending, received, processing, converted, rejected)
 * - Status transition actions: mark received, start processing, mark converted, reject
 * - Paginated browsing
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

  const { data, isLoading, isError } = useQuery({
    queryKey: ['clothing-intakes', page, statusFilter],
    queryFn: () => fetchClothingIntakes({ page, pageSize: 20, status: statusFilter || undefined }),
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
    {
      key: 'imageUrls',
      title: t('clothingDonation.colPhotos', 'Photos'),
      width: 120,
      render: (v) => {
        const urls: string[] = Array.isArray(v) ? v : [];
        if (urls.length === 0) return <span style={{ color: 'var(--color-text-3)' }}>-</span>;
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
    { key: 'conditionNotes', title: t('clothingDonation.colDescription'), width: 200, render: (v) => (v ? String(v).slice(0, 50) + (String(v).length > 50 ? '…' : '') : '-') },
    { key: 'contactPhone', title: t('clothingDonation.colPhone'), width: 120, render: (v) => v || '-' },
    { key: 'pickupAddress', title: t('clothingDonation.colAddress'), width: 160, render: (v) => (v ? String(v).slice(0, 40) + (String(v).length > 40 ? '…' : '') : '-') },
    { key: 'status', title: t('clothingDonation.colStatus'), width: 100, render: (v) => <StatusBadge status={v} /> },
    { key: 'createdAt', title: t('clothingDonation.colSubmittedAt'), width: 160, render: (v) => formatDateTime(v) },
    {
      key: '_actions',
      title: t('clothingDonation.colActions'),
      width: 240,
      render: (_v, record) => (
        <div className="table-actions">
          <Button variant="secondary" size="sm" onClick={() => setSelected(record)}>
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
              onClick={() => statusMutation.mutate({ id: record.id, status: 'listed' })}
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
          <option value="submitted">{t('clothingDonation.statusSubmitted', 'Submitted')}</option>
          <option value="received">{t('clothingDonation.statusReceived')}</option>
          <option value="processing">{t('clothingDonation.statusProcessing')}</option>
          <option value="listed">{t('clothingDonation.statusListed', 'Listed')}</option>
          <option value="rejected">{t('clothingDonation.statusRejected')}</option>
        </select>
      </div>

      {isError && (
        <div style={{ padding: 16, marginBottom: 16, background: 'var(--color-danger-bg, #fef2f2)', border: '1px solid var(--color-danger-border, #fecaca)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-danger, #dc2626)', fontSize: 14 }}>{t('generic.error')}</span>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ['clothing-intakes'] })} style={{ padding: '4px 12px', fontSize: 13, cursor: 'pointer', border: '1px solid var(--color-border)', borderRadius: 4, background: 'transparent' }}>{t('generic.retry', 'Retry')}</button>
        </div>
      )}
      <DataTable columns={columns} data={items} loading={isLoading} rowKey="id" />

      <div style={{ marginTop: 24 }}>
        <Pagination
          page={page}
          totalPages={Math.ceil(total / 10)}
          pageSize={20}
          total={total}
          onPageChange={setPage}
        />
      </div>

      {/* Detail Modal */}
      <Modal
        open={!!selected}
        title={t('clothingDonation.detailTitle')}
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
            {selected.imageUrls && selected.imageUrls.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  {t('clothingDonation.colPhotos', 'Photos')} ({selected.imageUrls.length})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                  {selected.imageUrls.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt=""
                        style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--color-border)', display: 'block' }}
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
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