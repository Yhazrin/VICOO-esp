import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import PaymentQRModal from '@/components/payment/PaymentQRModal';
import { useCartStore, selectTotalPrice } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { ordersApi } from '@/services/orders';
import { paymentsApi } from '@/services/payments';
import { addressesApi, type Address } from '@/services/addresses';
import type { CreateOrderRequest } from '@/types';
import { resolveProductLocale } from '@/utils/productLocale';
import { getPublicSiteOrigin } from '@/utils/publicSiteUrl';
import { getPayApiBaseForQr } from '@/utils/payApiBaseOverride';

type PaymentMethod = 'wechat' | 'alipay' | 'stripe' | 'paypal';

function currencySymbol(currency?: string) {
  return currency === 'USD' ? '$' : '¥';
}

interface AddressForm {
  recipient_name: string;
  phone: string;
  detail_address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

const STEPS = ['step1', 'step2', 'step3', 'step4'] as const;

const PAYMENT_OPTIONS: { key: PaymentMethod }[] = [
  { key: 'wechat' },
  { key: 'alipay' },
  { key: 'stripe' },
  { key: 'paypal' },
];

const COMMON_COUNTRIES = [
  { code: 'CN', name: 'China' },
  { code: 'US', name: 'United States' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'TW', name: 'Taiwan' },
];

export default function Checkout() {
  const { t, i18n } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const totalPrice = useCartStore(selectTotalPrice);
  const { isAuthenticated } = useAuthStore();
  const impactMode = useUIStore((s) => s.impactMode);
  const continueShoppingPath = impactMode ? '/impact/shop' : '/shop';

  const [step, setStep] = useState(0);
  const [address, setAddress] = useState<AddressForm>({
    recipient_name: '',
    phone: '',
    detail_address: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'China',
  });
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showManualAddress, setShowManualAddress] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat');
  const [isProcessing, setIsProcessing] = useState(false);
  const placingRef = useRef(false);
  const [orderResult, setOrderResult] = useState<{ orderId: string; orderNo: string } | null>(null);
  const [error, setError] = useState('');
  const [pendingPayOrder, setPendingPayOrder] = useState<{
    orderId: string;
    orderNo: string;
    amount: number;
    mockPayToken: string;
    payUrl: string;
  } | null>(null);

