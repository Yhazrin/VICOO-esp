var auth = require('../../../utils/auth');
var http = require('../../../utils/request');
var util = require('../../../utils/util');

Page({
  data: {
    donations: [],
    totalAmount: 0,
    totalCount: 0,
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
    isEmpty: false
  },

  onLoad: function () {
    var self = this;
    auth.ensureLogin().then(function() {
      self.loadDonations();
    }).catch(function() {
      wx.showToast({ title: '\u8BF7\u5148\u767B\u5F55', icon: 'none' });
    });
  },

  onShow: function () {
    // Server handles session via httpOnly cookies
    this.setData({ page: 1, donations: [], hasMore: true });
    this.loadDonations();
  },

  onPullDownRefresh: function () {
    this.setData({ page: 1, donations: [], hasMore: true });
    this.loadDonations();
    wx.stopPullDownRefresh();
  },

  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loading) {
      this.loadDonations();
    }
  },

  loadDonations: function () {
    var that = this;
    if (that.data.loading) { return; }

    that.setData({ loading: true });

    http.get('/donations/my', {
      page: that.data.page,
      pageSize: that.data.pageSize
    }).then(function (res) {
      var result = res || {};
      var list = result.list || [];
      list = list.map(function (item) {
        item.createdAtFormatted = util.formatDate(item.createdAt);
        item.amountFormatted = util.formatPrice(item.amount);
        return item;
      });
      var donations = that.data.page === 1 ? list : that.data.donations.concat(list);
      that.setData({
        donations: donations,
        totalAmount: result.totalAmount || 0,
        totalCount: result.totalCount || donations.length,
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

  handleDonationTap: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/donate/detail/index?id=' + id });
  },

  handleDonateNow: function () {
    wx.navigateTo({ url: '/pages/donate/index' });
  },

  handleViewCertificate: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/user/certificate/index?id=' + id });
  }
});
