import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import SectionContainer from '@/components/layout/SectionContainer';
import { FLOW_STEP_KEYS } from './types';

const FLOW_ICONS = [
  'M12 4.5v15m7.5-7.5h-15',         // submit
  'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z', // review
  'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z', // sort
  'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z', // list
  'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z', // purchase
  'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182', // close loop
];

function Connector() {
  return (
    <div className="hidden lg:flex items-center mx-1 mt-6">
      <svg width="24" height="10" viewBox="0 0 24 10" className="text-warm-gray/40 flex-shrink-0">
        <line x1="0" y1="5" x2="16" y2="5" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
        <polygon points="16,2 24,5 16,8" fill="currentColor" />
      </svg>
    </div>
  );
}

export default function DonateFlow() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  const steps = useMemo(
    () => FLOW_STEP_KEYS.map((key, i) => ({
      label: t(key, key),
      icon: FLOW_ICONS[i],
    })),
    [t],
  );

  return (
    <SectionContainer decorativeDivider>
      <p className="font-body text-overline text-sepia-mid tracking-[0.15em] uppercase text-center mb-10 md:mb-14">
        {t('donateClothing.flowTitle', 'Circular Workflow')}
      </p>

      {/* Mobile: 2-col grid | Desktop: flex row with connectors */}
      <div className="grid grid-cols-2 gap-6 md:gap-4 lg:hidden">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, ease: [0, 0, 0.2, 1], delay: i * 0.1 }}
            className="flex flex-col items-center text-center"
          >
            <div className="relative mb-3">
              <div className="w-14 h-14 rounded-full border-2 border-rust/30 flex items-center justify-center bg-paper">
                <svg className="w-6 h-6 text-rust" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={step.icon} />
                </svg>
              </div>
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rust text-paper font-body text-[10px] flex items-center justify-center font-medium">
                {i + 1}
              </span>
            </div>
            <span className="font-body text-caption text-ink leading-snug">{step.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Desktop: flex with inline connectors */}
      <div className="hidden lg:flex justify-center items-start">
        {steps.map((step, i) => (
          <div key={i} className="contents">
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, ease: [0, 0, 0.2, 1], delay: i * 0.1 }}
              className="flex flex-col items-center text-center"
              style={{ minWidth: 96 }}
            >
              <div className="relative mb-3">
                <div className="w-14 h-14 rounded-full border-2 border-rust/30 flex items-center justify-center bg-paper">
                  <svg className="w-6 h-6 text-rust" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={step.icon} />
                  </svg>
                </div>
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rust text-paper font-body text-[10px] flex items-center justify-center font-medium">
                  {i + 1}
                </span>
              </div>
              <span className="font-body text-caption text-ink leading-snug">{step.label}</span>
            </motion.div>
            {i < steps.length - 1 && <Connector />}
          </div>
        ))}
      </div>
    </SectionContainer>
  );
}
