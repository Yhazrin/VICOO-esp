import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { PageHeader } from '../components/ui/PageHeader';
import { SummaryCard, MiniStat } from '../components/ui/SummaryCard';
import { fetchCampaigns, createCampaign, updateCampaign, deleteCampaign, uploadTraceMedia, fetchArtworks } from '../services/api';
import type { Campaign, Artwork } from '../types';
import dayjs from 'dayjs';

// Icons
const TargetIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const MoneyIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const ChartIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px',
  border: '1px solid var(--color-border)', borderRadius: '6px',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
  background: 'var(--color-bg)', color: 'var(--color-text)',
};

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 5, color: 'var(--color-text-2)' };

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
  color: 'var(--color-text-3)', marginBottom: 12, paddingBottom: 8,
  borderBottom: '1px solid var(--color-border)',
};

type EditTab = 'basic' | 'sustainability' | 'artworks';

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '10px 20px', fontSize: 13, fontWeight: active ? 600 : 400,
        color: active ? 'var(--color-accent-2)' : 'var(--color-text-3)',
        background: 'transparent', border: 'none',
        borderBottom: active ? '2px solid var(--color-accent-2)' : '2px solid transparent',
        cursor: 'pointer', transition: 'all .15s',
      }}
    >
      {label}
    </button>
  );
}

const emptyForm = {
  title: '', subtitle: '', description: '', coverImage: '',
  startDate: '', endDate: '', targetAmount: '',
  sustainabilityEyebrow: '', sustainabilityTitle: '', sustainabilitySubtitle: '',
  sustainabilityP1Title: '', sustainabilityP1Body: '',
  sustainabilityP2Title: '', sustainabilityP2Body: '',
  sustainabilityP3Title: '', sustainabilityP3Body: '',
  sustainabilityP4Title: '', sustainabilityP4Body: '',
  sustainabilityFootnote: '', sustainabilityCtaTraceability: '', sustainabilityCtaShop: '',
};

export default function CampaignPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState<EditTab>('basic');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteCampaignId, setDeleteCampaignId] = useState<string | null>(null);

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
      setForm(emptyForm);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.message || t('campaign.errorCreateFailed');
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Campaign> }) => updateCampaign(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success(t('campaign.toastUpdated'));
      setEditCampaign(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.message || t('campaign.errorUpdateFailed');
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success(t('common.deleteSuccess', '删除成功'));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.message || t('common.deleteFailed', '删除失败');
      toast.error(msg);
    },
  });

