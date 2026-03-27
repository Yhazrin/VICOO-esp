var http = require('../../../utils/request');
var util = require('../../../utils/util');

Page({
  data: {
    order: null,
    loading: true
  },
  onLoad: function(options) {
    this.orderId = options.id;
    this.loadOrder();
  },
  loadOrder: function() {
    var self = this;
    http.get('/orders/' + self.orderId).then(function(res) {
      self.setData({ order: res, loading: false });
    }).catch(function() { self.setData({ loading: false }); });
  },
  onTraceTap: function() {
    wx.navigateTo({ url: '/pages/shop/index?traceId=' + this.data.order.id });
  }
});
