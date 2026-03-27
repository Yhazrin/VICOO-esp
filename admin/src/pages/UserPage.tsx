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
    { key: 'id', title: 'ID', width: 90 },
    { key: 'username', title: '用户名', sorter: true },
    { key: 'email', title: '邮箱', width: 200 },
    { key: 'role', title: '角色', width: 100, render: (v) => (
      <span style={{
        padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
        background: v === 'admin' ? 'var(--color-accent-light)' : '#f3f4f6',
        color: v === 'admin' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
      }}>
        {roleLabels[v] || v}
      </span>
    )},
    { key: 'status', title: '状态', width: 100, render: (v) => <StatusBadge status={v} /> },
    { key: 'createdAt', title: '注册时间', width: 140, render: (v) => dayjs(v).format('YYYY-MM-DD') },
    { key: 'lastLogin', title: '最后登录', width: 140, render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
    {
      key: 'action', title: '操作', width: 200,
      render: (_: any, record: User) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedUser(record); setEditRole(record.role); }}>
            编辑角色
          </Button>
          <Button
            size="sm"
            variant={record.status === 'active' ? 'danger' : 'secondary'}
            onClick={(e) => {
              e.stopPropagation();
              setStatusConfirm(record);
            }}
          >
            {record.status === 'active' ? '禁用' : '启用'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>用户管理</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          管理平台用户与角色权限
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          type="text" placeholder="搜索用户名或邮箱..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={filterStyle}
        />
      </div>

      <DataTable columns={columns} data={data?.data || []} rowKey="id" loading={isLoading} />
      <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} pageSize={10} onPageChange={setPage} />

      {/* Role Edit Modal */}
      <Modal
        open={!!selectedUser}
        title="编辑用户角色"
        onClose={() => setSelectedUser(null)}
        width={400}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedUser(null)}>取消</Button>
            <Button variant="primary" loading={roleMutation.isPending} onClick={() => {
              if (selectedUser && editRole) {
                roleMutation.mutate({ id: selectedUser.id, role: editRole as User['role'] });
              }
            }}>
              保存
            </Button>
          </>
        }
      >
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '12px', background: '#f9f9f7', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedUser.username}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{selectedUser.email}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>选择角色</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                style={{ ...filterStyle, width: '100%' }}
              >
                <option value="admin">管理员</option>
                <option value="editor">编辑</option>
                <option value="viewer">访客</option>
                <option value="auditor">审计员</option>
              </select>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-light)', padding: '8px 12px', background: 'var(--color-warning-light)', borderRadius: 'var(--radius-sm)' }}>
              注意：修改角色将立即生效，请谨慎操作。
            </div>
          </div>
        )}
      </Modal>

      {/* Status Confirm Modal */}
      <Modal
        open={!!statusConfirm}
        title={statusConfirm?.status === 'active' ? '确认禁用用户' : '确认启用用户'}
        onClose={() => setStatusConfirm(null)}
        width={400}
        footer={
          <>
            <Button variant="secondary" onClick={() => setStatusConfirm(null)}>取消</Button>
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
              {statusConfirm?.status === 'active' ? '确认禁用' : '确认启用'}
            </Button>
          </>
        }
      >
        {statusConfirm && (
          <div>
            <p style={{ fontSize: 14, margin: '0 0 8px' }}>
              {statusConfirm.status === 'active'
                ? `确定要禁用用户「${statusConfirm.username}」吗？禁用后该用户将无法登录。`
                : `确定要启用用户「${statusConfirm.username}」吗？`}
            </p>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', padding: '8px 12px', background: '#f9f9f7', borderRadius: 'var(--radius-sm)' }}>
              邮箱：{statusConfirm.email}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

const filterStyle: React.CSSProperties = {
  padding: '8px 12px', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)', fontSize: 13,
  background: 'var(--color-bg-card)', outline: 'none',
};
