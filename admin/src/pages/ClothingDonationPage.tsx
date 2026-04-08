/**
 * 衣物捐献管理页面 (Clothing Donation Page)
 *
 * 功能说明：
 * - 展示用户提交的衣物捐献申请列表
 * - 支持按状态筛选（待处理、已收到、处理中、已转化、未通过）
 * - 提供分页浏览功能
 * - 显示捐献详细信息（类型、数量、描述、联系方式等）
 * - 支持查看关联的商品信息
 *
 * 使用场景：
 * 管理员审核和处理用户的衣物捐献请求，跟踪捐献物品的处理进度
 */

// 导入 React 状态管理钩子
import { useState } from 'react';

// 导入 React Query 数据请求钩子
import { useQuery } from '@tanstack/react-query';

// 导入国际化翻译钩子
import { useTranslation } from 'react-i18next';

// 导入数据表格组件
import DataTable from '../components/ui/DataTable';

// 导入表格列定义类型
import type { Column } from '../components/ui/DataTable';

// 导入分页组件
import Pagination from '../components/ui/Pagination';

// 导入状态标签组件
import StatusBadge from '../components/ui/StatusBadge';

// 导入 API 请求实例（Axios 封装）
import { api } from '../services/api';

// 导入日期处理库
import dayjs from 'dayjs';

/**
 * 衣物捐献数据接口定义
 */
interface ClothingDonation {
  id: number;              // 捐献记录唯一标识符
  donor_user_id?: number;  // 捐赠者用户 ID（可选）
  donor_phone?: string;    // 捐赠者联系电话（可选）
  donor_address?: string;  // 捐赠者地址（可选）
  item_type: string;       // 物品类型：clothing/accessory/shoes/other
  item_count: number;      // 物品数量
  item_description?: string; // 物品描述信息（可选）
  status: string;          // 当前处理状态
  product_id?: number;     // 关联转化后的商品 ID（可选）
  created_at: string;      // 提交时间（ISO 格式字符串）
}

export default function ClothingDonationPage() {
  // 获取翻译函数
  const { t } = useTranslation();

  // 当前页码状态，默认第 1 页
  const [page, setPage] = useState(1);

  // 当前筛选的状态值，空字符串表示显示全部
  const [statusFilter, setStatusFilter] = useState('');

  /**
   * 使用 React Query 获取衣物捐献数据
   * 通过 API 实例发送 GET 请求到 /clothing-donations 端点
   * queryKey 包含页码和状态筛选条件，任一变化都会触发重新请求
   */
  const { data, isLoading } = useQuery({
    queryKey: ['clothing-donations', page, statusFilter],
    queryFn: async () => {
      // 发送 GET 请求获取数据，包含分页和筛选参数
      const res = await api.get('/clothing-donations', {
        params: { page, page_size: 10, status: statusFilter || undefined },
        baseURL: '/api/v1',  // 使用 v1 版本的 API 基础路径
      });
      return res.data;
    },
  });

  // 从响应数据中提取捐献列表，若无数据则返回空数组
  const items: ClothingDonation[] = data?.data ?? [];

  // 提取总记录数用于分页计算
  const total = data?.total ?? 0;

  /**
   * 表格列定义配置
   * 定义每列的字段名、标题、宽度及自定义渲染逻辑
   * 所有列标题使用国际化翻译
   */
  const columns: Column<ClothingDonation>[] = [
    { key: 'id', title: t('clothingDonation.colId'), width: 80 },
    { key: 'item_type', title: t('clothingDonation.colType'), width: 90, render: (v) => t(`clothingDonation.type${v.charAt(0).toUpperCase() + v.slice(1)}`) },
    { key: 'item_count', title: t('clothingDonation.colItemCount'), width: 80 },
    { key: 'item_description', title: t('clothingDonation.colDescription'), width: 200, render: (v) => (v ? String(v).slice(0, 50) + (String(v).length > 50 ? '…' : '') : '-') },
    { key: 'donor_phone', title: t('clothingDonation.colPhone'), width: 120, render: (v) => v || '-' },
    { key: 'status', title: t('clothingDonation.colStatus'), width: 100, render: (v) => <StatusBadge status={v} /> },
    { key: 'product_id', title: t('clothingDonation.colLinkedProduct'), width: 90, render: (v) => (v ? `#${v}` : '-') },
    { key: 'created_at', title: t('clothingDonation.colSubmittedAt'), width: 160, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
  ];

  return (
    <div>
      {/* 页面标题区域 */}
      <div style={{ marginBottom: 20 }}>
        {/* 主标题：衣物捐献管理 */}
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
          {t('clothingDonation.title')}
        </h1>
        {/* 副标题说明文字 */}
        <p style={{ fontSize: 14, color: 'var(--color-sepia-mid)' }}>
          {t('clothingDonation.description')}
        </p>
      </div>

      {/* 状态筛选器 */}
      <div style={{ marginBottom: 16 }}>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '8px 12px',
            border: '1px solid var(--color-ink)',
            background: 'var(--color-paper)',
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
          }}
        >
          <option value="">{t('clothingDonation.filterAllStatuses')}</option>
          <option value="pending">{t('clothingDonation.statusPending')}</option>
          <option value="received">{t('clothingDonation.statusReceived')}</option>
          <option value="processing">{t('clothingDonation.statusProcessing')}</option>
          <option value="converted">{t('clothingDonation.statusConverted')}</option>
          <option value="rejected">{t('clothingDonation.statusRejected')}</option>
        </select>
      </div>

      {/* 数据表格组件 */}
      <DataTable
        columns={columns}
        data={items}
        loading={isLoading}
        rowKey="id"
      />

      {/* 分页组件 */}
      <Pagination
        page={page}
        totalPages={Math.ceil(total / 10)}
        total={total}
        pageSize={10}
        onPageChange={setPage}
      />
    </div>
  );
}
