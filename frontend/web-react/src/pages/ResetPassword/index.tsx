import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import api from '@/services/api';
import { useUIStore } from '@/stores/uiStore';

type Step = 'verify' | 'set';

const OTP_LENGTH = 6;

export default function ResetPassword() {
  const { t, i18n } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawToken = searchParams.get('token') ?? '';
  const setLocale = useUIStore((s) => s.setLocale);

  const [step, setStep] = useState<Step>('verify');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpError, setOtpError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [missingToken, setMissingToken] = useState(!rawToken);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetting, setResetting] = useState(false);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!rawToken) setMissingToken(true);
  }, [rawToken]);

  const handleOtpChange = (idx: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[idx] = value.slice(-1);
    setOtp(next);
    setOtpError('');
    if (value && idx < OTP_LENGTH - 1) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    setOtpError('');
    const lastFilled = Math.min(pasted.length, OTP_LENGTH - 1);
    otpRefs.current[lastFilled]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      setOtpError(t('forgotPassword.resetPassword.errors.invalidOtp'));
      return;
    }
    setVerifying(true);
    setOtpError('');
    try {
      await api.post('/auth/reset/verify-otp', { token: rawToken, otp: code });
      setStep('set');
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
      const map: Record<string, string> = {
        invalid_otp: 'forgotPassword.resetPassword.errors.invalidOtp',
        too_many_attempts: 'forgotPassword.resetPassword.errors.tooManyAttempts',
        expired: 'forgotPassword.resetPassword.errors.expired',
      };
      setOtpError(t(map[code ?? ''] ?? 'forgotPassword.resetPassword.errors.generic'));
    } finally {
      setVerifying(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (newPassword.length < 8) {
      setResetError(t('forgotPassword.resetPassword.passwordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError(t('forgotPassword.resetPassword.passwordMismatch'));
      return;
    }
    setResetting(true);
    try {
      await api.post('/auth/reset/confirm', {
        token: rawToken,
        otp: otp.join(''),
        new_password: newPassword,
      });
      navigate('/login?reset=success');
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
      const map: Record<string, string> = {
        invalid_otp: 'forgotPassword.resetPassword.errors.invalidOtp',
        too_many_attempts: 'forgotPassword.resetPassword.errors.tooManyAttempts',
        expired: 'forgotPassword.resetPassword.errors.expired',
      };
      setResetError(t(map[code ?? ''] ?? 'forgotPassword.resetPassword.errors.generic'));
    } finally {
      setResetting(false);
    }
  };

  // ── Render: missing token ────────────────────────────────────────────
  if (missingToken) {
    return (
      <div className="h-[100dvh] overflow-hidden bg-paper flex items-center justify-center relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
          className="relative w-full max-w-[420px] mx-6"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-lg shadow-ink/[0.06] border border-warm-gray/30 px-8 py-10 md:px-10 md:py-12 text-center space-y-6">
            <div className="w-14 h-14 mx-auto rounded-full bg-rust/[0.08] flex items-center justify-center">
              <span className="text-xl font-bold text-rust">!</span>
            </div>
            <p className="font-body text-body-sm text-ink">
              {t('forgotPassword.resetPassword.errors.missingToken')}
            </p>
            <Link
              to="/forgot-password"
              className="inline-block bg-ink text-paper py-3 px-8 rounded-full font-body text-body-sm tracking-[0.1em] uppercase hover:bg-rust transition-colors duration-300 cursor-pointer"
            >
              {t('forgotPassword.resetPassword.requestNew')}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-paper flex items-center justify-center relative">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute top-[-15%] left-[20%] w-[500px] h-[500px] rounded-full bg-rust/[0.03] blur-3xl pointer-events-none" />

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
        className="relative w-full max-w-[420px] mx-6"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-lg shadow-ink/[0.06] border border-warm-gray/30 px-8 py-10 md:px-10 md:py-12">
          <div className="text-center mb-8">
            <Link
              to="/"
              className="inline-block font-display text-ink text-2xl font-medium tracking-[0.12em] mb-6 hover:text-rust transition-colors"
            >
              VICOO
            </Link>
            <h1 className="font-display text-2xl text-ink mb-2 tracking-tight">
              {step === 'verify'
                ? t('forgotPassword.resetPassword.verifyTitle')
                : t('forgotPassword.resetPassword.setTitle')}
            </h1>
            <p className="font-body text-body-sm text-ink-faded/70">
              {step === 'verify'
                ? t('forgotPassword.resetPassword.verifySubtitle')
                : t('forgotPassword.resetPassword.setSubtitle')}
            </p>
          </div>

          {step === 'verify' ? (
            <motion.form
              key="verify"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? {} : { duration: 0.5, ease: [0, 0, 0.2, 1] }}
              onSubmit={handleVerify}
              className="space-y-6"
            >
              <div>
                <label className="block font-body text-label tracking-[0.15em] uppercase text-sepia-mid mb-3 text-center">
                  {t('forgotPassword.resetPassword.otpLabel')}
                </label>
                <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      aria-label={`${t('forgotPassword.resetPassword.otpLabel')} ${i + 1}`}
                      className={`w-12 h-14 text-center font-mono text-2xl font-bold text-ink bg-aged-stock/60 border ${otpError ? 'border-rust/60' : 'border-warm-gray/30'} rounded-lg focus:outline-none focus:ring-2 focus:ring-rust/30 focus:border-rust/50 transition-all`}
                    />
                  ))}
                </div>
                <p className="font-body text-caption text-ink-faded/50 text-center mt-2">
                  {t('forgotPassword.resetPassword.passwordHint')}
                </p>
              </div>

              {otpError && (
                <div role="alert" className="font-body text-caption text-rust bg-rust/[0.06] rounded-full px-4 py-2 text-center">
                  {otpError}
                </div>
              )}

              <motion.button
                type="submit"
                disabled={verifying}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.015 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                className="w-full bg-ink text-paper py-3.5 rounded-full font-body text-body-sm tracking-[0.15em] uppercase font-medium hover:bg-rust transition-colors duration-300 disabled:opacity-50 cursor-pointer"
              >
                {verifying
                  ? t('forgotPassword.resetPassword.verifying')
                  : t('forgotPassword.resetPassword.verifyButton')}
              </motion.button>

              <p className="text-center pt-2">
                <Link
                  to="/forgot-password"
                  className="font-body text-caption text-rust hover:text-ink transition-colors font-medium"
                >
                  {t('forgotPassword.resetPassword.requestNew')}
                </Link>
              </p>
            </motion.form>
          ) : (
            <motion.form
              key="set"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? {} : { duration: 0.5, ease: [0, 0, 0.2, 1] }}
              onSubmit={handleReset}
              className="space-y-5"
            >
              <div>
                <label htmlFor="rp-new" className="block font-body text-label tracking-[0.15em] uppercase text-sepia-mid mb-2">
                  {t('forgotPassword.resetPassword.newPasswordLabel')}
                </label>
                <div className="relative">
                  <input
                    id="rp-new"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setResetError(''); }}
                    required
                    autoComplete="new-password"
                    className={`w-full px-4 py-3 pr-12 rounded-full bg-aged-stock/60 border ${resetError ? 'border-rust/60' : 'border-warm-gray/30'} font-body text-body-sm text-ink placeholder:text-ink-faded/40 focus:outline-none focus:ring-2 focus:ring-rust/30 focus:border-rust/50 transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? t('forgotPassword.resetPassword.hidePassword') : t('forgotPassword.resetPassword.showPassword')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faded/50 hover:text-ink transition-colors cursor-pointer p-1"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l11.544 11.544M9.879 16.121A3 3 0 1012.015 9.85" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="rp-confirm" className="block font-body text-label tracking-[0.15em] uppercase text-sepia-mid mb-2">
                  {t('forgotPassword.resetPassword.confirmPasswordLabel')}
                </label>
                <input
                  id="rp-confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setResetError(''); }}
                  required
                  autoComplete="new-password"
                  className={`w-full px-4 py-3 rounded-full bg-aged-stock/60 border ${resetError ? 'border-rust/60' : 'border-warm-gray/30'} font-body text-body-sm text-ink placeholder:text-ink-faded/40 focus:outline-none focus:ring-2 focus:ring-rust/30 focus:border-rust/50 transition-all`}
                />
              </div>

              {resetError && (
                <div role="alert" className="font-body text-caption text-rust bg-rust/[0.06] rounded-full px-4 py-2 text-center">
                  {resetError}
                </div>
              )}

              <motion.button
                type="submit"
                disabled={resetting}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.015 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                className="w-full bg-ink text-paper py-3.5 rounded-full font-body text-body-sm tracking-[0.15em] uppercase font-medium hover:bg-rust transition-colors duration-300 disabled:opacity-50 cursor-pointer"
              >
                {resetting
                  ? t('forgotPassword.resetPassword.resetting')
                  : t('forgotPassword.resetPassword.resetButton')}
              </motion.button>

              <p className="text-center pt-2">
                <Link
                  to="/login"
                  className="font-body text-caption text-rust hover:text-ink transition-colors font-medium"
                >
                  {t('forgotPassword.resetPassword.backToLogin')}
                </Link>
              </p>
            </motion.form>
          )}
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={() => {
              const next = i18n.language === 'en' ? 'zh' : 'en';
              i18n.changeLanguage(next);
              setLocale(next);
            }}
            className="font-body text-caption text-sepia-mid/50 hover:text-ink-faded transition-colors px-4 py-2 cursor-pointer"
          >
            {i18n.language === 'zh' ? 'English' : '中文'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
