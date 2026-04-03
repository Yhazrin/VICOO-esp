import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

const roleLabels: Record<string, string> = {
  admin: '管理员',
  editor: '编辑',
  viewer: '访客',
  auditor: '审计员',
};

const roleColors: Record<string, string> = {
  admin: 'var(--color-rust)',
  editor: 'var(--color-archive-brown)',
  viewer: 'var(--color-sepia-mid)',
  auditor: 'var(--color-info)',
};

export default function UserPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState('');
  const [statusConfirm, setStatusConfirm] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () => fetchUsers({ page, pageSize: 10, search: search || undefined }),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: User['role'] }) => updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('角色已更新');
      setSelectedUser(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: User['status'] }) => updateUserStatus(id, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(vars.status === 'disabled' ? '用户已禁用' : '用户已启用');
    },
  });

  const columns: Column<User>[] = [
    { key: 'id', title: 'Identity', width: 120, render: (v) => <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{v}</code> },
    { key: 'username', title: 'Username', sorter: true, render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'email', title: 'Email Address', width: 220 },
    { key: 'role', title: 'Authority', width: 120, render: (v) => (
      <span style={{
        padding: '2px 8px', 
        borderRadius: '2px', 
        fontSize: '10px', 
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        background: 'var(--color-aged-stock)',
        color: roleColors[v] || 'var(--color-ink)',
        border: `1px solid ${roleColors[v] || 'var(--color-ink)'}20`
      }}>
        {roleLabels[v] || v}
      </span>
    )},
    { key: 'status', title: 'Availability', width: 120, render: (v) => <StatusBadge status={v} /> },
    { key: 'createdAt', title: 'Registration', width: 140, render: (v) => dayjs(v).format('YYYY-MM-DD') },
    { key: 'lastLogin', title: 'Last Access', width: 160, render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
    {
      key: 'action', title: 'Command', width: 220,
      render: (_: any, record: User) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setSelectedUser(record); setEditRole(record.role); }}>
            Edit Role
          </Button>
          <Button
            size="sm"
            variant={record.status === 'active' ? 'danger' : 'primary'}
            onClick={(e) => {
              e.stopPropagation();
              setStatusConfirm(record);
            }}
          >
            {record.status === 'active' ? 'Disable' : 'Enable'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, fontFamily: 'var(--font-serif)' }}>User Directory</h1>
        <p style={{ fontSize: 14, color: 'var(--color-sepia-mid)', maxWidth: '600px', lineHeight: 1.6 }}>
          Manage administrative permissions and monitor system access. Revoking authority or disabling accounts takes immediate effect across all terminal sessions.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <input
          type="text" placeholder="Search by name or email..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={filterStyle}
        />
      </div>

      <DataTable columns={columns} data={data?.data || []} rowKey="id" loading={isLoading} />
      
      <div style={{ marginTop: 32 }}>
        <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} pageSize={10} onPageChange={setPage} />
      </div>

      {/* Role Edit Modal */}
      <Modal
        open={!!selectedUser}
        title="Administrative Override: Role"
        onClose={() => setSelectedUser(null)}
        width={450}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedUser(null)}>Cancel</Button>
            <Button variant="primary" loading={roleMutation.isPending} onClick={() => {
              if (selectedUser && editRole) {
                roleMutation.mutate({ id: selectedUser.id, role: editRole as User['role'] });
              }
            }}>
              Update Authorization
            </Button>
          </>
        }
      >
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ padding: '20px', background: 'var(--color-paper)', border: '1px solid var(--color-ink)', borderRadius: '2px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-sepia-mid)', marginBottom: 4 }}>Subject Identification</div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{selectedUser.username}</div>
              <div style={{ fontSize: 13, color: 'var(--color-archive-brown)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>{selectedUser.email}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, color: 'var(--color-ink)' }}>Assignment Level</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                style={{ ...filterStyle, width: '100%', borderRadius: '2px', border: '1px solid var(--color-ink)' }}
              >
                <option value="admin">Administrator (Full Access)</option>
                <option value="editor">Editor (Content Management)</option>
                <option value="viewer">Visitor (Read Only)</option>
                <option value="auditor">Auditor (Security Logs)</option>
              </select>
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--color-danger)', padding: '12px 16px', background: 'var(--color-danger-light)', border: '1px solid var(--color-danger)20' }}>
              <strong>Notice:</strong> Assigning administrative roles grants significant access to sensitive archival data. Please verify identity before proceeding.
            </div>
          </div>
        )}
      </Modal>

      {/* Status Confirm Modal */}
      <Modal
        open={!!statusConfirm}
        title={statusConfirm?.status === 'active' ? 'Account Suspension' : 'Account Re-enablement'}
        onClose={() => setStatusConfirm(null)}
        width={450}
        footer={
          <>
            <Button variant="ghost" onClick={() => setStatusConfirm(null)}>Abort</Button>
            <Button
              variant={statusConfirm?.status === 'active' ? 'danger' : 'primary'}
              loading={statusMutation.isPending}
              onClick={() => {
                if (statusConfirm) {
                  statusMutation.mutate({
                    id: statusConfirm.id,
                    status: statusConfirm.status === 'active' ? 'disabled' : 'active',
                  }, { onSuccess: () => setStatusConfirm(null) });
                }
              }}
            >
              {statusConfirm?.status === 'active' ? 'Execute Suspension' : 'Restore Access'}
            </Button>
          </>
        }
      >
        {statusConfirm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              {statusConfirm.status === 'active'
                ? `Are you certain you wish to suspend access for 「${statusConfirm.username}」? This action will immediately terminate all active sessions.`
                : `Confirm restoration of access for 「${statusConfirm.username}」.`}
            </p>
            <div style={{ fontSize: 12, color: 'var(--color-sepia-mid)', padding: '12px', background: 'var(--color-aged-stock)', fontFamily: 'var(--font-mono)' }}>
              Identification: {statusConfirm.email}
            </div>
          </div>
        )}
      </Modal>
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
  minWidth: '280px'
};
