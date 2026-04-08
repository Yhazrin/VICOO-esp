import type {
  User, Artwork, Campaign, Donation, Order,
  ChildParticipant, AuditLogEntry, DashboardMetrics,
  ChartDataPoint, SystemSettings,
} from '../types';

// Deterministic seeded PRNG — replaces Math.random() for stable mock data
function seeded(seed: number): number {
  // Simple hash: returns deterministic 0..1 value from integer seed
  let h = seed;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 0xFFFFFFFF;
}

// Helper for deterministic dates
const randomDate = (start: string, end: string, seed: number) => {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return new Date(s + seeded(seed) * (e - s)).toISOString();
};

const statuses: Artwork['status'][] = ['pending', 'approved', 'rejected', 'archived'];
const categories = ['油画', '水彩', '素描', '蜡笔画', '拼贴', '数字艺术'];
const regions = ['北京市', '上海市', '广州市', '成都市', '西安市', '杭州市', '南京市', '重庆市'];
const paymentMethods: Donation['paymentMethod'][] = ['wechat', 'alipay', 'stripe', 'paypal'];
const orderStatuses: Order['status'][] = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];

// Mock Users
export const mockUsers: User[] = Array.from({ length: 48 }, (_, i) => ({
  id: `user-${String(i + 1).padStart(3, '0')}`,
  username: ['张明', '李华', '王芳', '刘洋', '陈静', '赵磊', '孙丽', '周杰', '吴敏', '郑伟'][i % 10] + (i > 9 ? i : ''),
  email: `user${i + 1}@tonghua.org`,
  phone: `138${String(Math.floor(seeded(i * 101) * 100000000)).padStart(8, '0')}`,
  role: i === 0 ? 'admin' : (['editor', 'viewer', 'auditor'] as User['role'][])[i % 3],
  status: i < 40 ? 'active' : (['disabled', 'pending'] as User['status'][])[i % 2],
  createdAt: randomDate('2024-01-01', '2025-12-31', i * 7 + 1),
  lastLogin: randomDate('2025-01-01', '2026-03-19', i * 7 + 2),
}));

// Mock Artworks
export const mockArtworks: Artwork[] = Array.from({ length: 86 }, (_, i) => ({
  id: `art-${String(i + 1).padStart(3, '0')}`,
  title: [
    '春天的花园', '我的家乡', '彩虹下的奔跑', '快乐的节日', '星空梦想',
    '绿色地球', '温暖的家', '友谊之手', '海洋世界', '未来城市',
    '乡村小路', '美丽的蝴蝶', '蓝天白云', '丰收的季节', '冬日雪景',
  ][i % 15],
  description: '小朋友用画笔描绘的美丽世界，充满了想象力和对美好生活的向往。',
  childName: ['小明', '小红', '小华', '小丽', '小强', '小芳', '小军', '小燕'][i % 8],
  childAge: 5 + (i % 8),
  imageUrl: `/placeholder/artwork-${(i % 6) + 1}.jpg`,
  status: statuses[i % 4],
  category: categories[i % categories.length],
  campaignId: `camp-${(i % 5) + 1}`,
  votes: Math.floor(seeded(i * 31) * 500) + 10,
  createdAt: randomDate('2025-01-01', '2026-03-01', i * 7 + 3),
  reviewedAt: i % 4 !== 0 ? randomDate('2025-02-01', '2026-03-19', i * 7 + 4) : undefined,
  reviewedBy: i % 4 !== 0 ? '管理员' : undefined,
}));

