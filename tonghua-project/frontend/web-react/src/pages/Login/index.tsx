import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import { VintageInput } from '@/components/editorial/VintageInput';
import GrainOverlay from '@/components/editorial/GrainOverlay';
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
      {/* Centered auth layout - no hero section */}
      <div className="min-h-screen flex items-center justify-center py-12 px-4 relative">
        {/* Grain overlay */}
        <div style={{ opacity: 0.06 }} className="absolute inset-0">
          <GrainOverlay />
        </div>

        <div className="w-full max-w-md relative">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="font-body text-caption text-sepia-mid tracking-[0.3em] uppercase mb-4 block">
              09
            </span>
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
              className="font-body text-sm text-ink-faded"
            >
              {t('login.subtitle')}
            </motion.p>
          </div>

          {/* Form with corner accents */}
          <motion.form
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, ease: [0, 0, 0.2, 1], delay: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-6 relative"
          >
            {/* Corner accents */}
            <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-rust/30 pointer-events-none" aria-hidden="true" />
            <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-rust/30 pointer-events-none" aria-hidden="true" />
            <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-rust/30 pointer-events-none" aria-hidden="true" />
            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-rust/30 pointer-events-none" aria-hidden="true" />

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
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="font-body text-xs text-ink-faded">{t('login.rememberMe')}</span>
              </label>
              <Link
                to="#"
                className="font-body text-xs text-rust hover:text-ink transition-colors cursor-pointer"
              >
                {t('login.forgotPassword')}
              </Link>
            </div>

            {loginError && (
              <div role="alert" className="font-body text-sm text-rust text-center border border-rust/20 px-4 py-3 mb-4">
                {loginError}
              </div>
            )}

            <motion.button
              type="submit"
              disabled={isLoggingIn}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
              className="w-full font-body text-sm tracking-[0.15em] uppercase bg-ink text-paper px-10 py-4 hover:bg-rust transition-colors duration-300 disabled:opacity-50 cursor-pointer"
            >
              {isLoggingIn ? t('login.submitting') : t('login.submit')}
            </motion.button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-warm-gray/30" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-paper px-4 font-body text-xs text-sepia-mid">
                  {t('login.orContinueWith')}
                </span>
              </div>
            </div>

            <motion.button
              type="button"
              whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
              className="w-full font-body text-sm tracking-[0.1em] border border-warm-gray/40 text-ink px-10 py-4 hover:border-ink transition-colors duration-300 cursor-pointer"
            >
              {t('login.wechat')}
            </motion.button>

            <p className="text-center pt-4">
              <Link
                to="/register"
                className="font-body text-xs text-rust hover:text-ink transition-colors tracking-[0.1em] uppercase cursor-pointer"
              >
                {t('login.register')}
              </Link>
            </p>
          </motion.form>
        </div>
      </div>
    </PageWrapper>
  );
}
