import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import { useAuthStore } from '@/stores/authStore';
import { productsApi } from '@/services/products';
import { supplyChainApi, type SupplyChainRecord } from '@/services/supply-chain';
import type { TraceMediaItem } from '@/types';
import toast from 'react-hot-toast';

function RecordGalleryEditor({
  record,
  onSave,
  disabled,
}: {
  record: SupplyChainRecord;
  onSave: (g: TraceMediaItem[]) => void;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<TraceMediaItem[]>([{ type: 'image', url: '', caption: '' }]);
  const [uploadingRow, setUploadingRow] = useState<number | null>(null);

  const gallerySyncKey = useMemo(
    () => `${record.id}:${JSON.stringify(record.gallery ?? [])}`,
    [record.id, record.gallery]
  );

  useEffect(() => {
    setRows(
      record.gallery?.length
        ? record.gallery.map((x) => ({
            type: x.type === 'video' ? ('video' as const) : ('image' as const),
            url: x.url,
            caption: x.caption,
          }))
        : [{ type: 'image', url: '', caption: '' }]
    );
  }, [gallerySyncKey]);

  const handleLocalUpload = async (rowIndex: number, file: File | undefined) => {
    if (!file) return;
    setUploadingRow(rowIndex);
    try {
      const { url, mime } = await supplyChainApi.uploadTraceMedia(file);
      setRows((prev) => {
        const next = [...prev];
        const cur = next[rowIndex];
        if (!cur) return prev;
        const isVideo = mime.startsWith('video/') || cur.type === 'video';
        next[rowIndex] = { ...cur, url, type: isVideo ? 'video' : 'image' };
        return next;
      });
      toast.success(t('supplyChainStudio.uploaded', '上传成功'));
    } catch {
      toast.error(t('supplyChainStudio.uploadError', '上传失败'));
    } finally {
      setUploadingRow(null);
    }
  };

  return (
    <div className="border border-warm-gray/25 bg-paper/40 p-5 space-y-3">
      <p className="font-body text-[10px] tracking-[0.2em] uppercase text-sepia-mid">
        {record.stage} · ID {record.id}
      </p>
      {rows.map((row, i) => (
        <div
          key={i}
          className="grid grid-cols-1 md:grid-cols-[88px_minmax(0,1.2fr)_minmax(0,1fr)_auto] gap-2 items-end"
        >
          <select
            value={row.type}
            onChange={(e) => {
              const next = [...rows];
              next[i] = { ...row, type: e.target.value === 'video' ? 'video' : 'image' };
              setRows(next);
            }}
            className="border border-warm-gray/25 bg-paper px-2 py-1.5 text-xs font-body"
          >
            <option value="image">{t('supplyChainStudio.image', '图片')}</option>
            <option value="video">{t('supplyChainStudio.video', '视频')}</option>
          </select>
          <div className="space-y-1.5 min-w-0">
            <input
              value={row.url}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...row, url: e.target.value };
                setRows(next);
              }}
              placeholder={t('supplyChainStudio.urlOrUpload', 'URL 或下方本地上传')}
              className="border border-warm-gray/25 bg-paper px-2 py-1.5 text-xs font-body w-full"
            />
            <div className="flex flex-wrap items-center gap-2">
              <label className="font-body text-[10px] tracking-wider uppercase text-sepia-mid border border-warm-gray/30 px-2 py-1 cursor-pointer hover:border-warm-gray/55 transition-colors shrink-0">
                <input
                  type="file"
                  className="sr-only"
                  accept={row.type === 'video' ? 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov' : 'image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif'}
                  disabled={disabled || uploadingRow === i}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    void handleLocalUpload(i, f);
                  }}
                />
                {uploadingRow === i
                  ? t('supplyChainStudio.uploading', '上传中…')
                  : t('supplyChainStudio.uploadLocal', '本地上传')}
              </label>
              <span className="font-body text-[10px] text-ink-faded truncate max-w-[12rem]" title={row.url}>
                {row.url || '—'}
              </span>
            </div>
          </div>
          <input
            value={row.caption ?? ''}
            onChange={(e) => {
              const next = [...rows];
              next[i] = { ...row, caption: e.target.value };
              setRows(next);
            }}
            placeholder={t('supplyChainStudio.caption', '说明（可选）')}
            className="border border-warm-gray/25 bg-paper px-2 py-1.5 text-xs font-body w-full"
          />
          <button
            type="button"
            className="text-xs text-rust font-body self-end pb-1.5"
            onClick={() => setRows(rows.filter((_, j) => j !== i))}
          >
            {t('supplyChainStudio.removeRow', '移除')}
          </button>
        </div>
      ))}
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          onClick={() => setRows([...rows, { type: 'image', url: '', caption: '' }])}
          className="font-body text-[10px] uppercase tracking-widest text-sepia-mid border border-warm-gray/30 px-3 py-2"
        >
          {t('supplyChainStudio.addRow', '添加一条')}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSave(rows.filter((x) => x.url.trim()))}
          className="font-body text-[10px] uppercase tracking-widest bg-ink text-paper px-4 py-2 disabled:opacity-50"
        >
          {t('supplyChainStudio.save', '保存')}
        </button>
      </div>
    </div>
  );
}

