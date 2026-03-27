import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { fetchArtworks, updateArtworkStatus } from '../services/api';
import type { Artwork } from '../types';
import dayjs from 'dayjs';

const columns: Column<Artwork>[] = [
  { key: 'id', title: 'ID', width: 80 },
  { key: 'title', title: '作品名称', sorter: true },
  { key: 'childName', title: '作者', width: 100 },
  { key: 'category', title: '类别', width: 100 },
  { key: 'votes', title: '票数', width: 80, sorter: true },
  { key: 'status', title: '状态', width: 100, render: (v) => <StatusBadge status={v} /> },
  { key: 'createdAt', title: '提交时间', width: 160, sorter: true, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
  { key: 'action', title: '操作', width: 200 },
];

export default function ArtworkPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [detailModal, setDetailModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['artworks', page, statusFilter, search, sortBy, sortOrder],
    queryFn: () => fetchArtworks({ page, pageSize: 10, status: statusFilter || undefined, search: search || undefined, sortBy, sortOrder }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Artwork['status'] }) => updateArtworkStatus(id, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      toast.success(vars.status === 'approved' ? '作品已通过审核' : '作品已拒绝');
    },
  });

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const renderColumns: Column<Artwork>[] = columns.map((col) => {
    if (col.key === 'action') {
      return {
        ...col,
        render: (_: any, record: Artwork) => (
          <div style={{ display: 'flex', gap: 6 }}>
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedArtwork(record); setDetailModal(true); }}>
              查看
            </Button>
            {record.status === 'pending' && (
              <>
                <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); updateMutation.mutate({ id: record.id, status: 'approved' }); }}>
                  通过
                </Button>
                <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); updateMutation.mutate({ id: record.id, status: 'rejected' }); }}>
                  拒绝
                </Button>
              </>
            )}
          </div>
        ),
      };
    }
    return col;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>作品管理</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            审核和管理儿童画作作品
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <input
          type="text"
          placeholder="搜索作品名称..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{
            padding: '8px 14px', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)', fontSize: 13, width: 220, outline: 'none',
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{
            padding: '8px 12px', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)', fontSize: 13, outline: 'none',
            background: 'var(--color-bg-card)',
          }}
        >
          <option value="">全部状态</option>
          <option value="pending">待审核</option>
          <option value="approved">已通过</option>
          <option value="rejected">已拒绝</option>
          <option value="archived">已归档</option>
        </select>
      </div>

      <DataTable
        columns={renderColumns}
        data={data?.data || []}
        rowKey="id"
        loading={isLoading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onRowClick={(record) => { setSelectedArtwork(record); setDetailModal(true); }}
      />

      <Pagination
        page={page}
        totalPages={data?.totalPages || 1}
        total={data?.total || 0}
        pageSize={10}
        onPageChange={setPage}
      />

      {/* Detail Modal */}
      <Modal
        open={detailModal}
        title="作品详情"
        onClose={() => setDetailModal(false)}
        width={560}
        footer={
          selectedArtwork?.status === 'pending' ? (
            <>
              <Button variant="secondary" onClick={() => setDetailModal(false)}>关闭</Button>
              <Button variant="danger" onClick={() => { updateMutation.mutate({ id: selectedArtwork.id, status: 'rejected' }); setDetailModal(false); }}>拒绝</Button>
              <Button variant="primary" onClick={() => { updateMutation.mutate({ id: selectedArtwork.id, status: 'approved' }); setDetailModal(false); }}>通过审核</Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setDetailModal(false)}>关闭</Button>
          )
        }
      >
        {selectedArtwork && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              width: '100%', height: 200,
              background: '#f5f3f0', borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-light)', fontSize: 13,
            }}>
              [作品图片预览区]
            </div>
            <DetailRow label="作品编号" value={selectedArtwork.id} />
            <DetailRow label="作品名称" value={selectedArtwork.title} />
            <DetailRow label="作者" value={`${selectedArtwork.childName} (${selectedArtwork.childAge}岁)`} />
            <DetailRow label="类别" value={selectedArtwork.category} />
            <DetailRow label="票数" value={selectedArtwork.votes.toString()} />
            <DetailRow label="状态" value={<StatusBadge status={selectedArtwork.status} />} />
            <DetailRow label="提交时间" value={dayjs(selectedArtwork.createdAt).format('YYYY-MM-DD HH:mm:ss')} />
            {selectedArtwork.reviewedAt && (
              <>
                <DetailRow label="审核时间" value={dayjs(selectedArtwork.reviewedAt).format('YYYY-MM-DD HH:mm:ss')} />
                <DetailRow label="审核人" value={selectedArtwork.reviewedBy || '-'} />
              </>
            )}
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>作品描述</div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>{selectedArtwork.description}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
    </div>
  );
}
