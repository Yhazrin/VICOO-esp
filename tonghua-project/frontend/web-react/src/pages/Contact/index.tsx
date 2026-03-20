import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import EditorialHero from '@/components/editorial/EditorialHero';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import { VintageInput } from '@/components/editorial/VintageInput';

export default function Contact() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    // API call would go here
    setTimeout(() => {
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1500);
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <PageWrapper>
      <EditorialHero
        number="08"
        title={t('contact.hero.title')}
        subtitle={t('contact.hero.subtitle')}
        hideHero={true}
      />

      <SectionContainer noTopSpacing>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
          {/* Form */}
          <div className="md:col-span-7">
            <NumberedSectionHeading number="01" title="Write to Us" />

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <VintageInput
                  label={t('contact.form.name')}
                  type="text"
                  value={formData.name}
                  onChange={handleChange('name')}
                  required
                />
                <VintageInput
                  label={t('contact.form.email')}
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  required
                />
              </div>

              <VintageInput
                label={t('contact.form.subject')}
                type="text"
                value={formData.subject}
                onChange={handleChange('subject')}
                required
              />

              <VintageInput
                label={t('contact.form.message')}
                type="textarea"
                value={formData.message}
                onChange={handleChange('message')}
                required
              />

              <motion.button
                type="submit"
                disabled={status === 'sending'}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="font-body text-sm tracking-[0.15em] uppercase bg-ink text-paper px-10 py-4 hover:bg-rust transition-colors duration-300 disabled:opacity-50"
              >
                {status === 'sending'
                  ? t('contact.form.sending')
                  : t('contact.form.submit')
                }
              </motion.button>

              {status === 'success' && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-body text-sm text-rust"
                >
                  {t('contact.form.success')}
                </motion.p>
              )}

              {status === 'error' && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-body text-sm text-archive-brown"
                >
                  {t('contact.form.error')}
                </motion.p>
              )}
            </form>
          </div>

          {/* Contact info */}
          <div className="md:col-span-5">
            <NumberedSectionHeading number="02" title={t('contact.info.title')} />

            <div className="space-y-8">
              <div>
                <span className="font-body text-caption text-sepia-mid tracking-[0.2em] uppercase">
                  Email
                </span>
                <a
                  href={`mailto:${t('contact.info.email')}`}
                  className="block font-display text-xl font-semibold text-ink mt-2 hover:text-rust transition-colors"
                >
                  {t('contact.info.email')}
                </a>
              </div>

              <div>
                <span className="font-body text-caption text-sepia-mid tracking-[0.2em] uppercase">
                  WeChat
                </span>
                <p className="font-display text-xl font-semibold text-ink mt-2">
                  {t('contact.info.wechat')}
                </p>
              </div>

              <div>
                <span className="font-body text-caption text-sepia-mid tracking-[0.2em] uppercase">
                  Location
                </span>
                <p className="font-display text-xl font-semibold text-ink mt-2">
                  {t('contact.info.address')}
                </p>
              </div>
            </div>

            {/* Decorative image */}
            <div className="mt-12">
              <SepiaImageFrame
                src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&q=80"
                alt="Team meeting"
                caption="Our Shanghai office"
                aspectRatio="landscape"
                size="full"
              />
            </div>
          </div>
        </div>
      </SectionContainer>

      <div className="editorial-divider" />
    </PageWrapper>
  );
}
