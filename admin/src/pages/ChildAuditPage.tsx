import { useState } from 'react';
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
        alert('访问码错误，请联系管理员获取');
      }
    } catch {
      alert('验证失败，请重试');
    }
  };

  // Access control gate
  if (!accessGranted) {
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>儿童参与者审计</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            审查儿童参与者数据（受严格访问控制保护）
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
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>敏感数据区域</h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
            此页面包含儿童个人信息，受《个人信息保护法》保护。<br />
            请输入审计访问码以继续。
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAccess()}
              placeholder="输入访问码"
              style={{
                flex: 1, padding: '10px 14px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)', fontSize: 14, outline: 'none',
              }}
            />
            <Button variant="primary" onClick={handleAccess}>验证</Button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--color-text-light)', marginTop: 12, fontFamily: 'var(--font-mono)' }}>
            联系管理员获取访问码
          </p>
        </div>
      </div>
    );
  }

  const columns: Column<ChildParticipant>[] = [
    { key: 'id', title: 'ID', width: 90 },
    { key: 'childName', title: '儿童姓名' },
    { key: 'age', title: '年龄', width: 60 },
    { key: 'guardianName', title: '监护人' },
    { key: 'region', title: '地区', width: 100 },
    { key: 'school', title: '学校', width: 120, render: (v) => v || '-' },
    { key: 'artworkCount', title: '作品数', width: 80 },
    { key: 'consentGiven', title: '同意书', width: 80, render: (v) => v ? (
      <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>已签署</span>
    ) : (
      <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>未签署</span>
    )},
    { key: 'status', title: '状态', width: 100, render: (v) => <StatusBadge status={v} /> },
    {
      key: 'action', title: '操作', width: 80,
      render: (_: any, record: ChildParticipant) => (
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelected(record); }}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>儿童参与者审计</h1>
          <span style={{
            padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
            background: 'var(--color-danger-light)', color: 'var(--color-danger)',
          }}>
            受限访问
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          所有访问行为将被记录至审计日志。儿童信息查看需二级审批。
        </p>
      </div>

      {/* Notice */}
      <div style={{
        padding: '12px 16px', background: 'var(--color-warning-light)',
        borderRadius: 'var(--radius-sm)', marginBottom: 16,
        fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
        </svg>
        您正在访问受保护的儿童个人信息区域。您的操作将被记录。
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          type="text" placeholder="搜索儿童姓名或监护人..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={filterStyle}
        />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={filterStyle}>
          <option value="">全部状态</option>
          <option value="active">活跃</option>
          <option value="withdrawn">已退出</option>
          <option value="pending_review">待审查</option>
        </select>
      </div>

      <DataTable columns={columns} data={data?.data || []} rowKey="id" loading={isLoading} />
      <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} pageSize={10} onPageChange={setPage} />

      {/* Detail Modal */}
      <Modal open={!!selected} title="参与者详情" onClose={() => setSelected(null)} width={520}>
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: '12px', background: 'var(--color-danger-light)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: '#991b1b' }}>
              以下信息受《个人信息保护法》保护，未经授权不得外传。
            </div>
            <Row label="儿童姓名" value={selected.childName} />
            <Row label="年龄" value={`${selected.age}岁`} />
            <Row label="监护人" value={selected.guardianName} />
            <Row label="监护人电话" value={selected.guardianPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')} />
            <Row label="监护人邮箱" value={selected.guardianEmail.replace(/(.{2}).+(@.+)/, '$1***$2')} />
            <Row label="地区" value={selected.region} />
            <Row label="学校" value={selected.school || '-'} />
            <Row label="同意书" value={selected.consentGiven ? `已签署 (${dayjs(selected.consentDate).format('YYYY-MM-DD')})` : '未签署'} />
            <Row label="作品数" value={selected.artworkCount.toString()} />
            <Row label="状态" value={<StatusBadge status={selected.status} />} />
            <Row label="加入时间" value={dayjs(selected.createdAt).format('YYYY-MM-DD')} />
            {selected.lastActivity && <Row label="最后活动" value={dayjs(selected.lastActivity).format('YYYY-MM-DD HH:mm')} />}
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
  padding: '8px 12px', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)', fontSize: 13,
  background: 'var(--color-bg-card)', outline: 'none',
};
