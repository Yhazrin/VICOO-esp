var auth = require('../../../utils/auth');
var http = require('../../../utils/request');
var util = require('../../../utils/util');

Page({
  data: {
    statusTabs: [
      { key: 'all', label: 'All' },
      { key: 'pending', label: 'Pending' },
      { key: 'paid', label: 'Paid' },
      { key: 'shipped', label: 'Shipped' },
      { key: 'completed', label: 'Completed' }
    ],
    currentStatus: 'all',
    orders: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
    isEmpty: false
  },

  onLoad: function () {
    var self = this;
    auth.ensureLogin().then(function() {
      self.loadOrders();
    }).catch(function() {
      wx.showToast({ title: '\u8BF7\u5148\u767B\u5F55', icon: 'none' });
    });
  },

  onShow: function () {
    // Server handles session via httpOnly cookies
    this.loadOrders();
  },

  onPullDownRefresh: function () {
    this.setData({ page: 1, hasMore: true, orders: [] });
    this.loadOrders();
    wx.stopPullDownRefresh();
  },

  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loading) {
      this.loadOrders();
    }
  },

  handleStatusChange: function (e) {
    var status = e.currentTarget.dataset.status;
    this.setData({
      currentStatus: status,
      page: 1,
      orders: [],
      hasMore: true
    });
    this.loadOrders();
  },

  loadOrders: function () {
    var that = this;
    if (that.data.loading) { return; }

    that.setData({ loading: true });

    http.get('/orders', {
      status: that.data.currentStatus === 'all' ? '' : that.data.currentStatus,
      page: that.data.page,
      pageSize: that.data.pageSize
    }).then(function (res) {
      var list = (res && res.list) || [];
      list = list.map(function (item) {
        item.createdAtFormatted = util.formatDate(item.createdAt);
        item.totalAmountFormatted = util.formatPrice(item.totalAmount);
        return item;
      });
      var orders = that.data.page === 1 ? list : that.data.orders.concat(list);
      that.setData({
        orders: orders,
        hasMore: list.length >= that.data.pageSize,
        page: that.data.page + 1,
        isEmpty: that.data.page === 1 && list.length === 0
      });
    }).catch(function () {
      // Error toast already shown by centralized request utility
    }).then(function() {
      // "finally" — always clear loading
      that.setData({ loading: false });
    });
  },

  handleOrderTap: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/order/detail/index?id=' + id });
  },

  getStatusText: function (status) {
    var map = {
      pending: 'Pending Payment',
      paid: 'Paid',
      shipped: 'Shipped',
      completed: 'Completed',
      cancelled: 'Cancelled',
      refunded: 'Refunded'
    };
    return map[status] || status;
  }
});
