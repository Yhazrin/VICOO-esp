import { useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import GrainOverlay from '@/components/editorial/GrainOverlay';
import { VintageInput } from '@/components/editorial/VintageInput';
import { VintageSelect } from '@/components/editorial/VintageSelect';
import { afterSalesApi } from '@/services/afterSales';
import { useAuthStore } from '@/stores/authStore';

const CATEGORIES = [
  { value: 'return', label: '退货' },
  { value: 'exchange', label: '换货' },
  { value: 'quality', label: '质量问题' },
  { value: 'logistics', label: '物流' },
  { value: 'other', label: '其他' },
];

export default function Support() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [orderId, setOrderId] = useState('');
  const [category, setCategory] = useState('quality');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      afterSalesApi.create({
        order_id: Number(orderId),
        category: category as 'return' | 'exchange' | 'quality' | 'logistics' | 'other',
        subject,
        description: description || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-after-sales'] });
      setSubject('');
      setDescription('');
      setOrderId('');
    },
  });

  if (!isAuthenticated) {
    return (
      <PageWrapper>
        <PaperTextureBackground variant="paper" className="py-24 text-center">
          <GrainOverlay />
          <p className="font-body text-ink-faded mb-6">{t('support.loginRequired', '登录后提交售后工单')}</p>
          <Link to="/login" className="font-body text-rust uppercase tracking-widest text-sm">
            {t('nav.login')} →
          </Link>
        </PaperTextureBackground>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PaperTextureBackground variant="aged" className="py-16 md:py-24 relative">
        <GrainOverlay />
        <SectionContainer>
          <NumberedSectionHeading number="06" title={t('support.title', '售后服务')} subtitle={t('support.subtitle', '关联订单号，便于运营处理')} />
          <form
            className="max-w-xl space-y-6 border border-warm-gray/30 p-6 md:p-8"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <VintageInput
              label={t('support.orderId', '订单 ID *')}
              value={orderId}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setOrderId(e.target.value)}
              required
              inputMode="numeric"
            />
            <VintageSelect
              label={t('support.category', '类型')}
              value={category}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}
              options={CATEGORIES}
            />
            <VintageInput
              label={t('support.subject', '主题 *')}
              value={subject}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSubject(e.target.value)}
              required
            />
            <VintageInput
              label={t('support.description', '详情')}
              value={description}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDescription(e.target.value)}
            />
            {mutation.isSuccess && (
              <p className="font-body text-caption text-archive-brown" role="status">
                {t('support.success', '已提交，请在个人中心查看进度')}
              </p>
            )}
            {mutation.isError && (
              <p className="font-body text-caption text-rust" role="alert">
                {t('support.error', '提交失败，请检查订单号是否属于您的账号')}
              </p>
            )}
            <button
              type="submit"
              disabled={mutation.isPending || !orderId || !subject.trim()}
              className="w-full font-body text-body-sm tracking-[0.15em] uppercase py-4 bg-ink text-paper hover:bg-rust disabled:opacity-50 cursor-pointer"
            >
              {mutation.isPending ? t('common.loading', '提交中…') : t('support.submit', '提交工单')}
            </button>
          </form>
          <Link to="/profile" className="font-body text-caption text-rust mt-8 inline-block">
            ← {t('profile.title')}
          </Link>
        </SectionContainer>
      </PaperTextureBackground>
    </PageWrapper>
  );
}
