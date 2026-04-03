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
    { key: 'id', title: 'Ledger ID', width: 120, render: (v) => <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{v}</code> },
    { key: 'donorName', title: 'Benefactor', minWidth: 150, render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'amount', title: 'Grant Amount', width: 140, sorter: true, render: (v, r) => (
      <span style={{ fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'var(--font-display)', fontSize: '15px' }}>
        {r.currency === 'CNY' ? '\u00a5' : '$'}{v.toLocaleString()}
      </span>
    )},
    { key: 'paymentMethod', title: 'Channel', width: 120, render: (v) => paymentLabels[v] || v },
    { key: 'campaignTitle', title: 'Assigned Project', minWidth: 200, render: (v) => v || '-' },
    { key: 'status', title: 'State', width: 120, render: (v) => <StatusBadge status={v} /> },
    { key: 'isAnonymous', title: 'Anon', width: 80, render: (v) => v ? 'YES' : 'NO' },
    { key: 'createdAt', title: 'Recorded At', width: 160, sorter: true, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, fontFamily: 'var(--font-serif)' }}>Donation Ledger</h1>
          <p style={{ fontSize: 14, color: 'var(--color-sepia-mid)', maxWidth: '600px', lineHeight: 1.6 }}>
            Comprehensive record of philanthropic contributions. Each entry represents a unique transaction within our ecosystem, traceable to specific campaigns and sustainability goals.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="secondary" onClick={handleExport}>Export Data</Button>
          <Button variant="primary">Generate Report</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32,
      }}>
        {[
          { label: 'Current Selection', value: filteredData.length, unit: 'Records' },
          { label: 'Aggregate Value', value: `\u00a5${totalAmount.toLocaleString()}`, unit: 'CNY Total' },
          { label: 'Verified Success', value: filteredData.filter((d) => d.status === 'completed').length, unit: 'Transactions' },
          { label: 'System Errors', value: filteredData.filter((d) => d.status === 'failed').length, unit: 'Action Required' },
        ].map((s) => (
          <div key={s.label} style={{
            padding: '24px', 
            background: 'var(--color-paper)',
            border: '1px solid var(--color-ink)', 
            borderRadius: '2px',
            boxShadow: '4px 4px 0px rgba(26, 26, 22, 0.05)'
          }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-sepia-mid)', marginBottom: 12 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--color-archive-brown)', marginTop: 4 }}>{s.unit}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text" placeholder="Search benefactor name..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={filterStyle}
        />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={filterStyle}>
          <option value="">All States</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} style={filterStyle}>
          <option value="">All Channels</option>
          <option value="wechat">WeChat Pay</option>
          <option value="alipay">Alipay</option>
          <option value="stripe">Stripe</option>
          <option value="paypal">PayPal</option>
        </select>
      </div>

      <DataTable columns={columns} data={filteredData} rowKey="id" loading={isLoading} />
      
      <div style={{ marginTop: 32 }}>
        <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} pageSize={10} onPageChange={setPage} />
      </div>
    </div>
  );
}

const filterStyle: React.CSSProperties = {
  padding: '10px 16px', 
  border: '1px solid var(--color-ink)',
  borderRadius: '2px', 
  fontSize: '13px',
  background: 'var(--color-paper)', 
  outline: 'none',
  fontFamily: 'var(--font-mono)',
  minWidth: '240px'
};
