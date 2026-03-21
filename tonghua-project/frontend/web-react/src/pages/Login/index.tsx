import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import { VintageInput } from '@/components/editorial/VintageInput';
import GrainOverlay from '@/components/editorial/GrainOverlay';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import { MagazineDivider } from '@/components/editorial/MagazineDivider';
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
      <PaperTextureBackground variant="paper" className="min-h-[100dvh] flex items-center relative">
        <GrainOverlay />

        {/* Decorative vertical line — left accent */}
        <div className="absolute left-6 top-1/4 bottom-1/4 w-px bg-rust/15 hidden md:block" aria-hidden="true" />

        <div className="w-full max-w-md relative mx-auto py-12 px-4">
          {/* Header */}
          <div className="text-center mb-10">
            <motion.span
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.1 }}
              className="font-body text-overline tracking-[0.3em] uppercase text-sepia-mid block mb-6"
            >
              Vol. IX · No. 09
            </motion.span>
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

            <MagazineDivider variant="decorative" className="!my-6" />

            <motion.button
              type="button"
              whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
              className="w-full font-body text-body-sm tracking-[0.1em] border border-warm-gray/40 text-ink px-10 py-4 hover:border-ink transition-colors duration-300 cursor-pointer"
            >
              {t('login.wechat')}
            </motion.button>

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

      <div className="editorial-divider" />
    </PageWrapper>
  );
}
