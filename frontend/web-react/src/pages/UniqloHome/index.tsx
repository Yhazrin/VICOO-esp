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
    bg: '#F5F5F5',
    accent: '#FF0000',
  },
  {
    title: 'SPRING / SUMMER 2026',
    subtitle: 'Light layers for everyday comfort.',
    cta: { label: 'Explore', path: '/shop' },
    bg: '#F0EFEB',
    accent: '#FF0000',
  },
  {
    title: 'SUSTAINABILITY',
    subtitle: 'Making good clothes for a better world.',
    cta: { label: 'Learn More', path: '/about' },
    bg: '#E8E6E1',
    accent: '#FF0000',
  },
];

export default function UniqloHome() {
  const { i18n } = useTranslation();
  const { data: products } = useQuery({
    queryKey: ['uniqlo-home-products', 'company'],
    queryFn: () => productsApi.getAll({ page_size: 16, isImpactProduct: false }),
    staleTime: 5 * 60 * 1000,
  });

  const homeCompanyPick = (products?.items ?? []).filter((p) => !p.isImpactProduct).slice(0, 8);

  return (
    <PageWrapper>
      {/* ── Hero Banner ── */}
      <section className="relative w-full" style={{ background: BANNER_ITEMS[0].bg }}>
        <SectionContainer>
          <div className="flex flex-col items-center justify-center text-center py-20 md:py-32">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-sans text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight"
              style={{ color: '#1A1A1A' }}
            >
              {BANNER_ITEMS[0].title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-4 md:mt-6 font-sans text-base md:text-lg tracking-wide"
              style={{ color: '#666' }}
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
                className="inline-block mt-8 px-10 py-3 font-sans text-sm font-semibold tracking-widest uppercase text-white transition-colors duration-200 hover:opacity-90"
                style={{ background: BANNER_ITEMS[0].accent }}
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
            className="flex flex-col items-center justify-center text-center py-16 md:py-20 border border-gray-100"
            style={{ background: item.bg }}
          >
            <h2 className="font-sans text-2xl md:text-3xl font-bold tracking-tight" style={{ color: '#1A1A1A' }}>
              {item.title}
            </h2>
            <p className="mt-3 font-sans text-sm tracking-wide" style={{ color: '#888' }}>
              {item.subtitle}
            </p>
            <Link
              to={item.cta.path}
              className="inline-block mt-6 px-8 py-2.5 font-sans text-xs font-semibold tracking-widest uppercase border transition-colors duration-200"
              style={{ borderColor: '#1A1A1A', color: '#1A1A1A' }}
            >
              {item.cta.label}
            </Link>
          </div>
        ))}
      </section>

      {/* ── Featured Products ── */}
      <section className="bg-white">
        <SectionContainer>
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="font-sans text-xl md:text-2xl font-bold tracking-tight" style={{ color: '#1A1A1A' }}>
              PICK UP
            </h2>
            <Link
              to="/shop"
              className="font-sans text-xs tracking-widest uppercase"
              style={{ color: '#999' }}
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
                <div
                  className="aspect-[3/4] bg-gray-50 flex items-center justify-center overflow-hidden"
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={pn}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <span className="font-sans text-xs" style={{ color: '#ccc' }}>No Image</span>
                    </div>
                  )}
                </div>
                <div className="mt-2 md:mt-3">
                  <p className="font-sans text-xs md:text-sm truncate" style={{ color: '#1A1A1A' }}>
                    {pn}
                  </p>
                  <p className="font-sans text-xs font-semibold mt-1" style={{ color: '#1A1A1A' }}>
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
      <section className="bg-white py-16 md:py-24">
        <SectionContainer>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-sans text-3xl md:text-4xl font-bold tracking-tight" style={{ color: '#1A1A1A' }}>
              MADE FOR ALL
            </h2>
            <p className="mt-4 font-sans text-sm md:text-base leading-relaxed" style={{ color: '#666' }}>
              Simple, high-quality everyday clothes with a universal design and supreme functionality.
              LifeWear is constantly evolving to bring more comfort and joy to people&apos;s lives.
            </p>
          </div>
        </SectionContainer>
      </section>

      {/* ── Footer CTA ── */}
      <section className="py-12 md:py-16 border-t border-gray-100">
        <SectionContainer>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-sans text-xs tracking-widest uppercase" style={{ color: '#999' }}>
              Free shipping on orders over &yen;5,000
            </p>
            <div className="flex gap-4">
              <Link
                to="/shop"
                className="font-sans text-xs tracking-widest uppercase px-6 py-2 transition-colors duration-200 hover:opacity-90"
                style={{ background: '#FF0000', color: '#fff' }}
              >
                Shop
              </Link>
              <Link
                to="/about"
                className="font-sans text-xs tracking-widest uppercase px-6 py-2 border transition-colors duration-200"
                style={{ borderColor: '#1A1A1A', color: '#1A1A1A' }}
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