// Fetch artworks for the campaign being edited
  const { data: campaignArtworks } = useQuery({
    queryKey: ['campaign-artworks', editCampaign?.id],
    queryFn: () => fetchArtworks({ campaignId: editCampaign?.id }),
    enabled: !!editCampaign?.id,
  });

  const campaigns = data?.data || [];

  // Summary stats
  const summaryStats = {
    total: campaigns.length,
    active: campaigns.filter((c: Campaign) => c.status === 'active').length,
    raised: campaigns.reduce((sum: number, c: Campaign) => sum + (c.raisedAmount || 0), 0),
    drafts: campaigns.filter((c: Campaign) => c.status === 'draft').length,
  };

  const columns: Column<Campaign>[] = [
    {
      key: 'title', title: t('campaign.colCampaignName'), sorter: true,
      render: (v: string, record: Campaign) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {record.coverImage && (
            <img
              src={record.coverImage}
              alt={v}
              style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--color-border)' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <span className="table-text-bold">{v}</span>
        </div>
      ),
    },
    { key: 'status', title: t('campaign.colStatus'), width: 100, render: (v) => <StatusBadge status={v} context="campaign" /> },
    { key: 'targetAmount', title: t('campaign.colTargetAmount'), width: 120, render: (v) => <span className="table-text-mono">¥{v.toLocaleString('zh-CN')}</span> },
    { key: 'raisedAmount', title: t('campaign.colRaisedAmount'), width: 120, render: (v) => (
      <span className="table-text-mono" style={{ color: 'var(--color-success)' }}>¥{v.toLocaleString('zh-CN')}</span>
    ) },
    { key: 'startDate', title: t('campaign.colStartDate'), width: 110, render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
    { key: 'endDate', title: t('campaign.colEndDate'), width: 110, render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
    {
      key: 'action', title: t('campaign.colAction'), width: 180,
      render: (_: any, record: Campaign) => (
        <div className="table-actions">
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(record); }}>
            {t('campaign.btnEdit')}
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteCampaignId(record.id);
              setDeleteConfirmOpen(true);
            }}
          >
            {t('common.delete', '删除')}
          </Button>
          {record.status === 'draft' && (
            <Button size="sm" variant="primary" onClick={(e) => {
              e.stopPropagation();
              updateMutation.mutate({ id: record.id, data: { status: 'active' } });
            }}>
              {t('campaign.btnActivate')}
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
    const goalAmount = Number(form.targetAmount);
    if (!form.targetAmount || isNaN(goalAmount) || goalAmount <= 0) {
      toast.error(t('campaign.errorGoalAmount'));
      return;
    }
    createMutation.mutate({
      title: form.title,
      subtitle: form.subtitle || undefined,
      description: form.description,
      coverImage: form.coverImage || undefined,
      startDate: form.startDate,
      endDate: form.endDate,
      targetAmount: goalAmount,
      sustainabilityEyebrow: form.sustainabilityEyebrow || undefined,
      sustainabilityTitle: form.sustainabilityTitle || undefined,
      sustainabilitySubtitle: form.sustainabilitySubtitle || undefined,
      sustainabilityP1Title: form.sustainabilityP1Title || undefined,
      sustainabilityP1Body: form.sustainabilityP1Body || undefined,
      sustainabilityP2Title: form.sustainabilityP2Title || undefined,
      sustainabilityP2Body: form.sustainabilityP2Body || undefined,
      sustainabilityP3Title: form.sustainabilityP3Title || undefined,
      sustainabilityP3Body: form.sustainabilityP3Body || undefined,
      sustainabilityP4Title: form.sustainabilityP4Title || undefined,
      sustainabilityP4Body: form.sustainabilityP4Body || undefined,
      sustainabilityFootnote: form.sustainabilityFootnote || undefined,
      sustainabilityCtaTraceability: form.sustainabilityCtaTraceability || undefined,
      sustainabilityCtaShop: form.sustainabilityCtaShop || undefined,
    });
  };

  const openEdit = (campaign: Campaign) => {
    setEditCampaign(campaign);
    setForm({
      title: campaign.title,
      subtitle: campaign.subtitle || '',
      description: campaign.description || '',
      coverImage: campaign.coverImage || '',
      startDate: campaign.startDate ? dayjs(campaign.startDate).format('YYYY-MM-DD') : '',
      endDate: campaign.endDate ? dayjs(campaign.endDate).format('YYYY-MM-DD') : '',
      targetAmount: String(campaign.targetAmount),
      sustainabilityEyebrow: campaign.sustainabilityEyebrow || '',
      sustainabilityTitle: campaign.sustainabilityTitle || '',
      sustainabilitySubtitle: campaign.sustainabilitySubtitle || '',
      sustainabilityP1Title: campaign.sustainabilityP1Title || '',
      sustainabilityP1Body: campaign.sustainabilityP1Body || '',
      sustainabilityP2Title: campaign.sustainabilityP2Title || '',
      sustainabilityP2Body: campaign.sustainabilityP2Body || '',
      sustainabilityP3Title: campaign.sustainabilityP3Title || '',
      sustainabilityP3Body: campaign.sustainabilityP3Body || '',
      sustainabilityP4Title: campaign.sustainabilityP4Title || '',
      sustainabilityP4Body: campaign.sustainabilityP4Body || '',
      sustainabilityFootnote: campaign.sustainabilityFootnote || '',
      sustainabilityCtaTraceability: campaign.sustainabilityCtaTraceability || '',
      sustainabilityCtaShop: campaign.sustainabilityCtaShop || '',
    });
    setActiveTab('basic');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadTraceMedia(file);
      setForm({ ...form, coverImage: result.url });
      toast.success(t('common.uploadSuccess'));
    } catch {
      toast.error(t('common.uploadFailed'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    if (!editCampaign) return;
    updateMutation.mutate({
      id: editCampaign.id,
      data: {
        title: form.title,
        subtitle: form.subtitle || undefined,
        description: form.description || undefined,
        coverImage: form.coverImage || undefined,
        startDate: form.startDate,
        endDate: form.endDate,
        targetAmount: Number(form.targetAmount) || 0,
        sustainabilityEyebrow: form.sustainabilityEyebrow || undefined,
        sustainabilityTitle: form.sustainabilityTitle || undefined,
        sustainabilitySubtitle: form.sustainabilitySubtitle || undefined,
        sustainabilityP1Title: form.sustainabilityP1Title || undefined,
        sustainabilityP1Body: form.sustainabilityP1Body || undefined,
        sustainabilityP2Title: form.sustainabilityP2Title || undefined,
        sustainabilityP2Body: form.sustainabilityP2Body || undefined,
        sustainabilityP3Title: form.sustainabilityP3Title || undefined,
        sustainabilityP3Body: form.sustainabilityP3Body || undefined,
        sustainabilityP4Title: form.sustainabilityP4Title || undefined,
        sustainabilityP4Body: form.sustainabilityP4Body || undefined,
        sustainabilityFootnote: form.sustainabilityFootnote || undefined,
        sustainabilityCtaTraceability: form.sustainabilityCtaTraceability || undefined,
        sustainabilityCtaShop: form.sustainabilityCtaShop || undefined,
      },
    });
  };

  const renderBasicTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>{t('campaign.labelCampaignName')}</label>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} placeholder={t('campaign.namePlaceholder')} />
      </div>
      <div>
        <label style={labelStyle}>{t('campaign.labelSubtitle')}</label>
        <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} style={inputStyle} placeholder={t('campaign.subtitlePlaceholder')} />
      </div>
      <div>
        <label style={labelStyle}>{t('campaign.labelDescription')}</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, height: 80, resize: 'vertical' }} placeholder={t('campaign.descPlaceholder')} />
      </div>
      <div>
        <label style={labelStyle}>{t('campaign.labelCoverImage')}</label>
        <input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} style={inputStyle} placeholder="https://..." />
        {form.coverImage && (
          <img src={form.coverImage} alt="preview" style={{ height: 80, borderRadius: 8, objectFit: 'cover', marginTop: 8 }} />
        )}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ marginTop: 8, ...inputStyle, width: 'auto', cursor: 'pointer' }}>
          {uploading ? t('common.uploading') : t('common.uploadImage')}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>{t('campaign.labelStartDate')} *</label>
          <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>{t('campaign.labelEndDate')} *</label>
          <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} style={inputStyle} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>{t('campaign.labelTargetAmount')}</label>
        <input type="number" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} style={inputStyle} placeholder="0" />
      </div>
    </div>
  );

  const renderSustainabilityTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={sectionTitleStyle}>{t('campaign.sectionSustainabilityHeader')}</div>
      <div>
        <label style={labelStyle}>{t('campaign.labelSustainabilityEyebrow')}</label>
        <input value={form.sustainabilityEyebrow} onChange={(e) => setForm({ ...form, sustainabilityEyebrow: e.target.value })} style={inputStyle} placeholder="Materials · Welfare · Environment" />
      </div>
      <div>
        <label style={labelStyle}>{t('campaign.labelSustainabilityTitle')}</label>
        <input value={form.sustainabilityTitle} onChange={(e) => setForm({ ...form, sustainabilityTitle: e.target.value })} style={inputStyle} placeholder={t('campaign.sustainabilityTitlePlaceholder')} />
      </div>
      <div>
        <label style={labelStyle}>{t('campaign.labelSustainabilitySubtitle')}</label>
        <textarea value={form.sustainabilitySubtitle} onChange={(e) => setForm({ ...form, sustainabilitySubtitle: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'vertical' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>{t('campaign.labelP1Title')}</label>
          <input value={form.sustainabilityP1Title} onChange={(e) => setForm({ ...form, sustainabilityP1Title: e.target.value })} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>{t('campaign.labelP2Title')}</label>
          <input value={form.sustainabilityP2Title} onChange={(e) => setForm({ ...form, sustainabilityP2Title: e.target.value })} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>{t('campaign.labelP3Title')}</label>
          <input value={form.sustainabilityP3Title} onChange={(e) => setForm({ ...form, sustainabilityP3Title: e.target.value })} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>{t('campaign.labelP4Title')}</label>
          <input value={form.sustainabilityP4Title} onChange={(e) => setForm({ ...form, sustainabilityP4Title: e.target.value })} style={inputStyle} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>{t('campaign.labelP1Body')}</label>
        <textarea value={form.sustainabilityP1Body} onChange={(e) => setForm({ ...form, sustainabilityP1Body: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'vertical' }} />
      </div>
      <div>
        <label style={labelStyle}>{t('campaign.labelP2Body')}</label>
        <textarea value={form.sustainabilityP2Body} onChange={(e) => setForm({ ...form, sustainabilityP2Body: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'vertical' }} />
      </div>
      <div>
        <label style={labelStyle}>{t('campaign.labelP3Body')}</label>
        <textarea value={form.sustainabilityP3Body} onChange={(e) => setForm({ ...form, sustainabilityP3Body: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'vertical' }} />
      </div>
      <div>
        <label style={labelStyle}>{t('campaign.labelP4Body')}</label>
        <textarea value={form.sustainabilityP4Body} onChange={(e) => setForm({ ...form, sustainabilityP4Body: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'vertical' }} />
      </div>
      <div>
        <label style={labelStyle}>{t('campaign.labelFootnote')}</label>
        <textarea value={form.sustainabilityFootnote} onChange={(e) => setForm({ ...form, sustainabilityFootnote: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'vertical' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>{t('campaign.labelCtaTraceability')}</label>
          <input value={form.sustainabilityCtaTraceability} onChange={(e) => setForm({ ...form, sustainabilityCtaTraceability: e.target.value })} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>{t('campaign.labelCtaShop')}</label>
          <input value={form.sustainabilityCtaShop} onChange={(e) => setForm({ ...form, sustainabilityCtaShop: e.target.value })} style={inputStyle} />
        </div>
      </div>
    </div>
  );

  const renderArtworksTab = () => {
    const artworks = campaignArtworks?.data || [];
    const artworkColumns: Column<Artwork>[] = [
      { key: 'title', title: t('artwork.colTitle'), sorter: true },
      { key: 'childName', title: t('artwork.colChild'), width: 120 },
      { key: 'status', title: t('artwork.colStatus'), width: 100, render: (v) => <StatusBadge status={v} context="artwork" /> },
      { key: 'createdAt', title: t('artwork.colDate'), width: 110, render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
    ];

    return (
      <div>
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-2)' }}>
            {t('campaign.artworksInfo', { count: artworks.length })}
          </p>
        </div>
        {artworks.length > 0 ? (
          <DataTable columns={artworkColumns} data={artworks} rowKey="id" loading={!campaignArtworks} />
        ) : (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-3)' }}>
            {t('campaign.noArtworks')}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title={t('campaign.title')}
        description={t('campaign.description')}
        actions={
          <Button variant="primary" onClick={() => { setShowCreate(true); setForm(emptyForm); setActiveTab('basic'); }}>
            {t('campaign.btnCreate')}
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="dashboard-summary-grid" style={{ marginBottom: 24 }}>
        <SummaryCard title="Total Campaigns" subtitle="活动总数" icon={ChartIcon}>
          <MiniStat label="全部活动" value={summaryStats.total} />
          <MiniStat label="草稿" value={summaryStats.drafts} trend="warning" />
        </SummaryCard>
        <SummaryCard title="Active" subtitle="进行中" icon={TargetIcon}>
          <MiniStat label="进行中" value={summaryStats.active} />
          <MiniStat label="已结束" value={campaigns.filter((c: Campaign) => c.status === 'ended').length} />
        </SummaryCard>
        <SummaryCard title="Raised" subtitle="已筹款" icon={MoneyIcon}>
          <MiniStat label="已筹款" value={`¥${summaryStats.raised.toLocaleString('zh-CN')}`} trend="up" />
          <MiniStat label="本周新增" value="+¥8,500" change={15} />
        </SummaryCard>
      </div>

      {/* Filters */}
      <div className="table-toolbar">
        <div className="table-toolbar__filters">
          <select
            className="table-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">{t('campaign.filterAllStatuses')}</option>
            <option value="draft">{t('campaign.filterDraft')}</option>
            <option value="active">{t('campaign.filterActive')}</option>
            <option value="ended">{t('campaign.filterEnded')}</option>
            <option value="archived">{t('campaign.filterArchived')}</option>
          </select>
        </div>
      </div>

      <DataTable columns={columns} data={data?.data || []} rowKey="id" loading={isLoading} />
      <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} pageSize={10} onPageChange={setPage} />

      {/* Create Modal */}
      <Modal
        open={showCreate}
        title={t('campaign.modalCreateTitle')}
        onClose={() => { setShowCreate(false); setForm(emptyForm); }}
        width={680}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" loading={createMutation.isPending} onClick={handleSubmit}>
              {t('campaign.btnCreateSubmit')}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: 20 }}>
            <TabButton active={activeTab === 'basic'} label={t('campaign.tabBasic')} onClick={() => setActiveTab('basic')} />
            <TabButton active={activeTab === 'sustainability'} label={t('campaign.tabSustainability')} onClick={() => setActiveTab('sustainability')} />
          </div>
          {activeTab === 'basic' ? renderBasicTab() : renderSustainabilityTab()}
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editCampaign}
        title={t('campaign.modalEditTitle')}
        onClose={() => { setEditCampaign(null); }}
        width={680}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditCampaign(null)}>{t('common.cancel')}</Button>
            <Button variant="primary" loading={updateMutation.isPending} onClick={handleSave}>
              {t('campaign.btnSave')}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: 20 }}>
          <TabButton active={activeTab === 'basic'} label={t('campaign.tabBasic')} onClick={() => setActiveTab('basic')} />
          <TabButton active={activeTab === 'sustainability'} label={t('campaign.tabSustainability')} onClick={() => setActiveTab('sustainability')} />
          <TabButton active={activeTab === 'artworks'} label={t('campaign.tabArtworks')} onClick={() => setActiveTab('artworks')} />
        </div>
        {activeTab === 'basic' ? renderBasicTab() : activeTab === 'sustainability' ? renderSustainabilityTab() : renderArtworksTab()}
      </Modal>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeleteCampaignId(null);
        }}
        onConfirm={() => {
          if (deleteCampaignId) {
            deleteMutation.mutate(deleteCampaignId);
          }
          setDeleteConfirmOpen(false);
          setDeleteCampaignId(null);
        }}
        title={t('campaign.confirmDelete', '确认删除活动？')}
        description={t('common.confirmDeleteDesc', 'This action cannot be undone.')}
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
