import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import { MagazineDivider } from '@/components/editorial/MagazineDivider';

const TIMELINE = [
  { year: '1949', text: 'Founded as Ogori Shoji in Ube, Yamaguchi, Japan.' },
  { year: '1984', text: 'First UNIQLO store opens in Hiroshima. "Unique Clothing Warehouse" is born.' },
  { year: '1998', text: 'Fleece boom — 26 million pieces sold in one year.' },
  { year: '2001', text: 'First overseas store in London. Global expansion begins.' },
  { year: '2009', text: 'Launch of +J with Jil Sander — high fashion meets everyday wear.' },
  { year: '2013', text: 'UNIQLO opens its 1,000th store globally.' },
  { year: '2020', text: 'RE.UNIQLO recycling initiative launched worldwide.' },
  { year: '2024', text: 'LifeWear sustainability commitment — 50% recycled materials by 2030.' },
];

const COMMITMENTS = [
  { title: 'Recycled Materials', body: 'Using recycled polyester, nylon, and cotton across core product lines to reduce environmental impact.' },
  { title: 'Zero Waste', body: 'Working toward zero waste in production and distribution by 2030 through circular design principles.' },
  { title: 'Fair Labour', body: 'Regular audits and transparent reporting across all manufacturing partners in Asia.' },
  { title: 'Community', body: 'Clothing donation programs and disaster relief support in communities worldwide.' },
];

export default function About() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <PageWrapper>
      {/* Compact header */}
      <SectionContainer noTopSpacing>
        <div className="pt-12 md:pt-16 pb-6">
          <motion.h1
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
            className="font-display text-h2 md:text-h1 text-ink mb-2"
          >
            About UNIQLO
          </motion.h1>
          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0, 0, 0.2, 1], delay: 0.08 }}
            className="font-body text-body text-ink-faded max-w-2xl"
          >
            We create clothing with a simple philosophy: make high-quality, functional, and affordable
            basics that everyone can wear. LifeWear is clothing designed to make your life better.
          </motion.p>
        </div>
      </SectionContainer>

      {/* Brand Story */}
      <SectionContainer decorativeDivider>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
          <div className="md:col-span-7">
            <h2 className="font-display text-h2 text-ink mb-4">
              The Making of LifeWear
            </h2>
            <p className="font-body text-body text-ink-faded leading-relaxed mb-4">
              LifeWear is based on the Japanese values of simplicity, quality, and longevity.
              We continuously innovate to bring more warmth, more lightness, better design,
              and greater comfort to people&apos;s lives. Our clothing is made for everyone —
              every body, every age, every style.
            </p>
            <p className="font-body text-body text-ink-faded leading-relaxed">
              We believe that truly great clothes are not about luxury — they are about
              making everyday life better. Each piece is thoughtfully designed, rigorously tested,
              and refined season after season.
            </p>
          </div>
          <div className="md:col-span-5 aspect-[4/3] bg-warm-gray/10 border border-warm-gray/20 rounded-xl flex items-center justify-center">
            <span className="font-body text-caption text-sepia-mid">Brand Image</span>
          </div>
        </div>
      </SectionContainer>

      <MagazineDivider variant="decorative" />

      {/* Timeline */}
      <SectionContainer className="section-spacing">
        <h2 className="font-display text-h2 text-ink mb-10 text-center">
          Our History
        </h2>
        <div className="max-w-2xl mx-auto">
          {TIMELINE.map((item, i) => (
            <motion.div
              key={item.year}
              initial={prefersReducedMotion ? false : { opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="flex gap-6 md:gap-10 pb-8 border-l border-warm-gray/30 pl-6 md:pl-10 relative last:border-l-0"
            >
              <div className="absolute left-0 top-1 w-2 h-2 rounded-full bg-rust/60 -translate-x-[5px]" />
              <span className="font-body text-overline text-sepia-mid tracking-[0.15em] shrink-0 w-14">
                {item.year}
              </span>
              <p className="font-body text-body-sm text-ink">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </SectionContainer>

      <MagazineDivider variant="decorative" />

      {/* Sustainability */}
      <section className="bg-aged-stock/30 py-16 md:py-24 relative">
        <SectionContainer>
          <h2 className="font-display text-h2 text-ink mb-2 text-center">
            Sustainability
          </h2>
          <p className="font-body text-body text-ink-faded text-center mb-10">
            Making good clothes for a better world.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {COMMITMENTS.map((item, i) => (
              <motion.div
                key={item.title}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="rounded-xl border border-warm-gray/20 bg-paper/80 p-6"
              >
                <h3 className="font-body text-overline text-rust tracking-[0.15em] uppercase mb-3">
                  {item.title}
                </h3>
                <p className="font-body text-body-sm text-ink-faded leading-relaxed">
                  {item.body}
                </p>
              </motion.div>
            ))}
          </div>
        </SectionContainer>
      </section>

      <MagazineDivider variant="decorative" />

      {/* CTA */}
      <section className="bg-ink text-paper py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")' }} />
        <SectionContainer>
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="font-display text-h2 text-paper mb-4">
              Join Us
            </h2>
            <p className="font-body text-body-sm text-paper/60 mb-8">
              Discover our latest collections and learn how we&apos;re building a more sustainable future.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 font-body text-caption tracking-[0.15em] uppercase text-ink bg-paper px-8 py-3 rounded-full hover:bg-paper/90 transition-colors"
              >
                Shop Now
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 font-body text-caption tracking-[0.15em] uppercase text-paper border border-paper/30 px-8 py-3 rounded-full hover:bg-paper/10 transition-colors"
              >
                Contact
              </Link>
            </div>
          </motion.div>
        </SectionContainer>
      </section>

      <div className="editorial-divider" />
    </PageWrapper>
  );
}
