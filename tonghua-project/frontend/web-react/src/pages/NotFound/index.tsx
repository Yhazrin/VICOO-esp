import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageWrapper from '@/components/layout/PageWrapper';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <PageWrapper>
      <div className="min-h-[60dvh] flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="font-display text-hero font-black text-ink mb-4">404</h1>
          <p className="font-body text-body-sm text-ink-faded mb-8">
            {t('notFound.subtitle')}
          </p>
          <Link
            to="/"
            className="font-body text-caption text-rust tracking-[0.15em] uppercase hover:text-ink transition-colors cursor-pointer"
          >
            {t('notFound.cta')}
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}
