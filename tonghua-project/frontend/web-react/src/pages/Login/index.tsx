import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import { VintageInput } from '@/components/editorial/VintageInput';
import GrainOverlay from '@/components/editorial/GrainOverlay';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { login, isLoggingIn, loginError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    login(
      { email, password },
      {
        onSuccess: () => {
          navigate('/');
        },
      }
    );
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
              {t('login.title')}
            </motion.h1>
            <motion.p
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, ease: [0, 0, 0.2, 1], delay: 0.1 }}
              className="font-body text-body-sm text-ink-faded"
            >
              {t('login.subtitle')}
            </motion.p>

            {/* Decorative divider under header */}
            <motion.div
              {...(prefersReducedMotion ? {} : { initial: { scaleX: 0 }, animate: { scaleX: 1 }, transition: { duration: 0.8, delay: 0.3 } })}
              className="h-px w-[60px] bg-rust/40 mx-auto mt-6 origin-center"
              aria-hidden="true"
            />
          </div>

          {/* Form with corner accents */}
          <motion.form
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, ease: [0, 0, 0.2, 1], delay: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-6 relative"
          >
            {/* Corner accents — diagonal pattern */}
            <div className="absolute -top-4 -left-4 w-6 h-6 border-t-2 border-l-2 border-rust/30 pointer-events-none" aria-hidden="true" />
            <div className="absolute -bottom-4 -right-4 w-6 h-6 border-b-2 border-r-2 border-rust/30 pointer-events-none" aria-hidden="true" />

            <VintageInput
              label={t('login.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <VintageInput
              label={t('login.password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between">
              <label htmlFor="remember-me" className="flex items-center gap-2 cursor-pointer">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="w-4 h-4 accent-rust border-warm-gray/50 rounded-sm cursor-pointer"
                />
                <span className="font-body text-caption text-ink-faded">{t('login.rememberMe')}</span>
              </label>
              <Link
                to="#"
                className="font-body text-caption text-rust hover:text-ink transition-colors cursor-pointer"
              >
                {t('login.forgotPassword')}
              </Link>
            </div>

            {loginError && (
              <div role="alert" className="font-body text-body-sm text-rust text-center border border-rust/20 px-4 py-3 mb-4">
                {loginError}
              </div>
            )}

            <motion.button
              type="submit"
              disabled={isLoggingIn}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
              className="w-full font-body text-body-sm tracking-[0.15em] uppercase bg-ink text-paper px-10 py-4 hover:bg-rust transition-colors duration-300 disabled:opacity-50 cursor-pointer"
            >
              {isLoggingIn ? t('login.submitting') : t('login.submit')}
            </motion.button>

            {/* Social login buttons */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-warm-gray/30" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-paper text-caption text-sepia-mid">{t('login.orContinueWith')}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <motion.button
                type="button"
                aria-label="Sign in with GitHub"
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                className="flex items-center justify-center gap-2 font-body text-caption tracking-wide border border-warm-gray/40 text-ink px-3 py-3 hover:border-ink transition-colors duration-300 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </motion.button>

              <motion.button
                type="button"
                aria-label="Sign in with Google"
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                className="flex items-center justify-center gap-2 font-body text-caption tracking-wide border border-warm-gray/40 text-ink px-3 py-3 hover:border-ink transition-colors duration-300 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" fillOpacity="0.85" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" fillOpacity="0.65" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" fillOpacity="0.5" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" fillOpacity="0.35" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </motion.button>

              <motion.button
                type="button"
                aria-label={t('login.wechat')}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                className="flex items-center justify-center gap-2 font-body text-caption tracking-wide border border-warm-gray/40 text-ink px-3 py-3 hover:border-ink transition-colors duration-300 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" fillOpacity="0.7" aria-hidden="true">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.007-.27-.03-.406-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
                </svg>
                {t('login.wechat')}
              </motion.button>
            </div>

            <p className="text-center pt-4">
              <Link
                to="/register"
                className="font-body text-caption text-rust hover:text-ink transition-colors tracking-[0.1em] uppercase cursor-pointer"
              >
                {t('login.register')}
              </Link>
            </p>
          </motion.form>
        </div>
      </PaperTextureBackground>

      <div className="editorial-divider" aria-hidden="true" />
    </PageWrapper>
  );
}
