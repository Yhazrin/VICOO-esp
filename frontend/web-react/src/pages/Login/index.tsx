import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import { VintageInput } from '@/components/editorial/VintageInput';
import GrainOverlay from '@/components/editorial/GrainOverlay';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import BleedTitleBlock from '@/components/editorial/BleedTitleBlock';
import { OrigamiFoldAccent } from '@/components/animations/OrigamiFold';
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { login, isLoggingIn, loginError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    <PageWrapper className="bg-paper overflow-hidden">
      <div className="flex flex-col lg:flex-row min-h-[100dvh] relative">
        {/* Editorial Content Side (Left on Desktop) */}
        <div className="flex-[1.2] relative bg-aged-stock border-r-0 lg:border-r-2 border-ink flex flex-col justify-between p-8 md:p-12 lg:p-16 overflow-hidden">
          <GrainOverlay opacity={0.05} />
          
          {/* Magazine Metadata Header */}
          <motion.div 
            initial={prefersReducedMotion ? false : { opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0, 0, 0.2, 1] }}
            className="flex justify-between items-center border-b border-warm-gray pb-4 mb-12 relative z-10"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-sepia-mid">
              Vol. 1 — Issue 01 / March 2026
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-sepia-mid hidden md:block">
              International Publication
            </div>
          </motion.div>

          {/* Large Hero Section */}
          <div className="relative z-10">
            <BleedTitleBlock className="mb-8">
              <span className="text-rust italic font-light opacity-80 block mb-2 text-2xl md:text-3xl lg:text-4xl">
                The Story of
              </span>
              <span className="text-ink uppercase">Handmade</span>
              <br />
              <span className="text-archive-brown">Futures</span>
            </BleedTitleBlock>

            <div className="max-w-xl mb-12">
              <SepiaImageFrame
                src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=1000"
                alt="Children's artwork"
                aspectRatio="landscape"
                className="shadow-xl rotate-[-1deg]"
                caption="Spring Collection 2026 — Featured Artist: Anonymous, Age 9"
              />
            </div>

            <motion.p 
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="font-body text-lg text-ink-faded leading-relaxed max-w-md hidden lg:block"
            >
              "Every brushstroke is a silent dialogue between a child's dream and the world we choose to build for them."
            </motion.p>
          </div>

          {/* Footer Metadata */}
          <div className="mt-12 flex justify-between items-end relative z-10">
            <div className="font-mono text-[10px] text-sepia-mid space-y-1">
              <div>AUTH_LAYER: CLD_SECURE_01</div>
              <div>LOC: 31.2304° N, 121.4737° E</div>
            </div>
            {/* <div className="font-display text-4xl text-ink/20 select-none hidden lg:block">
              VICOO
            </div> */}
          </div>
          
          <OrigamiFoldAccent position="top-left" size="lg" intensity="subtle" />
        </div>

        {/* Login Form Side (Right on Desktop) */}
        <PaperTextureBackground 
          variant="paper" 
          className="flex-1 flex items-center justify-center p-8 md:p-12 lg:p-24 relative"
        >
          <GrainOverlay opacity={0.03} />
          
          <div className="w-full max-w-sm relative z-10">
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0, 0, 0.2, 1] }}
            >
              <div className="mb-12">
                <h2 className="font-display text-4xl md:text-5xl text-ink mb-4 italic leading-tight">
                  Welcome Back.
                </h2>
                <p className="font-body text-ink-faded opacity-80">
                  Please identify yourself to continue the journey.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <VintageInput
                  label={t('login.email')}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@email.com"
                />

                <VintageInput
                  label={t('login.password')}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-sepia-mid hover:text-rust transition-colors flex items-center"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  }
                />

                <div className="flex items-center justify-between pt-2">
                  <label htmlFor="remember-me" className="flex items-center gap-2 cursor-pointer group">
                    <input
                      id="remember-me"
                      type="checkbox"
                      className="w-4 h-4 accent-rust border-warm-gray/50 rounded-none cursor-pointer"
                    />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-sepia-mid group-hover:text-ink transition-colors">
                      {t('login.rememberMe')}
                    </span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="font-mono text-[10px] uppercase tracking-wider text-rust hover:text-ink transition-colors"
                  >
                    {t('login.forgotPassword')}
                  </Link>
                </div>

                {loginError && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    role="alert" 
                    className="font-body text-xs text-rust border-l-2 border-rust pl-4 py-1"
                  >
                    {loginError}
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  disabled={isLoggingIn}
                  whileHover={prefersReducedMotion ? undefined : { y: -2, boxShadow: '0 10px 20px -5px rgba(26, 26, 22, 0.2)' }}
                  whileTap={prefersReducedMotion ? undefined : { y: 0 }}
                  className="w-full bg-ink text-paper py-5 px-8 font-mono text-xs uppercase tracking-[0.3em] font-bold hover:bg-rust transition-all duration-500 disabled:opacity-50 relative overflow-hidden group"
                >
                  <span className="relative z-10">
                    {isLoggingIn ? t('login.submitting') : t('login.submit')}
                  </span>
                  <div className="absolute inset-0 bg-rust translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-editorial" />
                </motion.button>

                {/* Social Dividers */}
                <div className="relative pt-8 pb-4">
                  <div className="absolute inset-0 flex items-center px-4">
                    <div className="w-full border-t border-warm-gray/30" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 bg-paper font-mono text-[10px] uppercase tracking-widest text-sepia-mid">
                      {t('login.orContinueWith')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => window.location.href = '/api/v1/auth/github'}
                    className="flex items-center justify-center gap-3 font-mono text-[10px] uppercase tracking-widest border border-warm-gray/40 text-ink py-4 hover:border-ink hover:bg-aged-stock transition-all duration-300"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </button>

                  <button
                    type="button"
                    onClick={() => window.location.href = '/api/v1/auth/google'}
                    className="flex items-center justify-center gap-3 font-mono text-[10px] uppercase tracking-widest border border-warm-gray/40 text-ink py-4 hover:border-ink hover:bg-aged-stock transition-all duration-300"
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

                <p className="text-center pt-8 border-t border-warm-gray/20">
                  <span className="font-body text-[10px] text-ink-faded uppercase tracking-widest mr-2">New to the story?</span>
                  <Link
                    to="/register"
                    className="font-mono text-[10px] text-rust hover:text-ink transition-colors uppercase tracking-[0.2em] font-bold"
                  >
                    {t('login.register')}
                  </Link>
                </p>
              </form>
            </motion.div>
          </div>
          
          <OrigamiFoldAccent position="bottom-right" size="lg" intensity="subtle" />
        </PaperTextureBackground>
      </div>
    </PageWrapper>
  );
}
