import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import type { AdminProduct } from '../types';
import { createProduct, deleteProduct, fetchOriginCountries, fetchOriginRegions, fetchProducts } from '../services/api';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};

export default function ProductPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'CNY',
    imageUrl: '',
    category: 'apparel',
    stock: '0',
    status: 'active' as AdminProduct['status'],
    isImpactProduct: true,
    campaignId: '',
    donationPercentage: '',
    artworkId: '',
    originCountryId: '',
    originRegionId: '',
    traceStoryTitle: '',
    traceStoryContent: '',
    nameEn: '',
    descriptionEn: '',
    traceStoryTitleEn: '',
    traceStoryContentEn: '',
  });

  const { data, isLoading } = useQuery({
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
    [regions, form.originCountryId]
  );

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(t('product.toastCreated'));
      setOpen(false);
      setForm({
        name: '',
        description: '',
        price: '',
        currency: 'CNY',
        imageUrl: '',
        category: 'apparel',
        stock: '0',
        status: 'active',
        isImpactProduct: true,
        campaignId: '',
        donationPercentage: '',
        artworkId: '',
        originCountryId: '',
        originRegionId: '',
        traceStoryTitle: '',
        traceStoryContent: '',
        nameEn: '',
        descriptionEn: '',
        traceStoryTitleEn: '',
        traceStoryContentEn: '',
      });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.detail ?? t('product.toastCreateFailed'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(t('product.toastDeleted'));
      setDeleteTarget(null);
    },
    onError: (e: any) => {
      const d = e?.response?.data?.detail;
      toast.error(typeof d === 'string' ? d : t('product.toastDeleteFailed'));
    },
  });

  const columns: Column<AdminProduct>[] = [
    { key: 'name', title: t('product.colName'), minWidth: 160 },
    {
      key: 'price',
      title: t('product.colPrice'),
      width: 110,
      render: (v, row) => `${row.currency} ${Number(v).toFixed(2)}`,
    },
    { key: 'category', title: t('product.colCategory'), width: 110 },
    { key: 'stock', title: t('product.colStock'), width: 80 },
    { key: 'status', title: t('product.colStatus'), width: 90 },
    {
      key: 'isImpactProduct',
      title: t('product.colImpact'),
      width: 90,
      render: (v) => (v ? t('common.yes') : t('common.no')),
    },
    {
      key: 'createdAt',
      title: t('product.colCreatedAt'),
      width: 150,
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      key: 'actions',
      title: t('product.colActions'),
      width: 120,
      render: (_: unknown, record: AdminProduct) => (
        <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); setDeleteTarget(record); }}>
          {t('product.btnDelete')}
        </Button>
      ),
    },
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast.error(t('product.errorRequired'));
      return;
    }
    createMutation.mutate({
      name: form.name,
      description: form.description,
      price: Number(form.price),
      currency: form.currency,
      imageUrl: form.imageUrl,
      category: form.category,
      stock: Number(form.stock),
      status: form.status,
      isImpactProduct: form.isImpactProduct,
      campaignId: form.campaignId || undefined,
      donationPercentage: form.donationPercentage ? Number(form.donationPercentage) : undefined,
      artworkId: form.artworkId || undefined,
      originCountryId: form.originCountryId || undefined,
      originRegionId: form.originRegionId || undefined,
      traceStoryTitle: form.traceStoryTitle,
      traceStoryContent: form.traceStoryContent,
      nameEn: form.nameEn,
      descriptionEn: form.descriptionEn,
      traceStoryTitleEn: form.traceStoryTitleEn,
      traceStoryContentEn: form.traceStoryContentEn,
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4, fontFamily: 'var(--font-body)' }}>{t('product.title')}</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{t('product.description')}</p>
        </div>
        <Button variant="primary" onClick={() => setOpen(true)}>
          {t('product.btnCreate')}
        </Button>
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

      <DataTable columns={columns} data={data?.data || []} rowKey="id" loading={isLoading} />
      <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} pageSize={10} onPageChange={setPage} />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('product.modalCreateTitle')}
        width={760}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" loading={createMutation.isPending} onClick={(e) => submit(e as any)}>
              {t('product.btnCreateSubmit')}
            </Button>
          </>
        )}
      >
        <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>{t('product.labelName')} *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>{t('product.labelPrice')} *</label>
            <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>{t('product.labelCurrency')}</label>
            <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>{t('product.labelCategory')}</label>
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>{t('product.labelStock')}</label>
            <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>{t('product.labelStatus')}</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AdminProduct['status'] })} style={inputStyle}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="sold_out">sold_out</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>{t('product.labelDescription')}</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, height: 80 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>English name (optional)</label>
            <input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} style={inputStyle} placeholder="Shown when site language is English" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>English description (optional)</label>
            <textarea value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} style={{ ...inputStyle, height: 72 }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>{t('product.labelImageUrl')}</label>
            <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>{t('product.labelImpact')}</label>
            <select value={String(form.isImpactProduct)} onChange={(e) => setForm({ ...form, isImpactProduct: e.target.value === 'true' })} style={inputStyle}>
              <option value="true">{t('common.yes')}</option>
              <option value="false">{t('common.no')}</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>{t('product.labelDonationPercentage')}</label>
            <input type="number" min="0" max="100" step="0.01" value={form.donationPercentage} onChange={(e) => setForm({ ...form, donationPercentage: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>{t('product.labelCampaignId')}</label>
            <input value={form.campaignId} onChange={(e) => setForm({ ...form, campaignId: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>{t('product.labelArtworkId')}</label>
            <input value={form.artworkId} onChange={(e) => setForm({ ...form, artworkId: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>{t('product.labelOriginCountry')}</label>
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
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>{t('product.labelOriginRegion')}</label>
            <select value={form.originRegionId} onChange={(e) => setForm({ ...form, originRegionId: e.target.value })} style={inputStyle}>
              <option value="">{t('common.none')}</option>
              {selectableRegions.map((r) => (
                <option key={r.id} value={r.id}>{r.nameZh}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>{t('product.labelTraceStoryTitle')}</label>
            <input value={form.traceStoryTitle} onChange={(e) => setForm({ ...form, traceStoryTitle: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>{t('product.labelTraceStoryContent')}</label>
            <textarea value={form.traceStoryContent} onChange={(e) => setForm({ ...form, traceStoryContent: e.target.value })} style={{ ...inputStyle, height: 110 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Trace story title (EN, optional)</label>
            <input value={form.traceStoryTitleEn} onChange={(e) => setForm({ ...form, traceStoryTitleEn: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Trace story content (EN, optional)</label>
            <textarea value={form.traceStoryContentEn} onChange={(e) => setForm({ ...form, traceStoryContentEn: e.target.value })} style={{ ...inputStyle, height: 88 }} />
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('product.modalDeleteTitle')}
        width={440}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
              }}
            >
              {t('product.btnDeleteConfirm')}
            </Button>
          </>
        )}
      >
        {deleteTarget && (
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-text)' }}>
            {t('product.modalDeleteBody', { name: deleteTarget.name })}
          </p>
        )}
      </Modal>
    </div>
  );
}
