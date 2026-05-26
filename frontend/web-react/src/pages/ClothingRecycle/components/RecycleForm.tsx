import { useState, useMemo, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import SectionContainer from '@/components/layout/SectionContainer';
import { VintageInput } from '@/components/editorial/VintageInput';
import { VintageSelect } from '@/components/editorial/VintageSelect';
import { clothingIntakesApi, type ClothingIntake } from '@/services/clothingIntakes';
import { useAuthStore } from '@/stores/authStore';
import {
  TYPE_LABEL_KEYS, CONDITION_LABEL_KEYS,
  TYPE_OPTION_VALUES, CONDITION_OPTION_VALUES,
} from './types';

interface RecycleFormProps {
  onSubmitted: () => void;
}

export default function RecycleForm({ onSubmitted }: RecycleFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const prefersReducedMotion = useReducedMotion();
  const { isAuthenticated } = useAuthStore();

  const [description, setDescription] = useState('');
  const [clothingType, setClothingType] = useState('tshirt');
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState('like-new');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const typeLabelMap = useMemo(
    () => Object.fromEntries(Object.entries(TYPE_LABEL_KEYS).map(([v, k]) => [v, t(k, v)])),
    [t],
  ) as Record<string, string>;

  const conditionLabelMap = useMemo(
    () => Object.fromEntries(Object.entries(CONDITION_LABEL_KEYS).map(([v, k]) => [v, t(k, v)])),
    [t],
  ) as Record<string, string>;

  const typeOptions = useMemo(
    () => TYPE_OPTION_VALUES.map((v) => ({ value: v, label: t(TYPE_LABEL_KEYS[v], v) })),
    [t],
  );

  const conditionOptions = useMemo(
    () => CONDITION_OPTION_VALUES.map((v) => ({ value: v, label: t(CONDITION_LABEL_KEYS[v], v) })),
    [t],
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setPhotos(Array.from(e.target.files));
  };

  const createIntakeMutation = useMutation({
    mutationFn: () =>
      clothingIntakesApi.create({
        summary: description.trim(),
        garment_types: typeLabelMap[clothingType] || clothingType,
        quantity_estimate: quantity,
        condition_notes: [
          conditionLabelMap[condition],
          notes.trim(),
          photos.length > 0 ? t('clothingRecycle.photosAttached', '{{count}} photos attached', { count: photos.length }) : null,
        ].filter(Boolean).join(' · '),
        pickup_address: address.trim(),
        contact_phone: phone.trim(),
      }),
    onSuccess: (createdIntake) => {
      queryClient.setQueryData<ClothingIntake[]>(['my-clothing-intakes'], (prev = []) => [createdIntake, ...prev]);
      setSubmitted(true);
      setTimeout(() => { if (mountedRef.current) setSubmitted(false); }, 3000);
      setDescription(''); setClothingType('tshirt'); setQuantity(1); setCondition('like-new');
      setNotes(''); setPhotos([]); setAddress(''); setPhone('');
      setTimeout(() => { if (mountedRef.current) onSubmitted(); }, 300);
    },
    onError: (err: Error) => {
      toast.error(err.message || t('clothingRecycle.error', 'Submission failed — please retry'));
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    createIntakeMutation.mutate();
  };

  return (
    <SectionContainer>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
        {/* Left: Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
          className="md:col-span-7 space-y-5"
        >
          {!isAuthenticated && (
            <div className="rounded-xl border border-rust/20 bg-rust/5 p-5 mb-2">
              <p className="font-body text-body-sm text-ink mb-3">
                {t('clothingRecycle.loginPrompt', 'Sign in to submit a recycling request and track the same record in your profile.')}
              </p>
              <div className="flex gap-3">
                <Link to="/login" className="font-body text-caption text-paper bg-ink px-4 py-2 rounded-full tracking-[0.1em] uppercase hover:bg-ink/90 transition-colors">
                  {t('clothingRecycle.loginNow', 'Log In')}
                </Link>
                <Link to="/register" className="font-body text-caption text-rust border border-rust/30 px-4 py-2 rounded-full tracking-[0.1em] uppercase hover:border-rust/60 transition-colors">
                  {t('clothingRecycle.registerNow', 'Create Account')}
                </Link>
              </div>
            </div>
          )}

          <VintageInput
            label={t('clothingRecycle.fieldDescription', 'Garment Description *')}
            value={description}
            onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDescription(e.target.value)}
            placeholder={t('clothingRecycle.descriptionPlaceholder', 'Briefly describe the garments you want to recycle')}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <VintageSelect
              label={t('clothingRecycle.fieldType', 'Garment Type')}
              options={typeOptions}
              value={clothingType}
              onChange={(e) => setClothingType(e.target.value)}
            />
            <VintageInput
              label={t('clothingRecycle.fieldQuantity', 'Quantity')}
              type="number"
              value={String(quantity)}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setQuantity(Number(e.target.value) || 1)}
              min={1}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <VintageSelect
              label={t('clothingRecycle.fieldCondition', 'Condition')}
              options={conditionOptions}
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            />
            <VintageInput
              label={t('clothingRecycle.fieldPhone', 'Contact Phone *')}
              value={phone}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPhone(e.target.value)}
              placeholder={t('clothingRecycle.phonePlaceholder', '11-digit mobile number')}
              required
            />
          </div>

          <VintageInput
            label={t('clothingRecycle.fieldNotes', 'Notes')}
            type="textarea"
            value={notes}
            onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNotes(e.target.value)}
            placeholder={t('clothingRecycle.notesPlaceholder', 'Add any handling notes or garment details here')}
          />

          {/* Photo upload */}
          <div className="space-y-2">
            <span className="font-body text-overline tracking-[0.2em] uppercase text-sepia-mid block">
              {t('clothingRecycle.fieldPhotos', 'Upload Garment Photos')}
            </span>
            <label
              htmlFor="photo-upload"
              className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-rust/30 rounded-xl py-6 cursor-pointer hover:border-rust/50 transition-colors bg-aged-stock/30"
            >
              <svg className="w-6 h-6 text-sepia-mid" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0l-3 3m3-3l3 3M3 16.5V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18v-1.5" />
              </svg>
              <span className="font-body text-caption text-sepia-mid">
                {photos.length > 0
                  ? t('clothingRecycle.photoCount', '{{count}} file(s) selected', { count: photos.length })
                  : t('clothingRecycle.photoUploadPrompt', 'Click to upload photos')}
              </span>
              <input id="photo-upload" type="file" accept="image/*" multiple className="sr-only" onChange={handleFileChange} />
            </label>
          </div>

          <VintageInput
            label={t('clothingRecycle.fieldAddress', 'Pickup Address *')}
            value={address}
            onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setAddress(e.target.value)}
            placeholder={t('clothingRecycle.addressPlaceholder', 'Enter the full pickup address')}
            required
          />

          <motion.button
            type="submit"
            whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            disabled={createIntakeMutation.isPending}
            className="w-full py-3 rounded-full font-body text-body-sm tracking-[0.15em] uppercase bg-rust text-paper border border-rust hover:bg-rust/90 transition-colors disabled:opacity-60"
          >
            {submitted
              ? t('clothingRecycle.submitSuccess', 'Submitted Successfully!')
              : createIntakeMutation.isPending
                ? t('common.loading', 'Submitting...')
                : t('clothingRecycle.submitBtn', 'Submit Recycling Request')}
          </motion.button>
          {createIntakeMutation.isError && (
            <p className="font-body text-caption text-rust" role="alert">
              {t('clothingRecycle.submitError', 'Submission failed. Please try again later.')}
            </p>
          )}
        </motion.form>

        {/* Right: Tips */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0, 0, 0.2, 1], delay: 0.15 }}
          className="md:col-span-5 space-y-6"
        >
          <div className="rounded-xl border border-warm-gray/20 bg-paper/80 p-6">
            <h3 className="font-display text-h3 text-ink mb-3">
              {t('clothingRecycle.tipsTitle', 'Recycling Tips')}
            </h3>
            <ul className="space-y-3 font-body text-body-sm text-ink-faded">
              <li className="flex gap-2">
                <span className="text-rust mt-0.5">&#9670;</span>
                {t('clothingRecycle.tip1', 'Clean garments are more likely to be approved for recycling.')}
              </li>
              <li className="flex gap-2">
                <span className="text-rust mt-0.5">&#9670;</span>
                {t('clothingRecycle.tip2', 'Include photos for faster processing and better condition assessment.')}
              </li>
              <li className="flex gap-2">
                <span className="text-rust mt-0.5">&#9670;</span>
                {t('clothingRecycle.tip3', 'All types of clothing are accepted, including damaged items.')}
              </li>
              <li className="flex gap-2">
                <span className="text-rust mt-0.5">&#9670;</span>
                {t('clothingRecycle.tip4', 'Approved items will be listed in the circular shop with a recycle badge.')}
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-warm-gray/20 bg-aged-stock/30 p-6">
            <h3 className="font-display text-h3 text-ink mb-3">
              {t('clothingRecycle.processTitle', 'What Happens Next?')}
            </h3>
            <ol className="space-y-2 font-body text-body-sm text-ink-faded list-decimal list-inside">
              <li>{t('clothingRecycle.processStep1', 'Our team reviews your submission within 1-3 business days.')}</li>
              <li>{t('clothingRecycle.processStep2', 'Approved items are picked up from your address.')}</li>
              <li>{t('clothingRecycle.processStep3', 'Items are sorted, cleaned, and listed in the circular shop.')}</li>
              <li>{t('clothingRecycle.processStep4', 'You can track the full journey from your order history.')}</li>
            </ol>
          </div>
        </motion.div>
      </div>
    </SectionContainer>
  );
}
