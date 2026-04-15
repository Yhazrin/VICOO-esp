import { useState, useRef, useMemo, type ChangeEvent, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import { VintageInput } from '@/components/editorial/VintageInput';
import { VintageSelect } from '@/components/editorial/VintageSelect';
import { EditorialCard } from '@/components/editorial/EditorialCard';
import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import GrainOverlay from '@/components/animations/GrainOverlay';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import { MagazineDivider } from '@/components/editorial/MagazineDivider';
import ImpactCounter from '@/components/editorial/ImpactCounter';
import { clothingIntakesApi, type ClothingIntake } from '@/services/clothingIntakes';
import { useAuthStore } from '@/stores/authStore';
import { placeholderImage } from '@/utils/placeholderImage';

/* ─── Types & Constants ─── */

type OrderStatus = 'all' | 'pending' | 'approved' | 'rejected' | 'listed';

interface RecycleOrder {
  id: string;
  date: string;
  type: string;
  quantity: number;
  status: 'pending' | 'approved' | 'rejected' | 'listed';
  statusLabel: string;
  reason?: string;
  productLink?: string;
}

const MOCK_PRODUCTS = [
  { id: '1', nameKey: 'donateClothing.products.plaidJacket', nameFallback: 'Plaid Patchwork Jacket', price: '¥89', hue: 25 },
  { id: '2', nameKey: 'donateClothing.products.tieDyeTee', nameFallback: 'Tie-Dye Eco Tee', price: '¥45', hue: 200 },
  { id: '3', nameKey: 'donateClothing.products.handPaintedJeans', nameFallback: 'Hand-Painted Jeans', price: '¥120', hue: 220 },
  { id: '4', nameKey: 'donateClothing.products.patchworkDress', nameFallback: 'Patchwork Dress', price: '¥68', hue: 330 },
];

const STATUS_BADGE: Record<RecycleOrder['status'], string> = {
  listed: 'bg-sage/10 text-sage border border-sage/30',
  pending: 'bg-amber-50 text-amber-700 border border-amber-300',
  approved: 'bg-sky-50 text-sky-700 border border-sky-300',
  rejected: 'bg-red-50 text-red-700 border border-red-300',
};

const TYPE_OPTIONS = [
  { value: 'tshirt', label: '' },
  { value: 'pants', label: '' },
  { value: 'jacket', label: '' },
  { value: 'skirt', label: '' },
  { value: 'other', label: '' },
];

const CONDITION_OPTIONS = [
  { value: 'new', label: '' },
  { value: 'like-new', label: '' },
  { value: 'good', label: '' },
  { value: 'fair', label: '' },
];

/* ─── Helpers ─── */

function mapIntakeStatus(status: string): RecycleOrder['status'] {
  if (status === 'approved' || status === 'rejected' || status === 'listed') return status;
  return 'pending';
}

function formatOrderId(intake: ClothingIntake): string {
  return `RC-${intake.created_at.slice(0, 10).replace(/-/g, '')}-${String(intake.id).padStart(3, '0')}`;
}

/* ─── Circular Flow Diagram ─── */

function CircularFlowDiagram({ steps, ariaLabel }: { steps: string[]; ariaLabel: string }) {
  const prefersReducedMotion = useReducedMotion();
  const radius = 130;
  const center = 170;
  const total = steps.length;

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
      whileInView={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, ease: [0, 0, 0.2, 1] }}
      className="flex justify-center py-8"
    >
      <svg viewBox="0 0 340 340" className="w-64 h-64 md:w-80 md:h-80" aria-label={ariaLabel}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="currentColor" className="text-rust/20" strokeWidth={2} strokeDasharray="6 4" />
        {steps.map((_, i) => {
          const angle1 = (i / total) * Math.PI * 2 - Math.PI / 2;
          const angle2 = ((i + 1) / total) * Math.PI * 2 - Math.PI / 2;
          const midAngle = (angle1 + angle2) / 2;
          const ax = center + Math.cos(midAngle) * (radius + 12);
          const ay = center + Math.sin(midAngle) * (radius + 12);
          const dir = midAngle + Math.PI / 2;
          return (
            <polygon
              key={`arrow-${i}`}
              points={`${ax},${ay} ${ax - 5 * Math.cos(dir) - 4 * Math.cos(midAngle)},${ay - 5 * Math.sin(dir) - 4 * Math.sin(midAngle)} ${ax + 5 * Math.cos(dir) - 4 * Math.cos(midAngle)},${ay + 5 * Math.sin(dir) - 4 * Math.sin(midAngle)}`}
              className="fill-rust/50"
            />
          );
        })}
        {steps.map((step) => {
          const angle = (steps.indexOf(step) / total) * Math.PI * 2 - Math.PI / 2;
          const x = center + Math.cos(angle) * radius;
          const y = center + Math.sin(angle) * radius;
          return (
            <g key={step}>
              <circle cx={x} cy={y} r={28} className="fill-paper stroke-rust/40" strokeWidth={1.5} />
              <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className="fill-ink font-body" fontSize={11}>
                {step}
              </text>
            </g>
          );
        })}
      </svg>
    </motion.div>
  );
}

