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
import type { AdminProduct, SupplyChainRecord, TraceMediaItem } from '../types';
import {
  createProduct, updateProduct, deleteProduct,
  fetchProducts, fetchOriginCountries, fetchOriginRegions,
  fetchSupplyChainRecords, createSupplyChainRecord,
  updateSupplyChainRecord, deleteSupplyChainRecord,
  uploadTraceMedia,
} from '../services/api';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};

const STAGES = ['material_sourcing', 'processing', 'manufacturing', 'quality_check', 'shipping'] as const;

const emptyForm = {
  name: '', description: '', price: '', currency: 'CNY', imageUrl: '',
  category: 'apparel', stock: '0', status: 'active' as AdminProduct['status'],
  isImpactProduct: true, campaignId: '', donationPercentage: '', artworkId: '',
  originCountryId: '', originRegionId: '', traceStoryTitle: '', traceStoryContent: '',
  nameEn: '', descriptionEn: '', traceStoryTitleEn: '', traceStoryContentEn: '',
};

const emptyNode = {
  stage: 'material_sourcing' as SupplyChainRecord['stage'],
  description: '', location: '', latitude: '', longitude: '',
  certified: false, certImageUrl: '', carbonKg: '', carbonNote: '',
  timestamp: '', gallery: [] as TraceMediaItem[],
};

