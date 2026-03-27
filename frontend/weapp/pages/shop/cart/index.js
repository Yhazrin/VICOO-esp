var http = require('../../../utils/request');

Page({
  data: {
    cartItems: [],
    products: [],
    loading: true
  },
  onShow: function() { this.loadCart(); },
  loadCart: function() {
    var self = this;
    var cart = wx.getStorageSync('cart') || [];
    if (!cart.length) { self.setData({ cartItems: [], products: [], loading: false }); return; }
    var ids = cart.map(function(c) { return c.id; }).join(',');
    http.get('/products/batch', { ids: ids }).then(function(res) {
      var items = cart.map(function(c) {
        var product = (res || []).find(function(p) { return p.id === c.id; }) || {};
        return { product: product, quantity: c.quantity };
      });
      self.setData({ cartItems: items, loading: false });
    }).catch(function() { self.setData({ loading: false }); });
  },
  onChangeQty: function(e) {
    var idx = e.currentTarget.dataset.index;
    var delta = e.currentTarget.dataset.delta;
    var items = this.data.cartItems;
    items[idx].quantity = Math.max(1, items[idx].quantity + delta);
    this.setData({ cartItems: items });
    this.saveCart();
  },
  onRemove: function(e) {
    var idx = e.currentTarget.dataset.index;
    var items = this.data.cartItems;
    items.splice(idx, 1);
    this.setData({ cartItems: items });
    this.saveCart();
  },
  saveCart: function() {
    var cart = this.data.cartItems.map(function(i) { return { id: i.product.id, quantity: i.quantity }; });
    wx.setStorageSync('cart', cart);
  },
  getTotal: function() {
    return this.data.cartItems.reduce(function(sum, i) { return sum + (i.product.price || 0) * i.quantity; }, 0);
  },
  onCheckout: function() {
    if (!this.data.cartItems.length) { wx.showToast({ title: '\u8D2D\u7269\u8F66\u4E3A\u7A7A', icon: 'none' }); return; }
    wx.navigateTo({ url: '/pages/order/confirm' });
  }
});
