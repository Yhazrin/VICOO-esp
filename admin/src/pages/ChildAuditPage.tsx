/**
 * 儿童参与者审计页面 (Child Audit Page)
 *
 * 功能说明：
 * - 展示受保护的儿童参与者个人信息
 * - 实现访问控制，需输入访问码才能查看
 * - 支持按状态筛选和关键词搜索
 * - 显示儿童的详细信息，包括监护人信息、同意书状态等
 *
 * 使用场景：
 * 管理员在获得二级审批后访问儿童个人信息，所有访问行为都会被记录
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { fetchChildParticipants } from '../services/api';
import type { ChildParticipant } from '../types';
import dayjs from 'dayjs';

export default function ChildAuditPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<ChildParticipant | null>(null);
  const [accessGranted, setAccessGranted] = useState(false);
  const [accessCode, setAccessCode] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['childParticipants', page, search, statusFilter],
    queryFn: () => fetchChildParticipants({ page, pageSize: 10, search: search || undefined, status: statusFilter || undefined }),
    enabled: accessGranted,
  });

  const handleAccess = async () => {
    try {
      const response = await fetch('/api/admin/auth/verify-audit-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accessCode }),
      });
      if (response.ok) {
        setAccessGranted(true);
      } else {
        alert(t('childAudit.alertWrongCode'));
      }
    } catch {
      alert(t('childAudit.alertVerifyFailed'));
    }
  };

  if (!accessGranted) {
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{t('childAudit.title')}</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t('childAudit.description')}
          </p>
        </div>

        <div style={{
          maxWidth: 440, margin: '80px auto', padding: 32,
          background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)', textAlign: 'center',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
            background: 'var(--color-danger-light)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--color-danger)">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{t('childAudit.accessGateTitle')}</h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
            {t('childAudit.accessGateDesc')}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAccess()}
              placeholder={t('childAudit.inputAccessCodePlaceholder')}
              style={{
                flex: 1, padding: '10px 14px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)', fontSize: 14, outline: 'none',
              }}
            />
            <Button variant="primary" onClick={handleAccess}>{t('childAudit.btnVerify')}</Button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--color-text-light)', marginTop: 12, fontFamily: 'var(--font-mono)' }}>
            {t('childAudit.contactAdminForCode')}
          </p>
        </div>
      </div>
    );
  }

  const columns: Column<ChildParticipant>[] = [
    { key: 'id', title: t('childAudit.colId'), width: 90 },
    { key: 'childName', title: t('childAudit.colChildName') },
    { key: 'age', title: t('childAudit.colAge'), width: 60 },
    { key: 'guardianName', title: t('childAudit.colGuardian') },
    { key: 'region', title: t('childAudit.colRegion'), width: 100 },
    { key: 'school', title: t('childAudit.colSchool'), width: 120, render: (v) => v || '-' },
    { key: 'artworkCount', title: t('childAudit.colArtworks'), width: 80 },
    { key: 'consentGiven', title: t('childAudit.colConsent'), width: 80, render: (v) => v ? (
      <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{t('childAudit.consentSigned')}</span>
    ) : (
      <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{t('childAudit.consentUnsigned')}</span>
    )},
    { key: 'status', title: t('childAudit.colStatus'), width: 100, render: (v) => <StatusBadge status={v} /> },
    {
      key: 'action', title: t('childAudit.colAction'), width: 80,
      render: (_: any, record: ChildParticipant) => (
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelected(record); }}>
          {t('childAudit.btnDetail')}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>{t('childAudit.title')}</h1>
          <span style={{
            padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
            background: 'var(--color-danger-light)', color: 'var(--color-danger)',
          }}>
            {t('childAudit.restrictedLabel')}
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          {t('childAudit.auditDesc')}
        </p>
      </div>

      <div style={{
        padding: '12px 16px', background: 'var(--color-warning-light)',
        borderRadius: 'var(--radius-sm)', marginBottom: 16,
        fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
        </svg>
        {t('childAudit.noticeText')}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          type="text"
          placeholder={t('childAudit.searchPlaceholder')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={filterStyle}
        />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={filterStyle}>
          <option value="">{t('childAudit.filterAllStatuses')}</option>
          <option value="active">{t('childAudit.filterActive')}</option>
          <option value="withdrawn">{t('childAudit.filterWithdrawn')}</option>
          <option value="pending_review">{t('childAudit.filterPendingReview')}</option>
        </select>
      </div>

      <DataTable columns={columns} data={data?.data || []} rowKey="id" loading={isLoading} />
      <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} pageSize={10} onPageChange={setPage} />

      <Modal open={!!selected} title={t('childAudit.modalTitle')} onClose={() => setSelected(null)} width={520}>
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: '12px', background: 'var(--color-danger-light)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: '#991b1b' }}>
              {t('childAudit.privacyWarning')}
            </div>
            <Row label={t('childAudit.detailChildName')} value={selected.childName} />
            <Row label={t('childAudit.detailAge')} value={`${selected.age}${t('childAudit.ageUnit')}`} />
            <Row label={t('childAudit.detailGuardianName')} value={selected.guardianName} />
            <Row label={t('childAudit.detailGuardianPhone')} value={selected.guardianPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')} />
            <Row label={t('childAudit.detailGuardianEmail')} value={selected.guardianEmail.replace(/(.{2}).+(@.+)/, '$1***$2')} />
            <Row label={t('childAudit.detailRegion')} value={selected.region} />
            <Row label={t('childAudit.detailSchool')} value={selected.school || '-'} />
            <Row label={t('childAudit.detailConsent')} value={selected.consentGiven ? `${t('childAudit.consentSigned')} (${dayjs(selected.consentDate).format('YYYY-MM-DD')})` : t('childAudit.consentUnsigned')} />
            <Row label={t('childAudit.detailArtworkCount')} value={selected.artworkCount.toString()} />
            <Row label={t('childAudit.detailStatus')} value={<StatusBadge status={selected.status} />} />
            <Row label={t('childAudit.detailJoinDate')} value={dayjs(selected.createdAt).format('YYYY-MM-DD')} />
            {selected.lastActivity && <Row label={t('childAudit.detailLastActivity')} value={dayjs(selected.lastActivity).format('YYYY-MM-DD HH:mm')} />}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

const filterStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid var(--color-ink)',
  background: 'var(--color-paper)',
  fontSize: '13px',
  fontFamily: 'var(--font-mono)',
};
