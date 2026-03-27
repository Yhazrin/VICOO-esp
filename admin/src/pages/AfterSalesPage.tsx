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
  approved: '已通过',
  rejected: '已拒绝',
  completed: '已完成',
};

const typeLabels: Record<string, string> = {
  return: '退货',
  exchange: '换货',
  repair: '维修',
};

interface AfterSales {
  id: number;
  order_id: number;
  user_id: number;
  type: string;
  reason: string;
  status: string;
  created_at: string;
}

export default function AfterSalesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['after-sales', page, statusFilter],
    queryFn: async () => {
      const res = await api.get('/after-sales', {
        params: { page, page_size: 10, status: statusFilter || undefined },
        baseURL: '/api/v1',
      });
      return res.data;
    },
  });

  const items: AfterSales[] = data?.data ?? [];
  const total = data?.total ?? 0;

  const columns: Column<AfterSales>[] = [
    { key: 'id', title: 'ID', width: 80 },
    { key: 'order_id', title: '订单 ID', width: 90 },
    { key: 'user_id', title: '用户 ID', width: 90 },
    { key: 'type', title: '类型', width: 80, render: (v) => typeLabels[v] || v },
    { key: 'reason', title: '原因', width: 200, render: (v) => (v ? String(v).slice(0, 40) + (String(v).length > 40 ? '…' : '') : '-') },
    { key: 'status', title: '状态', width: 100, render: (v) => <StatusBadge status={v} /> },
    { key: 'created_at', title: '申请时间', width: 160, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>售后管理</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          处理用户的退货、换货、维修申请
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
