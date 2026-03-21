import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { VintageInput } from '@/components/editorial/VintageInput';

interface DonationPanelProps {
  onSubmit?: (data: {
    amount: number;
    frequency: 'once' | 'monthly';
    anonymous: boolean;
    message: string;
  }) => void;
  isSubmitting?: boolean;
  className?: string;
}

const AMOUNT_PRESETS = [50, 100, 200, 500];
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 100000;

export default function DonationPanel({
  onSubmit,
  isSubmitting = false,
  className = '',
}: DonationPanelProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [frequency, setFrequency] = useState<'once' | 'monthly'>('once');
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string>('');

  const activeAmount = customAmount ? Number(customAmount) : selectedAmount;

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
        <div className="grid grid-cols-2 gap-3 mb-8">
          {AMOUNT_PRESETS.map((amount, index) => (
            <motion.button
              key={amount}
              type="button"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
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
              {/* Grain overlay */}
              <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.06]" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
              }} aria-hidden="true" />

              {/* Sepia accent gradient */}
              <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-br from-pale-gold/3 via-transparent to-archive-brown/5" />

              {/* Active indicator */}
              {selectedAmount === amount && !customAmount && (
                <motion.div
                  className="absolute inset-0 z-0 bg-rust/[0.04]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              )}

              <div className="relative z-20">
                <span className="block font-display text-[clamp(20px,2.5vw,28px)] font-extrabold text-ink">
                  {amount}
                </span>
                <span className="block font-body text-overline tracking-[0.1em] uppercase text-sepia-mid mt-1">
                  {t('donate.form.currency')}
                </span>
              </div>
            </motion.button>
          ))}
        </div>

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
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            role="alert"
            className="mb-6 p-3 bg-archive-brown/10 border border-archive-brown/30"
          >
            <p className="font-body text-caption text-archive-brown">{error}</p>
          </motion.div>
        )}

        {/* Frequency */}
        <div className="mb-8">
          <label className="block font-body text-caption tracking-[0.05em] text-sepia-mid mb-3">
            {t('donate.form.frequency.title')}
          </label>
          <div className="flex" role="group" aria-label={t('donate.form.frequency.title')}>
            {(['once', 'monthly'] as const).map((freq) => (
              <button
                key={freq}
                type="button"
                aria-pressed={frequency === freq}
                onClick={() => setFrequency(freq)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setFrequency(freq);
                  }
                }}
                className={`
                  flex-1 py-3 font-body text-caption tracking-[0.05em] uppercase text-center border transition-all cursor-pointer
                  ${freq === 'once' ? 'border-r-0' : ''}
                  ${
                    frequency === freq
                      ? 'bg-ink text-paper border-ink'
                      : 'bg-transparent text-sepia-mid border-warm-gray hover:border-ink'
                  }
                `}
              >
                {t(`donate.form.frequency.${freq}`)}
              </button>
            ))}
          </div>
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
              className="w-4 h-4 accent-[var(--color-rust)] cursor-pointer"
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