// Mock Campaigns
export const mockCampaigns: Campaign[] = [
  {
    id: 'camp-1', title: '2025 春季童画展', description: '面向全国儿童征集春日主题画作',
    startDate: '2025-03-01', endDate: '2025-05-31', status: 'ended',
    targetAmount: 500000, raisedAmount: 423000, participantCount: 1280,
    artworkCount: 2100, createdAt: '2025-01-15',
  },
  {
    id: 'camp-2', title: '2025 夏季公益画展', description: '以"绿色地球"为主题的环保公益画展',
    startDate: '2025-06-01', endDate: '2025-08-31', status: 'ended',
    targetAmount: 800000, raisedAmount: 756000, participantCount: 2100,
    artworkCount: 3400, createdAt: '2025-04-20',
  },
  {
    id: 'camp-3', title: '2025 秋季童画公益', description: '描绘温暖的家庭与友谊故事',
    startDate: '2025-09-01', endDate: '2025-11-30', status: 'ended',
    targetAmount: 600000, raisedAmount: 580000, participantCount: 1800,
    artworkCount: 2800, createdAt: '2025-07-10',
  },
  {
    id: 'camp-4', title: '2026 新年童画', description: '新年主题画作征集，描绘新年愿望',
    startDate: '2025-12-15', endDate: '2026-02-28', status: 'ended',
    targetAmount: 700000, raisedAmount: 680000, participantCount: 1500,
    artworkCount: 2400, createdAt: '2025-10-25',
  },
  {
    id: 'camp-5', title: '2026 春季童画节', description: '以"多彩梦想"为主题的春季画展',
    startDate: '2026-03-01', endDate: '2026-05-31', status: 'active',
    targetAmount: 900000, raisedAmount: 125000, participantCount: 450,
    artworkCount: 680, createdAt: '2026-01-10',
  },
  {
    id: 'camp-6', title: '2026 暑期公益计划', description: '暑期儿童艺术教育公益项目',
    startDate: '2026-07-01', endDate: '2026-08-31', status: 'draft',
    targetAmount: 1000000, raisedAmount: 0, participantCount: 0,
    artworkCount: 0, createdAt: '2026-03-05',
  },
];

// Mock Donations
export const mockDonations: Donation[] = Array.from({ length: 120 }, (_, i) => ({
  id: `don-${String(i + 1).padStart(4, '0')}`,
  donorName: i % 5 === 0 ? '匿名好心人' : ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'][i % 8],
  donorEmail: `donor${i + 1}@example.com`,
  amount: [10, 20, 50, 100, 200, 500, 1000, 2000, 5000][i % 9],
  currency: paymentMethods[i % 4] === 'stripe' || paymentMethods[i % 4] === 'paypal' ? 'USD' : 'CNY',
  paymentMethod: paymentMethods[i % 4],
  status: i % 10 === 0 ? 'pending' : i % 15 === 0 ? 'failed' : 'completed',
  campaignId: `camp-${(i % 5) + 1}`,
  campaignTitle: ['2025 春季童画展', '2025 夏季公益画展', '2025 秋季童画公益', '2026 新年童画', '2026 春季童画节'][i % 5],
  message: i % 3 === 0 ? '希望孩子们的画能被更多人看到！' : undefined,
  isAnonymous: i % 5 === 0,
  transactionId: `TXN${20250000 + i}`,
  createdAt: randomDate('2025-01-01', '2026-03-19', i * 7 + 5),
}));

// Mock Orders
const productNames = ['童画T恤', '公益帆布包', '画作明信片套装', '儿童画册', '公益徽章套装', '艺术围裙', '蜡笔礼盒', '画框套装'];

export const mockOrders: Order[] = Array.from({ length: 95 }, (_, i) => ({
  id: `ord-${String(i + 1).padStart(4, '0')}`,
  orderNo: `TH${20250000 + i + 1}`,
  userId: `user-${String((i % 30) + 1).padStart(3, '0')}`,
  userName: ['张明', '李华', '王芳', '刘洋', '陈静', '赵磊', '孙丽', '周杰'][i % 8],
  items: [
    {
      productId: `prod-${(i % 8) + 1}`,
      productName: productNames[i % 8],
      quantity: (i % 3) + 1,
      price: [89, 59, 39, 49, 29, 69, 99, 129][i % 8],
    },
  ],
  totalAmount: [89, 59, 39, 49, 29, 69, 99, 129][i % 8] * ((i % 3) + 1),
  status: orderStatuses[i % orderStatuses.length],
  paymentMethod: ['wechat', 'alipay'][i % 2],
  shippingAddress: `${regions[i % regions.length]}某区某路${i + 1}号`,
  trackingNo: i % 6 >= 2 && i % 6 <= 3 ? `SF${String(Math.floor(seeded(i * 53) * 10000000000)).padStart(10, '0')}` : undefined,
  createdAt: randomDate('2025-01-01', '2026-03-19', i * 7 + 6),
  paidAt: i % 6 !== 0 ? randomDate('2025-01-02', '2026-03-19', i * 7 + 7) : undefined,
  shippedAt: i % 6 >= 2 ? randomDate('2025-01-05', '2026-03-19', i * 7 + 8) : undefined,
}));

