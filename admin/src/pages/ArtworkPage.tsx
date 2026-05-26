import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { fetchArtworks, updateArtworkStatus, analyzeArtwork } from '../services/api';
import type { Artwork } from '../types';
import dayjs from 'dayjs';

export default function ArtworkPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [detailModal, setDetailModal] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['artworks', page, statusFilter, search, sortBy, sortOrder],
    queryFn: () => fetchArtworks({ page, pageSize: 10, status: statusFilter || undefined, search: search || undefined, sortBy, sortOrder }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Artwork['status'] }) => updateArtworkStatus(id, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      toast.success(vars.status === 'approved' ? t('artwork.toastApproved') : t('artwork.toastRejected'));
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.detail ?? t('generic.error'));
    },
  });

  const aiMutation = useMutation({
    mutationFn: (artwork: Artwork) => analyzeArtwork(artwork.imageUrl!, artwork.description),
    onSuccess: (result) => {
      setAiResult(result);
      toast.success(t('artwork.toastAiSuccess'));
    },
    onError: () => {
      toast.error(t('artwork.toastAiError'));
    }
  });

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const handleOpenDetail = (artwork: Artwork) => {
    setSelectedArtwork(artwork);
    setAiResult(null);
    setDetailModal(true);
  };

  const columns: Column<Artwork>[] = [
    { key: 'id', title: t('artwork.colArchiveId'), width: 120, render: (v) => <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{v}</code> },
    { key: 'title', title: t('artwork.colWorkTitle'), minWidth: 180, sorter: true, render: (v) => <span style={{ fontWeight: 600, fontFamily: 'var(--font-body)' }}>{v}</span> },
    { key: 'childName', title: t('artwork.colArtist'), width: 120 },
    { key: 'category', title: t('artwork.colMedium'), width: 120 },
    { key: 'votes', title: t('artwork.colImpact'), width: 100, sorter: true, render: (v) => <span style={{ fontFamily: 'var(--font-mono)' }}>{v} {t('artwork.pts', 'pts')}</span> },
    { key: 'status', title: t('artwork.colStatus'), width: 120, render: (v) => <StatusBadge status={v} /> },
    { key: 'createdAt', title: t('artwork.colSubmitted'), width: 160, sorter: true, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      key: 'action', title: t('artwork.colCommand'), width: 180,
      render: (_: any, record: Artwork) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handleOpenDetail(record); }}>
            {t('artwork.btnInspect')}
          </Button>
          {record.status === 'pending' && (
            <Button size="sm" variant="primary" loading={updateMutation.isPending} onClick={(e) => { e.stopPropagation(); updateMutation.mutate({ id: record.id, status: 'approved' }); }}>
              {t('artwork.btnApprove')}
            </Button>
          )}
        </div>
      ),
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8, fontFamily: 'var(--font-body)' }}>{t('artwork.title')}</h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-2)', maxWidth: '600px', lineHeight: 1.6 }}>
          {t('artwork.description')}
        </p>
      </div>

      <div style={{
        display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <input
          type="text"
          placeholder={t('artwork.searchPlaceholder')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={filterStyle}
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={filterStyle}
        >
          <option value="">{t('artwork.filterAll')}</option>
          <option value="pending">{t('artwork.filterPending')}</option>
          <option value="approved">{t('artwork.filterApproved')}</option>
          <option value="rejected">{t('artwork.filterRejected')}</option>
          <option value="featured">{t('artwork.filterFeatured', 'Featured')}</option>
        </select>
      </div>

      {isError && (
        <div style={{ padding: 16, marginBottom: 16, background: 'var(--color-danger-bg, #fef2f2)', border: '1px solid var(--color-danger-border, #fecaca)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-danger, #dc2626)', fontSize: 14 }}>{t('generic.error')}</span>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ['artworks'] })} style={{ padding: '4px 12px', fontSize: 13, cursor: 'pointer', border: '1px solid var(--color-border)', borderRadius: 4, background: 'transparent' }}>{t('generic.retry', 'Retry')}</button>
        </div>
      )}
      <DataTable
        columns={columns}
        data={data?.data || []}
        rowKey="id"
        loading={isLoading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onRowClick={(record) => handleOpenDetail(record)}
      />

      <div style={{ marginTop: 32 }}>
        <Pagination
          page={page}
          totalPages={data?.totalPages || 1}
          total={data?.total || 0}
          pageSize={10}
          onPageChange={setPage}
        />
      </div>

      <Modal
        open={detailModal}
        title={t('artwork.modalTitle')}
        onClose={() => setDetailModal(false)}
        width={650}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              {!aiResult && selectedArtwork && (
                <Button variant="secondary" onClick={() => aiMutation.mutate(selectedArtwork)} loading={aiMutation.isPending} disabled={!selectedArtwork?.imageUrl}>
                  {t('artwork.btnAiAnalysis')}
                </Button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {selectedArtwork?.status === 'pending' ? (
                <>
                  <Button variant="danger" loading={updateMutation.isPending} onClick={() => { updateMutation.mutate({ id: selectedArtwork.id, status: 'rejected' }); setDetailModal(false); }}>{t('artwork.btnReject')}</Button>
                  <Button variant="primary" loading={updateMutation.isPending} onClick={() => { updateMutation.mutate({ id: selectedArtwork.id, status: 'approved' }); setDetailModal(false); }}>{t('artwork.btnApproveSubmission')}</Button>
                </>
              ) : (
                <Button variant="secondary" onClick={() => setDetailModal(false)}>{t('artwork.btnCloseView')}</Button>
              )}
            </div>
          </div>
        }
      >
        {selectedArtwork && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{
              width: '100%', height: 320,
              background: 'var(--color-surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', border: '1px solid var(--color-border)',
              borderRadius: '8px'
            }}>
              {selectedArtwork.imageUrl ? (
                <img src={selectedArtwork.imageUrl} alt={selectedArtwork.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ fontStyle: 'italic', color: 'var(--color-text-2)' }}>{t('artwork.assetNotFound')}</div>
              )}
            </div>

            {aiResult && (
              <div style={{
                padding: '24px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-accent-2)',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute', top: '-10px', left: '20px',
                  background: 'var(--color-accent-2)', color: 'white',
                  fontSize: '9px', padding: '2px 8px', textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}>
                  {t('artwork.aiEditorialInsights')}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid var(--color-accent-2)40', paddingBottom: 8 }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-2)' }}>{t('artwork.aiSafetyRating')} <strong style={{ color: 'var(--color-success)' }}>{aiResult.safety_rating.toUpperCase()}</strong></span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-2)' }}>{t('artwork.aiProtocol')} v1.0.4</span>
                </div>
                <h3 style={{ fontSize: 20, marginBottom: 12, fontStyle: 'italic', color: 'var(--color-text)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>{aiResult.suggested_title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 16, color: 'var(--color-text-2)' }}>{aiResult.style_description}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {aiResult.suggested_tags.map((tag: string) => (
                    <span key={tag} style={{
                      fontSize: '10px',
                      padding: '4px 10px',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-2)',
                      fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase'
                    }}>#{tag}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
              <DetailRow label={t('artwork.detailIdentityCode')} value={<code style={{ fontFamily: 'var(--font-mono)' }}>{selectedArtwork.id}</code>} />
              <DetailRow label={t('artwork.detailArtistName')} value={selectedArtwork.childName} />
              <DetailRow label={t('artwork.detailArtistAge')} value={`${selectedArtwork.childAge} ${t('artwork.years', 'Years')}`} />
              <DetailRow label={t('artwork.detailMedium')} value={selectedArtwork.category} />
              <DetailRow label={t('artwork.detailCuratorialStatus')} value={<StatusBadge status={selectedArtwork.status} />} />
              <DetailRow label={t('artwork.detailSubmissionDate')} value={dayjs(selectedArtwork.createdAt).format('YYYY-MM-DD')} />
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-text-2)', marginBottom: 8, letterSpacing: '0.05em' }}>{t('artwork.detailNarrativeLabel')}</div>
              <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--color-text)', fontStyle: 'italic', padding: '16px', background: 'var(--color-surface)', borderLeft: '3px solid var(--color-text-2)' }}>
                "{selectedArtwork.description}"
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--color-text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{value}</span>
    </div>
  );
}

const filterStyle: React.CSSProperties = {
  padding: '10px 16px',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  fontSize: '13px',
  background: 'var(--color-surface)',
  outline: 'none',
  fontFamily: 'var(--font-mono)',
  minWidth: '240px'
};
