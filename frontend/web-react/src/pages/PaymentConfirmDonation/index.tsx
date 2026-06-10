import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import { paymentsApi, type MockDonationPayPreview } from '@/services/payments';
import { resolvePayApiBaseFromSearchParam } from '@/utils/payApiBaseOverride';

export default function PaymentConfirmDonation() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = (
    params.get('t') ||
    params.get('token') ||
    params.get('mock_pay_token') ||
    params.get('mockPayToken') ||
    params.get('payment_token') ||
    params.get('paymentToken') ||
    ''
  ).trim();

  const payApiBase = useMemo(
    () => resolvePayApiBaseFromSearchParam(params.get('apiBase')),
    [params],
  );

  const [preview, setPreview] = useState<MockDonationPayPreview | null>(null);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const previewStatus = (preview?.status || '').toLowerCase();
  const isPendingLike = previewStatus === 'pending' || previewStatus === 'unpaid' || previewStatus === 'created';
  const isPaidLike = previewStatus === 'completed' || previewStatus === 'paid' || previewStatus === 'success';
  const donationId = String(preview?.donation_id || preview?.donationId || '');
  const amount = Number(preview?.amount || 0);

  useEffect(() => {
    if (!token) {
      setLoadError(t('paymentConfirm.invalidLink'));
      setLoading(false);
      return;
    }
    let cancelled = false;
    const runPreview = async () => {
      try {
        const data = payApiBase
          ? await paymentsApi.mockDonationPreviewAt(payApiBase, token)
          : await paymentsApi.mockDonationPreview(token);
        if (!cancelled) setPreview(data);
      } catch {
        if (!cancelled) setLoadError(t('paymentConfirm.loadFailed'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void runPreview();
    return () => {
      cancelled = true;
    };
  }, [token, t, payApiBase]);

  const handleConfirm = async () => {
    if (!token) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      if (payApiBase) await paymentsApi.mockDonationConfirmAt(payApiBase, token);
      else await paymentsApi.mockDonationConfirm(token);
      setDone(true);
    } catch {
      setSubmitError(t('paymentConfirm.confirmFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <SectionContainer noTopSpacing>
        <div className="min-h-[50vh] pt-10 pb-20 max-w-md mx-auto text-center">
          <h1 className="font-display text-h2 font-bold text-ink mb-2">{t('paymentConfirm.title')}</h1>
          <p className="font-body text-caption text-ink-faded mb-10">
            {t('campaigns.detail.donate')}
          </p>

          {loading && <p className="font-body text-body text-ink-faded">{t('checkout.processing')}</p>}
          {loadError && <p className="font-body text-body text-rust">{loadError}</p>}

          {!loading && !loadError && preview && !done && !isPendingLike && !isPaidLike && (
            <p className="font-body text-body text-sepia-mid">{t('paymentConfirm.notPending')}</p>
          )}

          {!loading && !loadError && preview && !done && isPaidLike && (
            <div className="space-y-6">
              <p className="font-body text-body text-ink-faded">{t('paymentConfirm.alreadyPaid')}</p>
              <Link
                to="/campaigns"
                className="inline-block font-body text-label tracking-wide text-rust hover:text-rust-light underline underline-offset-4"
              >
                {t('campaigns.detail.backToAll')}
              </Link>
            </div>
          )}

          {!loading && !loadError && preview && !done && isPendingLike && (
            <div className="border border-warm-gray/20 p-6 text-left space-y-4 mb-8">
              <div>
                <span className="font-body text-overline text-sepia-mid tracking-wider uppercase">
                  {t('campaigns.detail.donate')}
                </span>
                <p className="font-mono text-sm text-ink mt-1">#{donationId}</p>
              </div>
              <div>
                <span className="font-body text-overline text-sepia-mid tracking-wider uppercase">
                  {t('checkout.total')}
                </span>
                <p className="font-display text-xl font-bold text-ink mt-1">
                  ¥{amount.toFixed(2)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={submitting}
                className="w-full font-body text-label tracking-wide bg-ink text-paper px-4 py-3 hover:bg-rust transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? t('checkout.processing') : t('paymentConfirm.confirm')}
              </button>
              {submitError && <p className="font-body text-caption text-rust">{submitError}</p>}
            </div>
          )}

          {done && (
            <div className="space-y-6">
              <div className="w-14 h-14 mx-auto bg-sage/10 border border-sage/30 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-sage" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="font-display text-lg text-ink">{t('paymentConfirm.success')}</p>
              <Link
                to="/campaigns"
                className="inline-block font-body text-label tracking-wide text-rust hover:text-rust-light underline underline-offset-4"
              >
                {t('campaigns.detail.backToAll')}
              </Link>
            </div>
          )}
        </div>
      </SectionContainer>
    </PageWrapper>
  );
}
