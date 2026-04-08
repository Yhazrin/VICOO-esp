import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import { VintageInput } from '@/components/editorial/VintageInput';
import GrainOverlay from '@/components/editorial/GrainOverlay';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import api from '@/services/api';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recoveryData, setRecoveryData] = useState<{ password_hint?: string; is_mock?: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setRecoveryData(response.data?.data || null);
      setSubmitted(true);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError(t('forgotPassword.errorNotFound', 'Email address not found in our records.'));
      } else {
        setError(t('forgotPassword.errorGeneric', 'An error occurred. Please try again later.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <PaperTextureBackground variant="paper" className="min-h-[100dvh] flex items-center justify-center relative">
        <GrainOverlay />

        <div className="w-full max-w-md relative mx-auto py-12 px-6">
          {/* Header */}
          <div className="text-center mb-10">
            <motion.h1
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, ease: [0, 0, 0.2, 1] }}
              className="font-display text-3xl md:text-4xl font-bold text-ink mb-4"
            >
              {t('forgotPassword.title', 'Reset Password')}
            </motion.h1>
            <motion.p
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, ease: [0, 0, 0.2, 1], delay: 0.1 }}
              className="font-body text-body-sm text-ink-faded"
            >
              {recoveryData?.is_mock 
                ? t('forgotPassword.mockTitle', 'Account Found (Mock Mode)')
                : t('forgotPassword.subtitle', 'Enter your email and we\'ll send you a reset link')}
            </motion.p>
            <motion.div
              {...(prefersReducedMotion ? {} : { initial: { scaleX: 0 }, animate: { scaleX: 1 }, transition: { duration: 0.8, delay: 0.3 } })}
              className="h-px w-[60px] bg-rust/40 mx-auto mt-6 origin-center"
              aria-hidden="true"
            />
          </div>

          {submitted ? (
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="w-16 h-16 mx-auto border-2 border-rust/30 flex items-center justify-center">
                {recoveryData?.is_mock ? (
                  <span className="text-2xl font-bold text-rust">!</span>
                ) : (
                  <svg className="w-8 h-8 text-rust" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
              </div>

              {recoveryData?.is_mock ? (
                <div className="space-y-4">
                  <p className="font-body text-body-sm text-ink">
                    {t('forgotPassword.mockInstruction', 'Since this is a test account, your password is shown below:')}
                  </p>
                  <div className="bg-[#EDE6D6] p-4 border border-dashed border-rust font-mono text-lg font-bold text-ink">
                    {recoveryData.password_hint}
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-body text-body-sm text-ink">
                    {t('forgotPassword.sent', 'If an account exists with that email, we\'ve sent a password reset link.')}
                  </p>
                  <p className="font-body text-caption text-ink-faded">
                    {t('forgotPassword.checkSpam', 'Check your spam folder if you don\'t see it within a few minutes.')}
                  </p>
                </>
              )}
              
              <div className="pt-4">
                <Link
                  to="/login"
                  className="inline-block font-body text-body-sm tracking-[0.15em] uppercase text-rust hover:text-ink transition-colors cursor-pointer"
                >
                  &larr; {t('forgotPassword.backToLogin', 'Back to login')}
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.form
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, ease: [0, 0, 0.2, 1], delay: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-6 relative"
            >
              <div className="absolute -top-4 -left-4 w-6 h-6 border-t-2 border-l-2 border-rust/30 pointer-events-none" aria-hidden="true" />
              <div className="absolute -bottom-4 -right-4 w-6 h-6 border-b-2 border-r-2 border-rust/30 pointer-events-none" aria-hidden="true" />

              <VintageInput
                label={t('forgotPassword.email', 'Email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {error && (
                <div role="alert" className="font-body text-body-sm text-rust text-center border border-rust/20 px-4 py-3">
                  {error}
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
                className="w-full font-body text-body-sm tracking-[0.15em] uppercase bg-ink text-paper px-10 py-4 hover:bg-rust transition-colors duration-300 disabled:opacity-50 cursor-pointer"
              >
                {loading
                  ? t('forgotPassword.sending', 'Sending...')
                  : t('forgotPassword.submit', 'Send Reset Link')}
              </motion.button>

              <p className="text-center pt-4">
                <Link
                  to="/login"
                  className="font-body text-caption text-rust hover:text-ink transition-colors tracking-[0.1em] uppercase cursor-pointer"
                >
                  &larr; {t('forgotPassword.backToLogin', 'Back to login')}
                </Link>
              </p>
            </motion.form>
          )}
        </div>
      </PaperTextureBackground>
    </PageWrapper>
  );
}
