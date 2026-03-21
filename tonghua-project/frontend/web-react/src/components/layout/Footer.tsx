import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-paper mt-auto">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-24">
        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-16">
          {/* Brand */}
          <div className="md:col-span-4">
            <h3 className="font-display text-2xl md:text-3xl font-bold mb-4">
              Tonghua
            </h3>
            <p className="font-body text-body-sm text-warm-gray leading-relaxed max-w-xs">
              {t('footer.tagline')}
            </p>
            <p className="font-body text-caption text-sepia-mid mt-6 tracking-widest uppercase">
              {t('footer.issueNo')}
            </p>
          </div>

          {/* Publication */}
          <div className="md:col-span-2">
            <h4 className="font-body text-caption tracking-[0.2em] uppercase text-sepia-mid mb-6">
              {t('footer.sections.publication')}
            </h4>
            <ul className="space-y-3">
              {['about', 'campaigns', 'stories'].map((key) => (
                <li key={key}>
                  <Link
                    to={`/${key}`}
                    className="font-body text-body-sm text-warm-gray hover:text-paper transition-colors cursor-pointer"
                  >
                    {t(`footer.links.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div className="md:col-span-2">
            <h4 className="font-body text-caption tracking-[0.2em] uppercase text-sepia-mid mb-6">
              {t('footer.sections.connect')}
            </h4>
            <ul className="space-y-3">
              {['shop', 'donate', 'contact'].map((key) => (
                <li key={key}>
                  <Link
                    to={`/${key}`}
                    className="font-body text-body-sm text-warm-gray hover:text-paper transition-colors cursor-pointer"
                  >
                    {t(`footer.links.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="md:col-span-2">
            <h4 className="font-body text-caption tracking-[0.2em] uppercase text-sepia-mid mb-6">
              {t('footer.sections.legal')}
            </h4>
            <ul className="space-y-3">
              {['privacy', 'terms', 'children'].map((key) => (
                <li key={key}>
                  <Link
                    to={`/${key}`}
                    className="font-body text-body-sm text-warm-gray hover:text-paper transition-colors cursor-pointer"
                  >
                    {t(`footer.links.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-2">
            <h4 className="font-body text-caption tracking-[0.2em] uppercase text-sepia-mid mb-6">
              {t('footer.newsletter.title')}
            </h4>
            <p className="font-body text-caption text-warm-gray mb-4">
              {t('footer.newsletter.description')}
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col gap-2"
            >
              <input
                type="email"
                placeholder={t('common.emailPlaceholder')}
                className="bg-transparent border-b border-sepia-mid/50 text-paper font-body text-caption py-2 focus:outline-none focus:border-pale-gold transition-colors placeholder:text-sepia-mid/50"
              />
              <button
                type="submit"
                className="font-body text-caption text-pale-gold hover:text-paper transition-colors text-left mt-1 tracking-wider uppercase cursor-pointer"
              >
                {t('footer.newsletter.subscribe')} &rarr;
              </button>
            </form>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-sepia-mid/20 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="font-body text-caption text-sepia-mid">
            {t('footer.copyright').replace('2026', String(year))}
          </p>
          <div className="flex items-center gap-6">
            <span className="font-body text-caption text-sepia-mid">
              {t('common.location.shanghai')}
            </span>
            <span className="font-body text-caption text-sepia-mid">
              {t('footer.builtWith')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
