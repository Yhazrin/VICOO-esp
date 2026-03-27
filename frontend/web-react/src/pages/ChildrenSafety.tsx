import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import GrainOverlay from '@/components/editorial/GrainOverlay';
import { MagazineDivider } from '@/components/editorial/MagazineDivider';

const SECTIONS = [
  {
    key: 'commitment',
    title: 'Our Commitment',
    body: 'VICOO (Tonghua Public Welfare) is dedicated to creating a safe, nurturing environment where children can express themselves through art. We recognize that children are uniquely vulnerable and require the highest standards of protection. Every program we operate, every workshop we run, and every piece of data we collect is governed by our unwavering commitment to child safety and privacy. We comply fully with China\'s Personal Information Protection Law (PIPL), the Children\'s Online Privacy Protection principles, and GDPR for international visitors.',
  },
  {
    key: 'collection',
    title: 'Information We Collect',
    body: 'We collect only the minimum information necessary to operate our programs safely. This may include the child\'s first name (or a pseudonym), age, school name, and artwork submissions. We never collect government-issued identification numbers, precise location data, or biometric information from children. All collection is done with explicit parental or guardian consent obtained before the child participates in any program. Artwork images are only published with documented consent from both the child and their guardian.',
  },
  {
    key: 'parentalConsent',
    title: 'Parental Consent Process',
    body: 'Before any child under 14 participates in our programs, we require verifiable parental consent. This process includes: (1) A written consent form signed by the parent or legal guardian, (2) Verification of the guardian\'s identity through our partner schools, (3) A clear explanation of what data will be collected and how it will be used, (4) The right to withdraw consent at any time, which will result in the immediate deletion of the child\'s data and removal of any published artwork. For children aged 14-18, we require both the child\'s and a guardian\'s consent.',
  },
  {
    key: 'dataUse',
    title: 'How We Use Children\'s Information',
    body: 'Children\'s information is used exclusively for program purposes: displaying artwork in our gallery (with consent), organizing workshops, tracking program participation, and generating anonymized impact statistics. We never use children\'s information for marketing, advertising, or commercial purposes. Any public display of artwork uses only the child\'s first name or a chosen pseudonym — never full names or identifying details. Aggregate statistics (e.g., "2,847 children participated") contain no individual identifying information.',
  },
  {
    key: 'storage',
    title: 'Data Storage and Retention',
    body: 'All children\'s data is encrypted at rest using AES-256-GCM and in transit using TLS 1.3. Data is stored on servers located in mainland China, with access restricted to authorized personnel who have undergone background checks and child protection training. We retain children\'s data only for as long as necessary to fulfill the purpose for which it was collected, or as required by law. Upon program completion or consent withdrawal, personal data is securely deleted within 30 days. Anonymized artwork images may be retained for archival purposes with separate consent.',
  },
  {
    key: 'thirdParty',
    title: 'Third-Party Sharing',
    body: 'We do not sell, rent, or trade children\'s personal information to any third party. We share data only with: (1) Partner schools, strictly for program coordination and safety purposes, (2) Accredited auditors conducting program evaluation using anonymized data only, (3) Law enforcement when required by law, with appropriate legal process. All third-party partners are contractually bound by our child protection standards and undergo regular compliance audits.',
  },
  {
    key: 'rights',
    title: 'Rights of Children and Guardians',
    body: 'Parents and guardians have the right to: (1) Access all data we hold about their child, (2) Correct any inaccurate information, (3) Request deletion of their child\'s data and removal of published artwork, (4) Withdraw consent at any time without penalty, (5) Receive a clear explanation of our data practices in plain language. Children themselves have the right to be heard and to participate in decisions about their data in an age-appropriate manner. All requests are handled within 5 business days.',
  },
  {
    key: 'contact',
    title: 'Contact Us',
    body: 'If you have any questions or concerns about how we protect children\'s information, please contact our Child Protection Officer at children@vicoo.org, or write to us at: VICOO Child Protection Office, Tonghua Public Welfare Foundation, Shanghai, China. We aim to respond to all inquiries within 3 business days. If you believe a child\'s safety or privacy has been compromised, please contact us immediately — we treat such reports with the highest urgency.',
  },
];

export default function ChildrenSafety() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  return (
    <PageWrapper>
      <PaperTextureBackground variant="paper" className="section-spacing relative">
        <GrainOverlay />

        {/* Decorative vertical line */}
        <div className="absolute left-6 top-1/4 bottom-1/4 w-px bg-rust/15 hidden md:block" aria-hidden="true" />

        <SectionContainer narrow>
          <motion.div
            {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } })}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            {/* Corner accents */}
            <div className="absolute -top-4 -left-4 w-6 h-6 border-t-2 border-l-2 border-rust/25 pointer-events-none" aria-hidden="true" />
            <div className="absolute -top-4 -right-4 w-6 h-6 border-t-2 border-r-2 border-rust/25 pointer-events-none" aria-hidden="true" />

            <p className="font-body text-overline tracking-[0.3em] uppercase text-sepia-mid mb-4">
              {t('legal.children.overline', { defaultValue: 'Legal' })}
            </p>
            <h1 className="font-display text-h1 font-bold text-ink leading-tight mb-4">
              {t('legal.children.title', { defaultValue: "Children's Safety" })}
            </h1>
            <p className="font-body text-sm text-ink-faded leading-[1.8] max-w-[65ch] mb-4">
              {t('legal.children.intro', { defaultValue: 'Tonghua is committed to protecting the privacy and safety of every child who participates in our programs. This policy outlines how we collect, use, and safeguard children\'s personal information in compliance with applicable laws and regulations.' })}
            </p>
            <p className="font-body text-xs text-sepia-mid tracking-wide mb-12">
              {t('legal.children.lastUpdated', { defaultValue: 'Last updated: March 2026' })}
            </p>
          </motion.div>

          <div className="space-y-12">
            {SECTIONS.map((section, i) => (
              <div key={section.key}>
                <motion.section
                  {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 } })}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.04 }}
                >
                  <NumberedSectionHeading
                    number={String(i + 1).padStart(2, '0')}
                    title={t(`legal.children.sections.${section.key}.title`, { defaultValue: section.title })}
                  />
                  <p className="font-body text-sm text-ink-faded leading-[1.8] max-w-[65ch]">
                    {t(`legal.children.sections.${section.key}.body`, { defaultValue: section.body })}
                  </p>
                </motion.section>
                {i < SECTIONS.length - 1 && (
                  <MagazineDivider variant="simple" className="!my-10" />
                )}
              </div>
            ))}
          </div>
        </SectionContainer>
      </PaperTextureBackground>

      <div className="editorial-divider" aria-hidden="true" />
    </PageWrapper>
  );
}