  const { data: savedAddresses = [] } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: () => addressesApi.getAll(),
    enabled: isAuthenticated,
  });

  const canProceedStep1 = selectedAddressId || (address.recipient_name.trim() && address.phone.trim() && /^1[3-9]\d{9}$/.test(address.phone) && address.detail_address.trim() && address.city.trim() && address.province.trim());

  const selectSavedAddress = (addr: Address) => {
    setSelectedAddressId(addr.id);
    setShowManualAddress(false);
    setAddress({
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      detail_address: [addr.district, addr.detail_address].filter(Boolean).join(' '),
      city: addr.city,
      province: addr.province,
      postalCode: addr.postal_code || '',
      country: addr.country || 'China',
    });
  };

  const stepContent = useMemo(() => {
    switch (step) {
      case 0: return 'step1';
      case 1: return 'step2';
      case 2: return 'step3';
      case 3: return 'step4-success';
      default: return 'step1';
    }
  }, [step]);

  const showLocalhostQrWarning =
    !import.meta.env.VITE_PUBLIC_SITE_ORIGIN?.trim() &&
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const addressRef = useRef(address);
  addressRef.current = address;
  const saveAddressRef = useRef(saveAddress);
  saveAddressRef.current = saveAddress;
  const selectedAddressIdRef = useRef(selectedAddressId);
  selectedAddressIdRef.current = selectedAddressId;

  const finalizeOrder = useCallback(async (result: { orderId: string; orderNo: string }) => {
    setOrderResult(result);
    const addr = addressRef.current;
    const shouldSave = saveAddressRef.current;
    const selId = selectedAddressIdRef.current;
    if (shouldSave && !selId && addr.recipient_name && addr.phone) {
      try {
        await addressesApi.create({
          recipient_name: addr.recipient_name,
          phone: addr.phone,
          province: addr.province,
          city: addr.city,
          district: '',
          detail_address: addr.detail_address,
          postal_code: addr.postalCode || undefined,
          country: addr.country,
          is_default: false,
        });
      } catch {
        /* silent — don't block order flow */
      }
    }
    clearCart();
    setStep(3);
  }, [clearCart]);

  useEffect(() => {
    if (!pendingPayOrder) return;
    const { orderId } = pendingPayOrder;
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 90; // 3 minutes at 2s intervals
    const tick = async () => {
      if (cancelled) return;
      attempts++;
      if (attempts > maxAttempts) {
        if (!cancelled) {
          setPendingPayOrder(null);
          setError(t('checkout.paymentTimeout', '支付超时，请重新下单'));
        }
        return;
      }
      try {
        const o = await ordersApi.getById(orderId);
        if (cancelled) return;
        if (o.status === 'paid') {
          setPendingPayOrder(null);
          await finalizeOrder({ orderId, orderNo: o.order_no });
        }
      } catch {
        /* ignore transient polling errors */
      }
    };
    const id = window.setInterval(tick, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [pendingPayOrder, finalizeOrder, t]);

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
              to={continueShoppingPath}
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
    if (placingRef.current) return;
    placingRef.current = true;
    setIsProcessing(true);
    setError('');
    try {
      const orderData: CreateOrderRequest = {
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        shipping_address: selectedAddressId ? undefined : `${address.recipient_name}, ${address.phone}, ${address.detail_address}, ${address.city}, ${address.province} ${address.postalCode}, ${address.country}`,
        address_id: selectedAddressId || undefined,
        payment_method: paymentMethod,
      };

      const order = await ordersApi.create(orderData);
      const rawOrder = order as unknown as Record<string, unknown>;
      const amountRaw = (rawOrder.total_amount ?? rawOrder.totalAmount ?? order.total_amount) as
        | string
        | number
        | undefined;
      const amount = typeof amountRaw === 'string' ? parseFloat(amountRaw) : Number(amountRaw ?? 0);
      const token = (
        rawOrder.mock_pay_token ??
        rawOrder.mockPayToken ??
        rawOrder.mock_payment_token ??
        rawOrder.mockPaymentToken ??
        rawOrder.payment_token ??
        rawOrder.paymentToken ??
        order.mock_pay_token
      ) as string | undefined;
      if (!token) {
        setError(t('checkout.error'));
        return;
      }

      const origin = getPublicSiteOrigin();
      const devApi = getPayApiBaseForQr();
      const qs = new URLSearchParams({ t: token });
      if (devApi) qs.set('apiBase', devApi);
      const payUrl = `${origin}/payment/confirm?${qs.toString()}`;
      const orderId = String(rawOrder.id ?? rawOrder.order_id ?? rawOrder.orderId ?? order.id);
      const orderNo = String(rawOrder.order_no ?? rawOrder.orderNo ?? order.order_no ?? '');
      setPendingPayOrder({
        orderId,
        orderNo,
        amount,
        mockPayToken: token,
        payUrl,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('422') || msg.includes('stock')) {
        setError(t('checkout.outOfStock', '部分商品库存不足，请修改购物车'));
      } else {
        setError(t('checkout.error'));
      }
    } finally {
      setIsProcessing(false);
      placingRef.current = false;
    }
  };

  const handleSimulatePaid = async () => {
    if (!pendingPayOrder) return;
    setIsProcessing(true);
    try {
      await paymentsApi.mockConfirm(pendingPayOrder.mockPayToken);
      const o = await ordersApi.getById(pendingPayOrder.orderId);
      if (o.status === 'paid') {
        setPendingPayOrder(null);
        await finalizeOrder({ orderId: pendingPayOrder.orderId, orderNo: o.order_no });
      } else {
        setError(t('checkout.paymentFailed', '支付未完成，请重试'));
      }
    } catch {
      setError(t('checkout.error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayModalClose = async () => {
    const orderId = pendingPayOrder?.orderId;
    setPendingPayOrder(null);
    setError(t('checkout.paymentFailed'));
    if (orderId) {
      try { await ordersApi.cancel(orderId); } catch { /* best-effort cleanup */ }
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
                    ${orderResult
                      ? 'bg-sage text-paper'
                      : i < step
                        ? 'bg-sage text-paper'
                        : i === step
                          ? 'bg-ink text-paper'
                          : 'border border-warm-gray/30 text-sepia-mid'
                    }
                  `}
                >
                  {orderResult || i < step ? (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`font-body text-caption hidden sm:block ${orderResult || i === step ? 'text-ink' : 'text-sepia-mid'}`}>
                  {t(`checkout.${s}`)}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-px ${orderResult || i < step ? 'bg-sage' : 'bg-warm-gray/25'}`} />
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

                    {/* Saved addresses */}
                    {savedAddresses.length > 0 && !showManualAddress && (
                      <div className="space-y-3 mb-4">
                        <p className="font-body text-caption text-sepia-mid tracking-wider uppercase">
                          {t('checkout.savedAddresses', '已保存的地址')}
                        </p>
                        {savedAddresses.map((addr) => (
                          <button
                            key={addr.id}
                            onClick={() => selectSavedAddress(addr)}
                            className={`w-full text-left px-4 py-3 border transition-all cursor-pointer ${
                              selectedAddressId === addr.id
                                ? 'border-rust/50 bg-rust/[0.03]'
                                : 'border-warm-gray/25 hover:border-warm-gray/40'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {addr.label && (
                                <span className="font-body text-[10px] tracking-wider uppercase text-sepia-mid">{addr.label}</span>
                              )}
                              {addr.is_default && (
                                <span className="font-body text-[10px] tracking-wider uppercase text-sage">{t('profile.addresses.defaultBadge', '默认')}</span>
                              )}
                            </div>
                            <p className="font-body text-body-sm text-ink">{addr.recipient_name} · {addr.phone}</p>
                            <p className="font-body text-caption text-ink-faded">
                              {[addr.province, addr.city, addr.district, addr.detail_address].filter(Boolean).join(' ')}
                            </p>
                          </button>
                        ))}
                        <button
                          onClick={() => { setShowManualAddress(true); setSelectedAddressId(null); }}
                          className="font-body text-caption text-rust hover:text-rust-light transition-colors cursor-pointer"
                        >
                          + {t('checkout.enterNewAddress', '输入新地址')}
                        </button>
                      </div>
                    )}

                    {/* Manual address form */}
                    {(showManualAddress || savedAddresses.length === 0) && (
                    <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-body text-caption text-sepia-mid tracking-wider uppercase mb-1.5">
                          {t('checkout.fullName')}
                        </label>
                        <input
                          type="text"
                          required
                          value={address.recipient_name}
                          onChange={(e) => setAddress({ ...address, recipient_name: e.target.value })}
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
                          required
                          pattern="1[3-9]\d{9}"
                          value={address.phone}
                          onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                          className="w-full px-4 py-3 border border-warm-gray/30 bg-transparent font-body text-body text-ink focus:outline-none focus:border-rust/50 transition-colors"
                          placeholder={t('checkout.phone')}
                        />
                        {address.phone && !/^1[3-9]\d{9}$/.test(address.phone) && (
                          <p className="font-body text-caption text-rust mt-1">{t('checkout.phoneError', '请输入有效的11位手机号码')}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block font-body text-caption text-sepia-mid tracking-wider uppercase mb-1.5">
                        {t('checkout.street')}
                      </label>
                      <input
                        type="text"
                        required
                        value={address.detail_address}
                        onChange={(e) => setAddress({ ...address, detail_address: e.target.value })}
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
                          required
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
                          required
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
                      <div>
                        <label className="block font-body text-caption text-sepia-mid tracking-wider uppercase mb-1.5">
                          {t('checkout.country', 'Country')}
                        </label>
                        <select
                          value={address.country}
                          onChange={(e) => setAddress({ ...address, country: e.target.value })}
                          className="w-full px-4 py-3 border border-warm-gray/30 bg-transparent font-body text-body text-ink focus:outline-none focus:border-rust/50 transition-colors cursor-pointer"
                        >
                          {COMMON_COUNTRIES.map((c) => (
                            <option key={c.code} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Save address checkbox */}
                    {!selectedAddressId && (
                      <label className="flex items-center gap-2 cursor-pointer mt-2">
                        <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="accent-rust" />
                        <span className="font-body text-caption text-ink">{t('checkout.saveAddress', '保存到地址簿')}</span>
                      </label>
                    )}
                    </>
                    )}
                  </div>
                )}

                {/* Step 2: Payment method (actual checkout is always scan-to-pay) */}
                {step === 1 && (
                  <div>
                    <h2 className="font-display text-h3 font-semibold text-ink mb-6">{t('checkout.step2')}</h2>
                    <p className="font-body text-caption text-ink-faded mb-6">{t('checkout.allMethodsScanNote')}</p>
                    <div className="space-y-3">
                      {PAYMENT_OPTIONS.map(({ key }) => (
                        <button
                          key={key}
                          type="button"
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

                {/* Step 3: Review order */}
                {step === 2 && (
                  <div>
                    <h2 className="font-display text-h3 font-semibold text-ink mb-6">{t('checkout.step3')}</h2>

                    {/* Shipping info summary */}
                    <div className="border border-warm-gray/20 p-5 mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-body text-overline text-sepia-mid tracking-wider uppercase">{t('checkout.step1')}</span>
                        <button type="button" onClick={() => setStep(0)} className="font-body text-caption text-rust hover:text-rust-light cursor-pointer transition-colors">
                          {t('checkout.back')}
                        </button>
                      </div>
                      <p className="font-body text-body-sm text-ink">{address.recipient_name} · {address.phone}</p>
                      <p className="font-body text-body-sm text-ink-faded mt-1">{address.detail_address}, {address.city}, {address.province} {address.postalCode}, {address.country}</p>
                    </div>

                    {/* Payment choice + scan note */}
                    <div className="border border-warm-gray/20 p-5 mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-body text-overline text-sepia-mid tracking-wider uppercase">{t('checkout.step2')}</span>
                        <button type="button" onClick={() => setStep(1)} className="font-body text-caption text-rust hover:text-rust-light cursor-pointer transition-colors">
                          {t('checkout.back')}
                        </button>
                      </div>
                      <p className="font-body text-body-sm text-ink">
                        {paymentMethod === 'wechat' && t('checkout.wechatPay')}
                        {paymentMethod === 'alipay' && t('checkout.alipay')}
                        {paymentMethod === 'stripe' && t('checkout.stripe')}
                        {paymentMethod === 'paypal' && t('checkout.paypal')}
                      </p>
                      <p className="font-body text-caption text-ink-faded mt-2">{t('checkout.scanPaySummary')}</p>
                      <p className="font-body text-caption text-sepia-mid mt-1">{t('checkout.scanPayHint')}</p>
                    </div>

                    {/* Items */}
                    <div className="border border-warm-gray/20 p-5">
                      <span className="font-body text-overline text-sepia-mid tracking-wider uppercase block mb-4">{t('checkout.orderSummary')}</span>
                      <ul className="space-y-3">
                        {items.map((item) => {
                          const lineName = resolveProductLocale(item.product, i18n.language).name;
                          return (
                          <li key={`${item.product.id}-${item.selectedSize || ''}-${item.selectedColor || ''}`} className="flex items-center gap-3">
                            <div className="w-12 h-14 flex-shrink-0 overflow-hidden border border-warm-gray/15 bg-aged-stock">
                              {item.product.image_url && (
                                <img src={item.product.image_url} alt={lineName} className="w-full h-full object-cover" loading="lazy" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-body text-body-sm text-ink truncate">{lineName}</p>
                              <p className="font-mono text-[11px] text-sepia-mid">x{item.quantity}</p>
                            </div>
                            <span className="font-mono text-sm text-ink">
                              {currencySymbol(item.product.currency)}{(item.product.price * item.quantity).toFixed(2)}
                            </span>
                          </li>
                        );
                        })}
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
                        to={continueShoppingPath}
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
            {step <= 2 && !orderResult && (
              <div className="flex items-center gap-4 mt-8">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="font-body text-label tracking-wide text-ink-faded hover:text-ink transition-colors cursor-pointer"
                  >
                    {t('checkout.back')}
                  </button>
                )}

                {step < 2 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    disabled={step === 0 && !canProceedStep1}
                    className="font-body text-label tracking-[0.1em] uppercase bg-ink text-paper px-8 py-3 hover:bg-rust transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {t('checkout.next')}
                  </button>
                ) : (
                  <button
                    type="button"
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
          {step <= 2 && !orderResult && (
            <div className="lg:col-span-5">
              <div className="sticky top-20 border border-warm-gray/20 p-6">
                <h3 className="font-display text-base font-semibold text-ink mb-4">{t('checkout.orderSummary')}</h3>

                <ul className="space-y-3 mb-6">
                  {items.map((item) => {
                    const lineName = resolveProductLocale(item.product, i18n.language).name;
                    return (
                    <li key={`${item.product.id}-${item.selectedSize || ''}-${item.selectedColor || ''}`} className="flex items-center gap-3">
                      <div className="w-10 h-12 flex-shrink-0 overflow-hidden border border-warm-gray/15 bg-aged-stock">
                        {item.product.image_url && (
                          <img src={item.product.image_url} alt={lineName} className="w-full h-full object-cover" loading="lazy" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-caption text-ink truncate">{lineName}</p>
                        <p className="font-mono text-[10px] text-sepia-mid">x{item.quantity}</p>
                      </div>
                      <span className="font-mono text-xs text-ink">
                        {currencySymbol(item.product.currency)}{(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </li>
                  );
                  })}
                </ul>

                <div className="border-t border-warm-gray/20 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-body text-caption text-sepia-mid">{t('checkout.subtotal')}</span>
                    <span className="font-mono text-sm text-ink">{currencySymbol(items[0]?.product.currency)}{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-body text-caption text-sepia-mid">{t('checkout.shipping')}</span>
                    <span className="font-body text-caption text-sage">{t('checkout.freeShipping')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-warm-gray/15">
                    <span className="font-body text-label text-ink font-medium">{t('checkout.total')}</span>
                    <span className="font-display text-lg font-bold text-ink">{currencySymbol(items[0]?.product.currency)}{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </SectionContainer>

      {/* Scan-to-pay modal */}
      {pendingPayOrder && (
        <PaymentQRModal
          payUrl={pendingPayOrder.payUrl}
          amount={pendingPayOrder.amount}
          onSuccess={handleSimulatePaid}
          onFailure={handlePayModalClose}
          isProcessing={isProcessing}
          showLocalhostWarning={showLocalhostQrWarning}
        />
      )}
    </PageWrapper>
  );
}
