import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { fetchAuditLogs } from '../services/api';
import type { AuditLogEntry } from '../types';
import dayjs from 'dayjs';

const actionColors: Record<string, string> = {
  '登录系统': 'var(--color-info)',
  '审核作品': 'var(--color-accent)',
  '修改用户角色': 'var(--color-warning)',
  '导出数据': 'var(--color-info)',
  '修改设置': 'var(--color-warning)',
  '创建活动': 'var(--color-success)',
  '处理捐赠': 'var(--color-success)',
  '更新订单状态': 'var(--color-accent)',
  '查看儿童信息': 'var(--color-danger)',
  '删除数据': 'var(--color-danger)',
};

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', page, search, actionFilter],
    queryFn: () => fetchAuditLogs({ page, pageSize: 15, search: search || undefined }),
  });

  const filteredData = (data?.data || []).filter((log) => {
    if (actionFilter && log.action !== actionFilter) return false;
    if (resourceFilter && log.resource !== resourceFilter) return false;
    return true;
  });

  const columns: Column<AuditLogEntry>[] = [
    { key: 'timestamp', title: '时间', width: 160, sorter: true, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm:ss') },
    { key: 'userName', title: '操作人', width: 100 },
    { key: 'action', title: '操作', width: 140, render: (v) => (
      <span style={{
        padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
        background: `${actionColors[v]}15`, color: actionColors[v] || 'var(--color-text)',
      }}>
        {v}
      </span>
    )},
    { key: 'resource', title: '资源', width: 100 },
    { key: 'details', title: '详情', render: (v) => (
      <span style={{ color: 'var(--color-text-secondary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', whiteSpace: 'nowrap' }}>
        {v}
      </span>
    )},
    { key: 'ipAddress', title: 'IP 地址', width: 130 },
    {
      key: 'action_col', title: '操作', width: 80,
      render: (_: any, record: AuditLogEntry) => (
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelected(record); }}>
          详情
        </Button>
      ),
    },
  ];

  const uniqueActions = [...new Set((data?.data || []).map((l) => l.action))];
  const uniqueResources = [...new Set((data?.data || []).map((l) => l.resource))];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>审计日志</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          查看系统操作记录与安全审计事件
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text" placeholder="搜索操作人或详情..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={filterStyle}
        />
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={filterStyle}>
          <option value="">全部操作</option>
          {uniqueActions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={resourceFilter} onChange={(e) => setResourceFilter(e.target.value)} style={filterStyle}>
          <option value="">全部资源</option>
          {uniqueResources.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16,
      }}>
        {[
          { label: '总操作数', value: data?.total || 0 },
          { label: '安全操作', value: filteredData.filter((l) => l.action === '查看儿童信息' || l.action === '删除数据').length },
          { label: '今日操作', value: filteredData.filter((l) => dayjs(l.timestamp).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')).length },
          { label: '涉及用户', value: new Set(filteredData.map((l) => l.userId)).size },
        ].map((s) => (
          <div key={s.label} style={{
            padding: '12px 16px', background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
          }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <DataTable columns={columns} data={filteredData} rowKey="id" loading={isLoading} />
      <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} pageSize={15} onPageChange={setPage} />

      {/* Detail Modal */}
      <Modal open={!!selected} title="审计日志详情" onClose={() => setSelected(null)} width={520}>
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Row label="日志 ID" value={selected.id} />
            <Row label="操作人" value={selected.userName} />
            <Row label="用户 ID" value={selected.userId} />
            <Row label="操作" value={selected.action} />
            <Row label="资源" value={selected.resource} />
            {selected.resourceId && <Row label="资源 ID" value={selected.resourceId} />}
            <Row label="IP 地址" value={selected.ipAddress} />
            <Row label="时间" value={dayjs(selected.timestamp).format('YYYY-MM-DD HH:mm:ss')} />
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>操作详情</div>
              <div style={{ fontSize: 13, padding: '8px 12px', background: '#f9f9f7', borderRadius: 'var(--radius-sm)' }}>
                {selected.details}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>User Agent</div>
              <div style={{ fontSize: 12, padding: '8px 12px', background: '#f9f9f7', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
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