// Mock Child Participants
export const mockChildParticipants: ChildParticipant[] = Array.from({ length: 35 }, (_, i) => ({
  id: `child-${String(i + 1).padStart(3, '0')}`,
  childName: ['陈小春', '林小明', '黄小红', '杨小华', '朱小丽', '何小强', '高小芳', '梁小军'][i % 8] + (i > 7 ? `${i}` : ''),
  age: 5 + (i % 8),
  guardianName: ['陈大明', '林大力', '黄国庆', '杨秀英', '朱建华', '何志远', '高明辉', '梁永强'][i % 8],
  guardianPhone: `138${String(Math.floor(seeded(i * 103) * 100000000)).padStart(8, '0')}`,
  guardianEmail: `guardian${i + 1}@example.com`,
  consentGiven: true,
  consentDate: randomDate('2024-06-01', '2025-12-31', i * 7 + 9),
  region: regions[i % regions.length],
  school: ['阳光小学', '希望小学', '育才小学', '实验小学', '第一小学'][i % 5],
  artworkCount: Math.floor(seeded(i * 37) * 10) + 1,
  status: i < 30 ? 'active' : (['withdrawn', 'pending_review'] as ChildParticipant['status'][])[(i - 30) % 2],
  createdAt: randomDate('2024-06-01', '2025-12-31', i * 7 + 10),
  lastActivity: randomDate('2025-06-01', '2026-03-19', i * 7 + 11),
}));

// Mock Audit Logs
const auditActions = ['登录系统', '审核作品', '修改用户角色', '导出数据', '修改设置', '创建活动', '处理捐赠', '更新订单状态', '查看儿童信息', '删除数据'];
const auditResources = ['用户', '作品', '活动', '捐赠', '订单', '系统设置', '儿童参与者', '报告'];

export const mockAuditLogs: AuditLogEntry[] = Array.from({ length: 200 }, (_, i) => ({
  id: `log-${String(i + 1).padStart(4, '0')}`,
  userId: `user-${String((i % 10) + 1).padStart(3, '0')}`,
  userName: ['张明', '李华', '王芳', '刘洋', '陈静', '赵磊', '孙丽', '周杰', '吴敏', '郑伟'][i % 10],
  action: auditActions[i % auditActions.length],
  resource: auditResources[i % auditResources.length],
  resourceId: `res-${(i % 50) + 1}`,
  details: `${auditActions[i % auditActions.length]} - ${auditResources[i % auditResources.length]} #${(i % 50) + 1}`,
  ipAddress: `192.168.1.${(i % 254) + 1}`,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  timestamp: randomDate('2025-06-01', '2026-03-19', i * 7 + 12),
}));

// Mock After-Sales
export const mockAfterSales = Array.from({ length: 24 }, (_, i) => ({
  id: 1000 + i,
  order_id: 20250000 + i,
  user_id: (i % 30) + 1,
  type: ['return', 'exchange', 'repair'][i % 3],
  reason: ['尺寸不合适', '颜色有色差', '线头较多', '包装破损', '不喜欢了'][i % 5],
  status: ['pending', 'approved', 'rejected', 'completed'][i % 4],
  created_at: randomDate('2026-01-01', '2026-03-19', i * 7 + 13),
}));

// Dashboard Metrics
export const mockDashboardMetrics: DashboardMetrics = {
  totalArtworks: 86,
  pendingArtworks: 22,
  totalDonations: 120,
  totalDonationAmount: 256400,
  totalOrders: 95,
  totalUsers: 48,
  activeCampaigns: 1,
  childParticipants: 35,
};

