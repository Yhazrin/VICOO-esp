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
import GrainOverlay from '@/components/editorial/GrainOverlay';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import { MagazineDivider } from '@/components/editorial/MagazineDivider';
import ImpactCounter from '@/components/editorial/ImpactCounter';
import { clothingIntakesApi, type ClothingIntake } from '@/services/clothingIntakes';
import { useAuthStore } from '@/stores/authStore';
import { placeholderImage } from '@/utils/placeholderImage';

/* ------------------------------------------------------------------ */
/*  Types & Mock Data                                                  */
/* ------------------------------------------------------------------ */

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

const ORDER_STATUS_LABELS: Record<Exclude<OrderStatus, 'all'>, string> = {
  listed: '已上架',
  pending: '审核中',
  approved: '已通过·整理中',
  rejected: '已驳回',
};

const MOCK_PRODUCTS = [
  {
    id: '1',
    name: '复古格纹外套',
    price: '¥89',
    image: placeholderImage('复古格纹外套', { hue: 25, subtitle: '♻ 循环再生' }),
  },
  {
    id: '2',
    name: '扎染棉质T恤',
    price: '¥45',
    image: placeholderImage('扎染棉质T恤', { hue: 200, subtitle: '♻ 循环再生' }),
  },
  {
    id: '3',
    name: '手绘牛仔裤',
    price: '¥120',
    image: placeholderImage('手绘牛仔裤', { hue: 220, subtitle: '♻ 循环再生' }),
  },
  {
    id: '4',
    name: '拼布碎花裙',
    price: '¥68',
    image: placeholderImage('拼布碎花裙', { hue: 330, subtitle: '♻ 循环再生' }),
  },
];

const STATUS_BADGE: Record<RecycleOrder['status'], string> = {
  listed: 'bg-sage/10 text-sage border border-sage/30',
  pending: 'bg-amber-50 text-amber-700 border border-amber-300',
  approved: 'bg-sky-50 text-sky-700 border border-sky-300',
  rejected: 'bg-red-50 text-red-700 border border-red-300',
};

const TYPE_LABEL_MAP: Record<string, string> = {
  tshirt: 'T恤',
  pants: '裤子',
  jacket: '外套',
  skirt: '裙子',
  other: '其他',
};

const CONDITION_LABEL_MAP: Record<string, string> = {
  new: '全新',
  'like-new': '八成新',
  good: '七成新',
  fair: '有瑕疵',
};

const typeOptions = [
  { value: 'tshirt', label: 'T恤' },
  { value: 'pants', label: '裤子' },
  { value: 'jacket', label: '外套' },
  { value: 'skirt', label: '裙子' },
  { value: 'other', label: '其他' },
];

const conditionOptions = [
  { value: 'new', label: '全新' },
  { value: 'like-new', label: '八成新' },
  { value: 'good', label: '七成新' },
  { value: 'fair', label: '有瑕疵' },
];

const tabs: { key: OrderStatus; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已驳回' },
  { key: 'listed', label: '已上架' },
];

const FLOW_STEPS = [
  '提交旧衣',
  '审核',
  '整理',
  '上架',
  '购买',
  '闭环',
];

function mapIntakeStatus(status: string): RecycleOrder['status'] {
  if (status === 'approved' || status === 'rejected' || status === 'listed') {
    return status;
  }

  return 'pending';
}

function formatOrderId(intake: ClothingIntake): string {
  return `RC-${intake.created_at.slice(0, 10).replace(/-/g, '')}-${String(intake.id).padStart(3, '0')}`;
}

function mapIntakeToOrder(intake: ClothingIntake): RecycleOrder {
  const status = mapIntakeStatus(intake.status);

  return {
    id: formatOrderId(intake),
    date: intake.created_at.slice(0, 10),
    type: intake.garment_types || intake.summary,
    quantity: intake.quantity_estimate || 1,
    status,
    statusLabel: ORDER_STATUS_LABELS[status],
    reason: intake.admin_note || undefined,
    productLink: intake.product_id ? `/shop/${intake.product_id}` : undefined,
  };
}

/* ------------------------------------------------------------------ */
/*  Circular Flow Diagram                                              */
/* ------------------------------------------------------------------ */