/* ─── Main Component ─── */

export default function DonateClothing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const prefersReducedMotion = useReducedMotion();
  const ordersSectionRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuthStore();

  /* Form state */
  const [description, setDescription] = useState('');
  const [clothingType, setClothingType] = useState('tshirt');
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState('like-new');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<OrderStatus>('all');

  /* Queries */
  const { data: intakeOrders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['my-clothing-intakes'],
    queryFn: () => clothingIntakesApi.mine(),
    enabled: isAuthenticated,
  });

  /* Computed i18n labels */
  const typeOptions = useMemo(
    () => TYPE_OPTIONS.map((o) => ({
      value: o.value,
      label: t(`donateClothing.types.${o.value}`, o.value === 'tshirt' ? 'T-Shirt' : o.value === 'pants' ? 'Pants' : o.value === 'jacket' ? 'Jacket' : o.value === 'skirt' ? 'Skirt' : 'Other'),
    })),
    [t],
  );

  const conditionOptions = useMemo(
    () => CONDITION_OPTIONS.map((o) => ({
      value: o.value,
      label: t(`donateClothing.conditions.${o.value}`, o.value === 'new' ? 'New' : o.value === 'like-new' ? 'Like New' : o.value === 'good' ? 'Good' : 'Fair'),
    })),
    [t],
  );

  const typeLabelMap = useMemo(
    () => Object.fromEntries(typeOptions.map((o) => [o.value, o.label])),
    [typeOptions],
  );

  const conditionLabelMap = useMemo(
    () => Object.fromEntries(conditionOptions.map((o) => [o.value, o.label])),
    [conditionOptions],
  );

  const orderStatusLabels = useMemo(
    () => ({
      listed: t('donateClothing.statusLabels.listed', 'Listed'),
      pending: t('donateClothing.statusLabels.pending', 'Under Review'),
      approved: t('donateClothing.statusLabels.approved', 'Approved · Processing'),
      rejected: t('donateClothing.statusLabels.rejected', 'Rejected'),
    }),
    [t],
  );

  const recycleProducts = useMemo(
    () => MOCK_PRODUCTS.map((product) => {
      const name = t(product.nameKey, product.nameFallback);
      return {
        ...product,
        name,
        image: placeholderImage(name, { hue: product.hue, subtitle: t('donateClothing.recycleBadge', '♻ Recrafted') }),
      };
    }),
    [t],
  );

  const userOrders = useMemo(
    () => intakeOrders.map((intake) => ({
      id: formatOrderId(intake),
      date: intake.created_at.slice(0, 10),
      type: intake.garment_types || intake.summary,
      quantity: intake.quantity_estimate || 1,
      status: mapIntakeStatus(intake.status),
      statusLabel: orderStatusLabels[mapIntakeStatus(intake.status)],
      reason: intake.admin_note || undefined,
      productLink: intake.product_id ? `/shop/${intake.product_id}` : undefined,
    } as RecycleOrder)),
    [intakeOrders, orderStatusLabels],
  );

  const filteredOrders = useMemo(
    () => activeTab === 'all' ? userOrders : userOrders.filter((o) => o.status === activeTab),
    [userOrders, activeTab],
  );

  const tabs = useMemo(
    () => (['all', 'pending', 'approved', 'rejected', 'listed'] as OrderStatus[]).map((key) => ({
      key,
      label: key === 'all' ? t('donateClothing.tabs.all', 'All') : orderStatusLabels[key as keyof typeof orderStatusLabels],
    })),
    [t, orderStatusLabels],
  );

  const flowSteps = useMemo(
    () => [
      t('donateClothing.flowSteps.submit', 'Submit'),
      t('donateClothing.flowSteps.review', 'Review'),
      t('donateClothing.flowSteps.sort', 'Sort'),
      t('donateClothing.flowSteps.list', 'List'),
      t('donateClothing.flowSteps.purchase', 'Purchase'),
      t('donateClothing.flowSteps.closeLoop', 'Close Loop'),
    ],
    [t],
  );

  /* Handlers */
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
          photos.length > 0 ? t('donateClothing.photosAttached', '{{count}} photos attached', { count: photos.length }) : null,
        ]
          .filter(Boolean)
          .join(' · '),
        pickup_address: address.trim(),
        contact_phone: phone.trim(),
      }),
    onSuccess: (createdIntake) => {
      queryClient.setQueryData<ClothingIntake[]>(['my-clothing-intakes'], (previous = []) => [createdIntake, ...previous]);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setDescription('');
      setClothingType('tshirt');
      setQuantity(1);
      setCondition('like-new');
      setNotes('');
      setPhotos([]);
      setAddress('');
      setPhone('');
      setTimeout(() => ordersSectionRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    createIntakeMutation.mutate();
  };

  /* Animation helpers */
  const fadeUp = (delay = 0) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 } as const,
          whileInView: { opacity: 1, y: 0 } as const,
          viewport: { once: true, margin: '-60px' } as const,
          transition: { duration: 0.6, ease: [0, 0, 0.2, 1], delay },
        };

  return (
    <PageWrapper>
      {/* Section 01: Circular Fashion */}
      <PaperTextureBackground variant="paper" className="py-20 md:py-32 relative">
        <GrainOverlay />
        <SectionContainer>
          <NumberedSectionHeading
            number="01"
            title={t('donateClothing.heroTitle', 'Circular Fashion')}
            subtitle={t('donateClothing.heroSubtitle', 'Give old garments a second life, from submission and review to relisting and reuse.')}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 mt-12 md:mt-16">
            <ImpactCounter value={12000} suffix="+" label={t('donateClothing.statRecycled', 'Garments Recovered')} />
            <ImpactCounter value={8500} suffix=" kg" label={t('donateClothing.statCarbon', 'CO₂ Reduced')} />
            <ImpactCounter value={87} suffix="%" label={t('donateClothing.statRate', 'Reuse Rate')} />
          </div>

          <motion.div {...fadeUp(0.2)} className="mt-16">
            <p className="font-body text-caption text-sepia-mid tracking-[0.15em] uppercase text-center mb-4">
              {t('donateClothing.flowTitle', 'Circular Workflow')}
            </p>
            <CircularFlowDiagram
              steps={flowSteps}
              ariaLabel={t('donateClothing.flowDiagramAria', 'Circular recycling workflow')}
            />
          </motion.div>
        </SectionContainer>
      </PaperTextureBackground>

      <MagazineDivider variant="decorative" />

      {/* Section 02: Submit Old Clothes */}
      <PaperTextureBackground variant="aged" className="py-16 md:py-24 relative">
        <GrainOverlay />
        <SectionContainer>
          <NumberedSectionHeading
            number="02"
            title={t('donateClothing.submitTitle', 'Submit Old Clothes')}
            subtitle={t('donateClothing.submitSubtitle', 'Fill in the form below to start a recycling request. Our operations team reviews submissions within 1-3 business days.')}
          />

          <motion.form
            {...fadeUp()}
            onSubmit={handleSubmit}
            className="max-w-xl space-y-6 border border-rust/30 p-6 md:p-10 bg-paper/90"
          >
            {!isAuthenticated && (
              <div className="border border-rust/30 bg-rust/5 p-4">
                <p className="font-body text-body-sm text-ink mb-3">
                  {t('donateClothing.loginPrompt', 'Sign in to submit a recycling request and track the same record in your profile.')}
                </p>
                <div className="flex gap-3">
                  <Link to="/login" className="font-body text-caption text-paper bg-ink px-4 py-2 tracking-[0.1em] uppercase">
                    {t('donateClothing.loginNow', 'Log In')}
                  </Link>
                  <Link to="/register" className="font-body text-caption text-rust border border-rust/30 px-4 py-2 tracking-[0.1em] uppercase">
                    {t('donateClothing.registerNow', 'Create Account')}
                  </Link>
                </div>
              </div>
            )}

            <VintageInput
              label={t('donateClothing.fieldDescription', 'Garment Description *')}
              value={description}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder={t('donateClothing.descriptionPlaceholder', 'Briefly describe the garments you want to recycle')}
              required
            />

            <VintageSelect
              label={t('donateClothing.fieldType', 'Garment Type')}
              options={typeOptions}
              value={clothingType}
              onChange={(e) => setClothingType(e.target.value)}
            />

            <div>
              <label htmlFor="dc-qty" className="font-body text-overline text-sepia-mid block mb-2">
                {t('donateClothing.fieldQuantity', 'Quantity')}
              </label>
              <input
                id="dc-qty"
                type="number"
                min={1}
                max={999}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                className="w-full border border-warm-gray/40 bg-transparent px-4 py-3 font-body text-body-sm text-ink"
              />
            </div>

            <VintageSelect
              label={t('donateClothing.fieldCondition', 'Condition')}
              options={conditionOptions}
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            />

            <VintageInput
              label={t('donateClothing.fieldNotes', 'Notes')}
              type="textarea"
              value={notes}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNotes(e.target.value)}
              placeholder={t('donateClothing.notesPlaceholder', 'Add any handling notes or garment details here')}
            />

            {/* Photo upload */}
            <div className="space-y-2">
              <span className="font-body text-overline tracking-[0.2em] uppercase text-sepia-mid block">
                {t('donateClothing.fieldPhotos', 'Upload Garment Photos')}
              </span>
              <label
                htmlFor="photo-upload"
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-rust/30 rounded py-8 cursor-pointer hover:border-rust/50 transition-colors bg-aged-stock/30"
              >
                <svg className="w-8 h-8 text-sepia-mid" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0l-3 3m3-3l3 3M3 16.5V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18v-1.5M6.75 12l.004-.002" />
                </svg>
                <span className="font-body text-caption text-sepia-mid">
                  {photos.length > 0
                    ? t('donateClothing.photoCount', '{{count}} file(s) selected', { count: photos.length })
                    : t('donateClothing.photoUploadPrompt', 'Click to upload photos')}
                </span>
                <input id="photo-upload" type="file" accept="image/*" multiple className="sr-only" onChange={handleFileChange} />
              </label>
            </div>

            <VintageInput
              label={t('donateClothing.fieldAddress', 'Pickup Address *')}
              value={address}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setAddress(e.target.value)}
              placeholder={t('donateClothing.addressPlaceholder', 'Enter the full pickup address')}
              required
            />

            <VintageInput
              label={t('donateClothing.fieldPhone', 'Contact Phone *')}
              value={phone}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPhone(e.target.value)}
              placeholder={t('donateClothing.phonePlaceholder', '11-digit mobile number')}
              required
            />

            <motion.button
              type="submit"
              whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              disabled={createIntakeMutation.isPending}
              className="w-full py-3 font-body text-body-sm tracking-[0.15em] uppercase bg-ink text-paper hover:bg-rust disabled:opacity-60 transition-colors cursor-pointer"
            >
              {submitted
                ? t('donateClothing.submitSuccess', 'Submitted Successfully!')
                : createIntakeMutation.isPending
                  ? t('common.loading', 'Submitting...')
                  : t('donateClothing.submit', 'Submit Recycling Request')}
            </motion.button>
            {createIntakeMutation.isError && (
              <p className="font-body text-caption text-rust" role="alert">
                {t('donateClothing.error', 'Submission failed. Please try again later.')}
              </p>
            )}
          </motion.form>
        </SectionContainer>
      </PaperTextureBackground>

      <MagazineDivider variant="decorative" />

      {/* Section 03: My Recycling Orders */}
      <div ref={ordersSectionRef}>
        <SectionContainer className="section-spacing">
          <NumberedSectionHeading
            number="03"
            title={t('donateClothing.ordersTitle', 'My Recycling Orders')}
            subtitle={t('donateClothing.ordersSubtitle', 'Track recycling progress, review outcomes, and linked resale items here.')}
          />

          {!isAuthenticated ? (
            <motion.div {...fadeUp()} className="border border-rust/20 bg-aged-stock/30 p-6 text-center">
              <p className="font-body text-body-sm text-ink mb-4">
                {t('donateClothing.loginToTrack', 'Log in to view recycling progress synced with your profile.')}
              </p>
              <Link to="/login" className="font-body text-caption text-rust tracking-[0.1em] uppercase hover:underline">
                {t('donateClothing.goToLogin', 'Go to Login')} →
              </Link>
            </motion.div>
          ) : (
            <>
              <motion.div {...fadeUp()} className="flex flex-wrap gap-2 mb-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`font-body text-caption tracking-[0.1em] uppercase px-4 py-2 border transition-colors cursor-pointer ${
                      activeTab === tab.key
                        ? 'bg-ink text-paper border-ink'
                        : 'bg-transparent text-sepia-mid border-rust/30 hover:border-rust/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </motion.div>

              <div className="space-y-4">
                {loadingOrders ? (
                  <p className="font-body text-body-sm text-sepia-mid text-center py-12">
                    {t('common.loading', 'Loading...')}
                  </p>
                ) : filteredOrders.map((order, i) => (
                  <motion.div
                    key={order.id}
                    {...fadeUp(i * 0.08)}
                    className="border border-rust/30 bg-paper/90 p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4"
                  >
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <span className="font-body text-overline text-sepia-mid tracking-[0.1em] uppercase block mb-1">
                          {t('donateClothing.orderId', 'Order ID')}
                        </span>
                        <span className="font-body text-body-sm text-ink">{order.id}</span>
                      </div>
                      <div>
                        <span className="font-body text-overline text-sepia-mid tracking-[0.1em] uppercase block mb-1">
                          {t('donateClothing.orderDate', 'Submitted')}
                        </span>
                        <span className="font-body text-body-sm text-ink">{order.date}</span>
                      </div>
                      <div>
                        <span className="font-body text-overline text-sepia-mid tracking-[0.1em] uppercase block mb-1">
                          {t('donateClothing.orderType', 'Garment Type')}
                        </span>
                        <span className="font-body text-body-sm text-ink">{order.type}</span>
                      </div>
                      <div>
                        <span className="font-body text-overline text-sepia-mid tracking-[0.1em] uppercase block mb-1">
                          {t('donateClothing.orderQuantity', 'Quantity')}
                        </span>
                        <span className="font-body text-body-sm text-ink">{order.quantity} {t('donateClothing.quantityUnit', 'pcs')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 md:flex-col md:items-end md:gap-2">
                      <span className={`inline-block font-body text-overline tracking-[0.1em] px-3 py-1 rounded-sm ${STATUS_BADGE[order.status]}`}>
                        {order.statusLabel}
                      </span>
                      {order.status === 'listed' && order.productLink && (
                        <Link to={order.productLink} className="font-body text-caption text-rust tracking-[0.1em] uppercase hover:underline">
                          {t('donateClothing.viewProduct', 'View Product')} →
                        </Link>
                      )}
                      {order.status === 'rejected' && order.reason && (
                        <span className="font-body text-caption text-red-600 max-w-xs">{order.reason}</span>
                      )}
                      {order.status === 'pending' && (
                        <span className="font-body text-caption text-sepia-mid">
                          {t('donateClothing.pendingEta', 'Estimated review: 1-3 business days')}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}

                {!loadingOrders && filteredOrders.length === 0 && (
                  <p className="font-body text-body-sm text-sepia-mid text-center py-12">
                    {t('donateClothing.noOrders', 'No orders in this status')}
                  </p>
                )}
              </div>
            </>
          )}
        </SectionContainer>
      </div>

      <MagazineDivider variant="decorative" />

      {/* Section 04: Recrafted Product Showcase */}
      <PaperTextureBackground variant="aged" className="py-16 md:py-24 relative">
        <GrainOverlay />
        <SectionContainer>
          <NumberedSectionHeading
            number="04"
            title={t('donateClothing.showcaseTitle', 'Recrafted Product Showcase')}
            subtitle={t('donateClothing.showcaseSubtitle', 'Selected pieces revived from recycled garments, refreshed and ready for their next story.')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {recycleProducts.map((product, i) => (
              <motion.div key={product.id} {...fadeUp(i * 0.1)}>
                <EditorialCard
                  title={product.name}
                  image={product.image}
                  imageAlt={product.name}
                  index={i}
                  hoverEffect="lift"
                >
                  <div className="p-4 space-y-3">
                    <SepiaImageFrame src={product.image} alt={product.name} aspectRatio="square" size="full" />
                    <span className="inline-block font-body text-overline tracking-[0.1em] px-2 py-0.5 bg-sage/10 text-sage border border-sage/30 rounded-sm">
                      {t('donateClothing.recycleBadge', '♻ Recrafted')}
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-display text-body-sm font-bold text-ink">{product.price}</span>
                      <button
                        onClick={() => navigate(`/shop/${product.id}`)}
                        className="font-body text-caption text-rust tracking-[0.1em] uppercase hover:underline cursor-pointer"
                      >
                        {t('donateClothing.viewDetail', 'View Details')}
                      </button>
                    </div>
                  </div>
                </EditorialCard>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp(0.3)} className="text-center mt-12">
            <Link to="/shop" className="font-body text-body-sm text-rust tracking-[0.15em] uppercase hover:underline transition-colors">
              {t('donateClothing.browseMore', 'Browse More Recrafted Items')} →
            </Link>
          </motion.div>
        </SectionContainer>
      </PaperTextureBackground>

      <div className="editorial-divider" />
    </PageWrapper>
  );
}
