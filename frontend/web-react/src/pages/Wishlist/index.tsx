import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import ProductCard from '@/components/editorial/ProductCard';
import { useWishlistStore } from '@/stores/wishlistStore';

export default function Wishlist() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const items = useWishlistStore((s) => s.items);

  return (
    <PageWrapper>
      <SectionContainer noTopSpacing>
        <div className="pt-6 pb-10">
          <span className="font-body text-overline tracking-[0.3em] uppercase text-sepia-mid block mb-2">
            {t('wishlist.label', 'Saved')}
          </span>
          <h1 className="font-display text-[clamp(28px,4vw,48px)] font-bold text-ink leading-[1.05] tracking-[-0.02em] mb-3">
            {t('wishlist.title', 'My Wishlist')}
          </h1>
          <p className="font-body text-body text-ink-faded leading-[1.7]">
            {items.length > 0
              ? t('wishlist.count', `${items.length} saved items`, { count: items.length })
              : t('wishlist.empty', 'Your wishlist is empty.')
            }
          </p>
        </div>
      </SectionContainer>

      <SectionContainer>
        <div className="border-t border-warm-gray/20 pt-12 pb-16">
          {items.length === 0 ? (
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center py-24"
            >
              <div className="w-16 h-16 mx-auto mb-6 border border-warm-gray/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-warm-gray/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="font-display text-lg text-ink-faded mb-4">{t('wishlist.empty', 'Your wishlist is empty.')}</p>
              <Link
                to="/shop"
                className="inline-block font-body text-label tracking-wide text-rust hover:text-rust-light transition-colors cursor-pointer underline underline-offset-4 decoration-rust/30"
              >
                {t('cart.continueShopping')}
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8 md:gap-x-6 md:gap-y-12">
              {items.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </SectionContainer>
    </PageWrapper>
  );
}
