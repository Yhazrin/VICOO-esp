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
import { fetchOrders, updateOrderStatus } from '../services/api';
import type { Order } from '../types';
import dayjs from 'dayjs';

export default function OrderPage() {
  const { t } = useTranslation();
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
      toast.success(t('order.toastUpdated'));
    },
  });

  const getPaymentLabel = (v: string) => v === 'wechat' ? t('order.paymentWechat') : t('order.paymentAlipay');

  const columns: Column<Order>[] = [
    { key: 'orderNo', title: t('order.colOrderNo'), width: 130, sorter: true },
    { key: 'userName', title: t('order.colUser'), width: 100 },
    { key: 'items', title: t('order.colProduct'), width: 200, render: (items: Order['items']) => (
      <span>{items.map((i) => `${i.productName} x${i.quantity}`).join(', ')}</span>
    )},
    { key: 'totalAmount', title: t('order.colAmount'), width: 100, sorter: true, render: (v) => <span style={{ fontWeight: 600 }}>\u00a5{v.toLocaleString()}</span> },
    { key: 'paymentMethod', title: t('order.colPaymentMethod'), width: 100, render: (v) => getPaymentLabel(v) },
    { key: 'status', title: t('order.colStatus'), width: 100, render: (v) => <StatusBadge status={v} /> },
    { key: 'createdAt', title: t('order.colCreatedAt'), width: 160, sorter: true, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      key: 'action', title: t('order.colAction'), width: 200,
      render: (_: any, record: Order) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedOrder(record); }}>
            {t('order.btnDetail')}
          </Button>
          {record.status === 'paid' && (
            <Button size="sm" variant="primary" onClick={(e) => {
              e.stopPropagation();
              updateMutation.mutate({ id: record.id, status: 'shipped' });
            }}>
              {t('order.btnShip')}
            </Button>
          )}
          {record.status === 'shipped' && (
            <Button size="sm" variant="secondary" onClick={(e) => {
              e.stopPropagation();
              updateMutation.mutate({ id: record.id, status: 'delivered' });
            }}>
              {t('order.btnConfirmDelivery')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{t('order.title')}</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{t('order.description')}</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          type="text" placeholder={t('order.searchPlaceholder')}
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={filterStyle}
        />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={filterStyle}>
          <option value="">{t('order.filterAllStatuses')}</option>
          <option value="pending">{t('order.filterPending')}</option>
          <option value="paid">{t('order.filterPaid')}</option>
          <option value="shipped">{t('order.filterShipped')}</option>
          <option value="delivered">{t('order.filterDelivered')}</option>
          <option value="cancelled">{t('order.filterCancelled')}</option>
          <option value="refunded">{t('order.filterRefunded')}</option>
        </select>
      </div>

      <DataTable columns={columns} data={data?.data || []} rowKey="id" loading={isLoading} />
      <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} pageSize={10} onPageChange={setPage} />

      <Modal open={!!selectedOrder} title={t('order.modalTitle')} onClose={() => setSelectedOrder(null)} width={520}>
        {selectedOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <DetailRow label={t('order.detailOrderNo')} value={selectedOrder.orderNo} />
            <DetailRow label={t('order.detailUser')} value={selectedOrder.userName} />
            <DetailRow label={t('order.detailAmount')} value={`\u00a5${selectedOrder.totalAmount.toLocaleString()}`} />
            <DetailRow label={t('order.detailStatus')} value={<StatusBadge status={selectedOrder.status} />} />
            <DetailRow label={t('order.detailPaymentMethod')} value={getPaymentLabel(selectedOrder.paymentMethod)} />
            <DetailRow label={t('order.detailShippingAddress')} value={selectedOrder.shippingAddress} />
            {selectedOrder.trackingNo && <DetailRow label={t('order.detailTrackingNo')} value={selectedOrder.trackingNo} />}
            <DetailRow label={t('order.detailOrderTime')} value={dayjs(selectedOrder.createdAt).format('YYYY-MM-DD HH:mm:ss')} />
            {selectedOrder.paidAt && <DetailRow label={t('order.detailPayTime')} value={dayjs(selectedOrder.paidAt).format('YYYY-MM-DD HH:mm:ss')} />}
            {selectedOrder.shippedAt && <DetailRow label={t('order.detailShipTime')} value={dayjs(selectedOrder.shippedAt).format('YYYY-MM-DD HH:mm:ss')} />}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{t('order.detailItemsLabel')}</div>
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
