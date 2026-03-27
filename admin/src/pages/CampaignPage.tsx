import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { fetchCampaigns, createCampaign, updateCampaign } from '../services/api';
import type { Campaign } from '../types';
import dayjs from 'dayjs';

export default function CampaignPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', startDate: '', endDate: '', targetAmount: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', page, statusFilter],
    queryFn: () => fetchCampaigns({ page, pageSize: 10, status: statusFilter || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('活动创建成功');
      setShowCreate(false);
      setForm({ title: '', description: '', startDate: '', endDate: '', targetAmount: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Campaign> }) => updateCampaign(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('活动更新成功');
      setEditCampaign(null);
    },
  });

  const columns: Column<Campaign>[] = [
    { key: 'title', title: '活动名称', sorter: true },
    { key: 'status', title: '状态', width: 100, render: (v) => <StatusBadge status={v} /> },
    { key: 'targetAmount', title: '目标金额', width: 120, render: (v) => `\u00a5${v.toLocaleString()}` },
    { key: 'raisedAmount', title: '已筹金额', width: 120, render: (v) => <span style={{ color: 'var(--color-success)' }}>\u00a5{v.toLocaleString()}</span> },
    { key: 'participantCount', title: '参与人数', width: 100 },
    { key: 'artworkCount', title: '作品数', width: 80 },
    { key: 'startDate', title: '开始日期', width: 110 },
    { key: 'endDate', title: '结束日期', width: 110 },
    {
      key: 'action', title: '操作', width: 180,
      render: (_: any, record: Campaign) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditCampaign(record); }}>
            编辑
          </Button>
          {record.status === 'draft' && (
            <Button size="sm" variant="primary" onClick={(e) => {
              e.stopPropagation();
              updateMutation.mutate({ id: record.id, data: { status: 'active' } });
            }}>
              启用
            </Button>
          )}
          {record.status === 'active' && (
            <Button size="sm" variant="secondary" onClick={(e) => {
              e.stopPropagation();
              updateMutation.mutate({ id: record.id, data: { status: 'ended' } });
            }}>
              结束
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.startDate || !form.endDate) {
      toast.error('请填写必填字段');
      return;
    }
    createMutation.mutate({
      title: form.title,
      description: form.description,
      startDate: form.startDate,
      endDate: form.endDate,
      targetAmount: Number(form.targetAmount) || 0,
    });
  };

  const openEdit = (campaign: Campaign) => {
    setEditCampaign(campaign);
    setForm({
      title: campaign.title,
      description: campaign.description,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      targetAmount: String(campaign.targetAmount),
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>活动管理</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            创建和管理公益活动
          </p>
        </div>
        <Button variant="primary" onClick={() => { setShowCreate(true); setForm({ title: '', description: '', startDate: '', endDate: '', targetAmount: '' }); }}>
          + 创建活动
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{
            padding: '8px 12px', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)', fontSize: 13, background: 'var(--color-bg-card)',
          }}
        >
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="active">进行中</option>
          <option value="ended">已结束</option>
          <option value="archived">已归档</option>
        </select>
      </div>

      <DataTable columns={columns} data={data?.data || []} rowKey="id" loading={isLoading} />
      <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} pageSize={10} onPageChange={setPage} />

      {/* Create/Edit Modal */}
      <Modal
        open={showCreate || !!editCampaign}
        title={editCampaign ? '编辑活动' : '创建活动'}
        onClose={() => { setShowCreate(false); setEditCampaign(null); }}
        width={520}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowCreate(false); setEditCampaign(null); }}>取消</Button>
            <Button
              variant="primary"
              loading={createMutation.isPending || updateMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (editCampaign) {
                  updateMutation.mutate({ id: editCampaign.id, data: { title: form.title, description: form.description, startDate: form.startDate, endDate: form.endDate, targetAmount: Number(form.targetAmount) || 0 } });
                } else {
                  handleSubmit(e as any);
                }
              }}
            >
              {editCampaign ? '保存' : '创建'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>活动名称 *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} placeholder="请输入活动名称" required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>活动描述</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, height: 80, resize: 'vertical' }} placeholder="请输入活动描述" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>开始日期 *</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={inputStyle} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>结束日期 *</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} style={inputStyle} required />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>目标金额 (\u00a5)</label>
            <input type="number" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} style={inputStyle} placeholder="0" />
          </div>
        </form>
      </Modal>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 13, outline: 'none',
  boxSizing: 'border-box',
};
