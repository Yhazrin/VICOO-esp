var http = require('../../../utils/request');
var auth = require('../../../utils/auth');

Page({
  data: {
    cartItems: [],
    address: { name: '', phone: '', detail: '' },
    totalAmount: 0,
    submitting: false
  },
  onLoad: function() {
    var cart = wx.getStorageSync('cart') || [];
    var self = this;
    if (!cart.length) { wx.navigateBack(); return; }
    var ids = cart.map(function(c) { return c.id; }).join(',');
    http.get('/products/batch', { ids: ids }).then(function(res) {
      var items = cart.map(function(c) {
        var p = (res || []).find(function(x) { return x.id === c.id; }) || {};
        return { product: p, quantity: c.quantity };
      });
      var total = items.reduce(function(s, i) { return s + (i.product.price || 0) * i.quantity; }, 0);
      self.setData({ cartItems: items, totalAmount: total });
    }).catch(function() {
      wx.showToast({ title: '加载购物车失败', icon: 'none' });
    });
  },
  onNameInput: function(e) {
    this.setData({ 'address.name': e.detail.value });
  },
  onPhoneInput: function(e) {
    this.setData({ 'address.phone': e.detail.value });
  },
  onAddrInput: function(e) {
    this.setData({ 'address.detail': e.detail.value });
  },
  onSubmit: function() {
    var self = this;
    if (!self.data.address.name || !self.data.address.phone || !self.data.address.detail) {
      wx.showToast({ title: '请填写完整地址', icon: 'none' }); return;
    }
    auth.ensureLogin().then(function() {
      self.setData({ submitting: true });
      var items = self.data.cartItems.map(function(i) { return { id: i.product.id, quantity: i.quantity }; });
      http.post('/orders/create', { items: items, address: self.data.address }).then(function(order) {
        wx.requestPayment({
          timeStamp: order.timeStamp,
          nonceStr: order.nonceStr,
          package: order.package,
          signType: order.signType || 'RSA',
          paySign: order.paySign,
          success: function() {
            // Verify payment with server
            http.post('/orders/verify', {
              orderId: order.id,
              transactionId: order.transactionId
            }).then(function() {
              wx.removeStorageSync('cart');
              wx.redirectTo({ url: '/pages/order/detail?id=' + order.id });
            }).catch(function() {
              // Payment succeeded but verification failed — redirect anyway
              wx.removeStorageSync('cart');
              wx.redirectTo({ url: '/pages/order/detail?id=' + order.id });
            });
          },
          fail: function() {
            self.setData({ submitting: false });
            wx.showToast({ title: '支付取消', icon: 'none' });
          }
        });
      }).catch(function() {
        self.setData({ submitting: false });
        wx.showToast({ title: '创建订单失败', icon: 'none' });
      });
    });
  }
});
