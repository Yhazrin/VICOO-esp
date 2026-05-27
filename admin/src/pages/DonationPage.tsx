import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import html2pdf from 'html2pdf.js';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import { PageHeader } from '../components/ui/PageHeader';
import { SummaryCard, MiniStat } from '../components/ui/SummaryCard';
import { DonationTrendChart } from '../components/charts/DonationTrendChart';
import { fetchDonations, approveDonationAdmin } from '../services/api';
import type { Donation } from '../types';

// Icons
const SearchIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const HeartIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CheckIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ChartIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

export default function DonationPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const { data, isLoading } = useQuery({
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

  // Calculate summary stats
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
    const map: Record<string, string> = {
      wechat: t('donation.paymentWechat'),
      alipay: t('donation.paymentAlipay'),
      stripe: t('donation.paymentStripe'),
      paypal: t('donation.paymentPaypal'),
    };
    return map[v] || v;
  };

  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const columns: Column<Donation>[] = [
    {
      key: 'id',
      title: t('donation.colLedgerId'),
      width: 100,
      render: (v) => <code className="table-text-mono">{v}</code>,
    },
    {
      key: 'donorName',
      title: t('donation.colBenefactor'),
      minWidth: 140,
      render: (v) => <span className="table-text-bold">{v}</span>,
    },
    {
      key: 'amount',
      title: t('donation.colGrantAmount'),
      width: 120,
      sorter: true,
      render: (v, r) => (
        <span className="table-text-price">
          {r.currency === 'CNY' ? '¥' : '$'}
          {v.toLocaleString()}
        </span>
      ),
    },
    { key: 'paymentMethod', title: t('donation.colChannel'), width: 100, render: (v) => getPaymentLabel(v) },
    {
      key: 'campaignTitle',
      title: t('donation.colAssignedProject'),
      minWidth: 160,
      render: (v) => v || '-',
    },
    {
      key: 'status',
      title: t('donation.colState'),
      width: 100,
      render: (v) => <StatusBadge status={v} context="donation" />,
    },
    {
      key: 'isAnonymous',
      title: t('donation.colAnon'),
      width: 70,
      render: (v) => (v ? t('common.yes') : t('common.no')),
    },
    {
      key: 'createdAt',
      title: t('donation.colRecordedAt'),
      width: 140,
      sorter: true,
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      key: 'action',
      title: t('donation.colAction'),
      width: 100,
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
    const blob = new Blob(['﻿' + csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
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
        <td>${escapeHtml(d.status)}</td>
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
      <PageHeader
        title={t('donation.title')}
        description={t('donation.description')}
        actions={
          <>
            <Button variant="secondary" onClick={handleExport}>
              {t('donation.btnExport')}
            </Button>
            <Button variant="primary" onClick={handleReport}>
              {t('donation.btnReport')}
            </Button>
          </>
        }
      />

      {/* Summary Cards */}
      <div className="dashboard-summary-grid" style={{ marginBottom: 24 }}>
        <SummaryCard title="Total" subtitle="捐赠总额" icon={HeartIcon}>
          <MiniStat label="记录数" value={displaySummary.selectionTotal} />
          <MiniStat label="本周增长" value="+12%" change={12} />
        </SummaryCard>
        <SummaryCard title="Verified" subtitle="已认证" icon={CheckIcon}>
          <MiniStat label="已完成" value={displaySummary.completedCount} />
          <MiniStat label="金额" value={`¥${displaySummary.completedAmount.toLocaleString()}`} />
        </SummaryCard>
        <SummaryCard title="Campaigns" subtitle="活动关联" icon={ChartIcon}>
          <MiniStat label="关联活动" value={filteredData.filter((d) => d.campaignTitle).length} />
          <MiniStat label="失败记录" value={displaySummary.failedCount} trend="error" />
        </SummaryCard>
      </div>

      {/* Chart */}
      <div style={{ marginBottom: 24 }}>
        <DonationTrendChart />
      </div>

      {/* Filters */}
      <div className="table-toolbar">
        <div className="table-toolbar__filters">
          <div className="table-search">
            {SearchIcon}
            <input
              type="text"
              placeholder={t('donation.searchPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="table-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t('donation.filterAllStates')}</option>
            <option value="completed">{t('donation.filterCompleted')}</option>
            <option value="pending">{t('donation.filterPending')}</option>
            <option value="failed">{t('donation.filterFailed')}</option>
            <option value="refunded">{t('donation.filterRefunded')}</option>
          </select>
          <select
            className="table-select"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="">{t('donation.filterAllChannels')}</option>
            <option value="wechat">{t('donation.paymentWechat')}</option>
            <option value="alipay">{t('donation.paymentAlipay')}</option>
            <option value="stripe">{t('donation.paymentStripe')}</option>
            <option value="paypal">{t('donation.paymentPaypal')}</option>
          </select>
        </div>
      </div>

      <DataTable columns={columns} data={filteredData} rowKey="id" loading={isLoading} />
      <div style={{ marginTop: 24 }}>
        <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} pageSize={10} onPageChange={setPage} />
      </div>
    </div>
  );
}