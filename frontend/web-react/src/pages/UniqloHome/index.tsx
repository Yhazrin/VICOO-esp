import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { productDetailPath } from '@/utils/productPaths';
import { resolveProductLocale } from '@/utils/productLocale';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { productsApi } from '@/services/products';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';

const BANNER_ITEMS = [
  {
    title: 'LIFEWEAR',
    subtitle: '服の新しいカタチ。すべての人のために。',
    cta: { label: 'Shop Now', path: '/shop' },
    bgClass: 'bg-warm-gray/5',
  },
  {
    title: 'SPRING / SUMMER 2026',
    subtitle: 'Light layers for everyday comfort.',
    cta: { label: 'Explore', path: '/shop' },
    bgClass: 'bg-aged-stock/40',
  },
  {
    title: 'SUSTAINABILITY',
    subtitle: 'Making good clothes for a better world.',
    cta: { label: 'Learn More', path: '/about' },
    bgClass: 'bg-aged-stock/60',
  },
];

export default function UniqloHome() {
  const { i18n } = useTranslation();
  const { data: products } = useQuery({
    queryKey: ['uniqlo-home-products', 'company', i18n.language],
    queryFn: () => productsApi.getAll({ page_size: 16, isImpactProduct: false, locale: i18n.language }),
    staleTime: 5 * 60 * 1000,
  });

  const homeCompanyPick = (products?.items ?? []).filter((p) => !p.isImpactProduct).slice(0, 8);

  return (
    <PageWrapper>
      {/* ── Hero Banner ── */}
      <section className={`relative w-full ${BANNER_ITEMS[0].bgClass}`}>
        <SectionContainer>
          <div className="flex flex-col items-center justify-center text-center pt-16 md:pt-24 pb-20 md:pb-28">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-display text-h1 md:text-[clamp(3rem,8vw,6rem)] font-bold tracking-tight text-ink"
            >
              {BANNER_ITEMS[0].title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-4 md:mt-6 font-body text-body md:text-body-lg text-ink-faded tracking-wide"
            >
              {BANNER_ITEMS[0].subtitle}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Link
                to={BANNER_ITEMS[0].cta.path}
                className="inline-block mt-8 px-10 py-3 font-body text-caption tracking-[0.15em] uppercase bg-rust text-paper rounded-full hover:bg-rust/90 transition-colors"
              >
                {BANNER_ITEMS[0].cta.label}
              </Link>
            </motion.div>
          </div>
        </SectionContainer>
      </section>

      {/* ── Secondary Banners ── */}
      <section className="grid grid-cols-1 md:grid-cols-2">
        {BANNER_ITEMS.slice(1).map((item, i) => (
          <div
            key={i}
            className={`flex flex-col items-center justify-center text-center py-16 md:py-20 border border-warm-gray/10 ${item.bgClass}`}
          >
            <h2 className="font-display text-h3 md:text-h2 font-bold tracking-tight text-ink">
              {item.title}
            </h2>
            <p className="mt-3 font-body text-body-sm text-ink-faded tracking-wide">
              {item.subtitle}
            </p>
            <Link
              to={item.cta.path}
              className="inline-block mt-6 px-8 py-2.5 font-body text-caption tracking-[0.15em] uppercase border border-ink text-ink rounded-full hover:bg-ink hover:text-paper transition-colors"
            >
              {item.cta.label}
            </Link>
          </div>
        ))}
      </section>

      {/* ── Featured Products ── */}
      <section className="section-spacing">
        <SectionContainer>
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="font-display text-h3 md:text-h2 font-bold tracking-tight text-ink">
              PICK UP
            </h2>
            <Link
              to="/shop"
              className="font-body text-caption tracking-[0.15em] uppercase text-sepia-mid hover:text-ink transition-colors"
            >
              View All &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {homeCompanyPick.map((product) => {
              const pn = resolveProductLocale(product, i18n.language).name;
              return (
              <Link
                key={product.id}
                to={productDetailPath(product.id, product)}
                className="group block"
              >
                <div className="aspect-[3/4] bg-warm-gray/5 flex items-center justify-center overflow-hidden rounded-sm">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={pn}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-warm-gray/10">
                      <span className="font-body text-caption text-sepia-mid">No Image</span>
                    </div>
                  )}
                </div>
                <div className="mt-2 md:mt-3">
                  <p className="font-body text-body-sm truncate text-ink">
                    {pn}
                  </p>
                  <p className="font-body text-caption font-semibold mt-1 text-ink">
                    &yen;{product.price.toLocaleString()}
                  </p>
                </div>
              </Link>
            );
            })}
          </div>
        </SectionContainer>
      </section>

      {/* ── Brand Message ── */}
      <section className="section-spacing">
        <SectionContainer>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-h2 md:text-h1 font-bold tracking-tight text-ink">
              MADE FOR ALL
            </h2>
            <p className="mt-4 font-body text-body text-ink-faded leading-relaxed">
              Simple, high-quality everyday clothes with a universal design and supreme functionality.
              LifeWear is constantly evolving to bring more comfort and joy to people&apos;s lives.
            </p>
          </div>
        </SectionContainer>
      </section>

      {/* ── Footer CTA ── */}
      <section className="py-12 md:py-16 border-t border-warm-gray/15">
        <SectionContainer>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-body text-caption tracking-[0.15em] uppercase text-sepia-mid">
              Free shipping on orders over &yen;5,000
            </p>
            <div className="flex gap-4">
              <Link
                to="/shop"
                className="font-body text-caption tracking-[0.15em] uppercase px-6 py-2 bg-rust text-paper rounded-full hover:bg-rust/90 transition-colors"
              >
                Shop
              </Link>
              <Link
                to="/about"
                className="font-body text-caption tracking-[0.15em] uppercase px-6 py-2 border border-ink text-ink rounded-full hover:bg-ink hover:text-paper transition-colors"
              >
                About
              </Link>
            </div>
          </div>
        </SectionContainer>
      </section>
    </PageWrapper>
  );
}
