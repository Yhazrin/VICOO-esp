import { useState, useMemo, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { VintageInput } from '@/components/editorial/VintageInput';
import SectionGrainOverlay from '@/components/editorial/SectionGrainOverlay';
import { donationsApi } from '@/services/donations';

interface DonationPanelProps {
  onSubmit?: (data: {
    amount: number;
    frequency: 'once' | 'monthly';
    anonymous: boolean;
    message: string;
    paymentMethod: 'wechat' | 'alipay' | 'stripe' | 'paypal';
  }) => void;
  isSubmitting?: boolean;
  className?: string;
}

const AMOUNT_PRESETS_FALLBACK = [50, 100, 200, 500];
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 100000;

export default function DonationPanel({
  onSubmit,
  isSubmitting = false,
  className = '',
}: DonationPanelProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  const { data: apiTiers, isError: tiersError } = useQuery({
    queryKey: ['donation-tiers'],
    queryFn: () => donationsApi.getTiers(),
    staleTime: 10 * 60 * 1000,
  });

  const amountPresets = useMemo(() => {
    if (apiTiers && apiTiers.length > 0) {
      return apiTiers.map((tier) => tier.amount);
    }
    return AMOUNT_PRESETS_FALLBACK;
  }, [apiTiers]);

  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');

  // Default to first preset when tiers load, or reset if current selection is no longer valid
  useEffect(() => {
    if (customAmount) return;
    if (amountPresets.length > 0 && !amountPresets.includes(selectedAmount)) {
      setSelectedAmount(amountPresets[0]);
    }
  }, [amountPresets, selectedAmount, customAmount]);
  const [frequency] = useState<'once' | 'monthly'>('once');
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay' | 'stripe' | 'paypal'>('wechat');
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState('');
  const activeAmount = customAmount ? Number(customAmount) : selectedAmount;
  const selectedTier = useMemo(
    () => apiTiers?.find((tier) => tier.amount === activeAmount) ?? null,
    [activeAmount, apiTiers]
  );
  const [error, setError] = useState<string>('');

  const validateAmount = (amount: number): string => {
    if (isNaN(amount) || amount <= 0) {
      return t('donate.form.errors.invalidAmount');
    }
    if (amount < MIN_AMOUNT) {
      return t('donate.form.errors.minAmount', { min: MIN_AMOUNT });
    }
    if (amount > MAX_AMOUNT) {
      return t('donate.form.errors.maxAmount', { max: MAX_AMOUNT });
    }
    return '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateAmount(activeAmount);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (onSubmit) {
      onSubmit({
        amount: activeAmount,
        frequency,
        anonymous,
        message,
        paymentMethod,
      });
    }
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomAmount(value);
    // Clear preset selection when typing custom amount
    if (value) {
      setSelectedAmount(0);
    }
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  return (
    <motion.div
      {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 } })}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <h3 className="font-display text-[clamp(24px,3vw,36px)] font-bold text-ink mb-8">
        {t('donate.form.title')}
      </h3>

      <form onSubmit={handleSubmit}>
        {/* Amount Presets */}
        <div className="grid grid-cols-2 gap-3 mb-8" role="group" aria-label={t('donate.form.amountPresets', 'Donation amount presets')}>
          {amountPresets.map((amount, index) => (
            <motion.button
              key={amount}
              type="button"
              aria-pressed={selectedAmount === amount && !customAmount}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              onClick={() => {
                setSelectedAmount(amount);
                setCustomAmount('');
              }}
              className={`
                relative p-4 text-center transition-all duration-300 cursor-pointer overflow-hidden
                ${selectedAmount === amount && !customAmount
                  ? 'border-2 border-rust bg-rust/[0.04]'
                  : 'border border-warm-gray/60 hover:border-rust/60 bg-paper'
                }
              `}
            >
              <SectionGrainOverlay className="z-10" />

              {/* Sepia accent gradient */}
              <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-br from-pale-gold/3 via-transparent to-archive-brown/5" />

              {/* Active indicator */}
              {selectedAmount === amount && !customAmount && (
                <motion.div
                  className="absolute inset-0 z-0 bg-rust/[0.04]"
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              )}

              <div className="relative z-20">
                <span className="block font-display text-[clamp(20px,2.5vw,28px)] font-extrabold text-ink">
                  {amount}
                </span>
                {apiTiers?.find((tier) => tier.amount === amount)?.label && (
                  <span className="block font-body text-caption text-rust mt-0.5">
                    {apiTiers.find((tier) => tier.amount === amount)?.label}
                  </span>
                )}
                <span className="block font-body text-overline tracking-[0.1em] uppercase text-sepia-mid mt-1">
                  {t('donate.form.currency')}
                </span>
              </div>
            </motion.button>
          ))}
        </div>

        {selectedTier && (
          <div className="mb-8 border border-warm-gray/30 bg-aged-stock p-4">
            <p className="font-display text-lg font-bold text-ink">
              {selectedTier.label}
            </p>
            <p className="mt-2 font-body text-body-sm text-ink-faded leading-relaxed">
              {selectedTier.description}
            </p>
          </div>
        )}

        {/* Custom Amount */}
        <div className="mb-8">
          <VintageInput
            label={t('donate.form.customAmount')}
            type="number"
            value={customAmount}
            onChange={handleCustomAmountChange}
            placeholder={t('donate.form.placeholder')}
            min={MIN_AMOUNT}
            max={MAX_AMOUNT}
            error={error && customAmount ? error : undefined}
            helperText={t('donate.form.amountRange', { min: MIN_AMOUNT, max: MAX_AMOUNT })}
          />
        </div>

        {/* Error Message */}
        {error && !customAmount && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            role="alert"
            className="mb-6 p-3 bg-archive-brown/10 border border-archive-brown/30"
          >
            <p className="font-body text-caption text-archive-brown">{error}</p>
          </motion.div>
        )}

        {/* Frequency — currently only one-time donations are supported */}
        {/* Hidden: recurring donations require backend subscription support */}

        {/* Payment Method — capsule selector */}
        <div className="mb-8">
          <label className="block font-body text-caption tracking-[0.05em] text-sepia-mid mb-3">
            {t('donate.form.payment.title', 'Payment Method')}
          </label>
          {/* Mobile: vertical stack; Desktop (sm+): horizontal pill bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 sm:rounded-full sm:bg-white/80 sm:backdrop-blur-xl sm:shadow-sm sm:px-2 sm:py-1" role="group" aria-label={t('donate.form.payment.title', 'Payment Method')}>
            {([
              { value: 'stripe', label: t('donate.form.payment.stripe', 'Card / Stripe') },
              { value: 'wechat', label: t('donate.form.payment.wechat', 'WeChat Pay') },
              { value: 'alipay', label: t('donate.form.payment.alipay', 'Alipay') },
            ] as const).map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={paymentMethod === option.value}
                onClick={() => setPaymentMethod(option.value)}
                className={`
                  px-4 py-2 sm:py-1 text-left sm:text-center rounded-full font-body text-label tracking-wide transition-all cursor-pointer whitespace-nowrap
                  ${paymentMethod === option.value
                    ? 'bg-rust/15 text-ink font-medium sm:bg-rust/15'
                    : 'text-ink-faded hover:text-ink bg-white/80 shadow-sm sm:bg-transparent sm:shadow-none sm:hover:text-ink'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="mt-3 font-body text-caption text-ink-faded leading-relaxed">
            {paymentMethod === 'stripe'
              ? t('donate.form.payment.stripeHint', 'Recommended for the web experience in local and development environments.')
              : t('donate.form.payment.domesticHint', 'Domestic payment methods require additional merchant configuration. If unavailable, the server will return a clear setup message instead of a generic failure.')}
          </p>
        </div>

        {/* Options */}
        <div className="mb-8">
          <VintageInput
            label={t('donate.form.message')}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('donate.form.message')}
          />
          <label className="flex items-center gap-2 mt-6 cursor-pointer">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="w-11 h-11 p-2.5 accent-[var(--color-rust)] cursor-pointer"
            />
            <span className="font-body text-caption text-sepia-mid">
              {t('donate.form.anonymous')}
            </span>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={activeAmount <= 0 || isSubmitting}
          className="w-full py-4 font-body text-caption tracking-[0.1em] uppercase bg-rust text-paper border-none cursor-pointer transition-colors hover:bg-archive-brown disabled:bg-warm-gray disabled:cursor-not-allowed"
        >
          {isSubmitting ? t('donate.form.processing') : t('donate.form.submit')}
        </button>
      </form>
    </motion.div>
  );
}
