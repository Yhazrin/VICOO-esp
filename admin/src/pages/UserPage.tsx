import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { fetchUsers, updateUserRole, updateUserStatus } from '../services/api';
import type { User } from '../types';
import dayjs from 'dayjs';

export default function UserPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState('');
  const [statusConfirm, setStatusConfirm] = useState<User | null>(null);

  const roleColors: Record<string, string> = {
    admin: 'var(--color-accent-2)',
    editor: 'var(--color-text-3)',
    user: 'var(--color-text-3)',
    guardian: 'var(--color-text-3)',
    compliance: 'var(--color-accent-2)',
  };

  const getRoleLabel = (v: string) => {
    const map: Record<string, string> = {
      admin: t('user.roleAdmin'),
      editor: t('user.roleEditor'),
      user: t('user.roleViewer'),
      guardian: t('user.roleGuardian'),
      compliance: t('user.roleAuditor'),
    };
    return map[v] || v;
  };

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () => fetchUsers({ page, pageSize: 10, search: search || undefined }),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: User['role'] }) => updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('user.toastRoleUpdated'));
      setSelectedUser(null);
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : t('user.toastRoleFailed');
      toast.error(msg);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: User['status'] }) => updateUserStatus(id, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(vars.status === 'banned' ? t('user.toastUserDisabled') : t('user.toastUserEnabled'));
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.detail ?? t('generic.error'));
    },
  });

  const columns: Column<User>[] = [
    { key: 'id', title: t('user.colIdentity'), width: 120, render: (v) => <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{v}</code> },
    { key: 'username', title: t('user.colUsername'), sorter: true, render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'email', title: t('user.colEmail'), width: 220 },
    { key: 'role', title: t('user.colAuthority'), width: 120, render: (v) => (
      <span style={{
        padding: '2px 8px',
        borderRadius: '8px',
        fontSize: '10px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        background: 'var(--color-elevated)',
        color: roleColors[v] || 'var(--color-text)',
        border: `1px solid ${roleColors[v] || 'var(--color-border)'}20`
      }}>
        {getRoleLabel(v)}
      </span>
    )},
    { key: 'status', title: t('user.colAvailability'), width: 120, render: (v) => <StatusBadge status={v} /> },
    { key: 'createdAt', title: t('user.colRegistration'), width: 140, render: (v) => dayjs(v).format('YYYY-MM-DD') },
    { key: 'lastLogin', title: t('user.colLastAccess'), width: 160, render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
    {
      key: 'action', title: t('user.colCommand'), width: 220,
      render: (_: any, record: User) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setSelectedUser(record); setEditRole(record.role); }}>
            {t('user.btnEditRole')}
          </Button>
          <Button
            size="sm"
            variant={record.status === 'active' ? 'danger' : 'primary'}
            onClick={(e) => {
              e.stopPropagation();
              setStatusConfirm(record);
            }}
          >
            {record.status === 'active' ? t('user.btnDisable') : t('user.btnEnable')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8, fontFamily: 'var(--font-body)' }}>{t('user.title')}</h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-2)', maxWidth: '600px', lineHeight: 1.6 }}>
          {t('user.description')}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <input
          type="text" placeholder={t('user.searchPlaceholder')}
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={filterStyle}
        />
      </div>

      <DataTable columns={columns} data={data?.data || []} rowKey="id" loading={isLoading} />

      <div style={{ marginTop: 32 }}>
        <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} pageSize={10} onPageChange={setPage} />
      </div>

      <Modal
        open={!!selectedUser}
        title={t('user.modalRoleTitle')}
        onClose={() => setSelectedUser(null)}
        width={450}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedUser(null)}>{t('common.cancel')}</Button>
            <Button variant="primary" loading={roleMutation.isPending} onClick={() => {
              if (selectedUser && editRole) {
                roleMutation.mutate({ id: selectedUser.id, role: editRole as User['role'] });
              }
            }}>
              {t('user.btnUpdateAuth')}
            </Button>
          </>
        }
      >
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ padding: '20px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 4 }}>{t('user.modalSubjectIdentification')}</div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-body)' }}>{selectedUser.username}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>{selectedUser.email}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, color: 'var(--color-text)' }}>{t('user.modalAssignmentLevel')}</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                style={{ ...filterStyle, width: '100%', borderRadius: '6px', border: '1px solid var(--color-border)' }}
              >
                <option value="admin">{t('user.optionAdmin')}</option>
                <option value="editor">{t('user.optionEditor')}</option>
                <option value="user">{t('user.optionViewer')}</option>
                <option value="guardian">{t('user.optionGuardian')}</option>
                <option value="compliance">{t('user.optionAuditor')}</option>
              </select>
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--color-danger)', padding: '12px 16px', background: 'var(--color-error-bg)', border: '1px solid var(--color-danger)20' }}>
              <strong>{t('user.roleNotice')}</strong>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!statusConfirm}
        title={statusConfirm?.status === 'active' ? t('user.modalSuspendTitle') : t('user.modalRestoreTitle')}
        onClose={() => setStatusConfirm(null)}
        width={450}
        footer={
          <>
            <Button variant="ghost" onClick={() => setStatusConfirm(null)}>{t('user.btnAbort')}</Button>
            <Button
              variant={statusConfirm?.status === 'active' ? 'danger' : 'primary'}
              loading={statusMutation.isPending}
              onClick={() => {
                if (statusConfirm) {
                  statusMutation.mutate({
                    id: statusConfirm.id,
                    status: statusConfirm.status === 'active' ? 'banned' : 'active',
                  }, { onSuccess: () => setStatusConfirm(null) });
                }
              }}
            >
              {statusConfirm?.status === 'active' ? t('user.btnExecuteSuspension') : t('user.btnRestoreAccess')}
            </Button>
          </>
        }
      >
        {statusConfirm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              {statusConfirm.status === 'active'
                ? t('user.suspendConfirm', { username: statusConfirm.username })
                : t('user.restoreConfirm', { username: statusConfirm.username })}
            </p>
            <div style={{ fontSize: 12, color: 'var(--color-text-3)', padding: '12px', background: 'var(--color-elevated)', fontFamily: 'var(--font-mono)' }}>
              {t('user.identificationLabel')} {statusConfirm.email}
            </div>
          </div>
        )}
      </Modal>
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
  minWidth: '280px'
};
