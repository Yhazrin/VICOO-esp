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
import { fetchAuditLogs } from '../services/api';
import type { AuditLogEntry } from '../types';
import { formatDateTime, formatDateTimeFull } from '../utils/dateTime';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';

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
};

const ACTION_TYPE_MAP: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  login: 'neutral',
  review_artwork: 'success',
  modify_user_role: 'warning',
  export_data: 'neutral',
  modify_settings: 'warning',
  create_campaign: 'success',
  process_donation: 'success',
  update_order_status: 'neutral',
  view_child_info: 'neutral',
  delete_data: 'error',
  approve_artwork: 'success',
  approve: 'success',
  create: 'success',
  update: 'neutral',
};

export default function AuditLogPage() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', page, actionFilter],
    queryFn: () => fetchAuditLogs({
      page,
      pageSize: 100,  // Get more data for charts
      search: actionFilter || undefined
    }),
  });

  const logs = data?.data || [];
  const total = data?.total || 0;
  dayjs.locale(isZh ? 'zh-cn' : 'en');

  // Aggregate logs into chart data
  const activityTrendData = (() => {
    const grouped: Record<string, number> = {};
    logs.forEach((l: AuditLogEntry) => {
      const day = dayjs(l.timestamp).format('ddd');
      grouped[day] = (grouped[day] || 0) + 1;
    });
    return Object.entries(grouped).map(([date, count]) => ({ date, count }));
  })();

  const eventTypeData = (() => {
    const grouped: Record<string, { type: string; count: number; key: string }> = {};
       const labels: Record<string, string> = {
      login: t('auditLog.actionLogin'),
      review_artwork: t('auditLog.actionReview'),
      update_order_status: t('auditLog.actionOrder'),
      modify_settings: t('auditLog.actionSettings'),
      modify_user_role: t('auditLog.actionUser'),
      create_campaign: t('auditLog.actionCampaign'),
      delete_data: t('auditLog.actionDelete'),
      approve_artwork: t('auditLog.actionApprove'),
      approve: t('auditLog.actionApprove'),
      create: t('auditLog.actionCreate'),
      update: t('auditLog.actionUpdate'),
    };
    logs.forEach((l: AuditLogEntry) => {
      const key = l.action.split('_')[0];
      if (!grouped[key]) {
        grouped[key] = { type: labels[l.action] || l.action, count: 0, key };
      }
      grouped[key].count++;
    });
    return Object.values(grouped).sort((a, b) => b.count - a.count);
  })();

  // Calculate summary stats
  const summaryStats = {
    totalEvents: total,
    highRisk: logs.filter((l: AuditLogEntry) => ['delete_data', 'modify_user_role'].includes(l.action)).length,
    adminActions: logs.filter((l: AuditLogEntry) => l.action !== 'login').length,
    last24h: logs.filter((l: AuditLogEntry) => dayjs(l.timestamp).isAfter(dayjs().subtract(24, 'hour'))).length,
  };

  const getActionLabel = (v: string) => {
    const map: Record<string, string> = {
      login: t('auditLog.actionLogin'),
      review_artwork: t('auditLog.actionReviewArtwork'),
      modify_user_role: t('auditLog.actionModifyUserRole'),
      export_data: t('auditLog.actionExportData'),
      modify_settings: t('auditLog.actionModifySettings'),
      create_campaign: t('auditLog.actionCreateCampaign'),
      process_donation: t('auditLog.actionProcessDonation'),
      update_order_status: t('auditLog.actionUpdateOrderStatus'),
      view_child_info: t('auditLog.actionViewChildInfo'),
      delete_data: t('auditLog.actionDeleteData'),
      approve_artwork: t('auditLog.actionApprove'),
      approve: t('auditLog.actionApprove'),
      create: t('auditLog.actionCreate'),
      update: t('auditLog.actionUpdate'),
    };
    return map[v] || v;
  };

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
      width: 140,
      render: (v) => <StatusBadge status={v} label={getActionLabel(v)} />
    },
    { key: 'resource', title: t('auditLog.detailResource'), width: 100 },
    {
      key: 'details',
      title: t('common.detail'),
      render: (v) => (
        <span className="table-text-truncate" style={{ maxWidth: 300 }}>
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
          <MiniStat label={t('auditLog.todayLogin')} value={logs.filter((l: AuditLogEntry) => l.action === 'login').length} />
          <MiniStat label={t('auditLog.reviewOps')} value={logs.filter((l: AuditLogEntry) => l.action.includes('review')).length} />
        </SummaryCard>
      </div>

      {/* Charts */}
      <div className="dashboard-charts-grid" style={{ marginBottom: 24 }}>
        <AuditActivityChart data={activityTrendData} />
        <EventTypeChart data={eventTypeData} />
      </div>

      {/* Filters */}
      <div className="table-toolbar">
        <div className="table-toolbar__filters">
          <select
            className="table-select"
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          >
            <option value="">{t('auditLog.filterAllActions')}</option>
            <option value="login">{t('auditLog.actionLogin')}</option>
            <option value="review_artwork">{t('auditLog.actionReviewArtwork')}</option>
            <option value="modify_user_role">{t('auditLog.actionModifyUserRole')}</option>
            <option value="export_data">{t('auditLog.actionExportData')}</option>
            <option value="modify_settings">{t('auditLog.actionModifySettings')}</option>
            <option value="create_campaign">{t('auditLog.actionCreateCampaign')}</option>
            <option value="process_donation">{t('auditLog.actionProcessDonation')}</option>
            <option value="update_order_status">{t('auditLog.actionUpdateOrderStatus')}</option>
            <option value="view_child_info">{t('auditLog.actionViewChildInfo')}</option>
            <option value="delete_data">{t('auditLog.actionDeleteData')}</option>
          </select>
        </div>
        <div className="table-toolbar__info">
          {t('auditLog.recordCount', { count: total })}
        </div>
      </div>

      <DataTable columns={columns} data={logs} rowKey="id" loading={isLoading} />
      <Pagination page={page} totalPages={data?.totalPages || 1} total={total} pageSize={15} onPageChange={setPage} />

      <Modal open={!!selected} title={t('auditLog.modalTitle')} onClose={() => setSelected(null)} width={600}>
        {selected && (
          <div className="modal-detail-grid">
            <DetailRow label={t('auditLog.detailLogId')} value={<code className="table-text-mono">{selected.id}</code>} />
            <DetailRow label={t('auditLog.detailTimestamp')} value={<span className="table-text-mono">{formatDateTimeFull(selected.timestamp)}</span>} />
            <DetailRow label={t('auditLog.detailOperator')} value={selected.userName} />
            <DetailRow label={t('auditLog.detailUserId')} value={<code className="table-text-mono">{selected.userId}</code>} />
            <DetailRow label={t('auditLog.detailAction')} value={<StatusBadge status={selected.action} label={getActionLabel(selected.action)} />} />
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