import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { fetchOrders, updateOrderStatus } from '../services/api';
import type { Order } from '../types';
import dayjs from 'dayjs';

export default function OrderPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, statusFilter, search],
    queryFn: () => fetchOrders({ page, pageSize: 10, status: statusFilter || undefined, search: search || undefined }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Order['status'] }) => updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('订单状态已更新');
    },
  });

  const columns: Column<Order>[] = [
    { key: 'orderNo', title: '订单号', width: 130, sorter: true },
    { key: 'userName', title: '用户', width: 100 },
    { key: 'items', title: '商品', width: 200, render: (items: Order['items']) => (
      <span>{items.map((i) => `${i.productName} x${i.quantity}`).join(', ')}</span>
    )},
    { key: 'totalAmount', title: '金额', width: 100, sorter: true, render: (v) => <span style={{ fontWeight: 600 }}>\u00a5{v.toLocaleString()}</span> },
    { key: 'paymentMethod', title: '支付方式', width: 100, render: (v) => v === 'wechat' ? '微信' : '支付宝' },
    { key: 'status', title: '状态', width: 100, render: (v) => <StatusBadge status={v} /> },
    { key: 'createdAt', title: '下单时间', width: 160, sorter: true, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      key: 'action', title: '操作', width: 200,
      render: (_: any, record: Order) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedOrder(record); }}>
            详情
          </Button>
          {record.status === 'paid' && (
            <Button size="sm" variant="primary" onClick={(e) => {
              e.stopPropagation();
              updateMutation.mutate({ id: record.id, status: 'shipped' });
            }}>
              发货
            </Button>
          )}
          {record.status === 'shipped' && (
            <Button size="sm" variant="secondary" onClick={(e) => {
              e.stopPropagation();
              updateMutation.mutate({ id: record.id, status: 'delivered' });
            }}>
              确认送达
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>订单管理</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          查看和管理商品订单
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          type="text" placeholder="搜索订单号或用户..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={filterStyle}
        />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={filterStyle}>
          <option value="">全部状态</option>
          <option value="pending">待支付</option>
          <option value="paid">已支付</option>
          <option value="shipped">已发货</option>
          <option value="delivered">已送达</option>
          <option value="cancelled">已取消</option>
          <option value="refunded">已退款</option>
        </select>
      </div>

      <DataTable columns={columns} data={data?.data || []} rowKey="id" loading={isLoading} />
      <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} pageSize={10} onPageChange={setPage} />

      {/* Detail Modal */}
      <Modal open={!!selectedOrder} title="订单详情" onClose={() => setSelectedOrder(null)} width={520}>
        {selectedOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <DetailRow label="订单号" value={selectedOrder.orderNo} />
            <DetailRow label="用户" value={selectedOrder.userName} />
            <DetailRow label="金额" value={`\u00a5${selectedOrder.totalAmount.toLocaleString()}`} />
            <DetailRow label="状态" value={<StatusBadge status={selectedOrder.status} />} />
            <DetailRow label="支付方式" value={selectedOrder.paymentMethod === 'wechat' ? '微信支付' : '支付宝'} />
            <DetailRow label="收货地址" value={selectedOrder.shippingAddress} />
            {selectedOrder.trackingNo && <DetailRow label="快递单号" value={selectedOrder.trackingNo} />}
            <DetailRow label="下单时间" value={dayjs(selectedOrder.createdAt).format('YYYY-MM-DD HH:mm:ss')} />
            {selectedOrder.paidAt && <DetailRow label="支付时间" value={dayjs(selectedOrder.paidAt).format('YYYY-MM-DD HH:mm:ss')} />}
            {selectedOrder.shippedAt && <DetailRow label="发货时间" value={dayjs(selectedOrder.shippedAt).format('YYYY-MM-DD HH:mm:ss')} />}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>商品明细</div>
              {selectedOrder.items.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                  borderBottom: '1px solid var(--color-border-light)',
                }}>
                  <span style={{ fontSize: 13 }}>{item.productName} x{item.quantity}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>\u00a5{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
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
