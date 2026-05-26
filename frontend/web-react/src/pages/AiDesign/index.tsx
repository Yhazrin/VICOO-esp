import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';

import { aiDesignApi, type DesignDraft } from '@/services/aiDesign';
import { useAuthStore } from '@/stores/authStore';

const STATUS_STYLES: Record<string, string> = {
  draft: 'text-sepia-mid border-warm-gray/30',
  ai_generated: 'text-archive-brown border-archive-brown/30',
  review: 'text-sepia-mid border-warm-gray/40',
  approved: 'text-sage border-sage/30',
  rejected: 'text-rust border-rust/30',
  published: 'text-archive-brown border-archive-brown/30',
};

export default function AiDesign() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'editor';

  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedDraft, setSelectedDraft] = useState<DesignDraft | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [createArtworkId, setCreateArtworkId] = useState('');
  const [createTitle, setCreateTitle] = useState('');
  const [createCategory, setCreateCategory] = useState('');
  const [publishPrice, setPublishPrice] = useState('99');
  const [publishStock, setPublishStock] = useState('100');
  const [errorMessage, setErrorMessage] = useState('');

  const { data: drafts = [], isLoading } = useQuery({
    queryKey: ['design-drafts', filterStatus],
    queryFn: () => aiDesignApi.list(filterStatus ? { status: filterStatus } : undefined),
    enabled: isAuthenticated && isAdmin,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      aiDesignApi.create({
        artwork_id: Number(createArtworkId),
        title: createTitle,
        target_category: createCategory || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['design-drafts'] });
      setCreateArtworkId('');
      setCreateTitle('');
      setCreateCategory('');
    },
    onError: () => setErrorMessage(t('aiDesign.createError', '创建设计稿失败')),
  });

  const generateMutation = useMutation({
    mutationFn: (id: number) => aiDesignApi.generate(id),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['design-drafts'] });
      setSelectedDraft(updated);
    },
    onError: () => setErrorMessage(t('aiDesign.generateError', 'AI 生成失败')),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => aiDesignApi.approve(id, reviewNote || undefined),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['design-drafts'] });
      setSelectedDraft(updated);
      setReviewNote('');
    },
    onError: () => setErrorMessage(t('aiDesign.approveError', '审批失败')),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => aiDesignApi.reject(id, reviewNote || undefined),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['design-drafts'] });
      setSelectedDraft(updated);
      setReviewNote('');
    },
    onError: () => setErrorMessage(t('aiDesign.rejectError', '拒绝失败')),
  });

  const publishMutation = useMutation({
    mutationFn: (id: number) => aiDesignApi.publish(id, { price: Number(publishPrice) || 99, stock: Number(publishStock) || 100 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['design-drafts'] });
      setSelectedDraft(null);
    },
    onError: () => setErrorMessage(t('aiDesign.publishError', '发布商品失败')),
  });

  if (!isAuthenticated || !isAdmin) {
    return (
      <PageWrapper>
        <PaperTextureBackground variant="paper" className="py-24 text-center">

          <p className="font-body text-ink-faded mb-6">
            {t('aiDesign.adminOnly', '仅管理员可访问 AI 设计工作台')}
          </p>
          <Link to="/login" className="font-body text-rust uppercase tracking-widest text-sm">
            {t('nav.login')} →
          </Link>
        </PaperTextureBackground>
      </PageWrapper>
    );
  }

  const statuses = ['', 'draft', 'ai_generated', 'review', 'approved', 'rejected', 'published'] as const;

  return (
    <PageWrapper>
      <PaperTextureBackground variant="paper" className="py-16 md:py-24 relative">

        <SectionContainer>
          <h2 className="font-display text-h3 font-bold text-ink mb-2">
            {t('aiDesign.title', 'AI 设计工作台')}
          </h2>
          <p className="font-body text-body-sm text-ink-faded mb-8">
            {t('aiDesign.subtitle', '将儿童画作转化为商业产品设计')}
          </p>

          {errorMessage && (
            <div className="flex items-center gap-3 bg-rust/10 border border-rust/20 px-4 py-3 mb-6">
              <p className="font-body text-body-sm text-rust flex-1">{errorMessage}</p>
              <button onClick={() => setErrorMessage('')} className="text-rust cursor-pointer" aria-label={t('common.dismiss', 'Dismiss')}>&times;</button>
            </div>
          )}

          {/* Create new draft */}
          <div className="border border-warm-gray/30 p-6 mb-8 bg-paper/90">
            <h3 className="font-display text-lg text-ink font-bold mb-4">
              {t('aiDesign.createNew', '创建新设计稿')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="number"
                placeholder={t('aiDesign.artworkId', '画作 ID')}
                value={createArtworkId}
                onChange={(e) => setCreateArtworkId(e.target.value)}
                className="border border-warm-gray/30 bg-transparent px-3 py-2 font-body text-body-sm text-ink"
              />
              <input
                placeholder={t('aiDesign.draftTitle', '设计稿标题')}
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                className="border border-warm-gray/30 bg-transparent px-3 py-2 font-body text-body-sm text-ink"
              />
              <select
                value={createCategory}
                onChange={(e) => setCreateCategory(e.target.value)}
                className="border border-warm-gray/30 bg-transparent px-3 py-2 font-body text-body-sm text-ink"
              >
                <option value="">{t('aiDesign.selectCategory', '选择品类')}</option>
                <option value="apparel">{t('shop.categories.apparel', '服饰')}</option>
                <option value="accessories">{t('shop.categories.accessories', '配饰')}</option>
                <option value="stationery">{t('shop.categories.stationery', '文具')}</option>
                <option value="home">{t('shop.categories.home', '家居')}</option>
              </select>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!createArtworkId || !createTitle || createMutation.isPending}
                className="font-body text-label tracking-wide bg-ink text-paper py-2 hover:bg-rust disabled:opacity-40 cursor-pointer"
              >
                {createMutation.isPending ? t('common.loading', '…') : t('aiDesign.create', '创建')}
              </button>
            </div>
          </div>

          {/* Status filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`font-body text-[11px] tracking-[0.1em] uppercase px-3 py-1.5 border transition-all cursor-pointer ${
                  filterStatus === s
                    ? 'border-rust/50 bg-rust/10 text-ink'
                    : 'border-warm-gray/25 text-sepia-mid hover:border-warm-gray/40'
                }`}
              >
                {s ? t(`aiDesign.statuses.${s}`, s) : t('aiDesign.all', '全部')}
              </button>
            ))}
          </div>

          {/* Drafts list */}
          {isLoading ? (
            <p className="font-body text-body-sm text-ink-faded">{t('common.loading', 'Loading...')}</p>
          ) : drafts.length === 0 ? (
            <p className="font-body text-body-sm text-ink-faded text-center py-12">
              {t('aiDesign.noDrafts', '暂无设计稿')}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="border border-warm-gray/25 bg-paper p-5 hover:border-rust/25 transition-colors cursor-pointer"
                  onClick={() => setSelectedDraft(draft)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display text-lg text-ink">{draft.title}</h3>
                    <span className={`font-body text-[10px] tracking-wider uppercase px-2 py-0.5 border ${STATUS_STYLES[draft.status] ?? ''}`}>
                      {draft.status}
                    </span>
                  </div>
                  {draft.description && (
                    <p className="font-body text-caption text-ink-faded line-clamp-2">{draft.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 font-body text-caption text-sepia-mid">
                    <span>{t('aiDesign.artworkRef', '画作')}: #{draft.artwork_id}</span>
                    {draft.target_category && <span>{draft.target_category}</span>}
                    <span>{draft.created_at.slice(0, 10)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionContainer>
      </PaperTextureBackground>

      {/* Draft detail modal */}
      {selectedDraft && (
        <>
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div className="fixed inset-0 bg-ink/40 z-40" onClick={(e) => { if (e.target === e.currentTarget) setSelectedDraft(null); }} />
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label={selectedDraft.title}
            onKeyDown={(e) => { if (e.key === 'Escape') setSelectedDraft(null); }}
            className="fixed inset-x-4 top-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-paper border border-warm-gray/25 z-50 p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl font-bold text-ink">{selectedDraft.title}</h3>
              <button onClick={() => setSelectedDraft(null)} aria-label={t('common.close', 'Close')} className="text-sepia-mid hover:text-ink cursor-pointer">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" /></svg>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex gap-2">
                <span className={`font-body text-[10px] tracking-wider uppercase px-2 py-0.5 border ${STATUS_STYLES[selectedDraft.status] ?? ''}`}>
                  {selectedDraft.status}
                </span>
                {selectedDraft.target_category && (
                  <span className="font-body text-[10px] tracking-wider uppercase px-2 py-0.5 border border-warm-gray/25 text-sepia-mid">
                    {selectedDraft.target_category}
                  </span>
                )}
              </div>
              {selectedDraft.description && (
                <p className="font-body text-body-sm text-ink-faded">{selectedDraft.description}</p>
              )}
              {selectedDraft.prompt_used && (
                <div>
                  <p className="font-body text-caption text-sepia-mid tracking-wider uppercase mb-1">
                    {t('aiDesign.prompt', 'AI Prompt')}
                  </p>
                  <p className="font-body text-caption text-ink-faded bg-warm-gray/5 p-3">{selectedDraft.prompt_used}</p>
                </div>
              )}
              {selectedDraft.review_note && (
                <div>
                  <p className="font-body text-caption text-sepia-mid tracking-wider uppercase mb-1">
                    {t('aiDesign.reviewNote', '审核备注')}
                  </p>
                  <p className="font-body text-caption text-ink-faded">{selectedDraft.review_note}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {(selectedDraft.status === 'draft' || selectedDraft.status === 'rejected') && (
                <button
                  onClick={() => generateMutation.mutate(selectedDraft.id)}
                  disabled={generateMutation.isPending}
                  className="font-body text-label tracking-wide bg-ink text-paper px-6 py-2.5 hover:bg-rust disabled:opacity-40 cursor-pointer"
                >
                  {t('aiDesign.generate', 'AI 生成')}
                </button>
              )}
              {(selectedDraft.status === 'ai_generated' || selectedDraft.status === 'review') && (
                <>
                  <input
                    type="text"
                    placeholder={t('aiDesign.reviewNotePlaceholder', '审核备注（可选）')}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    className="flex-1 border border-warm-gray/30 bg-transparent px-3 py-2 font-body text-body-sm text-ink min-w-0"
                  />
                  <button
                    onClick={() => approveMutation.mutate(selectedDraft.id)}
                    disabled={approveMutation.isPending}
                    className="font-body text-label tracking-wide bg-sage text-paper px-6 py-2.5 hover:opacity-90 disabled:opacity-40 cursor-pointer"
                  >
                    {t('aiDesign.approve', '通过')}
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(selectedDraft.id)}
                    disabled={rejectMutation.isPending}
                    className="font-body text-label tracking-wide border border-rust/30 text-rust px-6 py-2.5 hover:bg-rust/5 disabled:opacity-40 cursor-pointer"
                  >
                    {t('aiDesign.reject', '驳回')}
                  </button>
                </>
              )}
              {selectedDraft.status === 'approved' && (
                <>
                  <input
                    type="number"
                    placeholder={t('aiDesign.price', '价格')}
                    value={publishPrice}
                    onChange={(e) => setPublishPrice(e.target.value)}
                    className="w-24 border border-warm-gray/30 bg-transparent px-3 py-2 font-body text-body-sm text-ink"
                    min="1"
                  />
                  <input
                    type="number"
                    placeholder={t('aiDesign.stock', '库存')}
                    value={publishStock}
                    onChange={(e) => setPublishStock(e.target.value)}
                    className="w-24 border border-warm-gray/30 bg-transparent px-3 py-2 font-body text-body-sm text-ink"
                    min="0"
                  />
                  <button
                    onClick={() => publishMutation.mutate(selectedDraft.id)}
                    disabled={publishMutation.isPending}
                    className="font-body text-label tracking-wide bg-archive-brown text-paper px-6 py-2.5 hover:opacity-90 disabled:opacity-40 cursor-pointer"
                  >
                    {t('aiDesign.publish', '发布为商品')}
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </PageWrapper>
  );
}
