import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import { donationsApi } from '@/services/donations';
import { getErrorMessage } from '@/utils/error';

export default function DonationCertificate() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const certificateQuery = useQuery({
    queryKey: ['donation-certificate', id],
    enabled: Boolean(id),
    queryFn: () => donationsApi.getCertificate(id as string),
  });

  const handleDownload = async () => {
    if (!id) {
      return;
    }
    const blob = await donationsApi.downloadCertificatePdf(id);
    const objectUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `donation-certificate-${id}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(objectUrl);
  };

  const errorMessage = certificateQuery.error
    ? getErrorMessage(certificateQuery.error, t('donate.certificate.error'))
    : null;
  const certificate = certificateQuery.data;

  return (
    <PageWrapper>
      <SectionContainer noTopSpacing className="max-w-4xl">
        <header className="max-w-2xl mb-8">
          <p className="font-body text-caption tracking-[0.18em] uppercase text-sepia-mid mb-3">
            {t('donate.certificate.kicker')}
          </p>
          <h1 className="font-display text-h2 md:text-h1 font-bold text-ink tracking-tight">
            {t('donate.certificate.title')}
          </h1>
          <p className="mt-3 font-body text-body text-ink-faded leading-relaxed">
            {t('donate.certificate.subtitle')}
          </p>
        </header>

        {certificateQuery.isLoading && (
          <div className="border border-warm-gray/20 bg-paper p-8">
            <p className="font-body text-body-sm text-ink-faded">
              {t('donate.certificate.loading')}
            </p>
          </div>
        )}

        {certificateQuery.isError && (
          <div className="border border-rust/40 bg-red-50 p-8">
            <p className="font-body text-body-sm text-rust">{errorMessage}</p>
          </div>
        )}

        {certificate && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-8 items-start">
            <article className="border border-warm-gray/25 bg-paper p-8 md:p-10 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(189,149,102,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.75),rgba(245,241,235,0.92))]" />
              <div className="absolute top-5 left-5 w-5 h-5 border-t border-l border-sage/35" />
              <div className="absolute bottom-5 right-5 w-5 h-5 border-b border-r border-sage/35" />

              <div className="relative">
                <p className="font-body text-caption uppercase tracking-[0.18em] text-sepia-mid">
                  VICOO Public Welfare
                </p>
                <h2 className="font-display text-[clamp(30px,4vw,48px)] font-bold text-ink mt-5">
                  {t('donate.certificate.documentTitle')}
                </h2>
                <p className="font-body text-body text-ink mt-8 leading-relaxed">
                  {certificate.summary?.[0] ?? certificate.donor_name}
                </p>
                <div className="mt-8 space-y-4 font-body text-body-sm text-ink-faded">
                  <p>{certificate.summary?.[1]}</p>
                  <p>{certificate.summary?.[2]}</p>
                  <p>{t('donate.certificate.issuedOn', { date: certificate.date_display })}</p>
                  <p>{t('donate.certificate.number', { number: certificate.certificate_no })}</p>
                </div>
              </div>
            </article>

            <aside className="border border-warm-gray/20 bg-aged-stock p-6 space-y-5">
              <div>
                <p className="font-body text-caption uppercase tracking-[0.14em] text-sepia-mid">
                  {t('donate.certificate.sideTitle')}
                </p>
                <p className="font-body text-body-sm text-ink mt-3 leading-relaxed">
                  {certificate.share_message}
                </p>
              </div>
              <div className="space-y-2 font-body text-caption text-ink-faded">
                <p>{t('donate.certificate.amount', { amount: certificate.amount_display })}</p>
                <p>{t('donate.certificate.project', { project: certificate.campaign_title })}</p>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-3 font-body text-caption tracking-[0.1em] uppercase bg-rust text-paper border-none cursor-pointer transition-colors hover:bg-archive-brown"
              >
                {t('donate.certificate.download')}
              </button>
              <Link
                to="/donate"
                className="block text-center py-3 border border-warm-gray/30 font-body text-caption tracking-[0.1em] uppercase text-ink hover:border-rust/40 transition-colors"
              >
                {t('donate.certificate.backToDonate')}
              </Link>
            </aside>
          </div>
        )}
      </SectionContainer>
    </PageWrapper>
  );
}
