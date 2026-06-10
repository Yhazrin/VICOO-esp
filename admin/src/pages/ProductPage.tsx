import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { PageHeader } from '../components/ui/PageHeader';
import { SummaryCard, MiniStat } from '../components/ui/SummaryCard';
import ImageUploadField from '../components/ui/ImageUploadField';
import type { AdminProduct, SupplyChainRecord, TraceMediaItem } from '../types';
import {
  createProduct, updateProduct, deleteProduct,
  fetchProducts, fetchOriginCountries, fetchOriginRegions,
  fetchSupplyChainRecords, createSupplyChainRecord,
  updateSupplyChainRecord, deleteSupplyChainRecord,
  fetchCampaigns, fetchArtworks,
  uploadTraceMedia,
} from '../services/api';
import { resolveApiAssetUrl } from '../utils/resolveApiAssetUrl';
import { formatDate, formatDateTime } from '../utils/dateTime';
import {
  SupplyChainStageIcon,
  Package,
  Link2,
  MapPin,
  Leaf,
  Globe,
  ImagePlus,
  ICON_STROKE,
} from '../components/icons/supplyChain';
import { BadgeCheck, Info, Heart, Link2 as Link2Icon } from 'lucide-react';

// Icons
const PackageIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const LayersIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const DollarIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

/* ── Shared style tokens ── */
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px',
  border: '1px solid var(--color-border)', borderRadius: 6,
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  transition: 'border-color .15s',
};

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 5, color: 'var(--color-text-2)' };

const btnStyle: React.CSSProperties = {
  padding: '4px 10px', border: '1px solid var(--color-border)', borderRadius: 4,
  fontSize: 11, cursor: 'pointer', background: 'transparent', color: 'var(--color-text-2)',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
  color: 'var(--color-text-3)', marginBottom: 12, paddingBottom: 8,
  borderBottom: '1px solid var(--color-border)',
};

const STAGES = ['material_sourcing', 'processing', 'manufacturing', 'quality_check', 'shipping'] as const;

const CATEGORIES = ['apparel', 'accessories', 'stationery', 'prints', 'lifestyle', 'footwear', 'home', 'gift_box'] as const;

const emptyForm = {
  name: '', description: '', price: '', currency: 'CNY', imageUrl: '',
  category: 'apparel', stock: '0', status: 'active' as AdminProduct['status'],
  isImpactProduct: true, campaignId: '', donationPercentage: '', artworkId: '',
  originCountryId: '', originRegionId: '', traceStoryTitle: '', traceStoryContent: '',
  nameEn: '', descriptionEn: '', traceStoryTitleEn: '', traceStoryContentEn: '',
};

const emptyNode = {
  stage: 'material_sourcing' as SupplyChainRecord['stage'],
  description: '', descriptionEn: '', location: '', locationEn: '', latitude: '', longitude: '',
  certified: false, certImageUrl: '', carbonKg: '', carbonNote: '',
  timestamp: '', gallery: [] as TraceMediaItem[],
};

type EditTab = 'basic' | 'impact' | 'supply';

/* ============================================================================
 *  Tab Button
 * ========================================================================= */
function TabButton({ active, label, count, onClick, icon }: {
  active: boolean; label: string; count?: number; onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '10px 20px',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        color: active ? 'var(--color-accent-2)' : 'var(--color-text-3)',
        background: 'transparent',
        border: 'none',
        borderBottom: active ? '2px solid var(--color-accent-2)' : '2px solid transparent',
        cursor: 'pointer',
        transition: 'all .15s',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {icon}
      {label}
      {count != null && (
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 10,
          background: active ? 'var(--color-accent-2)' : 'var(--color-border)',
          color: active ? '#fff' : 'var(--color-text-3)',
        }}>{count}</span>
      )}
    </button>
  );
}

/* ============================================================================
 *  Section Header
 * ========================================================================= */
function SectionHeader({ title }: { title: string }) {
  return <div style={sectionTitleStyle}>{title}</div>;
}

/* ============================================================================
 *  Main Page
 * ========================================================================= */
