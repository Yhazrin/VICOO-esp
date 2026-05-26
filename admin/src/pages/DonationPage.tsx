import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import { fetchDonations, approveDonationAdmin } from '../services/api';
import type { Donation } from '../types';
import dayjs from 'dayjs';
import html2pdf from 'html2pdf.js';

export default function DonationPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['donations', page, statusFilter, search, paymentFilter],
    queryFn: () =>
      fetchDonations({
        page,
        pageSize: 10,
        status: statusFilter || undefined,
        search: search || undefined,
        paymentMethod: paymentFilter || undefined,
      }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveDonationAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
      toast.success(t('donation.toastApproveSuccess'));
    },
    onError: () => {
      toast.error(t('donation.toastApproveError'));
    },
  });

  const filteredData = useMemo(() => data?.data ?? [], [data?.data]);

  const displaySummary = useMemo(() => {
    const s = data?.summary;
    if (s) {
      return {
        selectionTotal: s.selectionTotal,
        completedAmount: parseFloat(s.completedAmountTotal) || 0,
        completedCount: s.completedCount,
        failedCount: s.failedCount,
      };
    }
    const items = filteredData;
    return {
      selectionTotal: items.length,
      completedAmount: items.filter((d) => d.status === 'completed').reduce((sum, d) => sum + d.amount, 0),
      completedCount: items.filter((d) => d.status === 'completed').length,
      failedCount: items.filter((d) => d.status === 'failed').length,
    };
  }, [data?.summary, filteredData]);

  const getPaymentLabel = (v: string) => {
    const map: Record<string, string> = { wechat: t('donation.paymentWechat'), alipay: t('donation.paymentAlipay'), stripe: t('donation.paymentStripe'), paypal: t('donation.paymentPaypal') };
    return map[v] || v;
  };

  const getStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      completed: t('donation.filterCompleted'),
      pending: t('donation.filterPending'),
      failed: t('donation.filterFailed'),
      refunded: t('donation.filterRefunded'),
    };
    return map[s] || s;
  };

  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const columns: Column<Donation>[] = [
    { key: 'id', title: t('donation.colLedgerId'), width: 120, render: (v) => <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{v}</code> },
    { key: 'donorName', title: t('donation.colBenefactor'), minWidth: 150, render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'amount', title: t('donation.colGrantAmount'), width: 140, sorter: true, render: (v, r) => (
      <span style={{ fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-body)', fontSize: '15px' }}>
        {r.currency === 'CNY' ? '\u00a5' : '$'}{v.toLocaleString()}
      </span>
    )},
    { key: 'paymentMethod', title: t('donation.colChannel'), width: 120, render: (v) => getPaymentLabel(v) },
    { key: 'campaignTitle', title: t('donation.colAssignedProject'), minWidth: 200, render: (v) => v || '-' },
    { key: 'status', title: t('donation.colState'), width: 120, render: (v) => <StatusBadge status={v} context="donation" /> },
    { key: 'isAnonymous', title: t('donation.colAnon'), width: 80, render: (v) => v ? t('common.yes') : t('common.no') },
    { key: 'createdAt', title: t('donation.colRecordedAt'), width: 160, sorter: true, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      key: 'action',
      title: t('donation.colAction'),
      width: 120,
      render: (_: unknown, record: Donation) =>
        record.status === 'pending' ? (
          <Button
            size="sm"
            variant="primary"
            disabled={approveMutation.isPending}
            onClick={(e) => {
              e.stopPropagation();
              approveMutation.mutate(record.id);
            }}
          >
            {t('donation.btnApproveReview')}
          </Button>
        ) : null,
    },
  ];

  const csvEscape = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const handleExport = () => {
    const csvHeader = t('donation.csvHeader');
    const csvRows = filteredData.map((d) =>
      `${d.id},${csvEscape(d.donorName)},${d.amount},${d.currency},${csvEscape(getPaymentLabel(d.paymentMethod))},${csvEscape(d.campaignTitle || '')},${d.status},${d.isAnonymous ? t('donation.csvYes') : t('donation.csvNo')},${dayjs(d.createdAt).format('YYYY-MM-DD HH:mm')}`
    ).join('\n');
    const blob = new Blob(['\ufeff' + csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donations_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReport = async () => {
    if (!filteredData.length) {
      toast.error(t('donation.reportEmpty'));
      return;
    }
    const completedCount = displaySummary.completedCount;
    const failedCount = displaySummary.failedCount;
    const thead = `
      <tr>
        <th>${escapeHtml(t('donation.colLedgerId'))}</th>
        <th>${escapeHtml(t('donation.colBenefactor'))}</th>
        <th>${escapeHtml(t('donation.colGrantAmount'))}</th>
        <th>${escapeHtml(t('donation.colChannel'))}</th>
        <th>${escapeHtml(t('donation.colAssignedProject'))}</th>
        <th>${escapeHtml(t('donation.colState'))}</th>
        <th>${escapeHtml(t('donation.colAnon'))}</th>
        <th>${escapeHtml(t('donation.colRecordedAt'))}</th>
      </tr>`;
    const tbody = filteredData.map((d) => {
      const amt = d.currency === 'CNY' ? `¥${d.amount.toLocaleString()}` : `$${d.amount.toLocaleString()}`;
      return `<tr>
        <td>${escapeHtml(String(d.id))}</td>
        <td>${escapeHtml(d.donorName)}</td>
        <td>${escapeHtml(amt)}</td>
        <td>${escapeHtml(getPaymentLabel(d.paymentMethod))}</td>
        <td>${escapeHtml(d.campaignTitle || '')}</td>
        <td>${escapeHtml(getStatusLabel(d.status))}</td>
        <td>${d.isAnonymous ? escapeHtml(t('donation.csvYes')) : escapeHtml(t('donation.csvNo'))}</td>
        <td>${escapeHtml(dayjs(d.createdAt).format('YYYY-MM-DD HH:mm'))}</td>
      </tr>`;
    }).join('');
    const inner = `
  <style>
    .report-root { font-family: system-ui, "Segoe UI", "Microsoft YaHei", "PingFang SC", sans-serif; padding: 24px; color: #111; box-sizing: border-box; -webkit-font-smoothing: antialiased; }
    h1 { font-size: 1.35rem; margin: 0 0 0.25rem; }
    .meta { color: #555; font-size: 0.9rem; margin-bottom: 20px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px 14px; background: #fafafa; }
    .card .label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: #666; }
    .card .value { font-size: 1.25rem; font-weight: 700; margin-top: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
    th { background: #f0f0f0; }
  </style>
  <div class="report-root">
    <h1>${escapeHtml(t('donation.title'))}</h1>
    <div class="meta">${escapeHtml(t('donation.reportGeneratedAt', { time: dayjs().format('YYYY-MM-DD HH:mm:ss') }))}</div>
    <div class="summary">
      <div class="card"><div class="label">${escapeHtml(t('donation.summaryCurrentSelection'))}</div><div class="value">${displaySummary.selectionTotal}</div><div class="label">${escapeHtml(t('donation.summaryRecordsUnit'))}</div></div>
      <div class="card"><div class="label">${escapeHtml(t('donation.summaryAggregateValue'))}</div><div class="value">¥${displaySummary.completedAmount.toLocaleString()}</div><div class="label">${escapeHtml(t('donation.summaryCnyTotal'))}</div></div>
      <div class="card"><div class="label">${escapeHtml(t('donation.summaryVerifiedSuccess'))}</div><div class="value">${completedCount}</div><div class="label">${escapeHtml(t('donation.summaryTransactionsUnit'))}</div></div>
      <div class="card"><div class="label">${escapeHtml(t('donation.summarySystemErrors'))}</div><div class="value">${failedCount}</div><div class="label">${escapeHtml(t('donation.summaryActionRequired'))}</div></div>
    </div>
    <table>
      <thead>${thead}</thead>
      <tbody>${tbody}</tbody>
    </table>
  </div>`;
    // html2canvas fails to render off-viewport nodes (e.g. left:-9999px), producing blank PDFs.
    const overlay = document.createElement('div');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,0.2);display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow:auto;box-sizing:border-box;';
    const container = document.createElement('div');
    container.style.cssText =
      'width:1100px;max-width:min(1100px,calc(100vw - 32px));background:#fff;box-sizing:border-box;flex-shrink:0;';
    container.innerHTML = inner;
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    const filename = `donations_report_${dayjs().format('YYYYMMDD_HHmmss')}.pdf`;
    try {
      if (document.fonts?.ready) {
        await document.fonts.ready.catch(() => undefined);
      }
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      await html2pdf()
        .set({
          margin: 10,
          filename,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
          pagebreak: { mode: ['css', 'legacy'] },
        })
        .from(container)
        .save();
      toast.success(t('donation.reportPdfDownloaded'));
    } catch {
      toast.error(t('donation.reportPdfFailed'));
    } finally {
      document.body.removeChild(overlay);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8, fontFamily: 'var(--font-body)' }}>{t('donation.title')}</h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-2)', maxWidth: '600px', lineHeight: 1.6 }}>
            {t('donation.description')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="secondary" onClick={handleExport}>{t('donation.btnExport')}</Button>
          <Button variant="primary" onClick={handleReport}>{t('donation.btnReport')}</Button>
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32,
      }}>
        {[
          { label: t('donation.summaryCurrentSelection'), value: displaySummary.selectionTotal, unit: t('donation.summaryRecordsUnit') },
          { label: t('donation.summaryAggregateValue'), value: `\u00a5${displaySummary.completedAmount.toLocaleString()}`, unit: t('donation.summaryCnyTotal') },
          { label: t('donation.summaryVerifiedSuccess'), value: displaySummary.completedCount, unit: t('donation.summaryTransactionsUnit') },
          { label: t('donation.summarySystemErrors'), value: displaySummary.failedCount, unit: t('donation.summaryActionRequired') },
        ].map((s) => (
          <div key={s.label} style={{
            padding: '24px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-2)', marginBottom: 12 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-body)', color: 'var(--color-text)' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-2)', marginTop: 4 }}>{s.unit}</div>
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
          <option value="wechat">{t('donation.paymentWechat')}</option>
          <option value="alipay">{t('donation.paymentAlipay')}</option>
          <option value="stripe">{t('donation.paymentStripe')}</option>
          <option value="paypal">{t('donation.paymentPaypal')}</option>
        </select>
      </div>

      {isError && (
        <div style={{ padding: 16, marginBottom: 16, background: 'var(--color-danger-bg, #fef2f2)', border: '1px solid var(--color-danger-border, #fecaca)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-danger, #dc2626)', fontSize: 14 }}>{t('generic.error')}</span>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ['donations'] })} style={{ padding: '4px 12px', fontSize: 13, cursor: 'pointer', border: '1px solid var(--color-border)', borderRadius: 4, background: 'transparent' }}>{t('generic.retry', 'Retry')}</button>
        </div>
      )}
      <DataTable columns={columns} data={filteredData} rowKey="id" loading={isLoading} />

      <div style={{ marginTop: 32 }}>
        <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} pageSize={10} onPageChange={setPage} />
      </div>
    </div>
  );
}

const filterStyle: React.CSSProperties = {
  padding: '10px 16px',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  fontSize: '13px',
  background: 'var(--color-surface)',
  outline: 'none',
  fontFamily: 'var(--font-mono)',
  minWidth: '240px'
};
