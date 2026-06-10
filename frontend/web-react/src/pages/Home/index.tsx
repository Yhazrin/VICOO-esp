import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import ScrollNarrative from '@/components/scroll/ScrollNarrative';
import GlobeSection from '@/components/scroll/GlobeSection';
import Planar3DScene from '@/components/scroll/Planar3DScene';
import MagneticButton from '@/components/animations/MagneticButton';
import { KineticTextMarquee } from '@/components/animations/KineticMarquee';
import { useUIStore } from '@/stores/uiStore';

/* ─── Home Page ─── */

export default function Home() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const impactMode = useUIStore((s) => s.impactMode);
  /** 与 SupplyChainGlobe 错开第二套 WebGL，减轻公益首页进页主线程长任务 */
  const [showPlanar, setShowPlanar] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setShowPlanar(true), 300);
    return () => clearTimeout(id);
  }, []);
  const { scrollYProgress } = useScroll();

  // CTA section scroll-driven animations — headline fades up first
  const headlineOpacity = useTransform(
    scrollYProgress,
    [0.38, 0.48],
    prefersReducedMotion ? [1, 1] : [0, 1]
  );
  const headlineY = useTransform(
    scrollYProgress,
    [0.38, 0.48],
    prefersReducedMotion ? [0, 0] : [30, 0]
  );

  // Description fades up second
  const descOpacity = useTransform(
    scrollYProgress,
    [0.42, 0.52],
    prefersReducedMotion ? [1, 1] : [0, 1]
  );
  const descY = useTransform(
    scrollYProgress,
    [0.42, 0.52],
    prefersReducedMotion ? [0, 0] : [25, 0]
  );

  // Donate button scales in with spring
  const donateOpacity = useTransform(
    scrollYProgress,
    [0.46, 0.56],
    prefersReducedMotion ? [1, 1] : [0, 1]
  );
  const donateScale = useTransform(
    scrollYProgress,
    [0.46, 0.56],
    prefersReducedMotion ? [1, 1] : [0.8, 1]
  );

  // Shop button scales in slightly later
  const shopOpacity = useTransform(
    scrollYProgress,
    [0.50, 0.60],
    prefersReducedMotion ? [1, 1] : [0, 1]
  );
  const shopScale = useTransform(
    scrollYProgress,
    [0.50, 0.60],
    prefersReducedMotion ? [1, 1] : [0.8, 1]
  );

  return (
    <PageWrapper>
      {/* 3D Planar Scene -- slightly delayed mount to avoid competing with the homepage globe for GPU/main thread */}
      {showPlanar && <Planar3DScene />}

      {/* Globe — supply chain traceability hero */}
      <GlobeSection />

      {/* Scroll-driven narrative */}
      <ScrollNarrative />

      {/* Call to Action — 优衣库首页；公益模式已在首屏 Hero 提供 CTA */}
      {!impactMode && (
        <section className="bg-ink text-paper section-spacing">
          <SectionContainer>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <motion.div style={{ opacity: headlineOpacity, y: headlineY }}>
                <h2 className="font-display text-h2 md:text-h1 font-bold leading-[0.95] mb-6">
                  {t('home.cta.title')}
                </h2>
              </motion.div>

              <motion.div
                style={{ opacity: descOpacity, y: descY }}
                className="md:col-start-2 md:row-start-1"
              >
                <p className="font-body text-body-sm text-warm-gray leading-relaxed max-w-md">
                  {t('home.cta.description')}
                </p>
              </motion.div>
              <div className="flex flex-col gap-4 md:items-end md:col-start-2">
                <motion.div style={{ opacity: donateOpacity, scale: donateScale }}>
                  <MagneticButton strength={0.35}>
                    <Link
                      to="/donate"
                      className="inline-block font-body text-body-sm tracking-[0.15em] uppercase bg-rust text-paper px-8 py-4 cursor-pointer hover:bg-pale-gold hover:text-ink transition-all duration-300"
                    >
                      {t('home.cta.donate')}
                    </Link>
                  </MagneticButton>
                </motion.div>
                <motion.div style={{ opacity: shopOpacity, scale: shopScale }}>
                  <MagneticButton strength={0.35}>
                    <Link
                      to="/shop"
                      className="inline-block font-body text-body-sm tracking-[0.15em] uppercase border border-sage/40 text-paper px-8 py-4 cursor-pointer hover:border-sage hover:text-sage-pale transition-all duration-300"
                    >
                      {t('home.cta.shop')}
                    </Link>
                  </MagneticButton>
                </motion.div>
              </div>
            </div>
          </SectionContainer>
        </section>
      )}

      {/* Editorial Marquee — continuous motion strip */}
      <KineticTextMarquee
        items={[
          t('home.marquee.sustainableFashion', 'Welfare Action'),
          t('home.marquee.childrenArt', "Children's Art"),
          t('home.marquee.traceableImpact', 'Traceable Impact'),
          t('home.marquee.community', 'Community'),
        ]}
        speed={0.6}
        className="border-y border-warm-gray/30"
      />
    </PageWrapper>
  );
}
