import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import { useCartStore, selectTotalPrice } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { ordersApi } from '@/services/orders';
import { paymentsApi } from '@/services/payments';
import type { CreateOrderRequest } from '@/types';

type PaymentMethod = 'wechat' | 'alipay' | 'stripe' | 'paypal';

interface AddressForm {
  name: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

const STEPS = ['step1', 'step2', 'step3', 'step4'] as const;

const PAYMENT_OPTIONS: { key: PaymentMethod; icon: string }[] = [
  { key: 'wechat', icon: '  ' },
  { key: 'alipay', icon: '  ' },
  { key: 'stripe', icon: '  ' },
  { key: 'paypal', icon: '  ' },
];

export default function Checkout() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const totalPrice = useCartStore(selectTotalPrice);
  const { isAuthenticated } = useAuthStore();

  const [step, setStep] = useState(0);
  const [address, setAddress] = useState<AddressForm>({
    name: '',
    phone: '',
    street: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'China',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderResult, setOrderResult] = useState<{ orderId: string; orderNo: string } | null>(null);
  const [error, setError] = useState('');

  const canProceedStep1 = address.name && address.phone && address.street && address.city && address.province;

  const stepContent = useMemo(() => {
    switch (step) {
      case 0: return 'step1';
      case 1: return 'step2';
      case 2: return 'step3';
      case 3: return 'step4';
      default: return 'step1';
    }
  }, [step]);

  if (!isAuthenticated) {
    return (
      <PageWrapper>
        <SectionContainer noTopSpacing>
          <div className="pt-6 pb-24 text-center">
            <div className="w-16 h-16 mx-auto mb-6 border border-warm-gray/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-warm-gray/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <p className="font-display text-lg text-ink-faded mb-4">{t('checkout.loginRequired')}</p>
            <Link
              to="/login"
              className="inline-block font-body text-label tracking-wide bg-ink text-paper px-8 py-3 hover:bg-rust transition-colors cursor-pointer"
            >
              {t('nav.login')}
            </Link>
          </div>
        </SectionContainer>
      </PageWrapper>
    );
  }

  if (items.length === 0 && !orderResult) {
    return (
      <PageWrapper>
        <SectionContainer noTopSpacing>
          <div className="pt-6 pb-24 text-center">
            <p className="font-display text-lg text-ink-faded mb-4">{t('cart.empty')}</p>
            <Link
              to="/shop"
              className="inline-block font-body text-label tracking-wide text-rust hover:text-rust-light transition-colors cursor-pointer underline underline-offset-4 decoration-rust/30"
            >
              {t('cart.continueShopping')}
            </Link>
          </div>
        </SectionContainer>
      </PageWrapper>
    );
  }

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    setError('');
    try {
      const orderData: CreateOrderRequest = {
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        shipping_address: `${address.name}, ${address.phone}, ${address.street}, ${address.city}, ${address.province} ${address.postalCode}, ${address.country}`,
        payment_method: paymentMethod,
      };

      const order = await ordersApi.create(orderData);

      // Initiate payment
      await paymentsApi.create({
        order_id: order.id,
        amount: typeof order.total_amount === 'string' ? parseFloat(order.total_amount) : order.total_amount,
        method: paymentMethod,
      });

      setOrderResult({ orderId: String(order.id), orderNo: order.order_no });
      clearCart();
      setStep(3);
    } catch {
      setError(t('checkout.error'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <PageWrapper>
      <SectionContainer noTopSpacing>
        <div className="pt-6 pb-6">
          <h1 className="font-display text-[clamp(24px,3.5vw,40px)] font-bold text-ink leading-[1.1] tracking-[-0.02em]">
            {t('checkout.title')}
          </h1>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-6">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] transition-all duration-300
                    ${i < step
                      ? 'bg-sage text-paper'
                      : i === step
                        ? 'bg-ink text-paper'
                        : 'border border-warm-gray/30 text-sepia-mid'
                    }
                  `}
                >
                  {i < step ? (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`font-body text-caption hidden sm:block ${i === step ? 'text-ink' : 'text-sepia-mid'}`}>
                  {t(`checkout.${s}`)}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-px ${i < step ? 'bg-sage' : 'bg-warm-gray/25'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </SectionContainer>

      <SectionContainer>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-16">
          {/* Main content area */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={stepContent}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={prefersReducedMotion ? {} : { opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Step 1: Shipping Address */}
                {step === 0 && (
                  <div className="space-y-5">
                    <h2 className="font-display text-h3 font-semibold text-ink mb-6">{t('checkout.step1')}</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-body text-caption text-sepia-mid tracking-wider uppercase mb-1.5">
                          {t('checkout.fullName')}
                        </label>
                        <input
                          type="text"
                          value={address.name}
                          onChange={(e) => setAddress({ ...address, name: e.target.value })}
                          className="w-full px-4 py-3 border border-warm-gray/30 bg-transparent font-body text-body text-ink focus:outline-none focus:border-rust/50 transition-colors"
                          placeholder={t('checkout.fullName')}
                        />
                      </div>
                      <div>
                        <label className="block font-body text-caption text-sepia-mid tracking-wider uppercase mb-1.5">
                          {t('checkout.phone')}
                        </label>
                        <input
                          type="tel"
                          value={address.phone}
                          onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                          className="w-full px-4 py-3 border border-warm-gray/30 bg-transparent font-body text-body text-ink focus:outline-none focus:border-rust/50 transition-colors"
                          placeholder={t('checkout.phone')}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-body text-caption text-sepia-mid tracking-wider uppercase mb-1.5">
                        {t('checkout.street')}
                      </label>
                      <input
                        type="text"
                        value={address.street}
                        onChange={(e) => setAddress({ ...address, street: e.target.value })}
                        className="w-full px-4 py-3 border border-warm-gray/30 bg-transparent font-body text-body text-ink focus:outline-none focus:border-rust/50 transition-colors"
                        placeholder={t('checkout.street')}
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-body text-caption text-sepia-mid tracking-wider uppercase mb-1.5">
                          {t('checkout.city')}
                        </label>
                        <input
                          type="text"
                          value={address.city}
                          onChange={(e) => setAddress({ ...address, city: e.target.value })}
                          className="w-full px-4 py-3 border border-warm-gray/30 bg-transparent font-body text-body text-ink focus:outline-none focus:border-rust/50 transition-colors"
                          placeholder={t('checkout.city')}
                        />
                      </div>
                      <div>
                        <label className="block font-body text-caption text-sepia-mid tracking-wider uppercase mb-1.5">
                          {t('checkout.province')}
                        </label>
                        <input
                          type="text"
                          value={address.province}
                          onChange={(e) => setAddress({ ...address, province: e.target.value })}
                          className="w-full px-4 py-3 border border-warm-gray/30 bg-transparent font-body text-body text-ink focus:outline-none focus:border-rust/50 transition-colors"
                          placeholder={t('checkout.province')}
                        />
                      </div>
                      <div>
                        <label className="block font-body text-caption text-sepia-mid tracking-wider uppercase mb-1.5">
                          {t('checkout.postalCode')}
                        </label>
                        <input
                          type="text"
                          value={address.postalCode}
                          onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                          className="w-full px-4 py-3 border border-warm-gray/30 bg-transparent font-body text-body text-ink focus:outline-none focus:border-rust/50 transition-colors"
                          placeholder={t('checkout.postalCode')}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Payment Method */}
                {step === 1 && (
                  <div>
                    <h2 className="font-display text-h3 font-semibold text-ink mb-6">{t('checkout.step2')}</h2>
                    <div className="space-y-3">
                      {PAYMENT_OPTIONS.map(({ key }) => (
                        <button
                          key={key}
                          onClick={() => setPaymentMethod(key)}
                          className={`
                            w-full flex items-center gap-4 px-5 py-4 border transition-all duration-200 cursor-pointer text-left
                            ${paymentMethod === key
                              ? 'border-rust/50 bg-rust/[0.03]'
                              : 'border-warm-gray/25 hover:border-warm-gray/40'
                            }
                          `}
                        >
                          <div
                            className={`
                              w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                              ${paymentMethod === key ? 'border-rust' : 'border-warm-gray/40'}
                            `}
                          >
                            {paymentMethod === key && (
                              <div className="w-2.5 h-2.5 rounded-full bg-rust" />
                            )}
                          </div>
                          <span className="font-body text-body text-ink">{t(`checkout.${key === 'stripe' ? 'stripe' : key}`)}</span>
                          <span className="font-body text-caption text-sepia-mid ml-auto">
                            {key === 'wechat' && t('checkout.wechatPay')}
                            {key === 'alipay' && t('checkout.alipay')}
                            {key === 'stripe' && t('checkout.stripe')}
                            {key === 'paypal' && t('checkout.paypal')}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Review Order */}
                {step === 2 && (
                  <div>
                    <h2 className="font-display text-h3 font-semibold text-ink mb-6">{t('checkout.step3')}</h2>

                    {/* Shipping info summary */}
                    <div className="border border-warm-gray/20 p-5 mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-body text-overline text-sepia-mid tracking-wider uppercase">{t('checkout.step1')}</span>
                        <button onClick={() => setStep(0)} className="font-body text-caption text-rust hover:text-rust-light cursor-pointer transition-colors">
                          {t('checkout.back')}
                        </button>
                      </div>
                      <p className="font-body text-body-sm text-ink">{address.name} · {address.phone}</p>
                      <p className="font-body text-body-sm text-ink-faded mt-1">{address.street}, {address.city}, {address.province} {address.postalCode}</p>
                    </div>

                    {/* Payment method summary */}
                    <div className="border border-warm-gray/20 p-5 mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-body text-overline text-sepia-mid tracking-wider uppercase">{t('checkout.step2')}</span>
                        <button onClick={() => setStep(1)} className="font-body text-caption text-rust hover:text-rust-light cursor-pointer transition-colors">
                          {t('checkout.back')}
                        </button>
                      </div>
                      <p className="font-body text-body-sm text-ink">
                        {paymentMethod === 'wechat' && t('checkout.wechatPay')}
                        {paymentMethod === 'alipay' && t('checkout.alipay')}
                        {paymentMethod === 'stripe' && t('checkout.stripe')}
                        {paymentMethod === 'paypal' && t('checkout.paypal')}
                      </p>
                    </div>

                    {/* Items */}
                    <div className="border border-warm-gray/20 p-5">
                      <span className="font-body text-overline text-sepia-mid tracking-wider uppercase block mb-4">{t('checkout.orderSummary')}</span>
                      <ul className="space-y-3">
                        {items.map((item) => (
                          <li key={item.product.id} className="flex items-center gap-3">
                            <div className="w-12 h-14 flex-shrink-0 overflow-hidden border border-warm-gray/15 bg-aged-stock">
                              {item.product.image_url && (
                                <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" loading="lazy" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-body text-body-sm text-ink truncate">{item.product.name}</p>
                              <p className="font-mono text-[11px] text-sepia-mid">x{item.quantity}</p>
                            </div>
                            <span className="font-mono text-sm text-ink">
                              ¥{(item.product.price * item.quantity).toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {error && (
                      <p className="font-body text-caption text-rust mt-4">{error}</p>
                    )}
                  </div>
                )}

                {/* Step 4: Confirmation */}
                {step === 3 && orderResult && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-6 bg-sage/10 border border-sage/30 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-sage" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <h2 className="font-display text-h2 font-bold text-ink mb-3">{t('checkout.orderPlaced')}</h2>
                    <p className="font-mono text-sm text-sepia-mid mb-2">
                      {t('checkout.orderNumber')}: {orderResult.orderNo}
                    </p>
                    <p className="font-body text-body text-ink-faded max-w-sm mx-auto mb-8">
                      {t('checkout.thankYou')}
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <Link
                        to={`/orders/${orderResult.orderId}`}
                        className="font-body text-label tracking-wide bg-ink text-paper px-6 py-3 hover:bg-rust transition-colors cursor-pointer"
                      >
                        {t('checkout.viewOrder')}
                      </Link>
                      <Link
                        to="/shop"
                        className="font-body text-label tracking-wide text-ink-faded hover:text-ink transition-colors cursor-pointer underline underline-offset-4 decoration-warm-gray/30"
                      >
                        {t('checkout.continueShopping')}
                      </Link>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            {step < 3 && (
              <div className="flex items-center gap-4 mt-8">
                {step > 0 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="font-body text-label tracking-wide text-ink-faded hover:text-ink transition-colors cursor-pointer"
                  >
                    {t('checkout.back')}
                  </button>
                )}

                {step < 2 ? (
                  <button
                    onClick={() => setStep(step + 1)}
                    disabled={step === 0 && !canProceedStep1}
                    className="font-body text-label tracking-[0.1em] uppercase bg-ink text-paper px-8 py-3 hover:bg-rust transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {t('checkout.next')}
                  </button>
                ) : (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className="font-body text-label tracking-[0.1em] uppercase bg-ink text-paper px-8 py-3 hover:bg-rust transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isProcessing ? t('checkout.processing') : t('checkout.placeOrder')}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          {step < 3 && (
            <div className="lg:col-span-5">
              <div className="sticky top-20 border border-warm-gray/20 p-6">
                <h3 className="font-display text-base font-semibold text-ink mb-4">{t('checkout.orderSummary')}</h3>

                <ul className="space-y-3 mb-6">
                  {items.map((item) => (
                    <li key={item.product.id} className="flex items-center gap-3">
                      <div className="w-10 h-12 flex-shrink-0 overflow-hidden border border-warm-gray/15 bg-aged-stock">
                        {item.product.image_url && (
                          <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" loading="lazy" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-caption text-ink truncate">{item.product.name}</p>
                        <p className="font-mono text-[10px] text-sepia-mid">x{item.quantity}</p>
                      </div>
                      <span className="font-mono text-xs text-ink">
                        ¥{(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-warm-gray/20 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-body text-caption text-sepia-mid">{t('checkout.subtotal')}</span>
                    <span className="font-mono text-sm text-ink">¥{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-body text-caption text-sepia-mid">{t('checkout.shipping')}</span>
                    <span className="font-body text-caption text-sage">{t('checkout.freeShipping')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-warm-gray/15">
                    <span className="font-body text-label text-ink font-medium">{t('checkout.total')}</span>
                    <span className="font-display text-lg font-bold text-ink">¥{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </SectionContainer>
    </PageWrapper>
  );
}
