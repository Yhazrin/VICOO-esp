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
import { PageHeader } from '../components/ui/PageHeader';
import { SummaryCard, MiniStat } from '../components/ui/SummaryCard';
import { OrderActivityChart } from '../components/charts/OrderActivityChart';
import { fetchOrders, updateOrderStatus } from '../services/api';
import type { Order } from '../types';
import { formatDateTime, formatDateTimeFull } from '../utils/dateTime';

// Icons as React elements
const SearchIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const OrdersIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const PendingIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CompletedIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function OrderPage() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
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

  // Calculate summary stats
  const orders = data?.data || [];
  const summaryStats = {
    total: orders.length,
    pending: orders.filter((o: Order) => o.status === 'pending' || o.status === 'paid').length,
    completed: orders.filter((o: Order) => o.status === 'completed').length,
    cancelled: orders.filter((o: Order) => o.status === 'cancelled').length,
    revenue: orders.reduce((sum: number, o: Order) => sum + o.totalAmount, 0),
  };

  const getPaymentLabel = (v: string) => {
    const map: Record<string, string> = {
      wechat: t('order.paymentWechat'),
      alipay: t('order.paymentAlipay'),
      stripe: t('order.paymentStripe'),
      paypal: t('order.paymentPaypal'),
    };
    return map[v] || v || '-';
  };

  const columns: Column<Order>[] = [
    { key: 'orderNo', title: t('order.colOrderNo'), width: 130, sorter: true },
    { key: 'userName', title: t('order.colUser'), width: 100 },
    { key: 'items', title: t('order.colProduct'), width: 220, render: (items: Order['items']) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {items[0]?.imageUrl && (
          <img
            src={items[0].imageUrl}
            alt={items[0].productName}
            style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--color-border)' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <span className="table-text-truncate">{items.map((i) => `${i.productName} x${i.quantity}`).join(', ')}</span>
      </div>
    )},
    { key: 'totalAmount', title: t('order.colAmount'), width: 100, sorter: true, render: (v) => (
      <span className="table-text-mono">¥{Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
    ) },
    { key: 'paymentMethod', title: t('order.colPaymentMethod'), width: 100, render: (v) => getPaymentLabel(v) },
    { key: 'status', title: t('order.colStatus'), width: 100, render: (v) => <StatusBadge status={v} context="order" /> },
    { key: 'createdAt', title: t('order.colCreatedAt'), width: 160, sorter: true, render: (v) => formatDateTime(v) },
    {
      key: 'action', title: t('order.colAction'), width: 200,
      render: (_: any, record: Order) => (
        <div className="table-actions">
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
              updateMutation.mutate({ id: record.id, status: 'completed' });
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
      <PageHeader
        title={t('order.title')}
        description={t('order.description')}
      />

      {/* Summary Cards */}
      <div className="dashboard-summary-grid" style={{ marginBottom: 24 }}>
        <SummaryCard title={isZh ? '订单总数' : 'Total Orders'} subtitle={isZh ? '总计' : 'All'} icon={OrdersIcon}>
          <MiniStat label={t('common.miniStatThisWeek')} value={summaryStats.total} change={12} />
          <MiniStat label={t('common.miniStatPending')} value={summaryStats.pending} />
        </SummaryCard>
        <SummaryCard title={isZh ? '待处理' : 'Pending'} subtitle={isZh ? '处理中' : 'Processing'} icon={PendingIcon}>
          <MiniStat label={isZh ? '待发货' : 'To Ship'} value={orders.filter((o: Order) => o.status === 'paid').length} />
          <MiniStat label={isZh ? '运输中' : 'Shipping'} value={orders.filter((o: Order) => o.status === 'shipped').length} />
        </SummaryCard>
        <SummaryCard title={isZh ? '已完成' : 'Completed'} subtitle={isZh ? '完成' : 'Done'} icon={CompletedIcon}>
          <MiniStat label={isZh ? '已完成' : 'Completed'} value={summaryStats.completed} />
          <MiniStat label={isZh ? '取消/退款' : 'Cancelled'} value={summaryStats.cancelled} trend="error" />
        </SummaryCard>
      </div>

      {/* Chart */}
      <div style={{ marginBottom: 24 }}>
        <OrderActivityChart />
      </div>

      {/* Filters */}
      <div className="table-toolbar">
        <div className="table-toolbar__filters">
          <div className="table-search">
            {SearchIcon}
            <input
              type="text"
              placeholder={t('order.searchPlaceholder')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="table-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">{t('order.filterAllStatuses')}</option>
            <option value="pending">{t('order.filterPending')}</option>
            <option value="paid">{t('order.filterPaid')}</option>
            <option value="shipped">{t('order.filterShipped')}</option>
            <option value="completed">{t('order.filterDelivered')}</option>
            <option value="cancelled">{t('order.filterCancelled')}</option>
          </select>
        </div>
      </div>

      <DataTable columns={columns} data={orders} rowKey="id" loading={isLoading} />
      <Pagination page={page} totalPages={data?.totalPages || 1} total={data?.total || 0} pageSize={10} onPageChange={setPage} />

      <Modal open={!!selectedOrder} title={t('order.modalTitle')} onClose={() => setSelectedOrder(null)} width={520}>
        {selectedOrder && (
          <div className="modal-detail-grid">
            <DetailRow label={t('order.detailOrderNo')} value={selectedOrder.orderNo} />
            <DetailRow label={t('order.detailUser')} value={selectedOrder.userName} />
            <DetailRow label={t('order.detailAmount')} value={`¥${selectedOrder.totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`} />
            <DetailRow label={t('order.detailStatus')} value={<StatusBadge status={selectedOrder.status} context="order" />} />
            <DetailRow label={t('order.detailPaymentMethod')} value={getPaymentLabel(selectedOrder.paymentMethod)} />
            <DetailRow label={t('order.detailShippingAddress')} value={selectedOrder.shippingAddress} />
            {selectedOrder.trackingNo && <DetailRow label={t('order.detailTrackingNo')} value={selectedOrder.trackingNo} />}
            <DetailRow label={t('order.detailOrderTime')} value={formatDateTimeFull(selectedOrder.createdAt)} />
            <div className="modal-detail-full">
              <span className="modal-detail-label">{t('order.detailItemsLabel')}</span>
              <div className="modal-items">
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="modal-item-row" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--color-border)' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <span style={{ flex: 1 }}>{item.productName} x{item.quantity}</span>
                    <span>¥{(item.price * item.quantity).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="modal-detail-row">
      <span className="modal-detail-label">{label}</span>
      <span className="modal-detail-value">{value}</span>
    </div>
  );
}
