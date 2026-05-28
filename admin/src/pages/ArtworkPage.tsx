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
import { PageHeader } from '../components/ui/PageHeader';
import { SummaryCard, MiniStat } from '../components/ui/SummaryCard';
import { ReviewStatusChart } from '../components/charts/ReviewStatusChart';
import { fetchArtworks, updateArtworkStatus, analyzeArtwork } from '../services/api';
import type { Artwork } from '../types';
import dayjs from 'dayjs';

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
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['artworks', page, statusFilter, search, sortBy, sortOrder],
    queryFn: () => fetchArtworks({ page, pageSize: 10, status: statusFilter || undefined, search: search || undefined, sortBy, sortOrder }),
  });

  const artworks = data?.data || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Artwork['status'] }) => updateArtworkStatus(id, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      toast.success(vars.status === 'approved' ? t('artwork.toastApproved') : t('artwork.toastRejected'));
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
    setAiResult(null);
    setDetailModal(true);
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
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: 'createdAt',
      title: t('artwork.colSubmitted'),
      width: 140,
      sorter: true,
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      key: 'action',
      title: t('artwork.colCommand'),
      width: 180,
      render: (_: any, record: Artwork) => (
        <div className="table-actions">
          <Button
            size="sm"
            variant="ghost"
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
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t('artwork.title')} description={t('artwork.description')} />

      {/* Summary Cards */}
      <div className="dashboard-summary-grid" style={{ marginBottom: 24 }}>
        <SummaryCard title="Total Works" subtitle="作品总数" icon={LayersIcon}>
          <MiniStat label="全部作品" value={summaryStats.total} />
          <MiniStat label="本周新增" value={artworks.filter((a: Artwork) => dayjs(a.createdAt).isAfter(dayjs().subtract(7, 'day'))).length} change={8} />
        </SummaryCard>
        <SummaryCard title="Pending" subtitle="待审核" icon={AlertIcon}>
          <MiniStat label="待审核" value={summaryStats.pending} trend="warning" />
          <MiniStat label="需处理" value={`${summaryStats.pending} 项`} />
        </SummaryCard>
        <SummaryCard title="Reviewed" subtitle="已审核" icon={CheckIcon}>
          <MiniStat label="已通过" value={summaryStats.approved} trend="up" />
          <MiniStat label="已拒绝" value={summaryStats.rejected} />
        </SummaryCard>
      </div>

      {/* Chart */}
      <div style={{ marginBottom: 24 }}>
        <ReviewStatusChart />
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
          pageSize={10}
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
            <Button variant="ghost" onClick={() => setDetailModal(false)}>
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
              <StatusBadge status={selectedArtwork.status} />
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
              <span className="modal-detail-value">{dayjs(selectedArtwork.createdAt).format('YYYY-MM-DD HH:mm')}</span>
            </div>
            {selectedArtwork.description && (
              <div className="modal-detail-full">
                <span className="modal-detail-label">Description</span>
                <div className="modal-detail-box">
                  <SafeText text={selectedArtwork.description} />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}