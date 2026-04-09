import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useCartStore, selectTotalItems, selectTotalPrice } from '@/stores/cartStore';

export default function CartDrawer() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const isOpen = useCartStore((s) => s.isOpen);
  const items = useCartStore((s) => s.items);
  const setCartOpen = useCartStore((s) => s.setCartOpen);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const totalItems = useCartStore(selectTotalItems);
  const totalPrice = useCartStore(selectTotalPrice);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] bg-ink/30 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            key="cart-drawer"
            initial={prefersReducedMotion ? { x: 0 } : { x: '100%' }}
            animate={{ x: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { x: '100%' }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-0 right-0 bottom-0 z-[70] w-full max-w-md bg-paper shadow-2xl flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label={t('cart.title')}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-warm-gray/20">
              <h2 className="font-display text-lg font-semibold text-ink">
                {t('cart.title')}
                {totalItems > 0 && (
                  <span className="font-body text-caption text-sepia-mid ml-2">
                    ({totalItems})
                  </span>
                )}
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-warm-gray/10 transition-colors cursor-pointer"
                aria-label="Close cart"
              >
                <svg className="w-5 h-5 text-ink-faded" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 mb-6 border border-warm-gray/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-warm-gray/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 01-8 0" />
                    </svg>
                  </div>
                  <p className="font-display text-lg text-ink-faded mb-2">{t('cart.empty')}</p>
                  <p className="font-body text-caption text-sepia-mid">{t('cart.emptySubtitle')}</p>
                  <Link
                    to="/shop"
                    onClick={() => setCartOpen(false)}
                    className="mt-6 font-body text-label tracking-wide text-rust hover:text-rust-light transition-colors cursor-pointer underline underline-offset-4 decoration-rust/30"
                  >
                    {t('cart.continueShopping')}
                  </Link>
                </div>
              ) : (
                <ul className="space-y-4">
                  {items.map((item) => {
                    const itemKey = `${item.product.id}-${item.selectedSize || ''}-${item.selectedColor || ''}`;
                    return (
                    <motion.li
                      key={itemKey}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 60 }}
                      transition={{ duration: 0.25 }}
                      className="flex gap-4 pb-4 border-b border-warm-gray/10"
                    >
                      {/* Product image */}
                      <div className="w-20 h-24 flex-shrink-0 overflow-hidden border border-warm-gray/15 bg-aged-stock">
                        {item.product.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="font-mono text-[10px] text-warm-gray/40 uppercase">VICOO</span>
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-sm font-semibold text-ink leading-tight truncate">
                          {item.product.name}
                        </h3>
                        {(item.selectedSize || item.selectedColor) && (
                          <p className="font-body text-[11px] text-sepia-mid mt-0.5">
                            {[item.selectedSize, item.selectedColor].filter(Boolean).join(' / ')}
                          </p>
                        )}
                        <p className="font-mono text-xs text-sepia-mid mt-1">
                          {item.product.currency === 'CNY' ? '¥' : '$'}{item.product.price.toFixed(2)}
                        </p>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center border border-warm-gray/25">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedSize, item.selectedColor)}
                              className="w-7 h-7 flex items-center justify-center text-ink-faded hover:text-ink transition-colors cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                                <line x1="2" y1="6" x2="10" y2="6" />
                              </svg>
                            </button>
                            <span className="w-8 text-center font-mono text-xs text-ink">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedSize, item.selectedColor)}
                              className="w-7 h-7 flex items-center justify-center text-ink-faded hover:text-ink transition-colors cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                                <line x1="6" y1="2" x2="6" y2="10" />
                                <line x1="2" y1="6" x2="10" y2="6" />
                              </svg>
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.product.id, item.selectedSize, item.selectedColor)}
                            className="font-body text-[11px] text-sepia-mid hover:text-rust transition-colors cursor-pointer"
                          >
                            {t('cart.remove')}
                          </button>
                        </div>
                      </div>

                      {/* Line total */}
                      <div className="flex-shrink-0 text-right">
                        <span className="font-mono text-sm text-ink font-medium">
                          {item.product.currency === 'CNY' ? '¥' : '$'}{(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </motion.li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer — subtotal + checkout */}
            {items.length > 0 && (
              <div className="border-t border-warm-gray/20 px-6 py-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-body text-label text-sepia-mid tracking-wide uppercase">
                    {t('cart.subtotal')}
                  </span>
                  <span className="font-display text-xl font-bold text-ink">
                    ¥{totalPrice.toFixed(2)}
                  </span>
                </div>
                <p className="font-body text-caption text-sepia-mid mb-4">
                  {t('checkout.freeShipping')}
                </p>
                <Link
                  to="/checkout"
                  onClick={() => setCartOpen(false)}
                  className="block w-full text-center font-body text-label tracking-[0.15em] uppercase bg-ink text-paper py-3.5 hover:bg-rust transition-colors cursor-pointer"
                >
                  {t('cart.checkout')}
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
