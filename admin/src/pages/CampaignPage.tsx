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
import { fetchCampaigns, createCampaign, updateCampaign } from '../services/api';
import type { Campaign } from '../types';
import dayjs from 'dayjs';

export default function CampaignPage() {
  const { t } = useTranslation();
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
      toast.success(t('campaign.toastCreated'));
      setShowCreate(false);
      setForm({ title: '', description: '', startDate: '', endDate: '', targetAmount: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Campaign> }) => updateCampaign(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success(t('campaign.toastUpdated'));
      setEditCampaign(null);
    },
  });

  const columns: Column<Campaign>[] = [
    { key: 'title', title: t('campaign.colCampaignName'), sorter: true },
    { key: 'status', title: t('campaign.colStatus'), width: 100, render: (v) => <StatusBadge status={v} /> },
    { key: 'targetAmount', title: t('campaign.colTargetAmount'), width: 120, render: (v) => `\u00a5${v.toLocaleString()}` },
    { key: 'raisedAmount', title: t('campaign.colRaisedAmount'), width: 120, render: (v) => <span style={{ color: 'var(--color-success)' }}>\u00a5{v.toLocaleString()}</span> },
    { key: 'participantCount', title: t('campaign.colParticipants'), width: 100 },
    { key: 'artworkCount', title: t('campaign.colArtworks'), width: 80 },
    { key: 'startDate', title: t('campaign.colStartDate'), width: 110 },
    { key: 'endDate', title: t('campaign.colEndDate'), width: 110 },
    {
      key: 'action', title: t('campaign.colAction'), width: 180,
      render: (_: any, record: Campaign) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditCampaign(record); }}>
            {t('campaign.btnEdit')}
          </Button>
          {record.status === 'draft' && (
            <Button size="sm" variant="primary" onClick={(e) => {
              e.stopPropagation();
              updateMutation.mutate({ id: record.id, data: { status: 'active' } });
            }}>
              {t('campaign.btnActivate')}
            </Button>
          )}
          {record.status === 'active' && (
            <Button size="sm" variant="secondary" onClick={(e) => {
              e.stopPropagation();
              updateMutation.mutate({ id: record.id, data: { status: 'ended' } });
            }}>
              {t('campaign.btnEnd')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.startDate || !form.endDate) {
      toast.error(t('campaign.errorRequiredFields'));
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
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{t('campaign.title')}</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{t('campaign.description')}</p>
        </div>
        <Button variant="primary" onClick={() => { setShowCreate(true); setForm({ title: '', description: '', startDate: '', endDate: '', targetAmount: '' }); }}>
          {t('campaign.btnCreate')}
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
          <option value="">{t('campaign.filterAllStatuses')}</option>
          <option value="draft">{t('campaign.filterDraft')}</option>
          <option value="active">{t('campaign.filterActive')}</option>
          <option value="ended">{t('campaign.filterEnded')}</option>
          <option value="archived">{t('campaign.filterArchived')}</option>
        </select>
      </div>

      <DataTable columns={columns} data={data?.data || []} rowKey="id" loading={isLoading} />
      <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} pageSize={10} onPageChange={setPage} />

      <Modal
        open={showCreate || !!editCampaign}
        title={editCampaign ? t('campaign.modalEditTitle') : t('campaign.modalCreateTitle')}
        onClose={() => { setShowCreate(false); setEditCampaign(null); }}
        width={520}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowCreate(false); setEditCampaign(null); }}>{t('common.cancel')}</Button>
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
              {editCampaign ? t('campaign.btnSave') : t('campaign.btnCreateSubmit')}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{t('campaign.labelCampaignName')}</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} placeholder={t('campaign.namePlaceholder')} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{t('campaign.labelDescription')}</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, height: 80, resize: 'vertical' }} placeholder={t('campaign.descPlaceholder')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{t('campaign.labelStartDate')} *</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={inputStyle} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{t('campaign.labelEndDate')} *</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} style={inputStyle} required />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{t('campaign.labelTargetAmount')}</label>
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
