import { useState, useMemo, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import SectionContainer from '@/components/layout/SectionContainer';
import { VintageInput } from '@/components/editorial/VintageInput';
import { VintageSelect } from '@/components/editorial/VintageSelect';
import { clothingIntakesApi, type ClothingIntake } from '@/services/clothingIntakes';
import { useAuthStore } from '@/stores/authStore';
import {
  TYPE_LABEL_KEYS, CONDITION_LABEL_KEYS,
  TYPE_OPTION_VALUES, CONDITION_OPTION_VALUES,
} from './types';

// Common countries with Taiwan, China
const COMMON_COUNTRIES = [
  { code: 'CN', name: 'China' },
  { code: 'US', name: 'United States' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong, China' },
  { code: 'TW', name: 'Taiwan, China' },
];

// Phone validation by country/region
function getPhonePattern(country: string): RegExp | null {
  const patterns: Record<string, RegExp> = {
    'China': /^1[3-9]\d{9}$/,
    'Taiwan, China': /^09\d{8}$/,
    'Hong Kong, China': /^[569]\d{7}$/,
    'Singapore': /^[89]\d{7}$/,
    'Japan': /^0\d{9,10}$/,
    'South Korea': /^01[016789]\d{7,8}$/,
    'United States': /^1?[2-9]\d{9}$/,
    'Canada': /^1?[2-9]\d{9}$/,
    'United Kingdom': /^7[1-9]\d{9}$/,
    'Germany': /^1[1-9]\d{9,10}$/,
    'France': /^[67]\d{9}$/,
    'Australia': /^4\d{8,9}$/,
    'default': /^\d{8,15}$/,
  };
  return patterns[country] || patterns['default'];
}

function validatePhone(phone: string, country: string): boolean {
  if (!phone) return false;
  const pattern = getPhonePattern(country);
  return pattern ? pattern.test(phone) : true;
}

function validateName(name: string): boolean {
  if (!name || name.trim().length < 2 || name.trim().length > 50) return false;
  return /^[一-龥a-zA-Z\s\-']+$/.test(name.trim());
}

function validateAddress(address: string): boolean {
  if (!address || address.trim().length < 5 || address.trim().length > 200) return false;
  return true;
}

// Postal code validation by country/region
function getPostalCodePattern(country: string): RegExp | null {
  const patterns: Record<string, RegExp> = {
    'China': /^\d{6}$/,
    'Taiwan, China': /^\d{3,5}$/,
    'Japan': /^\d{3}-?\d{4}$/,
    'South Korea': /^\d{5}$/,
    'United States': /^\d{5}(-\d{4})?$/,
    'Canada': /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,
    'United Kingdom': /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
    'Germany': /^\d{5}$/,
    'France': /^\d{5}$/,
    'Australia': /^\d{4}$/,
    'Singapore': /^\d{6}$/,
    'Hong Kong, China': /^(?:\d{6}|\s*)?$/,
  };
  return patterns[country] || null;
}

function validatePostalCode(postalCode: string, country: string): boolean {
  if (!postalCode) return true;
  const pattern = getPostalCodePattern(country);
  if (!pattern) return true;
  return pattern.test(postalCode.trim());
}

// Get error message for phone by country
function getPhoneError(country: string, t: (key: string) => string): string {
  const errorMap: Record<string, string> = {
    'China': t('clothingRecycle.phoneErrorCn', '请输入有效的11位中国手机号码'),
    'Taiwan, China': t('clothingRecycle.phoneErrorTw', '請輸入有效的10位台灣手機號碼'),
    'Hong Kong, China': t('clothingRecycle.phoneErrorHk', '请输入有效的8位香港手机号码'),
    'Singapore': t('clothingRecycle.phoneErrorSg', '请输入有效的8位新加坡手机号码'),
    'Japan': t('clothingRecycle.phoneErrorJp', '请输入有效的日本电话号码'),
    'South Korea': t('clothingRecycle.phoneErrorKr', '请输入有效的韩国手机号码'),
    'United States': t('clothingRecycle.phoneErrorUs', '请输入有效的美国电话号码'),
    'Canada': t('clothingRecycle.phoneErrorCa', '请输入有效的加拿大电话号码'),
    'United Kingdom': t('clothingRecycle.phoneErrorUk', '请输入有效的英国电话号码'),
    'Germany': t('clothingRecycle.phoneErrorDe', '请输入有效的德国电话号码'),
    'France': t('clothingRecycle.phoneErrorFr', '请输入有效的法国电话号码'),
    'Australia': t('clothingRecycle.phoneErrorAu', '请输入有效的澳大利亚电话号码'),
    'default': t('clothingRecycle.phoneError', 'Invalid phone number'),
  };
  return errorMap[country] || errorMap['default'];
}

// Get dynamic placeholder for phone by country
function getPhonePlaceholder(country: string, t: (key: string) => string): string {
  const placeholders: Record<string, string> = {
    'China': t('clothingRecycle.phonePlaceholderCn', '请输入11位手机号'),
    'Taiwan, China': t('clothingRecycle.phonePlaceholderTw', '請輸入10位手機號碼'),
    'Hong Kong, China': t('clothingRecycle.phonePlaceholderHk', '請輸入8位電話號碼'),
    'Singapore': t('clothingRecycle.phonePlaceholderSg', '請輸入8位電話號碼'),
    'Japan': t('clothingRecycle.phonePlaceholderJp', '請輸入電話號碼'),
    'South Korea': t('clothingRecycle.phonePlaceholderKr', '請輸入10/11位手機號碼'),
    'United States': t('clothingRecycle.phonePlaceholderUs', '10-digit phone number'),
    'Canada': t('clothingRecycle.phonePlaceholderCa', '10-digit phone number'),
    'United Kingdom': t('clothingRecycle.phonePlaceholderUk', '11-digit phone number'),
    'Germany': t('clothingRecycle.phonePlaceholderDe', '10/11-digit phone number'),
    'France': t('clothingRecycle.phonePlaceholderFr', '10-digit phone number'),
    'Australia': t('clothingRecycle.phonePlaceholderAu', '9/10-digit phone number'),
    'default': t('clothingRecycle.phonePlaceholder', 'Enter phone number'),
  };
  return placeholders[country] || placeholders['default'];
}

// Get error message for field by country
function getFieldError(field: string, country: string, t: (key: string) => string): string {
  const errors: Record<string, Record<string, string>> = {
    name: {
      'China': t('clothingRecycle.nameErrorCn', '请输入2-50位中英文姓名'),
      'Taiwan, China': t('clothingRecycle.nameErrorTw', '請輸入2-50位中英文姓名'),
      'Hong Kong, China': t('clothingRecycle.nameErrorHk', '请输入2-50位中英文姓名'),
      'default': t('clothingRecycle.nameError', 'Name must be 2-50 characters'),
    },
    address: {
      'China': t('clothingRecycle.addressErrorCn', '地址长度需在5-200字符'),
      'Taiwan, China': t('clothingRecycle.addressErrorTw', '地址長度需在5-200字符'),
      'default': t('clothingRecycle.addressError', 'Address must be 5-200 characters'),
    },
    postalCode: {
      'China': t('clothingRecycle.postalCodeErrorCn', '请输入6位邮政编码'),
      'Taiwan, China': t('clothingRecycle.postalCodeErrorTw', '請輸入3-5位郵遞區號'),
      'Japan': t('clothingRecycle.postalCodeErrorJp', '格式: 123-4567 或 1234567'),
      'South Korea': t('clothingRecycle.postalCodeErrorKr', '请输入5位邮政编码'),
      'United States': t('clothingRecycle.postalCodeErrorUs', '格式: 12345 或 12345-6789'),
      'Canada': t('clothingRecycle.postalCodeErrorCa', '格式: A1A 1A1'),
      'United Kingdom': t('clothingRecycle.postalCodeErrorUk', '格式: SW1A 1AA'),
      'default': t('clothingRecycle.postalCodeError', 'Invalid postal code format'),
    },
  };
  return errors[field]?.[country] || errors[field]?.['default'] || '';
}

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
  const [country, setCountry] = useState('China');
  const [postalCode, setPostalCode] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const mountedRef = useRef(true);

  // Validation
  const canSubmit = isAuthenticated && description.trim() && validateName(contactName) &&
    phone.trim() && validatePhone(phone, country) && address.trim() && validateAddress(address) &&
    (!postalCode.trim() || validatePostalCode(postalCode, country));

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
            <div>
              <VintageInput
                label={t('clothingRecycle.fieldContactName', 'Contact Name *')}
                value={contactName}
                onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setContactName(e.target.value)}
                placeholder={t('clothingRecycle.namePlaceholder', 'Enter your name')}
                required
              />
              {contactName && !validateName(contactName) && (
                <p className="font-body text-caption text-rust mt-1">{getFieldError('name', country, t)}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <VintageSelect
              label={t('clothingRecycle.fieldCountry', 'Country/Region')}
              options={COMMON_COUNTRIES.map((c) => ({ value: c.name, label: c.name }))}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
            <div>
              <VintageInput
                label={t('clothingRecycle.fieldPhone', 'Contact Phone *')}
                value={phone}
                onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPhone(e.target.value)}
                placeholder={getPhonePlaceholder(country, t)}
                required
              />
              {phone && !validatePhone(phone, country) && (
                <p className="font-body text-caption text-rust mt-1">{getPhoneError(country, t)}</p>
              )}
            </div>
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
          {address && !validateAddress(address) && (
            <p className="font-body text-caption text-rust -mt-3">{getFieldError('address', country, t)}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <VintageInput
              label={t('clothingRecycle.fieldPostalCode', 'Postal Code')}
              value={postalCode}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPostalCode(e.target.value)}
              placeholder={t('clothingRecycle.postalCodePlaceholder', 'Enter postal code')}
            />
            {postalCode && !validatePostalCode(postalCode, country) && (
              <p className="font-body text-caption text-rust -mt-3">{getFieldError('postalCode', country, t)}</p>
            )}
          </div>

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
