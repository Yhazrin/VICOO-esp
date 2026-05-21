import { useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import { VintageInput } from '@/components/editorial/VintageInput';
import { VintageSelect } from '@/components/editorial/VintageSelect';
import { MagazineDivider } from '@/components/editorial/MagazineDivider';
import FAQAccordion from '@/components/editorial/FAQAccordion';
import { contactApi } from '@/services/contact';

const MIN_MESSAGE_LENGTH = 5;
const MAX_MESSAGE_LENGTH = 5000;

type FormStatus = 'idle' | 'sending' | 'success' | 'error';

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

const SUBJECT_OPTIONS = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'order', label: 'Order Support' },
  { value: 'partnership', label: 'Business Partnership' },
  { value: 'other', label: 'Other' },
];

export default function Contact() {
  const prefersReducedMotion = useReducedMotion();
  const [form, setForm] = useState({ name: '', email: '', subject: 'general', message: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>('idle');

  const validate = useCallback((): FormErrors => {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    const msg = form.message.trim();
    if (!msg) errs.message = 'Message is required';
    else if (msg.length < MIN_MESSAGE_LENGTH) errs.message = `Please enter at least ${MIN_MESSAGE_LENGTH} characters.`;
    else if (msg.length > MAX_MESSAGE_LENGTH) errs.message = `Max ${MAX_MESSAGE_LENGTH} characters`;
    return errs;
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setStatus('sending');
    try {
      await contactApi.submit({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim() || 'general',
        message: form.message.trim(),
      });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

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
            Contact Us
          </motion.h1>
          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0, 0, 0.2, 1], delay: 0.08 }}
            className="font-body text-body text-ink-faded max-w-2xl"
          >
            Have a question? We&apos;re here to help.
          </motion.p>
        </div>
      </SectionContainer>

      {/* Form + Info */}
      <section className="bg-aged-stock/30 py-16 md:py-24 relative">
        <SectionContainer noTopSpacing>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
            {/* Form */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
              className="md:col-span-7"
            >
              <AnimatePresence mode="wait">
                {status === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-xl border border-sage/30 bg-sage/5 p-8 text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-sage/10 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="font-display text-h3 text-ink mb-2">Message Sent</h3>
                    <p className="font-body text-body-sm text-ink-faded">
                      We&apos;ll get back to you within 24 hours.
                    </p>
                    <button
                      onClick={() => { setStatus('idle'); setForm({ name: '', email: '', subject: 'general', message: '' }); }}
                      className="mt-6 font-body text-caption text-rust tracking-[0.1em] uppercase hover:underline cursor-pointer"
                    >
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={handleSubmit} className="space-y-5">
                    <VintageInput
                      label="Name *"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your name"
                    />
                    {errors.name && <p className="font-body text-caption text-rust -mt-3">{errors.name}</p>}

                    <VintageInput
                      label="Email *"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="your@email.com"
                    />
                    {errors.email && <p className="font-body text-caption text-rust -mt-3">{errors.email}</p>}

                    <VintageSelect
                      label="Subject"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      options={SUBJECT_OPTIONS}
                    />

                    <div>
                      <VintageInput
                        label="Message *"
                        type="textarea"
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        placeholder="How can we help?"
                      />
                      <div className="flex justify-between mt-1">
                        {errors.message && <p className="font-body text-caption text-rust">{errors.message}</p>}
                        <span className="font-body text-[10px] text-sepia-mid ml-auto">
                          {form.message.trim().length}/{MAX_MESSAGE_LENGTH}
                        </span>
                      </div>
                    </div>

                    {status === 'error' && (
                      <p className="font-body text-body-sm text-rust" role="alert">
                        Something went wrong. Please try again.
                      </p>
                    )}

                    <motion.button
                      type="submit"
                      whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                      disabled={status === 'sending'}
                      className="w-full py-3 rounded-full font-body text-body-sm tracking-[0.15em] uppercase bg-rust text-paper border border-rust hover:bg-rust/90 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {status === 'sending' ? 'Sending...' : 'Send Message'}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: [0, 0, 0.2, 1], delay: 0.15 }}
              className="md:col-span-5 space-y-6"
            >
              <div className="rounded-xl border border-warm-gray/20 bg-paper/80 p-6">
                <h3 className="font-display text-h3 text-ink mb-3">Get in Touch</h3>
                <div className="space-y-4 font-body text-body-sm text-ink-faded">
                  <div>
                    <span className="font-body text-overline text-sepia-mid tracking-[0.1em] uppercase block mb-1">Email</span>
                    <span className="text-ink">support@vicoo.com</span>
                  </div>
                  <div>
                    <span className="font-body text-overline text-sepia-mid tracking-[0.1em] uppercase block mb-1">Customer Service</span>
                    <span className="text-ink">Mon — Fri, 9:00 — 18:00 CST</span>
                  </div>
                  <div>
                    <span className="font-body text-overline text-sepia-mid tracking-[0.1em] uppercase block mb-1">Headquarters</span>
                    <span className="text-ink">
                      Midtown Tower, 9-7-1 Akasaka<br />
                      Minato-ku, Tokyo 107-6231, Japan
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-warm-gray/20 bg-aged-stock/30 p-6">
                <h3 className="font-display text-h3 text-ink mb-3">Response Time</h3>
                <p className="font-body text-body-sm text-ink-faded">
                  We typically respond within 24 hours during business days. For urgent order issues, please include your order ID.
                </p>
              </div>
            </motion.div>
          </div>
        </SectionContainer>
      </section>

      <MagazineDivider variant="decorative" />

      {/* FAQ */}
      <SectionContainer className="section-spacing">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-h2 text-ink mb-8 text-center">
            Frequently Asked
          </h2>
          <FAQAccordion
            items={[
              {
                question: 'What is your return policy?',
                answer: 'We accept returns within 30 days of purchase. Items must be unworn, unwashed, and in original packaging with tags attached.',
              },
              {
                question: 'How long does shipping take?',
                answer: 'Standard shipping takes 3-5 business days. Express shipping is available for next-day delivery in select areas.',
              },
              {
                question: 'How can I track my order?',
                answer: "Once your order ships, you'll receive a tracking number via email. You can also check your order status in your account.",
              },
              {
                question: 'Do you ship internationally?',
                answer: 'Yes, we ship to over 20 countries. International shipping typically takes 7-14 business days depending on destination.',
              },
            ]}
          />
        </div>
      </SectionContainer>

      <div className="editorial-divider" />
    </PageWrapper>
  );
}
