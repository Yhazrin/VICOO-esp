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
    key: 'overview',
    title: 'Overview',
    body: 'VICOO ("we," "us," or "our") operates the website vicoo.org and related services including donations, product purchases, and art program participation. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services. By accessing our website, you agree to the collection and use of information in accordance with this policy. We are committed to transparency and to protecting your personal data in compliance with China\'s Personal Information Protection Law (PIPL), the Cybersecurity Law, and the EU General Data Protection Regulation (GDPR) for international visitors.',
  },
  {
    key: 'collection',
    title: 'Information We Collect',
    body: 'We collect information you provide directly, including: (1) Account information — name, email address, phone number, and password when you register; (2) Donation information — donor name, donation amount, payment method, and optional messages; (3) Order information — shipping address, billing details, and order history; (4) Communication data — messages sent through our contact form or email; (5) Children\'s participation data — collected only with parental consent (see Children\'s Safety Policy). We also collect certain information automatically, including IP address, browser type, device information, and pages visited, using cookies and similar technologies.',
  },
  {
    key: 'usage',
    title: 'How We Use Your Information',
    body: 'We use collected information to: (1) Process donations and issue donation receipts or certificates; (2) Fulfill product orders and manage shipping; (3) Communicate with you about programs, campaigns, and impact reports; (4) Maintain and improve our website and services; (5) Comply with legal obligations, including tax reporting for donations; (6) Generate anonymized, aggregate statistics for impact reporting. We never sell your personal data to third parties. We do not use your information for automated decision-making or profiling that produces legal effects.',
  },
  {
    key: 'sharing',
    title: 'Information Sharing and Disclosure',
    body: 'We share your information only in the following circumstances: (1) Payment processors (WeChat Pay, Alipay, Stripe, PayPal) — strictly for transaction processing; (2) Shipping partners — only the delivery information necessary to fulfill your order; (3) Partner schools and organizations — limited to program participation data with appropriate safeguards; (4) Legal compliance — when required by law, regulation, or valid legal process; (5) With your consent — for any other purpose you specifically authorize. All third-party service providers are contractually bound to protect your data and may only process it for the purposes we specify.',
  },
  {
    key: 'children',
    title: "Children's Privacy",
    body: 'Protecting children\'s privacy is our highest priority. For detailed information about how we handle children\'s data, please see our Children\'s Safety Policy. In summary: we collect children\'s information only with verifiable parental consent, we collect only the minimum necessary data, we never use children\'s data for marketing, and parents may request access, correction, or deletion of their child\'s data at any time. If you believe we have collected information from a child without appropriate consent, please contact us immediately.',
  },
  {
    key: 'cookies',
    title: 'Cookies and Tracking',
    body: 'We use essential cookies to operate our website, including session cookies for authentication and security cookies for request signing. We do not use advertising or tracking cookies. Our analytics are limited to privacy-respecting, aggregate page view counts. You can control cookie preferences through your browser settings, though disabling essential cookies may prevent certain features from functioning. We do not respond to "Do Not Track" signals, as we do not engage in cross-site tracking.',
  },
  {
    key: 'security',
    title: 'Data Security',
    body: 'We implement industry-standard security measures to protect your data: (1) AES-256-GCM encryption for sensitive data at rest; (2) TLS 1.3 encryption for all data in transit; (3) HMAC-SHA256 request signing to prevent tampering; (4) JWT-based authentication with short-lived access tokens; (5) Role-based access control limiting internal data access; (6) Regular security audits and penetration testing. While we strive to protect your information, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.',
  },
  {
    key: 'rights',
    title: 'Your Rights',
    body: 'Under applicable data protection laws, you have the right to: (1) Access the personal data we hold about you; (2) Correct inaccurate or incomplete data; (3) Request deletion of your data ("right to be forgotten"); (4) Restrict or object to certain processing; (5) Data portability — receive your data in a structured, machine-readable format; (6) Withdraw consent at any time for processing based on consent. To exercise these rights, contact us at privacy@vicoo.org. We will respond within 15 business days. For donations, certain data may be retained for legal compliance (e.g., tax records) even after a deletion request.',
  },
  {
    key: 'contact',
    title: 'Contact Us',
    body: 'For privacy-related questions, data requests, or complaints, contact our Data Protection Officer at: Email: privacy@vicoo.org. Address: VICOO Data Protection Office, Tonghua Public Welfare Foundation, Shanghai, China. If you are not satisfied with our response, you have the right to lodge a complaint with the relevant data protection authority. For urgent matters related to children\'s safety or data breaches, please use the subject line "URGENT" in your email for priority handling.',
  },
];

export default function Privacy() {
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
              {t('legal.privacy.overline', { defaultValue: 'Legal' })}
            </p>
            <h1 className="font-display text-h1 font-bold text-ink leading-tight mb-4">
              {t('legal.privacy.title', { defaultValue: 'Privacy Policy' })}
            </h1>
            <p className="font-body text-sm text-ink-faded leading-[1.8] max-w-[65ch] mb-4">
              {t('legal.privacy.intro', { defaultValue: 'Your privacy matters to us. This policy explains how VICOO collects, uses, and protects your personal information when you visit our website, make donations, or participate in our programs.' })}
            </p>
            <p className="font-body text-xs text-sepia-mid tracking-wide mb-12">
              {t('legal.privacy.lastUpdated', { defaultValue: 'Last updated: March 2026' })}
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
                    title={t(`legal.privacy.sections.${section.key}.title`, { defaultValue: section.title })}
                  />
                  <p className="font-body text-sm text-ink-faded leading-[1.8] max-w-[65ch]">
                    {t(`legal.privacy.sections.${section.key}.body`, { defaultValue: section.body })}
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
