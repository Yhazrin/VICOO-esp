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

// Phone validation by country/region
function getPhonePattern(country: string): RegExp | null {
  const patterns: Record<string, RegExp> = {
    // China (CN) - 11 digits starting with 1
    'China': /^1[3-9]\d{9}$/,
    // Taiwan (TW) - 10 digits starting with 09
    'Taiwan, China': /^09\d{8}$/,
    // Hong Kong (HK) - 8 digits starting with 5/6/9
    'Hong Kong, China': /^[569]\d{7}$/,
    // Singapore (SG) - 8 digits
    'Singapore': /^[89]\d{7}$/,
    // Japan (JP) - 10/11 digits starting with 0
    'Japan': /^0\d{9,10}$/,
    // South Korea (KR) - 10/11 digits starting with 01
    'South Korea': /^01[016789]\d{7,8}$/,
    // US/CA - 10 digits
    'United States': /^1?[2-9]\d{9}$/,
    'Canada': /^1?[2-9]\d{9}$/,
    // UK - 10/11 digits starting with 7
    'United Kingdom': /^7[1-9]\d{9}$/,
    // Germany - 10/11 digits starting with 1
    'Germany': /^1[1-9]\d{9,10}$/,
    // France - 10 digits starting with 6/7
    'France': /^[67]\d{9}$/,
    // Australia - 9/10 digits starting with 4
    'Australia': /^4\d{8,9}$/,
    // Default - require at least 8 digits
    'default': /^\d{8,15}$/,
  };
  return patterns[country] || patterns['default'];
}

function validatePhone(phone: string, country: string): boolean {
  if (!phone) return false;
  const pattern = getPhonePattern(country);
  return pattern ? pattern.test(phone) : true;
}

