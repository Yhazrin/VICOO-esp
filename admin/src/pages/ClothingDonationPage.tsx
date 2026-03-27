import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import StatusBadge from '../components/ui/StatusBadge';
import { api } from '../services/api';
import dayjs from 'dayjs';

const statusLabels: Record<string, string> = {
  pending: '待处理',
  received: '已收到',
  processing: '处理中',
  converted: '已转化',
  rejected: '未通过',
};

const itemTypeLabels: Record<string, string> = {
  clothing: '衣物',
  accessory: '配饰',
  shoes: '鞋履',
  other: '其他',
};

interface ClothingDonation {
  id: number;
  donor_user_id?: number;
  donor_phone?: string;
  donor_address?: string;
  item_type: string;
  item_count: number;
  item_description?: string;
  status: string;
  product_id?: number;
  created_at: string;
}

export default function ClothingDonationPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['clothing-donations', page, statusFilter],
    queryFn: async () => {
      const res = await api.get('/clothing-donations', {
        params: { page, page_size: 10, status: statusFilter || undefined },
        baseURL: '/api/v1',
      });
      return res.data;
    },
  });

  const items: ClothingDonation[] = data?.data ?? [];
  const total = data?.total ?? 0;

  const columns: Column<ClothingDonation>[] = [
    { key: 'id', title: 'ID', width: 80 },
    { key: 'item_type', title: '类型', width: 90, render: (v) => itemTypeLabels[v] || v },
    { key: 'item_count', title: '数量', width: 80 },
    { key: 'item_description', title: '描述', width: 200, render: (v) => (v ? String(v).slice(0, 50) + (String(v).length > 50 ? '…' : '') : '-') },
    { key: 'donor_phone', title: '联系电话', width: 120, render: (v) => v || '-' },
    { key: 'status', title: '状态', width: 100, render: (v) => <StatusBadge status={v} /> },
    { key: 'product_id', title: '关联商品', width: 90, render: (v) => (v ? `#${v}` : '-') },
    { key: 'created_at', title: '提交时间', width: 160, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>衣物捐献管理</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          查看与处理用户捐献的闲置衣物
        </p>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
        >
          <option value="">全部状态</option>
          {Object.entries(statusLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <DataTable columns={columns} data={items} loading={isLoading} />

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={10}
          total={total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
