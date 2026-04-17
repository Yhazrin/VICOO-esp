import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { fetchAuditLogs } from '../services/api';
import type { AuditLogEntry } from '../types';
import dayjs from 'dayjs';

export default function AuditLogPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const actionColors: Record<string, string> = {
    login: '#A0A0A0', review_artwork: '#2563EB', modify_user_role: '#A0A0A0',
    export_data: '#A0A0A0', modify_settings: '#A0A0A0', create_campaign: '#2563EB',
    process_donation: '#A0A0A0', update_order_status: '#2563EB',
    view_child_info: '#2563EB', delete_data: '#2563EB',
  };

  const getActionLabel = (v: string) => {
    const map: Record<string, string> = {
      login: t('auditLog.actionLogin'), review_artwork: t('auditLog.actionReviewArtwork'),
      modify_user_role: t('auditLog.actionModifyUserRole'), export_data: t('auditLog.actionExportData'),
      modify_settings: t('auditLog.actionModifySettings'), create_campaign: t('auditLog.actionCreateCampaign'),
      process_donation: t('auditLog.actionProcessDonation'), update_order_status: t('auditLog.actionUpdateOrderStatus'),
      view_child_info: t('auditLog.actionViewChildInfo'), delete_data: t('auditLog.actionDeleteData'),
    };
    return map[v] || v;
  };

  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', page, actionFilter],
    queryFn: () => fetchAuditLogs({
      page,
      pageSize: 15,
      search: actionFilter || undefined
    }),
  });

  const columns: Column<AuditLogEntry>[] = [
    { key: 'timestamp', title: t('auditLog.detailTimestamp'), width: 180, sorter: true, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm:ss') },
    { key: 'userName', title: t('auditLog.detailOperator'), width: 120 },
    { key: 'action', title: t('auditLog.detailAction'), width: 150, render: (v) => (
      <span style={{
        padding: '2px 8px',
        borderRadius: '8px',
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        border: `1px solid ${actionColors[v] || 'var(--color-border)'}`,
        color: actionColors[v] || 'var(--color-text)',
      }}>
        {getActionLabel(v)}
      </span>
    )},
    { key: 'resource', title: t('auditLog.detailResource'), width: 120 },
    { key: 'details', title: t('common.detail'), render: (v) => (
      <span style={{
        color: 'var(--color-text-2)',
        maxWidth: 400,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'block',
        whiteSpace: 'nowrap',
        fontSize: '13px'
      }}>
        {v}
      </span>
    )},
    { key: 'ipAddress', title: t('auditLog.detailIpAddress'), width: 140, render: (v) => <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{v}</code> },
    {
      key: 'action_col', title: t('common.operation'), width: 100,
      render: (_: any, record: AuditLogEntry) => (
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelected(record); }}>
          {t('auditLog.btnViewDetail')}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8, fontFamily: 'var(--font-body)' }}>{t('auditLog.title')}</h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-2)', maxWidth: '600px', lineHeight: 1.6 }}>
          {t('auditLog.description')}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center' }}>
        <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} style={filterStyle}>
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

        <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--color-text-3)' }}>
          {t('auditLog.recordCount', { count: data?.total || 0 })}
        </div>
      </div>

      <DataTable columns={columns} data={data?.data || []} rowKey="id" loading={isLoading} />

      <div style={{ marginTop: 32 }}>
        <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} pageSize={15} onPageChange={setPage} />
      </div>

      <Modal open={!!selected} title={t('auditLog.modalTitle')} onClose={() => setSelected(null)} width={600}>
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '10px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
              <Row label={t('auditLog.detailLogId')} value={<code style={{ fontFamily: 'var(--font-mono)' }}>{selected.id}</code>} />
              <Row label={t('auditLog.detailTimestamp')} value={dayjs(selected.timestamp).format('YYYY-MM-DD HH:mm:ss')} />
              <Row label={t('auditLog.detailOperator')} value={selected.userName} />
              <Row label={t('auditLog.detailUserId')} value={<code style={{ fontFamily: 'var(--font-mono)' }}>{selected.userId}</code>} />
              <Row label={t('auditLog.detailAction')} value={selected.action} />
              <Row label={t('auditLog.detailResource')} value={selected.resource} />
              <Row label={t('auditLog.detailResourceId')} value={selected.resourceId ? <code style={{ fontFamily: 'var(--font-mono)' }}>{selected.resourceId}</code> : '-'} />
              <Row label={t('auditLog.detailIpAddress')} value={<code style={{ fontFamily: 'var(--font-mono)' }}>{selected.ipAddress}</code>} />
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-3)', marginBottom: 8 }}>{t('auditLog.detailOperationDetails')}</div>
              <div style={{ fontSize: 14, padding: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', lineHeight: 1.6 }}>
                {selected.details}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-3)', marginBottom: 8 }}>{t('auditLog.detailUserAgent')}</div>
              <div style={{ fontSize: 12, padding: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all', color: 'var(--color-text-2)' }}>
                {selected.userAgent}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>{value}</span>
    </div>
  );
}

const filterStyle: React.CSSProperties = {
  padding: '10px 16px',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  fontSize: '13px',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  outline: 'none',
  fontFamily: 'var(--font-mono)',
  minWidth: '240px'
};