// Name validation (Chinese or English, 2-50 chars)
function validateName(name: string): boolean {
  if (!name || name.trim().length < 2 || name.trim().length > 50) return false;
  // Allow Chinese characters, English letters, spaces, hyphens, apostrophes
  return /^[一-龥a-zA-Z\s\-']+$/.test(name.trim());
}

// Address length validation (5-200 chars)
function validateAddress(address: string): boolean {
  if (!address || address.trim().length < 5 || address.trim().length > 200) return false;
  return true;
}

// Postal code validation by country/region
function getPostalCodePattern(country: string): RegExp | null {
  const patterns: Record<string, RegExp> = {
    'China': /^\d{6}$/,                              // 6 digits
    'Taiwan, China': /^\d{3,5}$/,                      // 3-5 digits
    'Japan': /^\d{3}-?\d{4}$/,                          // 123-4567 or 1234567
    'South Korea': /^\d{5}$/,                           // 5 digits
    'United States': /^\d{5}(-\d{4})?$/,               // 12345 or 12345-6789
    'Canada': /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,            // A1A 1A1
    'United Kingdom': /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i, // Various UK formats
    'Germany': /^\d{5}$/,                              // 5 digits
    'France': /^\d{5}$/,                               // 5 digits
    'Australia': /^\d{4}$/,                            // 4 digits
    'Singapore': /^\d{6}$/,                           // 6 digits
    'Hong Kong, China': /^(?:\d{6}|\s*)?$/,                   // Optional 6 digits
  };
  return patterns[country] || null;
}

function validatePostalCode(postalCode: string, country: string): boolean {
  if (!postalCode) return true; // Optional field
  const pattern = getPostalCodePattern(country);
  if (!pattern) return true; // No pattern for this country, skip validation
  return pattern.test(postalCode.trim());
}

// Field error messages for i18n
function getFieldError(field: string, country: string, t: (key: string) => string): string | null {
  const errors: Record<string, Record<string, string>> = {
    name: {
      default: t('checkout.nameError'),
      China: t('checkout.nameErrorChina'),
      'Taiwan, China': t('checkout.nameErrorTaiwan'),
    },
    address: {
      default: t('checkout.addressError'),
      China: t('checkout.addressErrorChina'),
      'Taiwan, China': t('checkout.addressErrorTaiwan'),
    },
    postalCode: {
      default: t('checkout.postalCodeError'),
      China: t('checkout.postalCodeErrorChina'),
      'Taiwan, China': t('checkout.postalCodeErrorTaiwan'),
      'United States': t('checkout.postalCodeErrorUS'),
      Canada: t('checkout.postalCodeErrorCA'),
      'United Kingdom': t('checkout.postalCodeErrorUK'),
    },
  };
  return errors[field]?.[country] || errors[field]?.['default'] || null;
}

function getPhoneError(country: string, t: (key: string) => string): string {
  const errorMap: Record<string, string> = {
    'China': t('checkout.phoneErrorChina'),
    'Taiwan, China': t('checkout.phoneErrorTaiwan'),
    'Hong Kong, China': t('checkout.phoneErrorHongKong'),
    'Singapore': t('checkout.phoneErrorSingapore'),
    'Japan': t('checkout.phoneErrorJapan'),
    'South Korea': t('checkout.phoneErrorKr'),
    'United States': t('checkout.phoneErrorUs'),
    'Canada': t('checkout.phoneErrorCa'),
    'United Kingdom': t('checkout.phoneErrorUk'),
    'Germany': t('checkout.phoneErrorDe'),
    'France': t('checkout.phoneErrorFr'),
    'Australia': t('checkout.phoneErrorAu'),
    'default': t('checkout.phoneErrorDefault'),
  };
  return errorMap[country] || errorMap['default'];
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
  { code: 'HK', name: 'Hong Kong, China' },
  { code: 'TW', name: 'Taiwan, China' },
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat');
  const [isProcessing, setIsProcessing] = useState(false);
  const placingRef = useRef(false);
  const finalizeOnceRef = useRef(false);
  const [orderResult, setOrderResult] = useState<{ orderId: string; orderNo: string } | null>(null);
  const [error, setError] = useState('');
  const [pendingPayOrder, setPendingPayOrder] = useState<{
    orderId: string;
    orderNo: string;
    amount: number;
    mockPayToken: string;
    payUrl: string;
  } | null>(null);

  const { data: savedAddresses = [], isError: addressesError } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: () => addressesApi.getAll(),
    enabled: isAuthenticated,
  });

  const canProceedStep1 = selectedAddressId || (
    address.recipient_name.trim() &&
    validateName(address.recipient_name) &&
    address.phone.trim() &&
    validatePhone(address.phone, address.country) &&
    address.detail_address.trim() &&
    validateAddress(address.detail_address) &&
    address.city.trim() &&
    address.province.trim() &&
    (!address.postalCode.trim() || validatePostalCode(address.postalCode, address.country))
  );

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

  const finalizeOrder = useCallback(async (result: { orderId: string; orderNo: string }) => {
    if (finalizeOnceRef.current) return;
    finalizeOnceRef.current = true;
    setOrderResult(result);
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
          if (cancelled) return;
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

  // Reset placingRef when polling finishes (pendingPayOrder cleared)
  useEffect(() => {
    if (!pendingPayOrder) {
      placingRef.current = false;
    }
  }, [pendingPayOrder]);

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
    if (!selectedAddressId && !validatePhone(address.phone.trim(), address.country)) {
      setError(getPhoneError(address.country, t));
      return;
    }
    placingRef.current = true;
    setIsProcessing(true);
    setError('');
    try {
      const countryEntry = COMMON_COUNTRIES.find((c) => c.name === address.country);
      const orderData: CreateOrderRequest = {
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        shipping_address: selectedAddressId ? undefined : `${address.recipient_name}, ${address.phone}, ${address.detail_address}, ${address.city}, ${address.province} ${address.postalCode}, ${address.country}`,
        address_id: selectedAddressId || undefined,
        payment_method: paymentMethod,
        ...((!selectedAddressId && address.recipient_name) ? {
          recipient_name: address.recipient_name,
          recipient_phone: address.phone,
          province: address.province,
          city: address.city,
          district: '',
          detail_address: address.detail_address,
          postal_code: address.postalCode || undefined,
          country: address.country,
          country_code: countryEntry?.code || undefined,
        } : {}),
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
        console.error('[handlePlaceOrder] order response missing mock_pay_token', { order: rawOrder });
        setError(t('checkout.error'));
        placingRef.current = false;
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
      // Keep placingRef = true — polling will handle reset via pendingPayOrder change
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { detail?: unknown } } })?.response?.status;
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      const msg = err instanceof Error ? err.message : String(err);
      // Diagnostic: surface the real failure to DevTools console so we don't have to guess
      console.error('[handlePlaceOrder] failed', { status, detail, msg, err, itemsCount: items.length, paymentMethod });
      if (status === 404) {
        setError(t('checkout.cartStale', 'An item in your cart is no longer available. Please refresh and try again.'));
      } else if (status === 401) {
        setError(t('checkout.loginExpired', 'Your session has expired. Please log in again.'));
      } else if (status === 400 && (typeof detail === 'string' && /stock/i.test(detail))) {
        setError(t('checkout.outOfStock', 'Some items are out of stock — please update your cart'));
      } else if (status === 400) {
        setError(t('checkout.invalidRequest', 'We could not process your order. Please review your address and try again.'));
      } else {
        setError(t('checkout.error'));
      }
      placingRef.current = false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulatePaid = async () => {
    if (!pendingPayOrder) return;
    setIsProcessing(true);
    try {
      // Use simplified mock payment confirm by order ID
      await paymentsApi.mockConfirmByOrderId(pendingPayOrder.orderId);
      setPendingPayOrder(null);
      await finalizeOrder({ orderId: pendingPayOrder.orderId, orderNo: pendingPayOrder.orderNo });
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
                    {addressesError && (
                      <p className="font-body text-caption text-rust mb-2">
                        {t('checkout.addressesLoadError', 'Could not load saved addresses')}
                      </p>
                    )}
                    {savedAddresses.length > 0 && !showManualAddress && (
                      <div className="space-y-3 mb-4">
                        <p className="font-body text-caption text-sepia-mid tracking-wider uppercase">
                          {t('checkout.savedAddresses', 'Saved addresses')}
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
                                <span className="font-body text-[10px] tracking-wider uppercase text-sage">{t('profile.addresses.defaultBadge', 'Default')}</span>
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
                          + {t('checkout.enterNewAddress', 'Enter new address')}
                        </button>
                      </div>
                    )}

                    {/* Manual address form */}
                    {(showManualAddress || savedAddresses.length === 0) && (
                    <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="checkout-name" className="block font-body text-caption text-sepia-mid tracking-wider uppercase mb-1.5">
                          {t('checkout.fullName')}
                        </label>
                        <input
                          id="checkout-name"
                          type="text"
                          required
                          value={address.recipient_name}
                          onChange={(e) => setAddress({ ...address, recipient_name: e.target.value })}
                          className="w-full px-4 py-3 border border-warm-gray/30 bg-transparent font-body text-body text-ink focus:outline-none focus:border-rust/50 transition-colors"
                          placeholder={t('checkout.fullName')}
                        />
                        {address.recipient_name && !validateName(address.recipient_name) && (
                          <p className="font-body text-caption text-rust mt-1">{getFieldError('name', address.country, t)}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="checkout-phone" className="block font-body text-caption text-sepia-mid tracking-wider uppercase mb-1.5">
                          {t('checkout.phone')}
                        </label>
                        <input
                          id="checkout-phone"
                          type="tel"
                          required
                          pattern="1[3-9]\d{9}"
                          value={address.phone}
                          onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                          className="w-full px-4 py-3 border border-warm-gray/30 bg-transparent font-body text-body text-ink focus:outline-none focus:border-rust/50 transition-colors"
                          placeholder={t('checkout.phone')}
                        />
                        {address.phone && !validatePhone(address.phone, address.country) && (
                          <p className="font-body text-caption text-rust mt-1">{getPhoneError(address.country, t)}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="checkout-street" className="block font-body text-caption text-sepia-mid tracking-wider uppercase mb-1.5">
                        {t('checkout.street')}
                      </label>
                      <input
                        id="checkout-street"
                        type="text"
                        required
                        value={address.detail_address}
                        onChange={(e) => setAddress({ ...address, detail_address: e.target.value })}
                        className="w-full px-4 py-3 border border-warm-gray/30 bg-transparent font-body text-body text-ink focus:outline-none focus:border-rust/50 transition-colors"
                        placeholder={t('checkout.street')}
                      />
                      {address.detail_address && !validateAddress(address.detail_address) && (
                        <p className="font-body text-caption text-rust mt-1">{getFieldError('address', address.country, t)}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="checkout-city" className="block font-body text-caption text-sepia-mid tracking-wider uppercase mb-1.5">
                          {t('checkout.city')}
                        </label>
                        <input
                          id="checkout-city"
                          type="text"
                          required
                          value={address.city}
                          onChange={(e) => setAddress({ ...address, city: e.target.value })}
                          className="w-full px-4 py-3 border border-warm-gray/30 bg-transparent font-body text-body text-ink focus:outline-none focus:border-rust/50 transition-colors"
                          placeholder={t('checkout.city')}
                        />
                      </div>
                      <div>
                        <label htmlFor="checkout-province" className="block font-body text-caption text-sepia-mid tracking-wider uppercase mb-1.5">
                          {t('checkout.province')}
                        </label>
                        <input
                          id="checkout-province"
                          type="text"
                          required
                          value={address.province}
                          onChange={(e) => setAddress({ ...address, province: e.target.value })}
                          className="w-full px-4 py-3 border border-warm-gray/30 bg-transparent font-body text-body text-ink focus:outline-none focus:border-rust/50 transition-colors"
                          placeholder={t('checkout.province')}
                        />
                      </div>
                      <div>
                        <label htmlFor="checkout-postal" className="block font-body text-caption text-sepia-mid tracking-wider uppercase mb-1.5">
                          {t('checkout.postalCode')}
                        </label>
                        <input
                          id="checkout-postal"
                          type="text"
                          value={address.postalCode}
                          onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                          className="w-full px-4 py-3 border border-warm-gray/30 bg-transparent font-body text-body text-ink focus:outline-none focus:border-rust/50 transition-colors"
                          placeholder={t('checkout.postalCode')}
                        />
                        {address.postalCode && !validatePostalCode(address.postalCode, address.country) && (
                          <p className="font-body text-caption text-rust mt-1">{getFieldError('postalCode', address.country, t)}</p>
                        )}
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
          currency={paymentMethod === 'paypal' || paymentMethod === 'stripe' ? 'USD' : 'CNY'}
          onSuccess={handleSimulatePaid}
          onFailure={handlePayModalClose}
          isProcessing={isProcessing}
          showLocalhostWarning={showLocalhostQrWarning}
        />
      )}
    </PageWrapper>
  );
}