// Chart Data
export const mockDonationTrend: ChartDataPoint[] = [
  { name: '2025-01', value: 12000, wechat: 5000, alipay: 4000, stripe: 2000, paypal: 1000 },
  { name: '2025-02', value: 18000, wechat: 7000, alipay: 6000, stripe: 3000, paypal: 2000 },
  { name: '2025-03', value: 25000, wechat: 10000, alipay: 8000, stripe: 4000, paypal: 3000 },
  { name: '2025-04', value: 22000, wechat: 9000, alipay: 7000, stripe: 3500, paypal: 2500 },
  { name: '2025-05', value: 30000, wechat: 12000, alipay: 10000, stripe: 5000, paypal: 3000 },
  { name: '2025-06', value: 28000, wechat: 11000, alipay: 9000, stripe: 4500, paypal: 3500 },
  { name: '2025-07', value: 35000, wechat: 14000, alipay: 11000, stripe: 6000, paypal: 4000 },
  { name: '2025-08', value: 32000, wechat: 13000, alipay: 10000, stripe: 5500, paypal: 3500 },
  { name: '2025-09', value: 27000, wechat: 11000, alipay: 8000, stripe: 5000, paypal: 3000 },
  { name: '2025-10', value: 31000, wechat: 12000, alipay: 10000, stripe: 5500, paypal: 3500 },
  { name: '2025-11', value: 29000, wechat: 11500, alipay: 9500, stripe: 5000, paypal: 3000 },
  { name: '2025-12', value: 38000, wechat: 15000, alipay: 12000, stripe: 7000, paypal: 4000 },
  { name: '2026-01', value: 42000, wechat: 17000, alipay: 13000, stripe: 7500, paypal: 4500 },
  { name: '2026-02', value: 36000, wechat: 14000, alipay: 11000, stripe: 6500, paypal: 4500 },
  { name: '2026-03', value: 15000, wechat: 6000, alipay: 5000, stripe: 2500, paypal: 1500 },
];

export const mockArtworkByCategory: ChartDataPoint[] = [
  { name: '油画', value: 18 },
  { name: '水彩', value: 22 },
  { name: '素描', value: 15 },
  { name: '蜡笔画', value: 12 },
  { name: '拼贴', value: 10 },
  { name: '数字艺术', value: 9 },
];

export const mockOrderTrend: ChartDataPoint[] = [
  { name: '2025-01', value: 8, revenue: 1200 },
  { name: '2025-02', value: 12, revenue: 1800 },
  { name: '2025-03', value: 15, revenue: 2250 },
  { name: '2025-04', value: 10, revenue: 1500 },
  { name: '2025-05', value: 18, revenue: 2700 },
  { name: '2025-06', value: 14, revenue: 2100 },
  { name: '2025-07', value: 20, revenue: 3000 },
  { name: '2025-08', value: 16, revenue: 2400 },
  { name: '2025-09', value: 22, revenue: 3300 },
  { name: '2025-10', value: 19, revenue: 2850 },
  { name: '2025-11', value: 25, revenue: 3750 },
  { name: '2025-12', value: 30, revenue: 4500 },
  { name: '2026-01', value: 28, revenue: 4200 },
  { name: '2026-02', value: 24, revenue: 3600 },
  { name: '2026-03', value: 10, revenue: 1500 },
];

export const mockUserGrowth: ChartDataPoint[] = [
  { name: '2025-01', value: 120 },
  { name: '2025-02', value: 185 },
  { name: '2025-03', value: 260 },
  { name: '2025-04', value: 340 },
  { name: '2025-05', value: 420 },
  { name: '2025-06', value: 530 },
  { name: '2025-07', value: 680 },
  { name: '2025-08', value: 820 },
  { name: '2025-09', value: 950 },
  { name: '2025-10', value: 1100 },
  { name: '2025-11', value: 1280 },
  { name: '2025-12', value: 1450 },
  { name: '2026-01', value: 1620 },
  { name: '2026-02', value: 1780 },
  { name: '2026-03', value: 1860 },
];

// Mock System Settings
export const mockSystemSettings: SystemSettings = {
  siteName: '童画公益',
  siteDescription: '童画公益 x 可持续时尚',
  contactEmail: 'admin@tonghua.org',
  donationEnabled: true,
  shopEnabled: true,
  registrationEnabled: true,
  maintenanceMode: false,
  paymentMethods: {
    wechat: { enabled: true, appId: 'wx_mock_app_id', merchantId: 'M12345678' },
    alipay: { enabled: true, appId: '2021_mock_alipay' },
    stripe: { enabled: true, publicKey: 'pk_test_mock_key' },
    paypal: { enabled: false, clientId: '' },
  },
};
