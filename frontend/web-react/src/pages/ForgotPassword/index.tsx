import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import api from '@/services/api';
import { useUIStore } from '@/stores/uiStore';

export default function ForgotPassword() {
  const { t, i18n } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recoveryData, setRecoveryData] = useState<{ password_hint?: string; is_mock?: boolean } | null>(null);
  const setLocale = useUIStore((s) => s.setLocale);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setRecoveryData(response.data?.data || null);
      setSubmitted(true);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setError(t('forgotPassword.errorNotFound'));
      } else {
        setError(t('forgotPassword.errorGeneric'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-paper flex items-center justify-center relative">
      {/* Subtle background grain */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Decorative gradient orb */}
      <div className="absolute top-[-15%] left-[20%] w-[500px] h-[500px] rounded-full bg-rust/[0.03] blur-3xl pointer-events-none" />

      {/* Card */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
        className="relative w-full max-w-[420px] mx-6"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-lg shadow-ink/[0.06] border border-warm-gray/30 px-8 py-10 md:px-10 md:py-12">
          {/* Logo & header */}
          <div className="text-center mb-8">
            <Link
              to="/"
              className="inline-block font-display text-ink text-2xl font-medium tracking-[0.12em] mb-6 hover:text-rust transition-colors"
            >
              VICOO
            </Link>
            <h1 className="font-display text-2xl text-ink mb-2 tracking-tight">
              {t('forgotPassword.title')}
            </h1>
            <p className="font-body text-body-sm text-ink-faded/70">
              {recoveryData?.is_mock
                ? t('forgotPassword.mockTitle')
                : t('forgotPassword.subtitle')}
            </p>
          </div>

          {submitted ? (
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="w-14 h-14 mx-auto rounded-full bg-rust/[0.08] flex items-center justify-center">
                {recoveryData?.is_mock ? (
                  <span className="text-xl font-bold text-rust">!</span>
                ) : (
                  <svg className="w-6 h-6 text-rust" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
              </div>

              {recoveryData?.is_mock ? (
                <div className="space-y-4">
                  <p className="font-body text-body-sm text-ink">
                    {t('forgotPassword.mockInstruction')}
                  </p>
                  <div className="bg-aged-stock/60 rounded-full px-6 py-3 border border-warm-gray/30 font-mono text-lg font-bold text-ink text-center">
                    {recoveryData.password_hint}
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-body text-body-sm text-ink">
                    {t('forgotPassword.sent')}
                  </p>
                  <p className="font-body text-caption text-ink-faded/60">
                    {t('forgotPassword.checkSpam')}
                  </p>
                </>
              )}

              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-block bg-ink text-paper py-3 px-8 rounded-full font-body text-body-sm tracking-[0.1em] uppercase hover:bg-rust transition-colors duration-300 cursor-pointer"
                >
                  &larr; {t('forgotPassword.backToLogin')}
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.form
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? {} : { duration: 0.6, ease: [0, 0, 0.2, 1], delay: 0.15 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Email */}
              <div>
                <label htmlFor="forgot-email" className="block font-body text-label tracking-[0.15em] uppercase text-sepia-mid mb-2">
                  {t('forgotPassword.email')}
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-required="true"
                  placeholder="name@email.com"
                  className="w-full px-4 py-3 rounded-full bg-aged-stock/60 border border-warm-gray/30 font-body text-body-sm text-ink placeholder:text-ink-faded/40 focus:outline-none focus:ring-2 focus:ring-rust/30 focus:border-rust/50 transition-all"
                />
              </div>

              {/* Error */}
              {error && (
                <div role="alert" className="font-body text-caption text-rust bg-rust/[0.06] rounded-full px-4 py-2 text-center">
                  {error}
                </div>
              )}

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.015 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                className="w-full bg-ink text-paper py-3.5 rounded-full font-body text-body-sm tracking-[0.15em] uppercase font-medium hover:bg-rust transition-colors duration-300 disabled:opacity-50 cursor-pointer"
              >
                {loading
                  ? t('forgotPassword.sending')
                  : t('forgotPassword.submit')}
              </motion.button>

              {/* Back to login */}
              <p className="text-center pt-2">
                <Link
                  to="/login"
                  className="font-body text-caption text-rust hover:text-ink transition-colors font-medium"
                >
                  &larr; {t('forgotPassword.backToLogin')}
                </Link>
              </p>
            </motion.form>
          )}
        </div>

        {/* Language toggle */}
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