export default function SupplyChainStudio() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const isStaff = user?.role === 'admin' || user?.role === 'editor';
  const [productId, setProductId] = useState<string>('');

  const { data: productPage } = useQuery({
    queryKey: ['products-all-studio', i18n.language],
    queryFn: () => productsApi.getAll({ page_size: 200, locale: i18n.language }),
    enabled: isAuthenticated && isStaff,
  });
  const products = productPage?.items ?? [];

  const pid = Number(productId);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['supply-chain-records', pid],
    queryFn: () => supplyChainApi.getRecords({ product_id: pid, page_size: 100 }),
    enabled: isAuthenticated && isStaff && pid > 0,
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, gallery }: { id: number; gallery: TraceMediaItem[] }) =>
      supplyChainApi.patchRecord(id, { gallery }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supply-chain-records', pid] });
      qc.invalidateQueries({ queryKey: ['product-supply-chain'] });
      toast.success(t('supplyChainStudio.saved', '已保存'));
    },
    onError: (err: Error) => toast.error(err.message || t('supplyChainStudio.saveError', '保存失败')),
  });

  if (!isAuthenticated || !isStaff) {
    return (
      <PageWrapper>
        <PaperTextureBackground variant="paper" className="py-24 text-center">
          <p className="font-body text-ink-faded mb-6">
            {t('supplyChainStudio.adminOnly', '仅管理员/编辑可管理溯源媒体')}
          </p>
          <Link to="/login" className="font-body text-rust uppercase tracking-widest text-sm">
            {t('nav.login')} →
          </Link>
        </PaperTextureBackground>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PaperTextureBackground variant="paper" className="py-16 md:py-24">
        <SectionContainer>
          <h1 className="font-display text-2xl text-ink mb-2">
            {t('supplyChainStudio.title', '溯源节点媒体')}
          </h1>
          <p className="font-body text-caption text-sepia-mid mb-8 max-w-2xl leading-relaxed">
            {t(
              'supplyChainStudio.lead',
              '为每个溯源点配置图片或视频：可本地上传（存入服务器 /static/uploads/traceability），也可手动填写外链。支持 mp4/webm/mov、JPEG/PNG/WebP/GIF。保存后商品详情地球仪与时间线会同步展示。'
            )}
          </p>

          <label className="block font-body text-caption text-ink-faded mb-2">
            {t('supplyChainStudio.selectProduct', '选择商品')}
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full max-w-md border border-warm-gray/30 bg-paper px-3 py-2 font-body text-body-sm text-ink mb-10"
          >
            <option value="">{t('supplyChainStudio.pickProduct', '— 请选择 —')}</option>
            {products.map((p) => (
              <option key={p.id} value={String(p.id)}>
                #{p.id} · {p.name}
              </option>
            ))}
          </select>

          {pid > 0 && (
            <div className="space-y-6">
              {isLoading && <p className="font-body text-sepia-mid">{t('common.loading', '…')}</p>}
              {!isLoading && records.length === 0 && (
                <p className="font-body text-caption text-ink-faded">
                  {t('supplyChainStudio.noRecords', '该商品暂无溯源记录')}
                </p>
              )}
              {records.map((r) => (
                <RecordGalleryEditor
                  key={r.id}
                  record={r}
                  onSave={(gallery) => patchMutation.mutate({ id: Number(r.id), gallery })}
                  disabled={patchMutation.isPending}
                />
              ))}
            </div>
          )}
        </SectionContainer>
      </PaperTextureBackground>
    </PageWrapper>
  );
}
