import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import { fetchDonations } from '../services/api';
import type { Donation } from '../types';
import dayjs from 'dayjs';

export default function DonationPage() {
  const { t } = useTranslation();
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

  const getPaymentLabel = (v: string) => {
    const map: Record<string, string> = { wechat: t('donation.paymentWechat'), alipay: t('donation.paymentAlipay'), stripe: t('donation.paymentStripe'), paypal: t('donation.paymentPaypal') };
    return map[v] || v;
  };

  const columns: Column<Donation>[] = [
    { key: 'id', title: t('donation.colLedgerId'), width: 120, render: (v) => <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{v}</code> },
    { key: 'donorName', title: t('donation.colBenefactor'), minWidth: 150, render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'amount', title: t('donation.colGrantAmount'), width: 140, sorter: true, render: (v, r) => (
      <span style={{ fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'var(--font-display)', fontSize: '15px' }}>
        {r.currency === 'CNY' ? '\u00a5' : '$'}{v.toLocaleString()}
      </span>
    )},
    { key: 'paymentMethod', title: t('donation.colChannel'), width: 120, render: (v) => getPaymentLabel(v) },
    { key: 'campaignTitle', title: t('donation.colAssignedProject'), minWidth: 200, render: (v) => v || '-' },
    { key: 'status', title: t('donation.colState'), width: 120, render: (v) => <StatusBadge status={v} /> },
    { key: 'isAnonymous', title: t('donation.colAnon'), width: 80, render: (v) => v ? t('common.yes') : t('common.no') },
    { key: 'createdAt', title: t('donation.colRecordedAt'), width: 160, sorter: true, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
  ];

  const handleExport = () => {
    const csvHeader = t('donation.csvHeader');
    const csvRows = filteredData.map((d) =>
      `${d.id},${d.donorName},${d.amount},${d.currency},${getPaymentLabel(d.paymentMethod)},${d.campaignTitle || ''},${d.status},${d.isAnonymous ? t('donation.csvYes') : t('donation.csvNo')},${dayjs(d.createdAt).format('YYYY-MM-DD HH:mm')}`
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
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, fontFamily: 'var(--font-serif)' }}>{t('donation.title')}</h1>
          <p style={{ fontSize: 14, color: 'var(--color-sepia-mid)', maxWidth: '600px', lineHeight: 1.6 }}>
            {t('donation.description')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="secondary" onClick={handleExport}>{t('donation.btnExport')}</Button>
          <Button variant="primary">{t('donation.btnReport')}</Button>
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32,
      }}>
        {[
          { label: t('donation.summaryCurrentSelection'), value: filteredData.length, unit: t('donation.summaryRecordsUnit') },
          { label: t('donation.summaryAggregateValue'), value: `\u00a5${totalAmount.toLocaleString()}`, unit: t('donation.summaryCnyTotal') },
          { label: t('donation.summaryVerifiedSuccess'), value: filteredData.filter((d) => d.status === 'completed').length, unit: t('donation.summaryTransactionsUnit') },
          { label: t('donation.summarySystemErrors'), value: filteredData.filter((d) => d.status === 'failed').length, unit: t('donation.summaryActionRequired') },
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

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text" placeholder={t('donation.searchPlaceholder')}
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={filterStyle}
        />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={filterStyle}>
          <option value="">{t('donation.filterAllStates')}</option>
          <option value="completed">{t('donation.filterCompleted')}</option>
          <option value="pending">{t('donation.filterPending')}</option>
          <option value="failed">{t('donation.filterFailed')}</option>
          <option value="refunded">{t('donation.filterRefunded')}</option>
        </select>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} style={filterStyle}>
          <option value="">{t('donation.filterAllChannels')}</option>
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
