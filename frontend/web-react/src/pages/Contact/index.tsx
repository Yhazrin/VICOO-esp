import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import { contactApi } from '@/services/contact';

const MAX_MESSAGE_LENGTH = 1000;

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

const FAQS = [
  {
    q: 'What is your return policy?',
    a: 'We accept returns within 30 days of purchase. Items must be unworn, unwashed, and in original packaging with tags attached.',
  },
  {
    q: 'How long does shipping take?',
    a: 'Standard shipping takes 3-5 business days. Express shipping is available for next-day delivery in select areas.',
  },
  {
    q: 'How can I track my order?',
    a: 'Once your order ships, you\'ll receive a tracking number via email. You can also check your order status in your account.',
  },
  {
    q: 'Do you ship internationally?',
    a: 'Yes, we ship to over 20 countries. International shipping typically takes 7-14 business days depending on destination.',
  },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'general', message: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>('idle');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const validate = useCallback((): FormErrors => {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.message.trim()) errs.message = 'Message is required';
    else if (form.message.length > MAX_MESSAGE_LENGTH) errs.message = `Max ${MAX_MESSAGE_LENGTH} characters`;
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
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
      });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <PageWrapper>
      {/* ── Header ── */}
      <section className="bg-white">
        <SectionContainer>
          <div className="max-w-2xl mx-auto text-center py-16 md:py-20">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-sans text-3xl md:text-5xl font-bold tracking-tight"
              style={{ color: '#1A1A1A' }}
            >
              CONTACT US
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-4 font-sans text-sm"
              style={{ color: '#888' }}
            >
              Have a question? We&apos;re here to help.
            </motion.p>
          </div>
        </SectionContainer>
      </section>

      {/* ── Form + Info ── */}
      <section className="bg-white pb-16 md:pb-24">
        <SectionContainer>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-16">
            {/* Form */}
            <div className="md:col-span-3">
              <AnimatePresence mode="wait">
                {status === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                  >
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="font-sans text-lg font-bold" style={{ color: '#1A1A1A' }}>Message Sent</h3>
                    <p className="font-sans text-sm mt-2" style={{ color: '#888' }}>
                      We&apos;ll get back to you within 24 hours.
                    </p>
                    <button
                      onClick={() => { setStatus('idle'); setForm({ name: '', email: '', subject: 'general', message: '' }); }}
                      className="mt-6 font-sans text-xs tracking-widest underline"
                      style={{ color: '#999' }}
                    >
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block font-sans text-xs tracking-widest uppercase mb-2" style={{ color: '#999' }}>Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-4 py-3 border font-sans text-sm outline-none transition-colors focus:border-gray-400"
                        style={{ borderColor: errors.name ? '#FF0000' : '#ddd', color: '#1A1A1A' }}
                      />
                      {errors.name && <p className="mt-1 font-sans text-xs" style={{ color: '#FF0000' }}>{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block font-sans text-xs tracking-widest uppercase mb-2" style={{ color: '#999' }}>Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-4 py-3 border font-sans text-sm outline-none transition-colors focus:border-gray-400"
                        style={{ borderColor: errors.email ? '#FF0000' : '#ddd', color: '#1A1A1A' }}
                      />
                      {errors.email && <p className="mt-1 font-sans text-xs" style={{ color: '#FF0000' }}>{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block font-sans text-xs tracking-widest uppercase mb-2" style={{ color: '#999' }}>Subject</label>
                      <select
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        className="w-full px-4 py-3 border font-sans text-sm outline-none bg-white transition-colors focus:border-gray-400"
                        style={{ borderColor: '#ddd', color: '#1A1A1A' }}
                      >
                        {SUBJECT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-sans text-xs tracking-widest uppercase mb-2" style={{ color: '#999' }}>
                        Message
                        <span className="float-right normal-case tracking-normal" style={{ fontWeight: 400 }}>
                          {form.message.length}/{MAX_MESSAGE_LENGTH}
                        </span>
                      </label>
                      <textarea
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        rows={6}
                        maxLength={MAX_MESSAGE_LENGTH}
                        className="w-full px-4 py-3 border font-sans text-sm outline-none resize-none transition-colors focus:border-gray-400"
                        style={{ borderColor: errors.message ? '#FF0000' : '#ddd', color: '#1A1A1A' }}
                      />
                      {errors.message && <p className="mt-1 font-sans text-xs" style={{ color: '#FF0000' }}>{errors.message}</p>}
                    </div>

                    {status === 'error' && (
                      <p className="font-sans text-sm" style={{ color: '#FF0000' }}>
                        Something went wrong. Please try again.
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={status === 'sending'}
                      className="px-10 py-3 font-sans text-xs font-semibold tracking-widest uppercase text-white transition-opacity duration-200 disabled:opacity-50"
                      style={{ background: '#FF0000' }}
                    >
                      {status === 'sending' ? 'Sending...' : 'Send Message'}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {/* Contact Info */}
            <div className="md:col-span-2 space-y-8">
              <div>
                <h3 className="font-sans text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#1A1A1A' }}>Email</h3>
                <p className="font-sans text-sm" style={{ color: '#666' }}>support@uniqlo.com</p>
              </div>
              <div>
                <h3 className="font-sans text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#1A1A1A' }}>Customer Service</h3>
                <p className="font-sans text-sm" style={{ color: '#666' }}>Mon — Fri, 9:00 — 18:00 (JST)</p>
              </div>
              <div>
                <h3 className="font-sans text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#1A1A1A' }}>Headquarters</h3>
                <p className="font-sans text-sm" style={{ color: '#666' }}>
                  Midtown Tower, 9-7-1 Akasaka<br />
                  Minato-ku, Tokyo 107-6231, Japan
                </p>
              </div>
            </div>
          </div>
        </SectionContainer>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-gray-50 py-16 md:py-24">
        <SectionContainer>
          <h2 className="font-sans text-2xl md:text-3xl font-bold tracking-tight mb-10 text-center" style={{ color: '#1A1A1A' }}>
            FREQUENTLY ASKED
          </h2>
          <div className="max-w-2xl mx-auto space-y-0">
            {FAQS.map((faq, i) => (
              <div key={i} className="border-b border-gray-200">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between py-5 font-sans text-sm text-left cursor-pointer"
                  style={{ color: '#1A1A1A' }}
                >
                  <span className="font-semibold">{faq.q}</span>
                  <span className="ml-4 text-lg shrink-0" style={{ color: '#ccc' }}>
                    {openFaq === i ? '−' : '+'}
                  </span>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 font-sans text-sm leading-relaxed" style={{ color: '#666' }}>
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </SectionContainer>
      </section>
    </PageWrapper>
  );
}