function CircularFlowDiagram() {
  const prefersReducedMotion = useReducedMotion();
  const radius = 130;
  const center = 170;
  const total = FLOW_STEPS.length;

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
      whileInView={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, ease: [0, 0, 0.2, 1] }}
      className="flex justify-center py-8"
    >
      <svg viewBox="0 0 340 340" className="w-64 h-64 md:w-80 md:h-80" aria-label="循环流程图">
        {/* Connecting arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-rust/20"
          strokeWidth={2}
          strokeDasharray="6 4"
        />
        {/* Arrow arcs between nodes */}
        {FLOW_STEPS.map((_, i) => {
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
        {/* Step nodes */}
        {FLOW_STEPS.map((step, i) => {
          const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
          const x = center + Math.cos(angle) * radius;
          const y = center + Math.sin(angle) * radius;
          return (
            <g key={step}>
              <circle cx={x} cy={y} r={28} className="fill-paper stroke-rust/40" strokeWidth={1.5} />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-ink font-body"
                fontSize={11}
              >
                {step}
              </text>
            </g>
          );
        })}
      </svg>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function ClothingRecycle() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const prefersReducedMotion = useReducedMotion();
  const ordersSectionRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuthStore();

  /* --- Form state --- */
  const [description, setDescription] = useState('');
  const [clothingType, setClothingType] = useState('tshirt');
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState('like-new');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  /* --- Order tab state --- */
  const [activeTab, setActiveTab] = useState<OrderStatus>('all');

  const { data: intakeOrders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['my-clothing-intakes'],
    queryFn: () => clothingIntakesApi.mine(),
    enabled: isAuthenticated,
  });

  const userOrders = useMemo(() => intakeOrders.map(mapIntakeToOrder), [intakeOrders]);

  const filteredOrders = useMemo(
    () => activeTab === 'all' ? userOrders : userOrders.filter((o) => o.status === activeTab),
    [userOrders, activeTab],
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };


  const createIntakeMutation = useMutation({
    mutationFn: () =>
      clothingIntakesApi.create({
        summary: description.trim(),
        garment_types: TYPE_LABEL_MAP[clothingType] || clothingType,
        quantity_estimate: quantity,
        condition_notes: [CONDITION_LABEL_MAP[condition], notes.trim(), photos.length > 0 ? `附 ${photos.length} 张照片` : null]
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

      setTimeout(() => {
        ordersSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    createIntakeMutation.mutate();
  };

  /* --- Animation helpers --- */
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
      {/* Disclaimer banner */}
      <div className="bg-aged-stock/40 border-b border-rust/20 px-4 py-2 flex items-center justify-center gap-2">
        <svg className="w-4 h-4 text-sepia-mid flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <span className="text-sepia-mid text-xs">商品展示为示例内容，登录后的回收申请与进度会接入真实用户数据</span>
      </div>

      {/* ============================================================ */}
      {/*  Section 01 - 循环时尚理念                                      */}
      {/* ============================================================ */}
      <PaperTextureBackground variant="paper" className="py-20 md:py-32 relative">
        <GrainOverlay />
        <SectionContainer>
          <NumberedSectionHeading
            number="01"
            title={t('clothingRecycle.heroTitle', '循环时尚理念')}
            subtitle={t(
              'clothingRecycle.heroSubtitle',
              '让旧衣焕发新生 -- 从提交、审核到重新上架，每一件旧衣都在循环中找到新的归宿。',
            )}
          />

          {/* Impact stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 mt-12 md:mt-16">
            <ImpactCounter
              value={12000}
              suffix="+"
              label={t('clothingRecycle.statRecycled', '已回收旧衣 (件)')}
            />
            <ImpactCounter
              value={8500}
              suffix=" kg"
              label={t('clothingRecycle.statCarbon', '减少碳排放 CO₂')}
            />
            <ImpactCounter
              value={87}
              suffix="%"
              label={t('clothingRecycle.statRate', '循环利用率')}
            />
          </div>

          {/* Circular Flow Diagram */}
          <motion.div {...fadeUp(0.2)} className="mt-16">
            <p className="font-body text-caption text-sepia-mid tracking-[0.15em] uppercase text-center mb-4">
              {t('clothingRecycle.flowTitle', '循环闭环流程')}
            </p>
            <CircularFlowDiagram />
          </motion.div>
        </SectionContainer>
      </PaperTextureBackground>

      <MagazineDivider variant="decorative" />

      {/* ============================================================ */}
      {/*  Section 02 - 提交旧衣                                         */}
      {/* ============================================================ */}
      <PaperTextureBackground variant="aged" className="py-16 md:py-24 relative">
        <GrainOverlay />
        <SectionContainer>
          <NumberedSectionHeading
            number="02"
            title={t('clothingRecycle.submitTitle', '提交旧衣')}
            subtitle={t(
              'clothingRecycle.submitSubtitle',
              '填写以下表单，提交您的旧衣回收申请。运营团队将在 1-3 个工作日内完成审核。',
            )}
          />

          <motion.form
            {...fadeUp()}
            onSubmit={handleSubmit}
            className="max-w-xl space-y-6 border border-rust/30 p-6 md:p-10 bg-paper/90"
          >
            {!isAuthenticated && (
              <div className="border border-rust/30 bg-rust/5 p-4">
                <p className="font-body text-body-sm text-ink mb-3">
                  登录后可提交回收申请，并在个人中心查看同一条回收记录。
                </p>
                <div className="flex gap-3">
                  <Link
                    to="/login"
                    className="font-body text-caption text-paper bg-ink px-4 py-2 tracking-[0.1em] uppercase"
                  >
                    立即登录
                  </Link>
                  <Link
                    to="/register"
                    className="font-body text-caption text-rust border border-rust/30 px-4 py-2 tracking-[0.1em] uppercase"
                  >
                    注册账号
                  </Link>
                </div>
              </div>
            )}

            <VintageInput
              label={t('clothingRecycle.fieldDescription', '衣物描述 *')}
              value={description}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              placeholder="简要描述您要回收的衣物"
              required
            />

            <VintageSelect
              label={t('clothingRecycle.fieldType', '衣物类型')}
              options={typeOptions}
              value={clothingType}
              onChange={(e) => setClothingType(e.target.value)}
            />

            <VintageInput
              label={t('clothingRecycle.fieldQuantity', '数量')}
              type="number"
              value={String(quantity)}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                setQuantity(Number(e.target.value) || 1)
              }
              min={1}
            />

            <VintageSelect
              label={t('clothingRecycle.fieldCondition', '衣物状况')}
              options={conditionOptions}
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            />

            {/* Notes textarea */}
            <VintageInput
              label={t('clothingRecycle.fieldNotes', '备注说明')}
              type="textarea"
              value={notes}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                setNotes(e.target.value)
              }
              placeholder="如有特殊情况请在此说明"
            />

            {/* Photo upload area */}
            <div className="space-y-2">
              <span className="font-body text-overline tracking-[0.2em] uppercase text-sepia-mid block">
                {t('clothingRecycle.fieldPhotos', '上传旧衣照片')}
              </span>
              <label
                htmlFor="photo-upload"
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-rust/30 rounded py-8 cursor-pointer hover:border-rust/50 transition-colors bg-aged-stock/30"
              >
                <svg
                  className="w-8 h-8 text-sepia-mid"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16v-8m0 0l-3 3m3-3l3 3M3 16.5V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18v-1.5M6.75 12l.004-.002"
                  />
                </svg>
                <span className="font-body text-caption text-sepia-mid">
                  {photos.length > 0
                    ? `${photos.length} 个文件已选择`
                    : '点击上传照片'}
                </span>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            <VintageInput
              label={t('clothingRecycle.fieldAddress', '取件地址 *')}
              value={address}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                setAddress(e.target.value)
              }
              placeholder="请填写详细取件地址"
              required
            />

            <VintageInput
              label={t('clothingRecycle.fieldPhone', '联系电话 *')}
              value={phone}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                setPhone(e.target.value)
              }
              placeholder="11位手机号码"
              required
            />

            {/* Submit button */}
            <motion.button
              type="submit"
              whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              disabled={createIntakeMutation.isPending}
              className="w-full py-3 font-body text-body-sm tracking-[0.15em] uppercase bg-rust text-paper border border-rust hover:bg-rust/90 transition-colors disabled:opacity-60"
            >
              {submitted
                ? t('clothingRecycle.submitSuccess', '提交成功!')
                : createIntakeMutation.isPending
                  ? t('common.loading', '提交中…')
                  : t('clothingRecycle.submitBtn', '提交回收申请')}
            </motion.button>
            {createIntakeMutation.isError && (
              <p className="font-body text-caption text-rust" role="alert">
                提交失败，请稍后重试。
              </p>
            )}
          </motion.form>
        </SectionContainer>
      </PaperTextureBackground>

      <MagazineDivider variant="decorative" />

      {/* ============================================================ */}
      {/*  Section 03 - 我的回收订单                                      */}
      {/* ============================================================ */}
      <div ref={ordersSectionRef}>
      <PaperTextureBackground variant="paper" className="py-16 md:py-24 relative">
        <GrainOverlay />
        <SectionContainer>
          <NumberedSectionHeading
            number="03"
            title={t('clothingRecycle.ordersTitle', '我的回收订单')}
            subtitle={t(
              'clothingRecycle.ordersSubtitle',
              '追踪您的旧衣回收进度，查看审核状态与处理结果。',
            )}
          />

          {!isAuthenticated ? (
            <motion.div {...fadeUp()} className="border border-rust/20 bg-aged-stock/30 p-6 text-center">
              <p className="font-body text-body-sm text-ink mb-4">
                登录后即可在这里查看与你个人中心同步的回收进度。
              </p>
              <Link
                to="/login"
                className="font-body text-caption text-rust tracking-[0.1em] uppercase hover:underline"
              >
                前往登录 →
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
                    className={`font-body text-caption tracking-[0.1em] uppercase px-4 py-2 border transition-colors ${
                      activeTab === tab.key
                        ? 'bg-rust text-paper border-rust'
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
                    {t('common.loading', '加载中…')}
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
                          订单号
                        </span>
                        <span className="font-body text-body-sm text-ink">{order.id}</span>
                      </div>
                      <div>
                        <span className="font-body text-overline text-sepia-mid tracking-[0.1em] uppercase block mb-1">
                          提交日期
                        </span>
                        <span className="font-body text-body-sm text-ink">{order.date}</span>
                      </div>
                      <div>
                        <span className="font-body text-overline text-sepia-mid tracking-[0.1em] uppercase block mb-1">
                          衣物类型
                        </span>
                        <span className="font-body text-body-sm text-ink">{order.type}</span>
                      </div>
                      <div>
                        <span className="font-body text-overline text-sepia-mid tracking-[0.1em] uppercase block mb-1">
                          数量
                        </span>
                        <span className="font-body text-body-sm text-ink">{order.quantity} 件</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 md:flex-col md:items-end md:gap-2">
                      <span
                        className={`inline-block font-body text-overline tracking-[0.1em] px-3 py-1 rounded-sm ${STATUS_BADGE[order.status]}`}
                      >
                        {order.statusLabel}
                      </span>
                      {order.status === 'listed' && order.productLink && (
                        <Link
                          to={order.productLink}
                          className="font-body text-caption text-rust tracking-[0.1em] uppercase hover:underline"
                        >
                          查看商品 →
                        </Link>
                      )}
                      {order.status === 'rejected' && order.reason && (
                        <span className="font-body text-caption text-red-600 max-w-xs">
                          {order.reason}
                        </span>
                      )}
                      {order.status === 'pending' && (
                        <span className="font-body text-caption text-sepia-mid">
                          预计 1-3 个工作日
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}

                {!loadingOrders && filteredOrders.length === 0 && (
                  <p className="font-body text-body-sm text-sepia-mid text-center py-12">
                    {t('clothingRecycle.noOrders', '暂无该状态的订单')}
                  </p>
                )}
              </div>
            </>
          )}
        </SectionContainer>
      </PaperTextureBackground>
      </div>

      <MagazineDivider variant="decorative" />

      {/* ============================================================ */}
      {/*  Section 04 - 循环商品橱窗                                      */}
      {/* ============================================================ */}
      <PaperTextureBackground variant="aged" className="py-16 md:py-24 relative">
        <GrainOverlay />
        <SectionContainer>
          <NumberedSectionHeading
            number="04"
            title={t('clothingRecycle.showcaseTitle', '循环商品橱窗')}
            subtitle={t(
              'clothingRecycle.showcaseSubtitle',
              '来自回收的精选商品 -- 每一件都经过专业整理，焕然一新。',
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {MOCK_PRODUCTS.map((product, i) => (
              <motion.div key={product.id} {...fadeUp(i * 0.1)}>
                <EditorialCard
                  title={product.name}
                  image={product.image}
                  imageAlt={product.name}
                  index={i}
                  hoverEffect="lift"
                >
                  <div className="p-4 space-y-3">
                    <SepiaImageFrame
                      src={product.image}
                      alt={product.name}
                      aspectRatio="square"
                      size="full"
                    />
                    <span className="inline-block font-body text-overline tracking-[0.1em] px-2 py-0.5 bg-sage/10 text-sage border border-sage/30 rounded-sm">
                      ♻️ 循环再生
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-display text-body-sm font-bold text-ink">
                        {product.price}
                      </span>
                      <button
                        onClick={() => navigate(`/shop/${product.id}`)}
                        className="font-body text-caption text-rust tracking-[0.1em] uppercase hover:underline"
                      >
                        {t('clothingRecycle.viewDetail', '查看详情')}
                      </button>
                    </div>
                  </div>
                </EditorialCard>
              </motion.div>
            ))}
          </div>

          {/* Link to full shop */}
          <motion.div {...fadeUp(0.3)} className="text-center mt-12">
            <a
              href="/shop"
              className="font-body text-body-sm text-rust tracking-[0.15em] uppercase hover:underline transition-colors"
            >
              {t('clothingRecycle.browseMore', '浏览更多循环商品')} →
            </a>
          </motion.div>
        </SectionContainer>
      </PaperTextureBackground>
    </PageWrapper>
  );
}
