import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';

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
  {
    title: 'RECYCLED MATERIALS',
    body: 'Using recycled polyester, nylon, and cotton across core product lines to reduce environmental impact.',
  },
  {
    title: 'ZERO WASTE',
    body: 'Working toward zero waste in production and distribution by 2030 through circular design principles.',
  },
  {
    title: 'FAIR LABOUR',
    body: 'Regular audits and transparent reporting across all manufacturing partners in Asia.',
  },
  {
    title: 'COMMUNITY',
    body: 'Clothing donation programs and disaster relief support in communities worldwide.',
  },
];

export default function About() {
  return (
    <PageWrapper>
      {/* ── Hero ── */}
      <section className="bg-white">
        <SectionContainer>
          <div className="max-w-3xl mx-auto text-center py-16 md:py-24">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-sans text-3xl md:text-5xl font-bold tracking-tight"
              style={{ color: '#1A1A1A' }}
            >
              ABOUT UNIQLO
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6 font-sans text-sm md:text-base leading-relaxed"
              style={{ color: '#666' }}
            >
              We create clothing with a simple philosophy: make high-quality, functional, and affordable
              basics that everyone can wear. LifeWear is clothing designed to make your life better —
              simple in appearance, but rich in detail, thought, and craftsmanship.
            </motion.p>
          </div>
        </SectionContainer>
      </section>

      {/* ── Brand Story ── */}
      <section className="bg-gray-50 py-16 md:py-24">
        <SectionContainer>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div>
              <h2 className="font-sans text-2xl md:text-3xl font-bold tracking-tight mb-6" style={{ color: '#1A1A1A' }}>
                THE MAKING OF LIFEWEAR
              </h2>
              <p className="font-sans text-sm leading-[1.9]" style={{ color: '#555' }}>
                LifeWear is based on the Japanese values of simplicity, quality, and longevity.
                We continuously innovate to bring more warmth, more lightness, better design,
                and greater comfort to people&apos;s lives. Our clothing is made for everyone —
                every body, every age, every style.
              </p>
              <p className="font-sans text-sm leading-[1.9] mt-4" style={{ color: '#555' }}>
                We believe that truly great clothes are not about luxury — they are about
                making everyday life better. Each piece is thoughtfully designed, rigorously tested,
                and refined season after season.
              </p>
            </div>
            <div className="aspect-[4/3] bg-gray-200 flex items-center justify-center">
              <span className="font-sans text-xs" style={{ color: '#aaa' }}>Brand Image</span>
            </div>
          </div>
        </SectionContainer>
      </section>

      {/* ── Timeline ── */}
      <section className="bg-white py-16 md:py-24">
        <SectionContainer>
          <h2 className="font-sans text-2xl md:text-3xl font-bold tracking-tight mb-12 text-center" style={{ color: '#1A1A1A' }}>
            OUR HISTORY
          </h2>
          <div className="max-w-2xl mx-auto">
            {TIMELINE.map((item, i) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="flex gap-6 md:gap-10 pb-8 border-l border-gray-200 pl-6 md:pl-10 relative last:border-l-0"
              >
                <div className="absolute left-0 top-1 w-2 h-2 rounded-full bg-gray-300 -translate-x-[5px]" />
                <span className="font-sans text-xs font-bold tracking-widest shrink-0 w-12" style={{ color: '#999' }}>
                  {item.year}
                </span>
                <p className="font-sans text-sm" style={{ color: '#444' }}>{item.text}</p>
              </motion.div>
            ))}
          </div>
        </SectionContainer>
      </section>

      {/* ── Sustainability ── */}
      <section className="bg-gray-50 py-16 md:py-24">
        <SectionContainer>
          <h2 className="font-sans text-2xl md:text-3xl font-bold tracking-tight mb-4 text-center" style={{ color: '#1A1A1A' }}>
            SUSTAINABILITY
          </h2>
          <p className="font-sans text-sm text-center mb-12" style={{ color: '#888' }}>
            Making good clothes for a better world.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {COMMITMENTS.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <h3 className="font-sans text-xs font-bold tracking-widest mb-3" style={{ color: '#1A1A1A' }}>
                  {item.title}
                </h3>
                <p className="font-sans text-sm leading-relaxed" style={{ color: '#666' }}>
                  {item.body}
                </p>
              </motion.div>
            ))}
          </div>
        </SectionContainer>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 md:py-24 bg-white text-center">
        <SectionContainer>
          <h2 className="font-sans text-2xl md:text-3xl font-bold tracking-tight mb-6" style={{ color: '#1A1A1A' }}>
            JOIN US
          </h2>
          <p className="font-sans text-sm mb-8" style={{ color: '#666' }}>
            Discover our latest collections and learn how we&apos;re building a more sustainable future.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/shop"
              className="inline-block px-10 py-3 font-sans text-xs font-semibold tracking-widest uppercase text-white"
              style={{ background: '#FF0000' }}
            >
              Shop Now
            </Link>
            <Link
              to="/contact"
              className="inline-block px-10 py-3 font-sans text-xs font-semibold tracking-widest uppercase border"
              style={{ borderColor: '#1A1A1A', color: '#1A1A1A' }}
            >
              Contact
            </Link>
          </div>
        </SectionContainer>
      </section>
    </PageWrapper>
  );
}