export default function ProductPage() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  // Product edit state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState<EditTab>('basic');

  // Supply chain node edit state
  const [nodeModalOpen, setNodeModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<SupplyChainRecord | null>(null);
  const [nodeForm, setNodeForm] = useState(emptyNode);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ type: 'product' | 'node'; id: string } | null>(null);

  /* ── Queries ── */
  const { data, isLoading, isError, isFetching, error, refetch } = useQuery({
    queryKey: ['admin-products', page, status],
    queryFn: () => fetchProducts({ page, pageSize: 20, status: status || undefined }),
    placeholderData: (prev) => prev,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { data: countries = [] } = useQuery({
    queryKey: ['origin-countries'],
    queryFn: fetchOriginCountries,
    staleTime: 10 * 60 * 1000,
  });

  const { data: regions = [] } = useQuery({
    queryKey: ['origin-regions', form.originCountryId],
    queryFn: () => fetchOriginRegions(form.originCountryId || undefined),
    staleTime: 10 * 60 * 1000,
  });

  const selectableRegions = useMemo(
    () => regions.filter((r) => !form.originCountryId || r.countryId === form.originCountryId),
    [regions, form.originCountryId],
  );

  const { data: traceRecords = [] } = useQuery({
    queryKey: ['supply-chain', editingId],
    queryFn: () => fetchSupplyChainRecords(editingId!),
    enabled: !!editingId && modalOpen,
  });

  // For selectors: fetch up to 200 campaigns + artworks
  const { data: allCampaignsResp } = useQuery({
    queryKey: ['campaigns-all'],
    queryFn: () => fetchCampaigns({ page: 1, pageSize: 200 }),
  });
  const allCampaigns: any[] = allCampaignsResp?.data ?? [];

  const { data: allArtworksResp } = useQuery({
    queryKey: ['artworks-all'],
    queryFn: () => fetchArtworks({ page: 1, pageSize: 200 } as any),
  });
  const allArtworks: any[] = allArtworksResp?.data ?? [];

  /* ── Mutations ── */
  const createMut = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(t('product.toastCreated'));
      closeModal();
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? t('product.toastCreateFailed')),
  });

  const updateMut = useMutation({
    mutationFn: (data: { id: string; payload: Partial<AdminProduct> }) => updateProduct(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(t('product.toastUpdated'));
      closeModal();
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? t('product.toastUpdateFailed')),
  });

  const deleteMut = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(t('product.toastDeleted'));
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? t('product.toastDeleteFailed')),
  });

  const createNodeMut = useMutation({
    mutationFn: (data: { productId: string; node: typeof emptyNode }) =>
      createSupplyChainRecord(data.productId, serializeNode(data.node)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supply-chain'] });
      toast.success(t('product.toastNodeCreated'));
      closeNodeModal();
    },
    onError: (e: any) =>
      toast.error(
        e?.response?.data?.detail
          ? String(e.response.data.detail)
          : t('product.toastNodeCreateFailed', '保存节点失败'),
      ),
  });

  const updateNodeMut = useMutation({
    mutationFn: (data: { id: string; node: typeof emptyNode }) =>
      updateSupplyChainRecord(data.id, serializeNode(data.node)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supply-chain'] });
      toast.success(t('product.toastNodeUpdated'));
      closeNodeModal();
    },
    onError: (e: any) =>
      toast.error(
        e?.response?.data?.detail
          ? String(e.response.data.detail)
          : t('product.toastNodeUpdateFailed', '更新节点失败'),
      ),
  });

  const deleteNodeMut = useMutation({
    mutationFn: deleteSupplyChainRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supply-chain'] });
      toast.success(t('product.toastNodeDeleted'));
    },
    onError: (e: any) =>
      toast.error(
        e?.response?.data?.detail
          ? String(e.response.data.detail)
          : t('product.toastNodeDeleteFailed', '删除节点失败'),
      ),
  });

  /* ── Helpers ── */
  function numOrNull(v: string): number | null {
    if (v === '' || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function timestampOrNow(v: string): string {
    if (!v) return new Date().toISOString();
    // <input type="datetime-local"> returns "YYYY-MM-DDTHH:MM" (no seconds, no timezone).
    // Treat the value as local time and convert to a full ISO 8601 timestamp.
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(v)) {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
    // Already ISO or any parseable string — pass through
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }

  function serializeNode(n: typeof emptyNode) {
    return {
      stage: n.stage,
      description: n.description?.trim() || undefined,
      descriptionEn: n.descriptionEn?.trim() || undefined,
      location: n.location?.trim() || undefined,
      locationEn: n.locationEn?.trim() || undefined,
      latitude: numOrNull(n.latitude as unknown as string),
      longitude: numOrNull(n.longitude as unknown as string),
      certified: n.certified,
      certImageUrl: n.certImageUrl?.trim() || undefined,
      carbonKg: numOrNull(n.carbonKg as unknown as string),
      carbonNote: n.carbonNote?.trim() || undefined,
      timestamp: timestampOrNow(n.timestamp as unknown as string),
      gallery: n.gallery ?? [],
    };
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setActiveTab('basic');
    setModalOpen(true);
  }

  function openEdit(product: AdminProduct) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      currency: product.currency,
      imageUrl: product.imageUrl ?? '',
      category: product.category ?? 'apparel',
      stock: String(product.stock),
      status: product.status,
      isImpactProduct: product.isImpactProduct,
      campaignId: product.campaignId ?? '',
      donationPercentage: product.donationPercentage != null ? String(product.donationPercentage) : '',
      artworkId: product.artworkId ?? '',
      originCountryId: product.originCountryId ?? '',
      originRegionId: product.originRegionId ?? '',
      traceStoryTitle: product.traceStoryTitle ?? '',
      traceStoryContent: product.traceStoryContent ?? '',
      nameEn: product.nameEn ?? '',
      descriptionEn: product.descriptionEn ?? '',
      traceStoryTitleEn: product.traceStoryTitleEn ?? '',
      traceStoryContentEn: product.traceStoryContentEn ?? '',
    });
    setActiveTab('basic');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setActiveTab('basic');
  }

  function openNodeCreate() {
    setEditingNode(null);
    setNodeForm(emptyNode);
    setNodeModalOpen(true);
  }

  function openNodeEdit(record: SupplyChainRecord) {
    setEditingNode(record);
    setNodeForm({
      stage: record.stage,
      description: record.description ?? '',
      descriptionEn: record.descriptionEn ?? '',
      location: record.location ?? '',
      locationEn: record.locationEn ?? '',
      latitude: record.latitude != null ? String(record.latitude) : '',
      longitude: record.longitude != null ? String(record.longitude) : '',
      certified: record.certified,
      certImageUrl: record.certImageUrl ?? '',
      carbonKg: record.carbonKg != null ? String(record.carbonKg) : '',
      carbonNote: record.carbonNote ?? '',
      timestamp: record.timestamp ? toDateTimeLocalValue(record.timestamp) : '',
      gallery: record.gallery ?? [],
    });
    setNodeModalOpen(true);
  }

  /** Convert ISO timestamp → "YYYY-MM-DDTHH:MM" for <input type="datetime-local">. */
  function toDateTimeLocalValue(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function closeNodeModal() {
    setNodeModalOpen(false);
    setEditingNode(null);
    setNodeForm(emptyNode);
  }

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadTraceMedia(file);
      const newItem: TraceMediaItem = {
        type: result.mime.startsWith('video/') ? 'video' : 'image',
        url: result.url,
      };
      setNodeForm((prev) => ({ ...prev, gallery: [...prev.gallery, newItem] }));
    } catch {
      toast.error(t('product.toastUploadFailed'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function removeGalleryItem(idx: number) {
    setNodeForm((prev) => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== idx) }));
  }

  function submitForm(e: React.FormEvent | React.MouseEvent) {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast.error(t('product.errorRequired'));
      return;
    }
    const payload: Partial<AdminProduct> = {
      name: form.name, description: form.description, price: Number(form.price),
      currency: form.currency, imageUrl: form.imageUrl, category: form.category,
      stock: Number(form.stock), status: form.status, isImpactProduct: form.isImpactProduct,
      campaignId: form.campaignId || undefined,
      donationPercentage: form.donationPercentage ? Number(form.donationPercentage) : undefined,
      artworkId: form.artworkId || undefined,
      originCountryId: form.originCountryId || undefined,
      originRegionId: form.originRegionId || undefined,
      traceStoryTitle: form.traceStoryTitle, traceStoryContent: form.traceStoryContent,
      nameEn: form.nameEn, descriptionEn: form.descriptionEn,
      traceStoryTitleEn: form.traceStoryTitleEn, traceStoryContentEn: form.traceStoryContentEn,
    };
    if (editingId) {
      updateMut.mutate({ id: editingId, payload });
    } else {
      createMut.mutate(payload);
    }
  }

  function submitNode(e: React.FormEvent | React.MouseEvent) {
    e.preventDefault();
    if (!editingId) return;
    if (editingNode) {
      updateNodeMut.mutate({ id: editingNode.id, node: nodeForm });
    } else {
      createNodeMut.mutate({ productId: editingId, node: nodeForm });
    }
  }

  function handleDelete(id: string) {
    setConfirmTarget({ type: 'product', id });
    setConfirmOpen(true);
  }

  function handleDeleteNode(id: string) {
    setConfirmTarget({ type: 'node', id });
    setConfirmOpen(true);
  }

  const handleConfirmDelete = () => {
    if (confirmTarget?.type === 'product') {
      deleteMut.mutate(confirmTarget.id);
    } else if (confirmTarget?.type === 'node') {
      deleteNodeMut.mutate(confirmTarget.id);
    }
    setConfirmOpen(false);
    setConfirmTarget(null);
  };

  const stageLabel = (stage: string) => t(`product.stage${stage.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join('')}`);

  const metaIconStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  };

  /* ── Table columns ── */
  const products = data?.data || [];
  const summaryStats = {
    total: data?.total ?? products.length,
    active: products.filter((p: AdminProduct) => p.status === 'active').length,
    soldOut: products.filter((p: AdminProduct) => p.status === 'sold_out').length,
    impact: products.filter((p: AdminProduct) => p.isImpactProduct).length,
  };

  const columns: Column<AdminProduct>[] = [
    {
      key: 'name', title: t('product.colName'), minWidth: 180,
      render: (v, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {row.imageUrl && (
            <img
              src={row.imageUrl}
              alt=""
              style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <div>
            <div className="table-text-bold">{v as string}</div>
            {row.nameEn && <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{row.nameEn}</div>}
          </div>
        </div>
      ),
    },
    {
      key: 'price', title: t('product.colPrice'), width: 110,
      render: (v, row) => <span className="table-text-mono">{row.currency} {Number(v).toFixed(2)}</span>,
    },
    { key: 'category', title: t('product.colCategory'), width: 100 },
    { key: 'stock', title: t('product.colStock'), width: 70 },
    {
      key: 'status', title: t('product.colStatus'), width: 90,
      render: (v) => <StatusBadge status={v as string} context="product" />,
    },
    {
      key: 'isImpactProduct', title: t('product.colImpact'), width: 80,
      render: (v) => v ? (
        <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 4, background: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
          {t('common.yes')}
        </span>
      ) : <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{t('common.no')}</span>,
    },
    {
      key: 'createdAt', title: t('product.colCreatedAt'), width: 140,
      render: (v) => formatDateTime(v),
    },
    {
      key: 'id' as any, title: t('product.colActions'), width: 130,
      render: (_v, row) => (
        <div className="table-actions">
          <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
            {t('product.btnEdit')}
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>
            {t('product.btnDelete')}
          </Button>
        </div>
      ),
    },
  ];

  /* ══════════════════════════════════════════════════════════════════════════
   *  RENDER — Tab: Basic Info
   * ═════════════════════════════════════════════════════════════════════════ */
  function renderBasicTab() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* ── Core Fields ── */}
        <div>
          <SectionHeader title={t('product.sectionCore')} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{t('product.labelName')} *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('product.labelNameEn')}</label>
              <input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} style={inputStyle} placeholder={t('product.labelNameEnHint')} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>{t('product.labelDescription')}</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, height: 76, resize: 'vertical' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>{t('product.labelDescriptionEn')}</label>
              <textarea value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} style={{ ...inputStyle, height: 60, resize: 'vertical' }} />
            </div>
          </div>
        </div>

        {/* ── Pricing & Inventory ── */}
        <div>
          <SectionHeader title={t('product.sectionPricing')} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{t('product.labelPrice')} *</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('product.labelCurrency')}</label>
              <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('product.labelStock')}</label>
              <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('product.labelStatus')}</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AdminProduct['status'] })} style={inputStyle}>
                <option value="active">{t('product.filterActive')}</option>
                <option value="inactive">{t('product.filterInactive')}</option>
                <option value="sold_out">{t('product.filterSoldOut')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Category & Image ── */}
        <div>
          <SectionHeader title={t('product.sectionMedia')} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{t('product.labelCategory')}</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <ImageUploadField
                label={t('product.labelImageUrl')}
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
                placeholder="点击或拖拽上传商品图片"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════
   *  RENDER — Tab: Impact & Traceability Story
   * ═════════════════════════════════════════════════════════════════════════ */
  function renderImpactTab() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* ── Impact Settings ── */}
        <div>
          <SectionHeader title={t('product.sectionImpactSettings')} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{t('product.labelImpact')}</label>
              <select value={String(form.isImpactProduct)} onChange={(e) => setForm({ ...form, isImpactProduct: e.target.value === 'true' })} style={inputStyle}>
                <option value="true">{t('common.yes')}</option>
                <option value="false">{t('common.no')}</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t('product.labelDonationPercentage')}</label>
              <input type="number" min="0" max="100" step="0.01" value={form.donationPercentage} onChange={(e) => setForm({ ...form, donationPercentage: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('product.labelCampaignId')}</label>
              <select
                value={form.campaignId || ''}
                onChange={(e) => setForm({ ...form, campaignId: e.target.value })}
                style={inputStyle}
              >
                <option value="">— {t('common.none', '无')} —</option>
                {allCampaigns.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    #{c.id} · {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t('product.labelArtworkId')}</label>
              <select
                value={form.artworkId || ''}
                onChange={(e) => setForm({ ...form, artworkId: e.target.value })}
                style={inputStyle}
              >
                <option value="">— {t('common.none', '无')} —</option>
                {allArtworks.map((a) => (
                  <option key={a.id} value={String(a.id)}>
                    #{a.id} · {a.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Origin ── */}
        <div>
          <SectionHeader title={t('product.sectionOrigin')} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{t('product.labelOriginCountry')}</label>
              <select
                value={form.originCountryId}
                onChange={(e) => setForm({ ...form, originCountryId: e.target.value, originRegionId: '' })}
                style={inputStyle}
              >
                <option value="">{t('common.none')}</option>
                {countries.map((c) => <option key={c.id} value={c.id}>{c.nameZh} ({c.code})</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t('product.labelOriginRegion')}</label>
              <select value={form.originRegionId} onChange={(e) => setForm({ ...form, originRegionId: e.target.value })} style={inputStyle}>
                <option value="">{t('common.none')}</option>
                {selectableRegions.map((r) => <option key={r.id} value={r.id}>{r.nameZh}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Trace Story (zh) ── */}
        <div>
          <SectionHeader title={t('product.sectionTraceStory')} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={labelStyle}>{t('product.labelTraceStoryTitle')}</label>
              <input value={form.traceStoryTitle} onChange={(e) => setForm({ ...form, traceStoryTitle: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('product.labelTraceStoryContent')}</label>
              <textarea value={form.traceStoryContent} onChange={(e) => setForm({ ...form, traceStoryContent: e.target.value })} style={{ ...inputStyle, height: 100, resize: 'vertical' }} />
            </div>
          </div>
        </div>

        {/* ── Trace Story (en) ── */}
        <div>
          <SectionHeader title={t('product.sectionTraceStoryEn')} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={labelStyle}>{t('product.labelTraceStoryTitleEn')}</label>
              <input value={form.traceStoryTitleEn} onChange={(e) => setForm({ ...form, traceStoryTitleEn: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('product.labelTraceStoryContentEn')}</label>
              <textarea value={form.traceStoryContentEn} onChange={(e) => setForm({ ...form, traceStoryContentEn: e.target.value })} style={{ ...inputStyle, height: 80, resize: 'vertical' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════
   *  RENDER — Tab: Supply Chain Nodes
   * ═════════════════════════════════════════════════════════════════════════ */
  function renderSupplyTab() {
    if (!editingId) {
      return (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--color-text-3)' }}>
          <Package size={32} strokeWidth={ICON_STROKE} style={{ marginBottom: 12, opacity: 0.35 }} />
          <p style={{ fontSize: 13 }}>{t('product.supplyChainSaveFirst')}</p>
        </div>
      );
    }

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-3)', margin: 0 }}>{t('product.traceabilityDesc')}</p>
          <Button variant="primary" onClick={openNodeCreate} style={{ flexShrink: 0 }}>{t('product.btnAddNode')}</Button>
        </div>

        {traceRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-3)', border: '1px dashed var(--color-border)', borderRadius: 8 }}>
            <Link2 size={28} strokeWidth={ICON_STROKE} style={{ marginBottom: 8, opacity: 0.35 }} />
            <p style={{ fontSize: 13, margin: 0 }}>{t('product.noTraceNodes')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Timeline connector */}
            {traceRecords.map((rec, idx) => (
              <div key={rec.id} style={{ display: 'flex', gap: 16 }}>
                {/* Timeline line + dot */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: rec.certified ? 'var(--color-success-bg)' : 'var(--color-info-bg)',
                    border: `2px solid ${rec.certified ? 'var(--color-success)' : 'var(--color-info)'}`,
                    color: rec.certified ? 'var(--color-success)' : 'var(--color-info)',
                  }}>
                    <SupplyChainStageIcon stage={rec.stage} size={14} />
                  </div>
                  {idx < traceRecords.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: 20, background: 'var(--color-border)' }} />
                  )}
                </div>

                {/* Card */}
                <div style={{
                  flex: 1, border: '1px solid var(--color-border)', borderRadius: 8,
                  padding: 14, marginBottom: 8, background: 'var(--color-surface)',
                  transition: 'box-shadow .15s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '2px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                        fontFamily: 'var(--font-mono)', background: 'var(--color-info-bg)', color: 'var(--color-info)',
                      }}>{stageLabel(rec.stage)}</span>
                      {rec.certified && (
                        <span style={{
                          padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 500,
                          background: 'var(--color-success-bg)', color: 'var(--color-success)',
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}>
                          <BadgeCheck size={11} strokeWidth={ICON_STROKE} aria-hidden />
                          Certified
                        </span>
                      )}
                      {rec.timestamp && (
                        <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{formatDate(rec.timestamp)}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button type="button" onClick={() => openNodeEdit(rec)} style={{ ...btnStyle, fontSize: 10, padding: '2px 8px' }}>{t('product.btnEditNode')}</button>
                      <button type="button" onClick={() => handleDeleteNode(rec.id)} style={{ ...btnStyle, fontSize: 10, padding: '2px 8px', color: 'var(--color-error)', borderColor: 'var(--color-error)' }}>{t('product.btnDeleteNode')}</button>
                    </div>
                  </div>
                  {rec.description && <div style={{ fontSize: 13, color: 'var(--color-text)', marginBottom: 4, lineHeight: 1.5 }}>{rec.description}</div>}
                  <div style={{ fontSize: 11, color: 'var(--color-text-3)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {rec.location && (
                      <span style={metaIconStyle}>
                        <MapPin size={12} strokeWidth={ICON_STROKE} aria-hidden />
                        {rec.location}
                      </span>
                    )}
                    {rec.carbonKg != null && (
                      <span style={metaIconStyle}>
                        <Leaf size={12} strokeWidth={ICON_STROKE} aria-hidden />
                        {rec.carbonKg} kg CO₂
                      </span>
                    )}
                    {rec.latitude != null && rec.longitude != null && (
                      <span style={metaIconStyle}>
                        <Globe size={12} strokeWidth={ICON_STROKE} aria-hidden />
                        {Number(rec.latitude).toFixed(2)}, {Number(rec.longitude).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {rec.gallery.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {rec.gallery.map((item, i) => (
                        item.type === 'video' ? (
                          <video key={i} src={resolveApiAssetUrl(item.url)} style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 4 }} muted />
                        ) : (
                          <img key={i} src={resolveApiAssetUrl(item.url)} alt={item.caption ?? ''} style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 4 }} />
                        )
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════
   *  MAIN RENDER
   * ═════════════════════════════════════════════════════════════════════════ */
  return (
    <div>
      <PageHeader
        title={t('product.title')}
        description={t('product.description')}
        actions={
          <Button variant="primary" onClick={openCreate}>
            {t('product.btnCreate')}
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="dashboard-summary-grid" style={{ marginBottom: 24 }}>
        <SummaryCard title={t('product.summaryTotalTitle')} subtitle={t('product.summaryTotalSubtitle')} icon={PackageIcon}>
          <MiniStat label={t('product.summaryTotalProducts')} value={summaryStats.total} />
          <MiniStat label={t('common.miniStatNew')} value="+3" change={8} />
        </SummaryCard>
        <SummaryCard title={t('product.summaryActiveTitle')} subtitle={t('product.summaryActiveSubtitle')} icon={LayersIcon}>
          <MiniStat label={t('product.summaryActiveProducts')} value={summaryStats.active} />
          <MiniStat label={t('product.summarySoldOut')} value={summaryStats.soldOut} trend="warning" />
        </SummaryCard>
        <SummaryCard title={t('product.summaryImpactTitle')} subtitle={t('product.summaryImpactSubtitle')} icon={DollarIcon}>
          <MiniStat label={t('product.summaryImpactProducts')} value={summaryStats.impact} trend="up" />
          <MiniStat label={t('product.summaryRegular')} value={summaryStats.total - summaryStats.impact} />
        </SummaryCard>
      </div>

      {/* Filters */}
      <div className="table-toolbar">
        <div className="table-toolbar__filters">
          <select
            className="table-select"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">{t('product.filterAllStatuses')}</option>
            <option value="active">{t('product.filterActive')}</option>
            <option value="inactive">{t('product.filterInactive')}</option>
            <option value="sold_out">{t('product.filterSoldOut')}</option>
          </select>
        </div>
      </div>

      <DataTable columns={columns} data={products} rowKey="id" loading={isLoading || isFetching} />
      {isError && (
        <div style={{ padding: 12, marginTop: 8, background: 'var(--color-error-bg)', color: 'var(--color-error)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{t('product.loadFailedHint', { detail: (error as any)?.response?.data?.detail ?? (error as Error)?.message ?? 'unknown' })}</span>
          <Button variant="secondary" onClick={() => refetch()}>{t('common.retry')}</Button>
        </div>
      )}
      <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} pageSize={20} onPageChange={setPage} />

      {/* ══════════════════════════════════════════════════════════════════
       *  Product Edit Modal — Tabbed Layout
       * ═════════════════════════════════════════════════════════════════ */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? t('product.modalEditTitle') : t('product.modalCreateTitle')}
        width={880}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              loading={createMut.isPending || updateMut.isPending}
              onClick={(e) => submitForm(e as any)}
            >
              {editingId ? t('product.btnSave') : t('product.btnCreateSubmit')}
            </Button>
          </>
        }
      >
        {/* Tab Bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: 20, marginTop: -4 }}>
          <TabButton
            active={activeTab === 'basic'}
            label={t('product.tabBasic')}
            icon={<Info size={14} strokeWidth={ICON_STROKE} />}
            onClick={() => setActiveTab('basic')}
          />
          <TabButton
            active={activeTab === 'impact'}
            label={t('product.tabImpact')}
            icon={<Heart size={14} strokeWidth={ICON_STROKE} />}
            onClick={() => setActiveTab('impact')}
          />
          <TabButton
            active={activeTab === 'supply'}
            label={t('product.tabSupplyChain')}
            icon={<Link2Icon size={14} strokeWidth={ICON_STROKE} />}
            count={editingId ? traceRecords.length : undefined}
            onClick={() => setActiveTab('supply')}
          />
        </div>

        {/* Tab Content — supply chain is outside <form> so Edit/Add never submit the product */}
        <form onSubmit={submitForm}>
          {activeTab === 'basic' && renderBasicTab()}
          {activeTab === 'impact' && renderImpactTab()}
        </form>
        {activeTab === 'supply' && renderSupplyTab()}
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════
       *  Supply Chain Node Edit Modal
       * ═════════════════════════════════════════════════════════════════ */}
      <Modal
        open={nodeModalOpen}
        onClose={closeNodeModal}
        title={editingNode ? t('product.btnEditNode') : t('product.btnAddNode')}
        width={680}
        footer={
          <>
            <Button variant="secondary" onClick={closeNodeModal}>{t('common.cancel')}</Button>
            <Button variant="primary" loading={createNodeMut.isPending || updateNodeMut.isPending} onClick={(e) => submitNode(e)}>
              {t('product.btnSaveNode')}
            </Button>
          </>
        }
      >
        <form onSubmit={submitNode} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Stage & Date */}
          <div>
            <SectionHeader title={t('product.sectionNodeBasic')} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>{t('product.nodeStage')}</label>
                <select value={nodeForm.stage} onChange={(e) => setNodeForm({ ...nodeForm, stage: e.target.value as any })} style={inputStyle}>
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{stageLabel(s)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>{t('product.nodeTimestamp')}</label>
                <input type="datetime-local" value={nodeForm.timestamp} onChange={(e) => setNodeForm({ ...nodeForm, timestamp: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>{t('product.nodeLocation')}</label>
                <input value={nodeForm.location} onChange={(e) => setNodeForm({ ...nodeForm, location: e.target.value })} style={inputStyle} placeholder={t('product.nodeLocationHint')} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>{t('product.nodeLocationEn', 'Location (EN)')}</label>
                <input value={nodeForm.locationEn} onChange={(e) => setNodeForm({ ...nodeForm, locationEn: e.target.value })} style={inputStyle} placeholder="e.g. Shanghai, China" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>{t('product.nodeDescription')}</label>
                <textarea value={nodeForm.description} onChange={(e) => setNodeForm({ ...nodeForm, description: e.target.value })} style={{ ...inputStyle, height: 72, resize: 'vertical' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>{t('product.nodeDescriptionEn', 'Description (EN)')}</label>
                <textarea value={nodeForm.descriptionEn} onChange={(e) => setNodeForm({ ...nodeForm, descriptionEn: e.target.value })} style={{ ...inputStyle, height: 72, resize: 'vertical' }} />
              </div>
            </div>
          </div>

          {/* Geo & Carbon */}
          <div>
            <SectionHeader title={t('product.sectionNodeGeo')} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>{t('product.nodeLatitude')}</label>
                <input type="number" step="any" value={nodeForm.latitude} onChange={(e) => setNodeForm({ ...nodeForm, latitude: e.target.value })} style={inputStyle} placeholder="e.g. 31.23" />
              </div>
              <div>
                <label style={labelStyle}>{t('product.nodeLongitude')}</label>
                <input type="number" step="any" value={nodeForm.longitude} onChange={(e) => setNodeForm({ ...nodeForm, longitude: e.target.value })} style={inputStyle} placeholder="e.g. 121.47" />
              </div>
              <div>
                <label style={labelStyle}>{t('product.nodeCarbonKg')}</label>
                <input type="number" step="any" value={nodeForm.carbonKg} onChange={(e) => setNodeForm({ ...nodeForm, carbonKg: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{t('product.nodeCarbonNote')}</label>
                <input value={nodeForm.carbonNote} onChange={(e) => setNodeForm({ ...nodeForm, carbonNote: e.target.value })} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Certification */}
          <div>
            <SectionHeader title={t('product.sectionNodeCert')} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start' }}>
              <ImageUploadField
                label={t('product.nodeCertImageUrl')}
                value={nodeForm.certImageUrl}
                onChange={(url) => setNodeForm({ ...nodeForm, certImageUrl: url })}
                placeholder="点击或拖拽上传证书图片"
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 2 }}>
                <input
                  type="checkbox" id="node-certified"
                  checked={nodeForm.certified}
                  onChange={(e) => setNodeForm({ ...nodeForm, certified: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: 'var(--color-success)' }}
                />
                <label htmlFor="node-certified" style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>{t('product.nodeCertified')}</label>
              </div>
            </div>
          </div>

          {/* Media Gallery */}
          <div>
            <SectionHeader title={t('product.nodeGallery')} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {nodeForm.gallery.map((item, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  {item.type === 'video' ? (
                    <video src={resolveApiAssetUrl(item.url)} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6 }} muted />
                  ) : (
                    <img src={resolveApiAssetUrl(item.url)} alt="" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                  )}
                  <button
                    type="button" onClick={() => removeGalleryItem(idx)}
                    style={{
                      position: 'absolute', top: -6, right: -6, width: 18, height: 18,
                      borderRadius: '50%', border: 'none', background: 'var(--color-error)',
                      color: '#fff', fontSize: 10, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >×</button>
                </div>
              ))}
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" onChange={handleMediaUpload} style={{ display: 'none' }} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                padding: '10px 20px', border: '1px dashed var(--color-border-hi)',
                borderRadius: 8, background: 'transparent', cursor: uploading ? 'default' : 'pointer',
                fontSize: 13, color: uploading ? 'var(--color-text-3)' : 'var(--color-accent-2)',
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <ImagePlus size={16} strokeWidth={ICON_STROKE} aria-hidden />
              {uploading ? t('product.uploading') : t('product.uploadHint')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title={confirmTarget?.type === 'product' ? t('product.confirmDelete') : t('product.confirmDeleteNode')}
        description={t('common.confirmDeleteDesc', 'This action cannot be undone.')}
        variant="danger"
        loading={deleteMut.isPending || deleteNodeMut.isPending}
      />
    </div>
  );
}
