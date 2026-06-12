import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { detectIdentityMode, type LoginMode } from '@/lib/auth/identity-detection';
import vicooLogo from '@/assets/vicoo-logo.png';
import toast from 'react-hot-toast';
import LoginAmbientBackground from './LoginAmbientBackground';
import type { AmbientMode } from './loginAmbientTypes';
import { TestAccountsPanel } from './TestAccountsPanel';
import type { TestAccount } from './testAccounts';
import { extractApiErrorDetail, localizeLoginErrorMessage } from '@/utils/loginError';

// Admin roles that can access admin panel
const ADMIN_ROLES = ['admin', 'editor', 'compliance'];

function getSafeRedirect(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

const CARD_GLOW: Record<Exclude<AmbientMode, null>, string> = {
  email: '0 28px 56px -12px rgba(230,0,18,0.12), 0 12px 24px -8px rgba(26,26,22,0.08)',
  password: '0 28px 56px -12px rgba(109,137,116,0.14), 0 12px 24px -8px rgba(26,26,22,0.08)',
  accounts: '0 28px 56px -12px rgba(196,164,90,0.16), 0 12px 24px -8px rgba(26,26,22,0.08)',
  action: '0 28px 56px -12px rgba(26,26,22,0.14), 0 12px 24px -8px rgba(26,26,22,0.1)',
};

// Admin mode glow (ADFS-inspired)
const ADMIN_GLOW = '0 28px 56px -12px rgba(1,132,127,0.2), 0 12px 24px -8px rgba(26,26,22,0.08)';

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefersReducedMotion = useReducedMotion();
  const { loginError } = useAuth();
  const setLocale = useUIStore((s) => s.setLocale);
  const stageRef = useRef<HTMLDivElement>(null);
  const lastTypePulseRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showTestAccounts, setShowTestAccounts] = useState(false);
  const [ambientMode, setAmbientMode] = useState<AmbientMode>(null);
  const [ambientPulse, setAmbientPulse] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      setResetSuccess(true);
      // Clear the param so a refresh doesn't re-show the banner.
      const next = new URLSearchParams(searchParams);
      next.delete('reset');
      const qs = next.toString();
      navigate(qs ? `?${qs}` : location.pathname, { replace: true });
      const timer = setTimeout(() => setResetSuccess(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, navigate]);

  // ADFS-inspired identity detection state
  const [detectedMode, setDetectedMode] = useState<LoginMode>('user');
  const [manualOverride, setManualOverride] = useState(false);
  const [showIdentityBadge, setShowIdentityBadge] = useState(false);

  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  const smoothX = useSpring(pointerX, { stiffness: 90, damping: 20, mass: 0.55 });
  const smoothY = useSpring(pointerY, { stiffness: 90, damping: 20, mass: 0.55 });

  const orbPrimaryX = useTransform(smoothX, [0, 1], [-130, 130]);
  const orbPrimaryY = useTransform(smoothY, [0, 1], [-90, 90]);
  const orbSecondaryX = useTransform(smoothX, [0, 1], [110, -110]);
  const orbSecondaryY = useTransform(smoothY, [0, 1], [70, -70]);
  const grainDriftX = useTransform(smoothX, [0, 1], [-18, 18]);
  const grainDriftY = useTransform(smoothY, [0, 1], [-12, 12]);

  const nudgeAmbient = useCallback((mode: Exclude<AmbientMode, null>) => {
    setAmbientMode(mode);
    setAmbientPulse((value) => value + 1);
  }, []);

  const pulseOnType = useCallback(
    (mode: Exclude<AmbientMode, null>) => {
      if (prefersReducedMotion) return;
      const now = Date.now();
      if (now - lastTypePulseRef.current < 420) return;
      lastTypePulseRef.current = now;
      nudgeAmbient(mode);
    },
    [nudgeAmbient, prefersReducedMotion],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!stageRef.current || prefersReducedMotion) return;
      const rect = stageRef.current.getBoundingClientRect();
      const nextX = (e.clientX - rect.left) / rect.width;
      const nextY = (e.clientY - rect.top) / rect.height;
      pointerX.set(Math.max(0, Math.min(1, nextX)));
      pointerY.set(Math.max(0, Math.min(1, nextY)));
    },
    [pointerX, pointerY, prefersReducedMotion],
  );

  const handleMouseLeave = useCallback(() => {
    pointerX.set(0.5);
    pointerY.set(0.5);
  }, [pointerX, pointerY]);

  // Handle email change with ADFS-inspired identity detection
  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounced identity detection (300ms)
    debounceRef.current = setTimeout(() => {
      if (!manualOverride && value) {
        const result = detectIdentityMode(value);
        setDetectedMode(result.mode);

        // Show badge when admin detected
        if (result.mode === 'admin') {
          setShowIdentityBadge(true);
          nudgeAmbient('action');
        } else {
          setShowIdentityBadge(false);
        }
      }
    }, 300);
  }, [manualOverride, nudgeAmbient]);

  // Handle test account selection with identity detection
  const handleSelectTestAccount = (account: TestAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setShowTestAccounts(false);
    nudgeAmbient('accounts');

    // Auto-detect identity from account
    const result = detectIdentityMode(account.email);
    setDetectedMode(result.mode);
    setManualOverride(true);
    setShowIdentityBadge(result.mode === 'admin');

    toast.success(t('login.testAccounts.filled', '已填入登录表单'));
  };

  // Handle form submission - use mutation directly to get server response
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    nudgeAmbient('action');

    // Show loading state
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = localizeLoginErrorMessage(extractApiErrorDetail(data), t);
        setSubmitError(message);
        toast.error(message);
        return;
      }

      const data = await response.json();
      const userData = data.data?.user || data.user;
      const userRole = userData?.role;

      // Check if admin user
      if (userRole && ADMIN_ROLES.includes(userRole)) {
        // Admin users: redirect to admin SPA directly
        // DO NOT store session in web-react - admin has its own session
        const redirect = getSafeRedirect(searchParams.get('redirect'));
        const adminTarget = redirect?.startsWith('/admin') ? redirect : '/admin/';
        toast.success(t('auth.loginSuccess', 'Login successful'));
        window.location.href = adminTarget;
      } else {
        const redirect = getSafeRedirect(searchParams.get('redirect'));
        const userTarget = redirect && !redirect.startsWith('/admin') ? redirect : '/';
        // Regular users: store session and stay on web-react
        const login = useAuthStore.getState().login;
        const tokenData = data.data?.token || data.token || data;
        login(userData, tokenData.access_token || tokenData.accessToken, tokenData.refresh_token);
        await useCartStore.getState().loadFromServer();
        navigate(userTarget, { replace: true });
      }
    } catch (err: unknown) {
      const message = err instanceof Error
        ? localizeLoginErrorMessage(err.message, t)
        : t('login.error.invalidCredentials', 'Invalid email or password');
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={stageRef}
      className="relative flex h-[100dvh] items-center justify-center overflow-hidden bg-paper"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <LoginAmbientBackground
        smoothX={smoothX}
        smoothY={smoothY}
        grainDriftX={grainDriftX}
        grainDriftY={grainDriftY}
        orbPrimaryX={orbPrimaryX}
        orbPrimaryY={orbPrimaryY}
        orbSecondaryX={orbSecondaryX}
        orbSecondaryY={orbSecondaryY}
        ambientMode={ambientMode}
        ambientPulse={ambientPulse}
        prefersReducedMotion={prefersReducedMotion}
      />

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
        className="relative z-10 flex w-full max-w-[780px] items-stretch justify-center mx-4"
      >
        <motion.div
          className={`relative w-full max-w-[420px] shrink-0 rounded-[24px] border px-8 py-10 backdrop-blur-xl md:px-10 md:py-12 transition-colors duration-300 ${
            detectedMode === 'admin'
              ? 'bg-white/85 border-[#01847F]/25 shadow-[0_0_0_1px_rgba(1,132,127,0.08)]'
              : 'bg-white/80 border-warm-gray/30'
          }`}
          animate={{
            boxShadow: detectedMode === 'admin'
              ? ADMIN_GLOW
              : (ambientMode ? CARD_GLOW[ambientMode] : '0 24px 48px -12px rgba(26,26,22,0.1)'),
          }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {!prefersReducedMotion && (
            <motion.div
              className="pointer-events-none absolute -inset-px rounded-[25px] opacity-0"
              aria-hidden
              animate={{ opacity: [0.15, 0.35, 0.15] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                background: detectedMode === 'admin'
                  ? 'linear-gradient(135deg, rgba(1,132,127,0.2), transparent 55%)'
                  : ambientMode === 'email'
                    ? 'linear-gradient(135deg, rgba(230,0,18,0.22), transparent 55%)'
                    : ambientMode === 'password'
                      ? 'linear-gradient(135deg, rgba(109,137,116,0.24), transparent 55%)'
                      : ambientMode === 'accounts'
                        ? 'linear-gradient(135deg, rgba(196,164,90,0.26), transparent 55%)'
                        : 'linear-gradient(135deg, rgba(26,26,22,0.12), transparent 55%)',
              }}
            />
          )}

          {/* ADFS Identity Detection Badge */}
          <AnimatePresence>
            {showIdentityBadge && detectedMode === 'admin' && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-5 left-5 z-10 flex items-center gap-1.5 rounded-full border border-[#01847F]/20 bg-[#01847F]/10 px-3 py-1 font-mono text-[10px] tracking-wider text-[#01847F]"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>INTERNAL</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => {
              const next = i18n.language === 'en' ? 'zh' : 'en';
              i18n.changeLanguage(next);
              setLocale(next);
              nudgeAmbient('action');
            }}
            className="absolute top-5 right-5 z-10 rounded-full border border-warm-gray/25 bg-aged-stock/40 px-2.5 py-1 font-body text-[11px] tracking-wide text-sepia-mid/70 transition-colors hover:bg-aged-stock hover:text-ink cursor-pointer"
            aria-label={i18n.language === 'zh' ? 'Switch to English' : '切换到中文'}
          >
            {i18n.language === 'zh' ? 'EN' : '中'}
          </button>

          <div className="text-center mb-8">
            <Link
              to="/"
              className="inline-flex items-center justify-center mb-6 hover:opacity-90 transition-opacity"
              onMouseEnter={() => setAmbientMode('action')}
            >
              <img
                src={vicooLogo}
                alt="VICOO"
                className="h-10 w-auto object-contain"
              />
            </Link>
            <h1 className="font-display text-2xl text-ink mb-2 tracking-tight">
              {t('login.title', 'Welcome Back')}
            </h1>
            <AnimatePresence mode="wait">
              <motion.p
                key={detectedMode}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className={`font-body text-caption transition-colors duration-300 ${
                  detectedMode === 'admin' ? 'text-[#01847F]/70' : 'text-ink-faded/60'
                }`}
              >
                {detectedMode === 'admin'
                  ? 'Staff identity detected'
                  : t('login.subtitle', 'Sign in to your account')}
              </motion.p>
            </AnimatePresence>
            <button
              type="button"
              onClick={() => {
                setShowTestAccounts((open) => !open);
                nudgeAmbient('accounts');
              }}
              className={`inline-flex items-center gap-1.5 mx-auto rounded-full border px-4 py-2 font-body text-caption tracking-[0.08em] transition-all cursor-pointer ${
                showTestAccounts
                  ? 'text-rust bg-rust/[0.08] border-rust/25'
                  : 'text-ink-faded bg-aged-stock/60 border-warm-gray/30 hover:text-rust hover:border-rust/30 hover:bg-aged-stock'
              }`}
              aria-expanded={showTestAccounts}
              aria-controls="login-test-accounts"
            >
              {showTestAccounts
                ? t('login.testAccounts.hide')
                : t('login.testAccounts.show')}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className={`transition-transform ${showTestAccounts ? 'rotate-180' : ''}`}
                aria-hidden
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={`block font-body text-label tracking-[0.15em] uppercase mb-2 transition-colors duration-300 ${
                detectedMode === 'admin' ? 'text-[#01847F]/70' : 'text-sepia-mid'
              }`}>
                {t('login.email')}
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => {
                  handleEmailChange(e.target.value);
                  pulseOnType('email');
                }}
                onFocus={() => setAmbientMode('email')}
                onClick={() => nudgeAmbient('email')}
                required
                placeholder={detectedMode === 'admin' ? 'admin@vicoo.org' : 'name@email.com'}
                className={`w-full px-4 py-3 rounded-full bg-aged-stock/60 border font-body text-body-sm text-ink placeholder:text-ink-faded/40 focus:outline-none focus:ring-2 transition-all ${
                  detectedMode === 'admin'
                    ? 'border-[#01847F]/30 focus:ring-[#01847F]/30 focus:border-[#01847F]/50'
                    : 'border-warm-gray/30 focus:ring-rust/30 focus:border-rust/50'
                }`}
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block font-body text-label tracking-[0.15em] uppercase text-sepia-mid mb-2">
                {t('login.password')}
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    pulseOnType('password');
                  }}
                  onFocus={() => setAmbientMode('password')}
                  onClick={() => nudgeAmbient('password')}
                  required
                  aria-required="true"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-full bg-aged-stock/60 border border-warm-gray/30 font-body text-body-sm text-ink placeholder:text-ink-faded/40 focus:outline-none focus:ring-2 focus:ring-rust/30 focus:border-rust/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowPassword(!showPassword);
                    nudgeAmbient('password');
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sepia-mid/60 hover:text-rust transition-colors cursor-pointer"
                  aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 accent-rust rounded cursor-pointer"
                  onFocus={() => setAmbientMode('action')}
                  onClick={() => nudgeAmbient('action')}
                />
                <span className="font-body text-caption text-sepia-mid/70 group-hover:text-ink-faded transition-colors">
                  {t('login.rememberMe')}
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="font-body text-caption text-rust hover:text-ink transition-colors"
                onMouseEnter={() => setAmbientMode('action')}
              >
                {t('login.forgotPassword')}
              </Link>
            </div>

            {resetSuccess && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                role="status"
                className="font-body text-caption text-emerald-800 bg-emerald-50 border border-emerald-200/60 rounded-full px-4 py-2 text-center"
              >
                {t('login.successReset')}
              </motion.div>
            )}

            {(submitError || loginError) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                role="alert"
                className="font-body text-caption text-rust bg-rust/[0.06] rounded-full px-4 py-2 text-center"
              >
                {submitError || loginError}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={prefersReducedMotion ? undefined : { y: -1 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
              className={`w-full py-3.5 rounded-full font-body text-body-sm tracking-[0.15em] uppercase font-medium transition-all duration-300 disabled:opacity-50 cursor-pointer ${
                detectedMode === 'admin'
                  ? 'bg-[#01847F] text-white hover:bg-[#016A67]'
                  : 'bg-ink text-paper hover:bg-rust'
              }`}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={detectedMode + (isSubmitting ? '-loading' : '')}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  {isSubmitting
                    ? t('login.submitting')
                    : detectedMode === 'admin'
                      ? 'Access Admin'
                      : t('login.submit')}
                </motion.span>
              </AnimatePresence>
            </motion.button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-warm-gray/25" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white/80 font-body text-caption text-sepia-mid/50">
                  {t('login.orContinueWith')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!!oauthLoading}
                onClick={() => {
                  nudgeAmbient('action');
                  setOauthLoading('github');
                  window.location.href = '/api/v1/auth/github';
                }}
                className="flex items-center justify-center gap-2 py-3 rounded-full border border-warm-gray/30 bg-aged-stock/40 font-body text-caption text-ink-faded hover:border-ink/30 hover:bg-aged-stock/70 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                {oauthLoading === 'github' ? t('common.loading', 'Loading...') : 'GitHub'}
              </button>
              <button
                type="button"
                disabled={!!oauthLoading}
                onClick={() => {
                  nudgeAmbient('action');
                  setOauthLoading('google');
                  window.location.href = '/api/v1/auth/google';
                }}
                className="flex items-center justify-center gap-2 py-3 rounded-full border border-warm-gray/30 bg-aged-stock/40 font-body text-caption text-ink-faded hover:border-ink/30 hover:bg-aged-stock/70 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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

            <p className="text-center pt-2">
              <span className="font-body text-caption text-ink-faded/50 mr-1">
                {t('login.noAccount', 'New to VICOO?')}
              </span>
              <Link
                to="/register"
                className="font-body text-caption text-rust hover:text-ink transition-colors font-medium"
                onMouseEnter={() => setAmbientMode('action')}
              >
                {t('login.register')}
              </Link>
            </p>
          </form>
        </motion.div>

        <AnimatePresence>
          {showTestAccounts && (
            <TestAccountsPanel
              onSelect={handleSelectTestAccount}
              onClose={() => setShowTestAccounts(false)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
