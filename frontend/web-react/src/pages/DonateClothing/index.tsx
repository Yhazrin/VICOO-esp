import { useState, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import GrainOverlay from '@/components/editorial/GrainOverlay';
import { VintageInput } from '@/components/editorial/VintageInput';
import { clothingIntakesApi } from '@/services/clothingIntakes';
import { useAuthStore } from '@/stores/authStore';

export default function DonateClothing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [summary, setSummary] = useState('');
  const [garmentTypes, setGarmentTypes] = useState('');
  const [quantityEstimate, setQuantityEstimate] = useState(1);
  const [conditionNotes, setConditionNotes] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      clothingIntakesApi.create({
        summary,
        garment_types: garmentTypes || undefined,
        quantity_estimate: quantityEstimate,
        condition_notes: conditionNotes || undefined,
        pickup_address: pickupAddress || undefined,
        contact_phone: contactPhone || undefined,
      }),
    onSuccess: () => navigate('/profile'),
  });

  if (!isAuthenticated) {
    return (
      <PageWrapper>
        <PaperTextureBackground variant="paper" className="py-24 text-center">
          <GrainOverlay />
          <p className="font-body text-ink-faded mb-6">{t('donateClothing.loginRequired', '请先登录以登记衣物捐献')}</p>
          <Link to="/login" className="font-body text-rust uppercase tracking-widest text-sm">
            {t('nav.login')} →
          </Link>
        </PaperTextureBackground>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PaperTextureBackground variant="paper" className="py-16 md:py-24 relative">
        <GrainOverlay />
        <SectionContainer>
          <NumberedSectionHeading
            number="05"
            title={t('donateClothing.title', '衣物捐献登记')}
            subtitle={t('donateClothing.subtitle', '分拣消毒后进入再生商品池，由运营上架')}
          />
          <form
            className="max-w-xl space-y-6 border border-warm-gray/30 p-6 md:p-8 bg-paper/90"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <VintageInput
              label={t('donateClothing.summary', '物品概要 *')}
              value={summary}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSummary(e.target.value)}
              required
            />
            <VintageInput
              label={t('donateClothing.types', '类型（如外套、童装）')}
              value={garmentTypes}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setGarmentTypes(e.target.value)}
            />
            <div>
              <label htmlFor="qty" className="font-body text-overline text-sepia-mid block mb-2">
                {t('donateClothing.qty', '预估件数')}
              </label>
              <input
                id="qty"
                type="number"
                min={1}
                max={999}
                value={quantityEstimate}
                onChange={(e) => setQuantityEstimate(Number(e.target.value) || 1)}
                className="w-full border border-warm-gray/40 bg-transparent px-4 py-3 font-body text-body-sm text-ink"
              />
            </div>
            <VintageInput
              type="textarea"
              label={t('donateClothing.condition', '成色与备注')}
              value={conditionNotes}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setConditionNotes(e.target.value)}
            />
            <VintageInput
              type="textarea"
              label={t('donateClothing.pickup', '取件/寄送地址')}
              value={pickupAddress}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPickupAddress(e.target.value)}
            />
            <VintageInput
              label={t('donateClothing.phone', '联系电话')}
              value={contactPhone}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setContactPhone(e.target.value)}
            />
            {mutation.isError && (
              <p className="font-body text-caption text-rust" role="alert">
                {t('donateClothing.error', '提交失败，请稍后再试')}
              </p>
            )}
            <button
              type="submit"
              disabled={mutation.isPending || !summary.trim()}
              className="w-full font-body text-body-sm tracking-[0.15em] uppercase py-4 bg-ink text-paper hover:bg-rust disabled:opacity-50 cursor-pointer"
            >
              {mutation.isPending ? t('common.loading', '提交中…') : t('donateClothing.submit', '提交登记')}
            </button>
          </form>
          <p className="font-body text-caption text-ink-faded mt-8 max-w-xl">
            {t('donateClothing.disclaimer', '提交后可在个人中心查看进度；涉及个人隐私仅用于物流联络。')}
          </p>
        </SectionContainer>
      </PaperTextureBackground>
    </PageWrapper>
  );
}
