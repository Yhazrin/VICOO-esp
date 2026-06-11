import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import { PageHeader } from '../components/ui/PageHeader';
import { SummaryCard, MiniStat } from '../components/ui/SummaryCard';
import { AuditActivityChart, EventTypeChart } from '../components/charts/AuditActivityChart';
import { fetchAuditLogs, fetchAuditSummary } from '../services/api';
import type { AuditLogEntry } from '../types';
import { formatDateTime, formatDateTimeFull } from '../utils/dateTime';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';
import { AUDIT_ACTIONS } from '../utils/auditActions';

// Icons
const Icons = {
  activity: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  alert: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  user: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  clock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  info: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

const ACTION_TYPE_MAP: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  // System
  login: 'neutral',
  register: 'success',
  // User management
  update_role: 'warning',
  modify_user_role: 'warning',
  update_user_status: 'warning',
  update_status: 'neutral',
  update_profile: 'neutral',
  // Artwork / voting
  submit_artwork: 'success',
  moderate_artwork: 'success',
  approve_artwork: 'success',
  approve: 'success',
  batch_moderate_artworks: 'success',
  batch_moderate_children: 'success',
  review_artwork: 'success',
  vote_artwork: 'success',
  // Campaign
  create_campaign: 'success',
  create: 'success',
  update: 'neutral',
  // Donations
  create_donation: 'success',
  complete_donation: 'success',
  admin_approve_donation: 'success',
  process_donation: 'success',
  allocate_impact_fund: 'success',
  // Orders
  place_order: 'success',
  cancel_order: 'warning',
  update_order_status: 'neutral',
  confirm_delivery_admin: 'success',
  confirm_receipt_user: 'success',
  // Payments
  create_payment_intent: 'neutral',
  payment_callback_success: 'success',
  // Supply chain
  create_traceability_record: 'success',
  update_traceability_record: 'warning',
  generate_design: 'success',
  publish_design_as_product: 'success',
  publish_product_from_intake: 'success',
  update_clothing_intake_status: 'warning',
  // AI / children
  ai_chat: 'neutral',
  ai_feedback: 'neutral',
  register_child: 'success',
  child_consent_approved: 'success',
  view_child_info: 'neutral',
  // Settings / data
  modify_settings: 'warning',
  export_data: 'neutral',
  delete_data: 'error',
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function AuditLogPage() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [actionFilter, setActionFilter] = useState('');
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', page, pageSize, actionFilter],
    queryFn: () => fetchAuditLogs({
      page,
      pageSize,
      action: actionFilter || undefined,
    }),
    placeholderData: (prev) => prev,
    staleTime: 0,
  });

  // Summary query: aggregates across ALL filtered rows (not paginated)
  const { data: summary } = useQuery({
    queryKey: ['auditSummary', actionFilter],
    queryFn: () => fetchAuditSummary({ action: actionFilter || undefined }),
    staleTime: 30 * 1000,
  });

  const logs = data?.data || [];
  const total = data?.total || 0;
  dayjs.locale(isZh ? 'zh-cn' : 'en');

  // Activity trend: 7-day daily counts from summary (not just current page)
  const activityTrendData = (summary?.dailyTrend ?? []).map((d) => ({
    date: dayjs(d.date).format('MM/DD'),
    count: d.count,
  }));

  // Event type chart: from summary (not current page)
  const eventTypeData = (summary?.eventTypes ?? []).map((e) => ({
    type: getActionLabel(e.action),
    count: e.count,
    key: e.action,
  }));

  const summaryStats = {
    totalEvents: summary?.total ?? total,
    highRisk: summary?.highRisk ?? 0,
    adminActions: summary?.adminActions ?? 0,
    last24h: summary?.last24h ?? 0,
    todayLogin: summary?.todayLogin ?? 0,
    reviewOps: summary?.reviewOps ?? 0,
  };

  function getActionLabel(v: string) {
    const meta = AUDIT_ACTIONS.find((a) => a[0] === v);
    if (meta) return isZh ? meta[2] : meta[1];
    return t('auditLog.actionGeneric', { action: v });
  }

  const getActionBadgeType = (v: string): 'success' | 'warning' | 'error' | 'neutral' => {
    return ACTION_TYPE_MAP[v] || 'neutral';
  };

  const columns: Column<AuditLogEntry>[] = [
    {
      key: 'timestamp',
      title: t('auditLog.detailTimestamp'),
      width: 160,
      sorter: true,
      render: (v) => <span className="table-text-mono">{formatDateTime(v)}</span>
    },
    { key: 'userName', title: t('auditLog.detailOperator'), width: 100 },
    {
      key: 'action',
      title: t('auditLog.detailAction'),
      width: 200,
      render: (v) => {
        const label = getActionLabel(v);
        const full = `${v} — ${label}`;
        return <StatusBadge status={getActionBadgeType(v)} label={label} title={full} />;
      }
    },
    { key: 'resource', title: t('auditLog.detailResource'), width: 100 },
    {
      key: 'details',
      title: t('common.detail'),
      render: (v) => (
        <span className="table-text-truncate" style={{ maxWidth: 300 }} title={typeof v === 'string' ? v : undefined}>
          {v}
        </span>
      )
    },
    {
      key: 'action_col',
      title: t('common.operation'),
      width: 80,
      render: (_: any, record: AuditLogEntry) => (
        <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setSelected(record); }}>
          {t('auditLog.btnViewDetail')}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('auditLog.title')}
        description={t('auditLog.description')}
      />

      {/* Summary Cards */}
      <div className="dashboard-summary-grid" style={{ marginBottom: 24 }}>
        <SummaryCard title={t('auditLog.summaryTotalTitle')} subtitle={t('auditLog.summaryTotalSubtitle')} icon={Icons.activity}>
          <MiniStat label={t('common.miniStatThisWeek')} value={summaryStats.totalEvents} change={-5} />
          <MiniStat label={t('common.miniStatLast24h')} value={summaryStats.last24h} />
        </SummaryCard>
        <SummaryCard title={t('auditLog.summaryHighRiskTitle')} subtitle={t('auditLog.summaryHighRiskSubtitle')} icon={Icons.alert}>
          <MiniStat label={t('common.miniStatHighRisk')} value={summaryStats.highRisk} trend="error" />
          <MiniStat label={t('common.miniStatAdminOps')} value={summaryStats.adminActions} />
        </SummaryCard>
        <SummaryCard title={t('auditLog.summaryActivityTitle')} subtitle={t('auditLog.summaryActivitySubtitle')} icon={Icons.clock}>
          <MiniStat label={t('auditLog.todayLogin')} value={summaryStats.todayLogin} />
          <MiniStat label={t('auditLog.reviewOps')} value={summaryStats.reviewOps} />
        </SummaryCard>
      </div>

      {/* Charts */}
      <div className="dashboard-charts-grid" style={{ marginBottom: 24 }}>
        <AuditActivityChart data={activityTrendData} />
        <EventTypeChart
          data={eventTypeData}
          focusedKey={actionFilter || null}
          onFocusChange={(key) => { setActionFilter(key); setPage(1); }}
        />
      </div>

      {/* Filters */}
      <div className="table-toolbar">
        <div className="table-toolbar__filters">
          <select
            className="table-select"
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            aria-label={t('auditLog.filterActionAriaLabel')}
          >
            <option value="">{t('auditLog.filterAllActions')}</option>
            {AUDIT_ACTIONS.map(([key, en, zh]) => (
              <option key={key} value={key}>
                {isZh ? zh : en} ({key})
              </option>
            ))}
          </select>
          <select
            className="table-select"
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            aria-label={t('auditLog.pageSizeAriaLabel')}
            style={{ marginLeft: 8 }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {t('auditLog.pageSizeOption', { count: n })}
              </option>
            ))}
          </select>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            marginLeft: 12, fontSize: 12, color: 'var(--color-text-3)',
          }} title={t('auditLog.filterHelpTooltip')}>
            {Icons.info}
            {actionFilter
              ? t('auditLog.filterHelpActiveFmt', { action: getActionLabel(actionFilter) })
              : t('auditLog.filterHelpIdle')}
          </span>
        </div>
        <div className="table-toolbar__info">
          {actionFilter
            ? t('auditLog.filteredCountFmt', { count: total, action: getActionLabel(actionFilter) })
            : t('auditLog.recordCount', { count: total })}
        </div>
      </div>

      <DataTable columns={columns} data={logs} rowKey="id" loading={isLoading} />
      <Pagination page={page} totalPages={data?.totalPages || 1} total={total} pageSize={pageSize} onPageChange={setPage} />

      <Modal open={!!selected} title={t('auditLog.modalTitle')} onClose={() => setSelected(null)} width={600}>
        {selected && (
          <div className="modal-detail-grid">
            <DetailRow label={t('auditLog.detailLogId')} value={<code className="table-text-mono">{selected.id}</code>} />
            <DetailRow label={t('auditLog.detailTimestamp')} value={<span className="table-text-mono">{formatDateTimeFull(selected.timestamp)}</span>} />
            <DetailRow label={t('auditLog.detailOperator')} value={selected.userName} />
            <DetailRow label={t('auditLog.detailUserId')} value={<code className="table-text-mono">{selected.userId}</code>} />
            <DetailRow label={t('auditLog.detailAction')} value={
              <span title={selected.action}>
                <StatusBadge status={getActionBadgeType(selected.action)} label={getActionLabel(selected.action)} />
              </span>
            } />
            <DetailRow label={t('auditLog.detailResource')} value={selected.resource} />
            <DetailRow label={t('auditLog.detailResourceId')} value={selected.resourceId ? <code className="table-text-mono">{selected.resourceId}</code> : '-'} />
            <DetailRow label={t('auditLog.detailIpAddress')} value={<code className="table-text-mono">{selected.ipAddress}</code>} />
            <div className="modal-detail-full">
              <span className="modal-detail-label">{t('auditLog.detailOperationDetails')}</span>
              <div className="modal-detail-box">{selected.details}</div>
            </div>
            <div className="modal-detail-full">
              <span className="modal-detail-label">{t('auditLog.detailUserAgent')}</span>
              <div className="modal-detail-box modal-detail-box--mono">{selected.userAgent}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="modal-detail-row">
      <span className="modal-detail-label">{label}</span>
      <span className="modal-detail-value">{value}</span>
    </div>
  );
}