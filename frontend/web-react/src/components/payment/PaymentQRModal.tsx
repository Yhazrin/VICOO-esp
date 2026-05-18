import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

interface PaymentQRModalProps {
  payUrl: string;
  amount: number;
  onSuccess: () => void;
  onFailure: () => void;
  isProcessing?: boolean;
  /** 未配置公网/局域网 origin 且当前为 localhost 时提示配置环境变量 */
  showLocalhostWarning?: boolean;
}

export default function PaymentQRModal({
  payUrl,
  amount,
  onSuccess,
  onFailure,
  isProcessing,
  showLocalhostWarning,
}: PaymentQRModalProps) {
  const { t } = useTranslation();
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDataUrl(null);
    setQrError(false);
    QRCode.toDataURL(payUrl, {
      margin: 1,
      width: 220,
      color: { dark: '#111111', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [payUrl]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(payUrl);
      toast.success(t('checkout.linkCopied'));
    } catch {
      toast.error(t('checkout.copyFailed'));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFailure();
      }}
    >
      <div className="bg-paper border border-warm-gray/20 w-[380px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <div className="px-6 pt-6 pb-4 text-center border-b border-warm-gray/15">
          <h3 className="font-display text-lg font-semibold text-ink">{t('checkout.paymentQRTitle')}</h3>
          <p className="font-body text-caption text-ink-faded mt-1">{t('checkout.paymentQRHint')}</p>
          {showLocalhostWarning && (
            <p className="font-body text-caption text-rust mt-2 text-left">{t('checkout.localhostQrWarning')}</p>
          )}
        </div>

        <div className="px-6 py-6 flex flex-col items-center">
          <div className="w-52 h-52 border border-warm-gray/20 flex items-center justify-center bg-white shrink-0">
            {dataUrl && !qrError ? (
              <img src={dataUrl} alt="" className="w-[220px] h-[220px]" width={220} height={220} />
            ) : (
              <p className="font-body text-caption text-ink-faded px-4 text-center">
                {qrError ? t('checkout.qrError') : t('checkout.qrLoading')}
              </p>
            )}
          </div>
          <p className="font-display text-xl font-bold text-ink mt-4">¥{amount.toFixed(2)}</p>

          <p className="font-body text-[10px] text-ink-faded mt-4 self-stretch text-left break-all leading-relaxed">
            {payUrl}
          </p>
          <button
            type="button"
            onClick={() => void copyLink()}
            className="mt-2 self-stretch font-body text-caption tracking-wide border border-warm-gray/30 text-ink px-3 py-2 hover:border-warm-gray/50 transition-colors cursor-pointer"
          >
            {t('checkout.copyPaymentLink')}
          </button>
          <p className="font-body text-[10px] text-sepia-mid mt-2 self-stretch text-left">{t('checkout.qrFallbackHint')}</p>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            type="button"
            onClick={onFailure}
            disabled={isProcessing}
            className="flex-1 font-body text-label tracking-wide border border-warm-gray/30 text-ink-faded px-4 py-3 hover:border-warm-gray/50 hover:text-ink transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('checkout.paymentFailed')}
          </button>
          <button
            type="button"
            onClick={onSuccess}
            disabled={isProcessing}
            className="flex-1 font-body text-label tracking-wide bg-ink text-paper px-4 py-3 hover:bg-rust transition-colors cursor-pointer disabled:opacity-60"
          >
            {isProcessing ? t('checkout.processing') : t('checkout.simulatePaid')}
          </button>
        </div>
      </div>
    </div>
  );
}
