import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import ImageUploadField from '../components/ui/ImageUploadField';
import { PageHeader } from '../components/ui/PageHeader';
import { SummaryCard, MiniStat } from '../components/ui/SummaryCard';
import { ReviewStatusChart } from '../components/charts/ReviewStatusChart';
import { fetchArtworks, fetchArtworkByCategory, updateArtworkStatus, updateArtwork, deleteArtwork, analyzeArtwork, uploadTraceMedia, adminCreateArtwork } from '../services/api';
import type { Artwork } from '../types';
import dayjs from 'dayjs';
import { formatDateTime } from '../utils/dateTime';

// Safe text rendering - prevents XSS without dangerouslySetInnerHTML
function SafeText({ text }: { text?: string }) {
  if (!text) return null;
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  return <>{escaped}</>;
}

// Icons
const SearchIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const LayersIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const AlertIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const CheckIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function ArtworkPage() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [detailModal, setDetailModal] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [editingImageUrl, setEditingImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create-artwork modal state
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    artistName: 'Admin',
  });
  const [createImageUploading, setCreateImageUploading] = useState(false);
  const createFileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['artworks', page, statusFilter, search, sortBy, sortOrder],
    queryFn: () => fetchArtworks({ page, pageSize: 20, status: statusFilter || undefined, search: search || undefined, sortBy, sortOrder }),
  });

  const { data: artworkStatsData } = useQuery({
    queryKey: ['artworkStats'],
    queryFn: fetchArtworkByCategory,
    staleTime: 5 * 60 * 1000,
  });

  const artworks = data?.data || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Artwork['status'] }) => updateArtworkStatus(id, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['artworkStats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardArtworkStats'] });
      toast.success(vars.status === 'approved' ? t('artwork.toastApproved') : t('artwork.toastRejected'));
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.detail ?? t('generic.error'));
    },
  });

  const updateArtworkMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Artwork> }) =>
      updateArtwork(id, {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['artworkStats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardArtworkStats'] });
      toast.success(t('common.saveSuccess'));
    },
    onError: () => {
      toast.error(t('common.saveFailed'));
    },
  });

  const deleteArtworkMutation = useMutation({
    mutationFn: deleteArtwork,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['artworkStats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardArtworkStats'] });
      setDetailModal(false);
      setSelectedArtwork(null);
      toast.success(t('common.deleteSuccess'));
    },
    onError: () => {
      toast.error(t('common.deleteFailed'));
    },
  });

  const createArtworkMutation = useMutation({
    mutationFn: (payload: { title: string; description?: string; image_url: string; artist_name: string }) =>
      adminCreateArtwork(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['artworkStats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardArtworkStats'] });
      setCreateModal(false);
      setCreateForm({ title: '', description: '', imageUrl: '', artistName: 'Admin' });
      toast.success(t('common.saveSuccess', '添加成功'));
    },
    onError: () => {
      toast.error(t('common.saveFailed', '添加失败'));
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
    },
  });

  // Calculate summary stats
  const summaryStats = {
    total: artworks.length,
    pending: artworks.filter((a: Artwork) => a.status === 'pending').length,
    approved: artworks.filter((a: Artwork) => a.status === 'approved').length,
    rejected: artworks.filter((a: Artwork) => a.status === 'rejected').length,
  };

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
    setEditingImageUrl(artwork.imageUrl || '');
    setAiResult(null);
    setDetailModal(true);
  };

  const handleArtworkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadTraceMedia(file);
      setEditingImageUrl(result.url);
      toast.success(t('common.uploadSuccess'));
    } catch {
      toast.error(t('common.uploadFailed'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCreateImageUploading(true);
    try {
      const result = await uploadTraceMedia(file);
      setCreateForm({ ...createForm, imageUrl: result.url });
      toast.success(t('common.uploadSuccess'));
    } catch {
      toast.error(t('common.uploadFailed'));
    } finally {
      setCreateImageUploading(false);
      if (createFileInputRef.current) createFileInputRef.current.value = '';
    }
  };

  const handleCreateSubmit = () => {
    if (!createForm.title || !createForm.imageUrl) {
      toast.error(t('campaign.errorRequiredFields', '请填写必填字段'));
      return;
    }
    createArtworkMutation.mutate({
      title: createForm.title,
      description: createForm.description || undefined,
      image_url: createForm.imageUrl,
      artist_name: createForm.artistName || 'Admin',
    });
  };

  const columns: Column<Artwork>[] = [
    {
      key: 'id',
      title: t('artwork.colArchiveId'),
      width: 100,
      render: (v) => <code className="table-text-mono">{v}</code>,
    },
    {
      key: 'title',
      title: t('artwork.colWorkTitle'),
      minWidth: 200,
      sorter: true,
      render: (v: string, record: Artwork) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {record.imageUrl && (
            <img
              src={record.imageUrl}
              alt={v}
              style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--color-border)' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <span className="table-text-truncate" style={{ maxWidth: 180, fontWeight: 600 }}>
            <SafeText text={v} />
          </span>
        </div>
      ),
    },
    { key: 'childName', title: t('artwork.colArtist'), width: 100 },
    { key: 'category', title: t('artwork.colMedium'), width: 100 },
    {
      key: 'votes',
      title: t('artwork.colImpact'),
      width: 80,
      sorter: true,
      render: (v) => <span className="table-text-mono">{v} pts</span>,
    },
    {
      key: 'status',
      title: t('artwork.colStatus'),
      width: 100,
      render: (v) => <StatusBadge status={v} context="artwork" />,
    },
    {
      key: 'createdAt',
      title: t('artwork.colSubmitted'),
      width: 140,
      sorter: true,
      render: (v) => formatDateTime(v),
    },
    {
      key: 'action',
      title: t('artwork.colCommand'),
      width: 200,
      render: (_: any, record: Artwork) => (
        <div className="table-actions">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDetail(record);
            }}
          >
            {t('artwork.btnInspect')}
          </Button>
          {record.status === 'pending' && (
            <Button
              size="sm"
              variant="primary"
              onClick={(e) => {
                e.stopPropagation();
                updateMutation.mutate({ id: record.id, status: 'approved' });
              }}
            >
              {t('artwork.btnApprove')}
            </Button>
          )}
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              deleteArtworkMutation.mutate(record.id);
            }}
          >
            {t('common.delete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('artwork.title')}
        description={t('artwork.description')}
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setCreateForm({ title: '', description: '', imageUrl: '', artistName: 'Admin' });
              setCreateModal(true);
            }}
          >
            + {t('artwork.btnCreate', '添加作品')}
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="dashboard-summary-grid" style={{ marginBottom: 24 }}>
        <SummaryCard title={t('artwork.summaryTotalTitle')} subtitle={t('artwork.summaryTotalSubtitle')} icon={LayersIcon}>
          <MiniStat label={t('artwork.summaryAllWorks')} value={summaryStats.total} />
          <MiniStat label={t('common.miniStatThisWeek')} value={artworks.filter((a: Artwork) => dayjs(a.createdAt).isAfter(dayjs().subtract(7, 'day'))).length} change={8} />
        </SummaryCard>
        <SummaryCard title={t('artwork.summaryPendingTitle')} subtitle={t('artwork.summaryPendingSubtitle')} icon={AlertIcon}>
          <MiniStat label={t('artwork.summaryPendingWorks')} value={summaryStats.pending} trend="warning" />
          <MiniStat label={t('artwork.summaryToHandle')} value={`${summaryStats.pending} ${t('artwork.summaryItems')}`} />
        </SummaryCard>
        <SummaryCard title={t('artwork.summaryReviewedTitle')} subtitle={t('artwork.summaryReviewedSubtitle')} icon={CheckIcon}>
          <MiniStat label={t('artwork.summaryApproved')} value={summaryStats.approved} trend="up" />
          <MiniStat label={t('artwork.summaryRejected')} value={summaryStats.rejected} />
        </SummaryCard>
      </div>

      {/* Chart */}
      <div style={{ marginBottom: 24 }}>
        <ReviewStatusChart data={artworkStatsData ?? []} />
      </div>

      {/* Filters */}
      <div className="table-toolbar">
        <div className="table-toolbar__filters">
          <div className="table-search">
            {SearchIcon}
            <input
              type="text"
              placeholder={t('artwork.searchPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="table-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t('artwork.filterAll')}</option>
            <option value="pending">{t('artwork.filterPending')}</option>
            <option value="approved">{t('artwork.filterApproved')}</option>
            <option value="rejected">{t('artwork.filterRejected')}</option>
            <option value="archived">{t('artwork.filterArchived')}</option>
          </select>
        </div>
      </div>

      {isError && (
        <div style={{ padding: 16, marginBottom: 16, background: 'var(--color-danger-bg, #fef2f2)', border: '1px solid var(--color-danger-border, #fecaca)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-danger, #dc2626)', fontSize: 14 }}>{t('generic.error')}</span>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ['artworks'] })} style={{ padding: '4px 12px', fontSize: 13, cursor: 'pointer', border: '1px solid var(--color-border)', borderRadius: 4, background: 'transparent' }}>{t('generic.retry', 'Retry')}</button>
        </div>
      )}
      <DataTable
        columns={columns}
        data={artworks}
        rowKey="id"
        loading={isLoading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onRowClick={(record) => handleOpenDetail(record)}
      />

      <div style={{ marginTop: 24 }}>
        <Pagination
          page={page}
          totalPages={data?.totalPages || 1}
          total={data?.total || 0}
          pageSize={20}
          onPageChange={setPage}
        />
      </div>

      {/* Detail Modal */}
      <Modal
        open={detailModal}
        title={t('artwork.modalTitle')}
        onClose={() => setDetailModal(false)}
        width={650}
        footer={
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setDetailModal(false)}>
              {t('common.close')}
            </Button>
            {selectedArtwork?.status === 'pending' && (
              <>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (selectedArtwork) {
                      updateMutation.mutate({ id: selectedArtwork.id, status: 'rejected' });
                      setDetailModal(false);
                    }
                  }}
                >
                  {t('artwork.btnReject')}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (selectedArtwork) {
                      updateMutation.mutate({ id: selectedArtwork.id, status: 'approved' });
                      setDetailModal(false);
                    }
                  }}
                >
                  {t('artwork.btnApprove')}
                </Button>
              </>
            )}
            {selectedArtwork && (
              <Button
                variant="danger"
                onClick={() => deleteArtworkMutation.mutate(selectedArtwork.id)}
                loading={deleteArtworkMutation.isPending}
              >
                {t('common.delete')}
              </Button>
            )}
          </div>
        }
      >
        {selectedArtwork && (
          <div className="modal-detail-grid">
            <div className="modal-detail-row">
              <span className="modal-detail-label">ID</span>
              <code className="table-text-mono">{selectedArtwork.id}</code>
            </div>
            <div className="modal-detail-row">
              <span className="modal-detail-label">{t('artwork.colStatus')}</span>
              <StatusBadge status={selectedArtwork.status} context="artwork" />
            </div>
            <div className="modal-detail-full">
              <span className="modal-detail-label">{t('artwork.colWorkTitle')}</span>
              <span className="modal-detail-value">
                <SafeText text={selectedArtwork.title} />
              </span>
            </div>
            <div className="modal-detail-row">
              <span className="modal-detail-label">{t('artwork.colArtist')}</span>
              <span className="modal-detail-value">{selectedArtwork.childName}</span>
            </div>
            <div className="modal-detail-row">
              <span className="modal-detail-label">{t('artwork.colMedium')}</span>
              <span className="modal-detail-value">{selectedArtwork.category}</span>
            </div>
            <div className="modal-detail-row">
              <span className="modal-detail-label">{t('artwork.colImpact')}</span>
              <span className="modal-detail-value">{selectedArtwork.votes} pts</span>
            </div>
            <div className="modal-detail-row">
              <span className="modal-detail-label">{t('artwork.colSubmitted')}</span>
              <span className="modal-detail-value">{formatDateTime(selectedArtwork.createdAt)}</span>
            </div>
            {selectedArtwork.description && (
              <div className="modal-detail-full">
                <span className="modal-detail-label">Description</span>
                <div className="modal-detail-box">
                  <SafeText text={selectedArtwork.description} />
                </div>
              </div>
            )}
            <div className="modal-detail-full">
              <span className="modal-detail-label">Image URL</span>
              <input
                value={editingImageUrl}
                onChange={(e) => setEditingImageUrl(e.target.value)}
                className="table-search"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-border)' }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleArtworkImageUpload}
                  style={{ display: 'none' }}
                />
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()} loading={uploading}>
                  {t('common.uploadImage')}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (!selectedArtwork) return;
                    updateArtworkMutation.mutate({
                      id: selectedArtwork.id,
                      data: { imageUrl: editingImageUrl },
                    });
                  }}
                  loading={updateArtworkMutation.isPending}
                >
                  {t('common.save')}
                </Button>
              </div>
              {editingImageUrl && (
                <img
                  src={editingImageUrl}
                  alt="artwork-preview"
                  style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, marginTop: 10, border: '1px solid var(--color-border)' }}
                />
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create Artwork Modal */}
      <Modal
        open={createModal}
        title={t('artwork.modalCreateTitle', '添加作品')}
        onClose={() => setCreateModal(false)}
        width={560}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateModal(false)}>
              {t('common.cancel', '取消')}
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateSubmit}
              loading={createArtworkMutation.isPending}
            >
              {t('common.save', '保存')}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 5, color: 'var(--color-text-2)' }}>
              {t('artwork.colWorkTitle', '标题')} *
            </label>
            <input
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', background: 'var(--color-bg)', color: 'var(--color-text)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 5, color: 'var(--color-text-2)' }}>
              {t('artwork.colArtist', '作者')}
            </label>
            <input
              value={createForm.artistName}
              onChange={(e) => setCreateForm({ ...createForm, artistName: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', background: 'var(--color-bg)', color: 'var(--color-text)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 5, color: 'var(--color-text-2)' }}>
              {t('artwork.colDescription', '描述')}
            </label>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 13, minHeight: 60, boxSizing: 'border-box', background: 'var(--color-bg)', color: 'var(--color-text)' }}
            />
          </div>
          <div>
            <ImageUploadField
              label={t('artwork.colImage', '图片') + ' *'}
              value={createForm.imageUrl}
              onChange={(url) => setCreateForm({ ...createForm, imageUrl: url })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}