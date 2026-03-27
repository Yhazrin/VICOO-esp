import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import { fetchDonations } from '../services/api';
import type { Donation } from '../types';
import dayjs from 'dayjs';

const paymentLabels: Record<string, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  stripe: 'Stripe',
  paypal: 'PayPal',
};

export default function DonationPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['donations', page, statusFilter, search, paymentFilter],
    queryFn: () => fetchDonations({ page, pageSize: 10, status: statusFilter || undefined, search: search || undefined }),
  });

  const filteredData = useMemo(() => {
    if (!data?.data) return [];
    let items = data.data;
    if (paymentFilter) {
      items = items.filter((d) => d.paymentMethod === paymentFilter);
    }
    return items;
  }, [data, paymentFilter]);

  const totalAmount = useMemo(() => {
    return filteredData.filter((d) => d.status === 'completed').reduce((sum, d) => sum + d.amount, 0);
  }, [filteredData]);

  const columns: Column<Donation>[] = [
    { key: 'id', title: 'ID', width: 90 },
    { key: 'donorName', title: '捐赠者' },
    { key: 'amount', title: '金额', width: 120, sorter: true, render: (v, r) => (
      <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>
        {r.currency === 'CNY' ? '\u00a5' : '$'}{v.toLocaleString()}
      </span>
    )},
    { key: 'paymentMethod', title: '支付方式', width: 100, render: (v) => paymentLabels[v] || v },
    { key: 'campaignTitle', title: '关联活动', width: 160, render: (v) => v || '-' },
    { key: 'status', title: '状态', width: 100, render: (v) => <StatusBadge status={v} /> },
    { key: 'isAnonymous', title: '匿名', width: 60, render: (v) => v ? '是' : '否' },
    { key: 'createdAt', title: '捐赠时间', width: 160, sorter: true, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
  ];

  const handleExport = () => {
    const csvHeader = 'ID,捐赠者,金额,币种,支付方式,关联活动,状态,匿名,捐赠时间\n';
    const csvRows = filteredData.map((d) =>
      `${d.id},${d.donorName},${d.amount},${d.currency},${paymentLabels[d.paymentMethod]},${d.campaignTitle || ''},${d.status},${d.isAnonymous ? '是' : '否'},${dayjs(d.createdAt).format('YYYY-MM-DD HH:mm')}`
    ).join('\n');
    const blob = new Blob(['\ufeff' + csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donations_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>捐赠管理</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            查看捐赠记录与生成报告
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={handleExport}>导出 CSV</Button>
          <Button variant="primary">生成报告</Button>
        </div>
      </div>

      {/* Summary */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20,
      }}>
        {[
          { label: '本页总笔数', value: filteredData.length },
          { label: '本页总额', value: `\u00a5${totalAmount.toLocaleString()}` },
          { label: '完成笔数', value: filteredData.filter((d) => d.status === 'completed').length },
          { label: '失败笔数', value: filteredData.filter((d) => d.status === 'failed').length },
        ].map((s) => (
          <div key={s.label} style={{
            padding: '16px 20px', background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
          }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text" placeholder="搜索捐赠者..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={filterStyle}
        />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={filterStyle}>
          <option value="">全部状态</option>
          <option value="completed">已完成</option>
          <option value="pending">待处理</option>
          <option value="failed">失败</option>
          <option value="refunded">已退款</option>
        </select>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} style={filterStyle}>
          <option value="">全部支付方式</option>
          <option value="wechat">微信支付</option>
          <option value="alipay">支付宝</option>
          <option value="stripe">Stripe</option>
          <option value="paypal">PayPal</option>
        </select>
      </div>

      <DataTable columns={columns} data={filteredData} rowKey="id" loading={isLoading} />
      <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} pageSize={10} onPageChange={setPage} />
    </div>
  );
}

const filterStyle: React.CSSProperties = {
  padding: '8px 12px', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)', fontSize: 13,
  background: 'var(--color-bg-card)', outline: 'none',
};