export default function ProductPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  // Traceability state
  const [traceProduct, setTraceProduct] = useState<AdminProduct | null>(null);
  const [nodeModalOpen, setNodeModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<SupplyChainRecord | null>(null);
  const [nodeForm, setNodeForm] = useState(emptyNode);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Queries ── */
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-products', page, status],
    queryFn: () => fetchProducts({ page, pageSize: 10, status: status || undefined }),
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
    queryKey: ['supply-chain', traceProduct?.id],
    queryFn: () => fetchSupplyChainRecords(traceProduct!.id),
    enabled: !!traceProduct,
  });

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
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? t('generic.error')),
  });

  const updateNodeMut = useMutation({
    mutationFn: (data: { id: string; node: typeof emptyNode }) =>
      updateSupplyChainRecord(data.id, serializeNode(data.node)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supply-chain'] });
      toast.success(t('product.toastNodeUpdated'));
      closeNodeModal();
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? t('generic.error')),
  });

  const deleteNodeMut = useMutation({
    mutationFn: deleteSupplyChainRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supply-chain'] });
      toast.success(t('product.toastNodeDeleted'));
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? t('generic.error')),
  });

  /* ── Helpers ── */
  function serializeNode(n: typeof emptyNode) {
    return {
      stage: n.stage,
      description: n.description,
      location: n.location,
      latitude: n.latitude ? Number(n.latitude) : undefined,
      longitude: n.longitude ? Number(n.longitude) : undefined,
      certified: n.certified,
      certImageUrl: n.certImageUrl || undefined,
      carbonKg: n.carbonKg ? Number(n.carbonKg) : undefined,
      carbonNote: n.carbonNote || undefined,
      timestamp: n.timestamp || new Date().toISOString(),
      gallery: n.gallery,
    };
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
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
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
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
      description: record.description,
      location: record.location,
      latitude: record.latitude != null ? String(record.latitude) : '',
      longitude: record.longitude != null ? String(record.longitude) : '',
      certified: record.certified,
      certImageUrl: record.certImageUrl ?? '',
      carbonKg: record.carbonKg != null ? String(record.carbonKg) : '',
      carbonNote: record.carbonNote ?? '',
      timestamp: record.timestamp ? record.timestamp.slice(0, 10) : '',
      gallery: record.gallery ?? [],
    });
    setNodeModalOpen(true);
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
    setNodeForm((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== idx),
    }));
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
    if (!traceProduct) return;
    if (editingNode) {
      updateNodeMut.mutate({ id: editingNode.id, node: nodeForm });
    } else {
      createNodeMut.mutate({ productId: traceProduct.id, node: nodeForm });
    }
  }

  function handleDelete(id: string) {
    if (confirm(t('product.confirmDelete'))) {
      deleteMut.mutate(id);
    }
  }

  function handleDeleteNode(id: string) {
    if (confirm(t('product.confirmDeleteNode'))) {
      deleteNodeMut.mutate(id);
    }
  }

  const stageLabel = (stage: string) => t(`product.stage${stage.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join('')}`);

  /* ── Columns ── */
  const columns: Column<AdminProduct>[] = [
    { key: 'name', title: t('product.colName'), minWidth: 160 },
    {
      key: 'price', title: t('product.colPrice'), width: 110,
      render: (v, row) => `${row.currency} ${Number(v).toFixed(2)}`,
    },
    { key: 'category', title: t('product.colCategory'), width: 110 },
    { key: 'stock', title: t('product.colStock'), width: 80 },
    { key: 'status', title: t('product.colStatus'), width: 90 },
    {
      key: 'isImpactProduct', title: t('product.colImpact'), width: 90,
      render: (v) => (v ? t('common.yes') : t('common.no')),
    },
    {
      key: 'createdAt', title: t('product.colCreatedAt'), width: 150,
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      key: 'id', title: t('product.colActions'), width: 220,
      render: (_v, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => openEdit(row)}
            style={{ ...btnStyle, color: 'var(--color-accent-2)', borderColor: 'var(--color-accent-2)' }}
          >{t('product.btnEdit')}</button>
          <button
            onClick={() => { setTraceProduct(row); }}
            style={{ ...btnStyle, color: 'var(--color-success)', borderColor: 'var(--color-success)' }}
          >{t('product.sectionTraceability')}</button>
          <button
            onClick={() => handleDelete(row.id)}
            style={{ ...btnStyle, color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
          >{t('product.btnDelete')}</button>
        </div>
      ),
    },
  ];

  /* ── Render ── */
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>{t('product.title')}</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-2)' }}>{t('product.description')}</p>
        </div>
        <Button variant="primary" onClick={openCreate}>{t('product.btnCreate')}</Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          style={{ ...inputStyle, width: 220 }}
        >
          <option value="">{t('product.filterAllStatuses')}</option>
          <option value="active">{t('product.filterActive')}</option>
          <option value="inactive">{t('product.filterInactive')}</option>
          <option value="sold_out">{t('product.filterSoldOut')}</option>
        </select>
      </div>

      {isError && (
        <div style={{ padding: 16, marginBottom: 16, background: 'var(--color-danger-bg, #fef2f2)', border: '1px solid var(--color-danger-border, #fecaca)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-danger, #dc2626)', fontSize: 14 }}>{t('generic.error')}</span>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-products'] })} style={{ padding: '4px 12px', fontSize: 13, cursor: 'pointer', border: '1px solid var(--color-border)', borderRadius: 4, background: 'transparent' }}>{t('generic.retry', 'Retry')}</button>
        </div>
      )}
      <DataTable columns={columns} data={data?.data || []} rowKey="id" loading={isLoading} />
      <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} pageSize={10} onPageChange={setPage} />

      {/* ── Create / Edit Product Modal ── */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? t('product.modalEditTitle') : t('product.modalCreateTitle')}
        width={760}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>{t('common.cancel')}</Button>
            <Button variant="primary" loading={createMut.isPending || updateMut.isPending} onClick={(e) => submitForm(e)}>
              {editingId ? t('product.btnSave') : t('product.btnCreateSubmit')}
            </Button>
          </>
        }
      >
        <form onSubmit={submitForm} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>{t('product.labelName')} *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t('product.labelPrice')} *</label>
            <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t('product.labelCurrency')}</label>
            <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t('product.labelCategory')}</label>
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle} />
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
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>{t('product.labelDescription')}</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, height: 80 }} />
          </div>
          <div>
            <label style={labelStyle}>{t('product.labelNameEn')}</label>
            <input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} style={inputStyle} placeholder={t('product.labelNameEnHint')} />
          </div>
          <div>
            <label style={labelStyle}>{t('product.labelDescriptionEn')}</label>
            <textarea value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} style={{ ...inputStyle, height: 72 }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>{t('product.labelImageUrl')}</label>
            <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} style={inputStyle} />
          </div>
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
            <input value={form.campaignId} onChange={(e) => setForm({ ...form, campaignId: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t('product.labelArtworkId')}</label>
            <input value={form.artworkId} onChange={(e) => setForm({ ...form, artworkId: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t('product.labelOriginCountry')}</label>
            <select
              value={form.originCountryId}
              onChange={(e) => setForm({ ...form, originCountryId: e.target.value, originRegionId: '' })}
              style={inputStyle}
            >
              <option value="">{t('common.none')}</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.nameZh} ({c.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>{t('product.labelOriginRegion')}</label>
            <select value={form.originRegionId} onChange={(e) => setForm({ ...form, originRegionId: e.target.value })} style={inputStyle}>
              <option value="">{t('common.none')}</option>
              {selectableRegions.map((r) => (
                <option key={r.id} value={r.id}>{r.nameZh}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>{t('product.labelTraceStoryTitle')}</label>
            <input value={form.traceStoryTitle} onChange={(e) => setForm({ ...form, traceStoryTitle: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>{t('product.labelTraceStoryContent')}</label>
            <textarea value={form.traceStoryContent} onChange={(e) => setForm({ ...form, traceStoryContent: e.target.value })} style={{ ...inputStyle, height: 110 }} />
          </div>
          <div>
            <label style={labelStyle}>{t('product.labelTraceStoryTitleEn')}</label>
            <input value={form.traceStoryTitleEn} onChange={(e) => setForm({ ...form, traceStoryTitleEn: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>{t('product.labelTraceStoryContentEn')}</label>
            <textarea value={form.traceStoryContentEn} onChange={(e) => setForm({ ...form, traceStoryContentEn: e.target.value })} style={{ ...inputStyle, height: 88 }} />
          </div>
        </form>
      </Modal>

      {/* ── Traceability Panel Modal ── */}
      <Modal
        open={!!traceProduct}
        onClose={() => setTraceProduct(null)}
        title={`${t('product.sectionTraceability')} — ${traceProduct?.name ?? ''}`}
        width={900}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTraceProduct(null)}>{t('common.close')}</Button>
            <Button variant="primary" onClick={openNodeCreate}>{t('product.btnAddNode')}</Button>
          </>
        }
      >
        <p style={{ fontSize: 13, color: 'var(--color-text-2)', marginBottom: 16 }}>{t('product.traceabilityDesc')}</p>
        {traceRecords.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--color-text-3)', textAlign: 'center', padding: 32 }}>{t('product.noTraceNodes')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {traceRecords.map((rec) => (
              <div key={rec.id} style={{
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: 16,
                background: 'var(--color-surface)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 10px', borderRadius: 4,
                      fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
                      background: 'var(--color-info-bg)', color: 'var(--color-info)',
                    }}>{stageLabel(rec.stage)}</span>
                    {rec.certified && (
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 4,
                        fontSize: 10, fontWeight: 500,
                        background: 'var(--color-success-bg)', color: 'var(--color-success)',
                      }}>{t('product.nodeCertifiedBadge', 'Certified')}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openNodeEdit(rec)} style={btnStyle}>{t('product.btnEditNode')}</button>
                    <button onClick={() => handleDeleteNode(rec.id)} style={{ ...btnStyle, color: 'var(--color-error)', borderColor: 'var(--color-error)' }}>{t('product.btnDeleteNode')}</button>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text)', marginBottom: 4 }}>{rec.description}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-3)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {rec.location && <span>{rec.location}</span>}
                  {rec.timestamp && <span>{dayjs(rec.timestamp).format('YYYY-MM-DD')}</span>}
                  {rec.carbonKg != null && <span>{rec.carbonKg} {t('product.carbonUnit', 'kg CO2')}</span>}
                </div>
                {rec.gallery.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {rec.gallery.map((item, i) => (
                      item.type === 'video' ? (
                        <video key={i} src={item.url} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4 }} muted />
                      ) : (
                        <img key={i} src={item.url} alt={item.caption ?? ''} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4 }} />
                      )
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ── Node Create / Edit Modal ── */}
      <Modal
        open={nodeModalOpen}
        onClose={closeNodeModal}
        title={editingNode ? t('product.btnEditNode') : t('product.btnAddNode')}
        width={640}
        footer={
          <>
            <Button variant="secondary" onClick={closeNodeModal}>{t('common.cancel')}</Button>
            <Button variant="primary" loading={createNodeMut.isPending || updateNodeMut.isPending} onClick={(e) => submitNode(e)}>
              {t('product.btnSaveNode')}
            </Button>
          </>
        }
      >
        <form onSubmit={submitNode} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>{t('product.nodeStage')}</label>
            <select
              value={nodeForm.stage}
              onChange={(e) => setNodeForm({ ...nodeForm, stage: e.target.value as SupplyChainRecord['stage'] })}
              style={inputStyle}
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>{t(`product.stage${s.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join('')}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>{t('product.nodeTimestamp')}</label>
            <input type="date" value={nodeForm.timestamp} onChange={(e) => setNodeForm({ ...nodeForm, timestamp: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>{t('product.nodeLocation')}</label>
            <input value={nodeForm.location} onChange={(e) => setNodeForm({ ...nodeForm, location: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>{t('product.nodeDescription')}</label>
            <textarea value={nodeForm.description} onChange={(e) => setNodeForm({ ...nodeForm, description: e.target.value })} style={{ ...inputStyle, height: 80 }} />
          </div>
          <div>
            <label style={labelStyle}>{t('product.nodeLatitude')}</label>
            <input type="number" step="any" value={nodeForm.latitude} onChange={(e) => setNodeForm({ ...nodeForm, latitude: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t('product.nodeLongitude')}</label>
            <input type="number" step="any" value={nodeForm.longitude} onChange={(e) => setNodeForm({ ...nodeForm, longitude: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t('product.nodeCarbonKg')}</label>
            <input type="number" step="any" value={nodeForm.carbonKg} onChange={(e) => setNodeForm({ ...nodeForm, carbonKg: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t('product.nodeCarbonNote')}</label>
            <input value={nodeForm.carbonNote} onChange={(e) => setNodeForm({ ...nodeForm, carbonNote: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>{t('product.nodeCertImageUrl')}</label>
            <input value={nodeForm.certImageUrl} onChange={(e) => setNodeForm({ ...nodeForm, certImageUrl: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="node-certified"
              checked={nodeForm.certified}
              onChange={(e) => setNodeForm({ ...nodeForm, certified: e.target.checked })}
            />
            <label htmlFor="node-certified" style={{ fontSize: 13 }}>{t('product.nodeCertified')}</label>
          </div>

          {/* ── Media Gallery ── */}
          <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--color-border)', paddingTop: 12, marginTop: 4 }}>
            <label style={{ ...labelStyle, marginBottom: 8, display: 'block' }}>{t('product.nodeGallery')}</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              {nodeForm.gallery.map((item, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  {item.type === 'video' ? (
                    <video src={item.url} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4 }} muted />
                  ) : (
                    <img src={item.url} alt="" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4 }} />
                  )}
                  <button
                    type="button"
                    onClick={() => removeGalleryItem(idx)}
                    style={{
                      position: 'absolute', top: -6, right: -6, width: 18, height: 18,
                      borderRadius: '50%', border: 'none', background: 'var(--color-error)',
                      color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >x</button>
                </div>
              ))}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
              onChange={handleMediaUpload}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                padding: '8px 16px', border: '1px dashed var(--color-border-hi)',
                borderRadius: 6, background: 'transparent', cursor: 'pointer',
                fontSize: 13, color: uploading ? 'var(--color-text-3)' : 'var(--color-accent-2)',
              }}
            >
              {uploading ? t('product.uploading') : t('product.uploadHint')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ── Shared styles ── */
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, marginBottom: 6 };

const btnStyle: React.CSSProperties = {
  padding: '4px 10px', border: '1px solid var(--color-border)', borderRadius: 4,
  fontSize: 11, cursor: 'pointer', background: 'transparent', color: 'var(--color-text-2)',
};
