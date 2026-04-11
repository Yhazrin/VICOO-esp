import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

export default function Register() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { register, isRegistering, registerError } = useAuth();
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError(t('register.errors.passwordMismatch'));
      return;
    }

    if (password.length < 8) {
      setLocalError(t('register.errors.passwordTooShort'));
      return;
    }

    register(
      { email, password, nickname },
      {
        onSuccess: () => {
          navigate('/');
        },
      }
    );
  };

  const error = localError || registerError;

  return (
    <div className="h-[100dvh] overflow-hidden bg-paper flex items-center justify-center relative">
      {/* Subtle background grain */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Decorative gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-sage/[0.04] blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-rust/[0.04] blur-3xl pointer-events-none" />

      {/* Card */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
        className="relative w-full max-w-[420px] mx-6"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-lg shadow-ink/[0.06] border border-warm-gray/30 px-8 py-10 md:px-10 md:py-12 max-h-[90vh] overflow-y-auto">
          {/* Logo & header */}
          <div className="text-center mb-8">
            <Link
              to="/"
              className="inline-block font-display text-ink text-2xl font-medium tracking-[0.12em] mb-6 hover:text-rust transition-colors"
            >
              VICOO
            </Link>
            <h1 className="font-display text-2xl text-ink mb-2 tracking-tight">
              {t('register.title')}
            </h1>
            <p className="font-body text-body-sm text-ink-faded/70">
              {t('register.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nickname */}
            <div>
              <label className="block font-body text-label tracking-[0.15em] uppercase text-sepia-mid mb-2">
                {t('register.nickname')}
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-full bg-aged-stock/60 border border-warm-gray/30 font-body text-body-sm text-ink placeholder:text-ink-faded/40 focus:outline-none focus:ring-2 focus:ring-rust/30 focus:border-rust/50 transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block font-body text-label tracking-[0.15em] uppercase text-sepia-mid mb-2">
                {t('register.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-full bg-aged-stock/60 border border-warm-gray/30 font-body text-body-sm text-ink placeholder:text-ink-faded/40 focus:outline-none focus:ring-2 focus:ring-rust/30 focus:border-rust/50 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block font-body text-label tracking-[0.15em] uppercase text-sepia-mid mb-2">
                {t('register.password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-full bg-aged-stock/60 border border-warm-gray/30 font-body text-body-sm text-ink placeholder:text-ink-faded/40 focus:outline-none focus:ring-2 focus:ring-rust/30 focus:border-rust/50 transition-all"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block font-body text-label tracking-[0.15em] uppercase text-sepia-mid mb-2">
                {t('register.confirmPassword')}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-full bg-aged-stock/60 border border-warm-gray/30 font-body text-body-sm text-ink placeholder:text-ink-faded/40 focus:outline-none focus:ring-2 focus:ring-rust/30 focus:border-rust/50 transition-all"
              />
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                role="alert"
                className="font-body text-caption text-rust bg-rust/[0.06] rounded-full px-4 py-2 text-center"
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isRegistering}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.015 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
              className="w-full bg-ink text-paper py-3.5 rounded-full font-body text-body-sm tracking-[0.15em] uppercase font-medium hover:bg-rust transition-colors duration-300 disabled:opacity-50 cursor-pointer"
            >
              {isRegistering ? t('register.submitting') : t('register.submit')}
            </motion.button>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-warm-gray/25" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white/80 font-body text-caption text-sepia-mid/50">
                  {t('register.orContinueWith')}
                </span>
              </div>
            </div>

            {/* Social */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => window.location.href = '/api/v1/auth/github'}
                className="flex items-center justify-center gap-2 py-3 rounded-full border border-warm-gray/30 bg-aged-stock/40 font-body text-caption text-ink-faded hover:border-ink/30 hover:bg-aged-stock/70 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </button>
              <button
                type="button"
                onClick={() => window.location.href = '/api/v1/auth/google'}
                className="flex items-center justify-center gap-2 py-3 rounded-full border border-warm-gray/30 bg-aged-stock/40 font-body text-caption text-ink-faded hover:border-ink/30 hover:bg-aged-stock/70 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" opacity="0.7" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" opacity="0.5" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" opacity="0.3" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
            </div>

            {/* Login link */}
            <p className="text-center pt-2">
              <span className="font-body text-caption text-ink-faded/50 mr-1">
                {t('register.alreadyHaveAccount')}
              </span>
              <Link
                to="/login"
                className="font-body text-caption text-rust hover:text-ink transition-colors font-medium"
              >
                {t('register.login')}
              </Link>
            </p>
          </form>
        </div>

        {/* Language toggle */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => {
              const next = i18n.language === 'en' ? 'zh' : 'en';
              i18n.changeLanguage(next);
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
