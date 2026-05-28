import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import { PageHeader } from '../components/ui/PageHeader';
import { SummaryCard, MiniStat } from '../components/ui/SummaryCard';
import { fetchUsers, updateUserRole, updateUserStatus } from '../services/api';
import type { User } from '../types';
import { formatDate, formatDateTime } from '../utils/dateTime';
import dayjs from 'dayjs';

// Icons
const SearchIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const UsersIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ShieldIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const ActivityIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

export default function UserPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState('');
  const [statusConfirm, setStatusConfirm] = useState<User | null>(null);

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

  const users = data?.data || [];

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: User['role'] }) => updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('user.toastRoleUpdated'));
      setSelectedUser(null);
    },
    onError: (err: unknown) => {
      const detail = (err as any)?.response?.data?.detail;
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
  });

  // Calculate summary stats
  const summaryStats = {
    total: users.length,
    admins: users.filter((u: User) => u.role === 'admin' || u.role === 'compliance').length,
    active: users.filter((u: User) => u.status === 'active').length,
    recent: users.filter((u: User) => dayjs(u.createdAt).isAfter(dayjs().subtract(7, 'day'))).length,
  };

  const columns: Column<User>[] = [
    {
      key: 'id',
      title: t('user.colIdentity'),
      width: 100,
      render: (v) => <code className="table-text-mono">{v}</code>,
    },
    {
      key: 'username',
      title: t('user.colUsername'),
      sorter: true,
      render: (v) => <span className="table-text-bold">{v}</span>,
    },
    { key: 'email', title: t('user.colEmail'), width: 200 },
    {
      key: 'role',
      title: t('user.colAuthority'),
      width: 110,
      render: (v) => <StatusBadge status={v} label={getRoleLabel(v)} />,
    },
    {
      key: 'status',
      title: t('user.colAvailability'),
      width: 100,
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: 'createdAt',
      title: t('user.colRegistration'),
      width: 120,
      render: (v) => formatDate(v),
    },
    {
      key: 'lastLogin',
      title: t('user.colLastAccess'),
      width: 140,
      render: (v) => (v ? formatDateTime(v) : '-'),
    },
    {
      key: 'action',
      title: t('user.colCommand'),
      width: 200,
      render: (_: any, record: User) => (
        <div className="table-actions">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(record);
              setEditRole(record.role);
            }}
          >
            {t('user.btnEditRole')}
          </Button>
          <Button
            size="sm"
            variant={record.status === 'active' ? 'danger' : 'secondary'}
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
      <PageHeader title={t('user.title')} description={t('user.description')} />

      {/* Summary Cards */}
      <div className="dashboard-summary-grid" style={{ marginBottom: 24 }}>
        <SummaryCard title="Total Users" subtitle="用户总数" icon={UsersIcon}>
          <MiniStat label="全部用户" value={summaryStats.total} />
          <MiniStat label="本周新增" value={summaryStats.recent} change={summaryStats.recent > 0 ? 5 : 0} />
        </SummaryCard>
        <SummaryCard title="Admins" subtitle="管理员" icon={ShieldIcon}>
          <MiniStat label="管理员" value={summaryStats.admins} />
          <MiniStat label="编辑者" value={users.filter((u: User) => u.role === 'editor').length} />
        </SummaryCard>
        <SummaryCard title="Active" subtitle="活跃用户" icon={ActivityIcon}>
          <MiniStat label="活跃" value={summaryStats.active} />
          <MiniStat label="已禁用" value={users.filter((u: User) => u.status === 'banned').length} trend="error" />
        </SummaryCard>
      </div>

      {/* Filters */}
      <div className="table-toolbar">
        <div className="table-toolbar__filters">
          <div className="table-search">
            {SearchIcon}
            <input
              type="text"
              placeholder={t('user.searchPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={users} rowKey="id" loading={isLoading} />
      <div style={{ marginTop: 24 }}>
        <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} pageSize={10} onPageChange={setPage} />
      </div>

      {/* Role Edit Modal */}
      <Modal
        open={!!selectedUser}
        title={t('user.modalRoleTitle')}
        onClose={() => setSelectedUser(null)}
        width={450}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedUser(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              loading={roleMutation.isPending}
              onClick={() => {
                if (selectedUser && editRole) {
                  roleMutation.mutate({ id: selectedUser.id, role: editRole as User['role'] });
                }
              }}
            >
              {t('user.btnUpdateAuth')}
            </Button>
          </>
        }
      >
        {selectedUser && (
          <div className="modal-detail-grid">
            <div className="modal-detail-row">
              <span className="modal-detail-label">{t('user.modalSubjectIdentification')}</span>
              <span className="modal-detail-value">{selectedUser.username}</span>
            </div>
            <div className="modal-detail-row">
              <span className="modal-detail-label">Email</span>
              <span className="modal-detail-value">{selectedUser.email}</span>
            </div>
            <div className="modal-detail-full">
              <span className="modal-detail-label">{t('user.modalAssignmentLevel')}</span>
              <select
                className="table-select"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="admin">{t('user.optionAdmin')}</option>
                <option value="editor">{t('user.optionEditor')}</option>
                <option value="user">{t('user.optionViewer')}</option>
                <option value="guardian">{t('user.optionGuardian')}</option>
                <option value="compliance">{t('user.optionAuditor')}</option>
              </select>
            </div>
            <div className="modal-detail-full">
              <div className="modal-alert">{t('user.roleNotice')}</div>
            </div>
          </div>
        )}
      </Modal>

      {/* Status Confirm Modal */}
      <Modal
        open={!!statusConfirm}
        title={statusConfirm?.status === 'active' ? t('user.modalSuspendTitle') : t('user.modalRestoreTitle')}
        onClose={() => setStatusConfirm(null)}
        width={450}
        footer={
          <>
            <Button variant="ghost" onClick={() => setStatusConfirm(null)}>
              {t('user.btnAbort')}
            </Button>
            <Button
              variant={statusConfirm?.status === 'active' ? 'danger' : 'primary'}
              loading={statusMutation.isPending}
              onClick={() => {
                if (statusConfirm) {
                  statusMutation.mutate(
                    {
                      id: statusConfirm.id,
                      status: statusConfirm.status === 'active' ? 'banned' : 'active',
                    },
                    { onSuccess: () => setStatusConfirm(null) }
                  );
                }
              }}
            >
              {statusConfirm?.status === 'active' ? t('user.btnExecuteSuspension') : t('user.btnRestoreAccess')}
            </Button>
          </>
        }
      >
        {statusConfirm && (
          <div className="modal-detail-grid">
            <div className="modal-detail-full">
              <p className="modal-detail-text">
                {statusConfirm.status === 'active'
                  ? t('user.suspendConfirm', { username: statusConfirm.username })
                  : t('user.restoreConfirm', { username: statusConfirm.username })}
              </p>
            </div>
            <div className="modal-detail-full">
              <code className="table-text-mono">{statusConfirm.email}</code>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}