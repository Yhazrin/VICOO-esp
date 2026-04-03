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
  '登录系统': '#7A6A58',
  '审核作品': '#8B3A2A',
  '修改用户角色': '#5C4033',
  '导出数据': '#7A6A58',
  '修改设置': '#5C4033',
  '创建活动': '#8B3A2A',
  '处理捐赠': '#5C4033',
  '更新订单状态': '#8B3A2A',
  '查看儿童信息': '#8B3A2A',
  '删除数据': '#8B3A2A',
};

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', page, search, actionFilter],
    queryFn: () => fetchAuditLogs({ 
      page, 
      pageSize: 15, 
      search: search || undefined,
      status: actionFilter || undefined 
    }),
  });

  const columns: Column<AuditLogEntry>[] = [
    { key: 'timestamp', title: '时间', width: 180, sorter: true, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm:ss') },
    { key: 'userName', title: '操作人', width: 120 },
    { key: 'action', title: '操作', width: 150, render: (v) => (
      <span style={{
        padding: '2px 8px', 
        borderRadius: '2px', 
        fontSize: '11px', 
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        border: `1px solid ${actionColors[v] || 'var(--color-ink)'}`,
        color: actionColors[v] || 'var(--color-ink)',
      }}>
        {v}
      </span>
    )},
    { key: 'resource', title: '资源', width: 120 },
    { key: 'details', title: '详情', render: (v) => (
      <span style={{ 
        color: 'var(--color-ink-faded)', 
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
    { key: 'ipAddress', title: 'IP 地址', width: 140, render: (v) => <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{v}</code> },
    {
      key: 'action_col', title: '操作', width: 100,
      render: (_: any, record: AuditLogEntry) => (
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelected(record); }}>
          查看详情
        </Button>
      ),
    },
  ];

  const uniqueActions = ['登录系统', '审核作品', '修改用户角色', '导出数据', '修改设置', '创建活动', '处理捐赠', '更新订单状态', '查看儿童信息', '删除数据'];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, fontFamily: 'var(--font-serif)' }}>审计日志</h1>
        <p style={{ fontSize: 14, color: 'var(--color-sepia-mid)', maxWidth: '600px', lineHeight: 1.6 }}>
          记录了管理系统内所有关键操作的完整审计轨迹。这对于确保系统安全、合规性以及在出现问题时进行追溯至关重要。
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center' }}>
        <input
          type="text" placeholder="搜索操作人或详情..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={filterStyle}
        />
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={filterStyle}>
          <option value="">所有操作类型</option>
          {uniqueActions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        
        <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--color-sepia-mid)' }}>
          共找到 {data?.total || 0} 条记录
        </div>
      </div>

      <DataTable columns={columns} data={data?.data || []} rowKey="id" loading={isLoading} />
      
      <div style={{ marginTop: 32 }}>
        <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} pageSize={15} onPageChange={setPage} />
      </div>

      {/* Detail Modal */}
      <Modal open={!!selected} title="审计日志详情" onClose={() => setSelected(null)} width={600}>
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '10px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
              <Row label="日志 ID" value={<code style={{ fontFamily: 'var(--font-mono)' }}>{selected.id}</code>} />
              <Row label="时间" value={dayjs(selected.timestamp).format('YYYY-MM-DD HH:mm:ss')} />
              <Row label="操作人" value={selected.userName} />
              <Row label="用户 ID" value={<code style={{ fontFamily: 'var(--font-mono)' }}>{selected.userId}</code>} />
              <Row label="操作" value={selected.action} />
              <Row label="资源" value={selected.resource} />
              <Row label="资源 ID" value={selected.resourceId ? <code style={{ fontFamily: 'var(--font-mono)' }}>{selected.resourceId}</code> : '-'} />
              <Row label="IP 地址" value={<code style={{ fontFamily: 'var(--font-mono)' }}>{selected.ipAddress}</code>} />
            </div>
            
            <div style={{ borderTop: '1px solid var(--color-warm-gray)', paddingTop: 20 }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-sepia-mid)', marginBottom: 8 }}>操作详情</div>
              <div style={{ fontSize: 14, padding: '16px', background: 'var(--color-paper)', border: '1px solid var(--color-warm-gray)', lineHeight: 1.6 }}>
                {selected.details}
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-sepia-mid)', marginBottom: 8 }}>设备指纹 (User Agent)</div>
              <div style={{ fontSize: 12, padding: '12px', background: 'var(--color-paper)', border: '1px solid var(--color-warm-gray)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all', color: 'var(--color-ink-faded)' }}>
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
      <span style={{ fontSize: 11, color: 'var(--color-sepia-mid)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink)' }}>{value}</span>
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
  minWidth: '240px'
};
