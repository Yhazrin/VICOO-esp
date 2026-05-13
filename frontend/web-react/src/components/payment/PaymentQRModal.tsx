import { useTranslation } from 'react-i18next';

interface PaymentQRModalProps {
  amount: number;
  onSuccess: () => void;
  onFailure: () => void;
  isProcessing?: boolean;
}

export default function PaymentQRModal({ amount, onSuccess, onFailure, isProcessing }: PaymentQRModalProps) {
  const { t } = useTranslation();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onFailure(); }}
    >
      <div className="bg-paper border border-warm-gray/20 w-[340px] max-w-[90vw]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center border-b border-warm-gray/15">
          <h3 className="font-display text-lg font-semibold text-ink">
            {t('checkout.paymentQRTitle')}
          </h3>
          <p className="font-body text-caption text-ink-faded mt-1">
            {t('checkout.paymentQRHint')}
          </p>
        </div>

        {/* QR Code area */}
        <div className="px-6 py-8 flex flex-col items-center">
          <div className="w-48 h-48 border border-warm-gray/20 flex items-center justify-center bg-white">
            {/* Static QR code placeholder — in production this would be a real payment QR */}
            <div className="text-center">
              <svg className="w-32 h-32 mx-auto" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* QR code pattern - simplified representation */}
                <rect x="4" y="4" width="32" height="32" rx="2" fill="#111" />
                <rect x="8" y="8" width="24" height="24" rx="1" fill="white" />
                <rect x="12" y="12" width="16" height="16" rx="1" fill="#111" />
                <rect x="92" y="4" width="32" height="32" rx="2" fill="#111" />
                <rect x="96" y="8" width="24" height="24" rx="1" fill="white" />
                <rect x="100" y="12" width="16" height="16" rx="1" fill="#111" />
                <rect x="4" y="92" width="32" height="32" rx="2" fill="#111" />
                <rect x="8" y="96" width="24" height="24" rx="1" fill="white" />
                <rect x="12" y="100" width="16" height="16" rx="1" fill="#111" />
                {/* Random QR dots */}
                <rect x="42" y="8" width="4" height="4" fill="#111" />
                <rect x="50" y="8" width="4" height="4" fill="#111" />
                <rect x="62" y="8" width="4" height="4" fill="#111" />
                <rect x="74" y="8" width="4" height="4" fill="#111" />
                <rect x="42" y="16" width="4" height="4" fill="#111" />
                <rect x="58" y="16" width="4" height="4" fill="#111" />
                <rect x="70" y="16" width="4" height="4" fill="#111" />
                <rect x="82" y="16" width="4" height="4" fill="#111" />
                <rect x="46" y="24" width="4" height="4" fill="#111" />
                <rect x="54" y="24" width="4" height="4" fill="#111" />
                <rect x="66" y="24" width="4" height="4" fill="#111" />
                <rect x="78" y="24" width="4" height="4" fill="#111" />
                <rect x="8" y="42" width="4" height="4" fill="#111" />
                <rect x="20" y="42" width="4" height="4" fill="#111" />
                <rect x="42" y="42" width="4" height="4" fill="#111" />
                <rect x="54" y="42" width="4" height="4" fill="#111" />
                <rect x="66" y="42" width="4" height="4" fill="#111" />
                <rect x="82" y="42" width="4" height="4" fill="#111" />
                <rect x="96" y="42" width="4" height="4" fill="#111" />
                <rect x="108" y="42" width="4" height="4" fill="#111" />
                <rect x="12" y="50" width="4" height="4" fill="#111" />
                <rect x="28" y="50" width="4" height="4" fill="#111" />
                <rect x="46" y="50" width="4" height="4" fill="#111" />
                <rect x="58" y="50" width="4" height="4" fill="#111" />
                <rect x="74" y="50" width="4" height="4" fill="#111" />
                <rect x="86" y="50" width="4" height="4" fill="#111" />
                <rect x="100" y="50" width="4" height="4" fill="#111" />
                <rect x="116" y="50" width="4" height="4" fill="#111" />
                <rect x="8" y="58" width="4" height="4" fill="#111" />
                <rect x="16" y="58" width="4" height="4" fill="#111" />
                <rect x="32" y="58" width="4" height="4" fill="#111" />
                <rect x="50" y="58" width="4" height="4" fill="#111" />
                <rect x="62" y="58" width="4" height="4" fill="#111" />
                <rect x="78" y="58" width="4" height="4" fill="#111" />
                <rect x="92" y="58" width="4" height="4" fill="#111" />
                <rect x="108" y="58" width="4" height="4" fill="#111" />
                <rect x="42" y="66" width="4" height="4" fill="#111" />
                <rect x="54" y="66" width="4" height="4" fill="#111" />
                <rect x="66" y="66" width="4" height="4" fill="#111" />
                <rect x="82" y="66" width="4" height="4" fill="#111" />
                <rect x="96" y="66" width="4" height="4" fill="#111" />
                <rect x="112" y="66" width="4" height="4" fill="#111" />
                <rect x="8" y="74" width="4" height="4" fill="#111" />
                <rect x="24" y="74" width="4" height="4" fill="#111" />
                <rect x="46" y="74" width="4" height="4" fill="#111" />
                <rect x="58" y="74" width="4" height="4" fill="#111" />
                <rect x="74" y="74" width="4" height="4" fill="#111" />
                <rect x="86" y="74" width="4" height="4" fill="#111" />
                <rect x="100" y="74" width="4" height="4" fill="#111" />
                <rect x="12" y="82" width="4" height="4" fill="#111" />
                <rect x="28" y="82" width="4" height="4" fill="#111" />
                <rect x="42" y="82" width="4" height="4" fill="#111" />
                <rect x="50" y="82" width="4" height="4" fill="#111" />
                <rect x="62" y="82" width="4" height="4" fill="#111" />
                <rect x="78" y="82" width="4" height="4" fill="#111" />
                <rect x="92" y="82" width="4" height="4" fill="#111" />
                <rect x="108" y="82" width="4" height="4" fill="#111" />
                <rect x="42" y="96" width="4" height="4" fill="#111" />
                <rect x="54" y="96" width="4" height="4" fill="#111" />
                <rect x="70" y="96" width="4" height="4" fill="#111" />
                <rect x="82" y="96" width="4" height="4" fill="#111" />
                <rect x="96" y="96" width="4" height="4" fill="#111" />
                <rect x="112" y="96" width="4" height="4" fill="#111" />
                <rect x="46" y="104" width="4" height="4" fill="#111" />
                <rect x="62" y="104" width="4" height="4" fill="#111" />
                <rect x="74" y="104" width="4" height="4" fill="#111" />
                <rect x="86" y="104" width="4" height="4" fill="#111" />
                <rect x="100" y="104" width="4" height="4" fill="#111" />
                <rect x="116" y="104" width="4" height="4" fill="#111" />
                <rect x="42" y="112" width="4" height="4" fill="#111" />
                <rect x="58" y="112" width="4" height="4" fill="#111" />
                <rect x="70" y="112" width="4" height="4" fill="#111" />
                <rect x="82" y="112" width="4" height="4" fill="#111" />
                <rect x="96" y="112" width="4" height="4" fill="#111" />
                <rect x="108" y="112" width="4" height="4" fill="#111" />
              </svg>
            </div>
          </div>
          <p className="font-display text-xl font-bold text-ink mt-4">
            ¥{amount.toFixed(2)}
          </p>
        </div>

        {/* Action buttons */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onFailure}
            disabled={isProcessing}
            className="flex-1 font-body text-label tracking-wide border border-warm-gray/30 text-ink-faded px-4 py-3 hover:border-warm-gray/50 hover:text-ink transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('checkout.paymentFailed')}
          </button>
          <button
            onClick={onSuccess}
            disabled={isProcessing}
            className="flex-1 font-body text-label tracking-wide bg-ink text-paper px-4 py-3 hover:bg-rust transition-colors cursor-pointer disabled:opacity-60"
          >
            {isProcessing ? t('checkout.processing') : t('checkout.paymentSuccess')}
          </button>
        </div>
      </div>
    </div>
  );
}
