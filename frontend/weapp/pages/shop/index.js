var http = require('../../utils/request');

Page({
  data: {
    products: [],
    categories: [],
    currentCategory: '',
    loading: true,
    page: 1,
    hasMore: true
  },
  onLoad: function() { this.loadData(); },
  onPullDownRefresh: function() {
    this.setData({ page: 1, products: [] });
    this.loadData().then(function() { wx.stopPullDownRefresh(); });
  },
  onReachBottom: function() {
    if (this.data.hasMore) this.loadMore();
  },
  loadData: function() {
    var self = this;
    self.setData({ loading: true });
    return Promise.all([
      http.get('/products/categories'),
      http.get('/products', { page: 1, limit: 20, category: self.data.currentCategory })
    ]).then(function(results) {
      self.setData({
        categories: results[0] || [],
        products: results[1] || [],
        loading: false,
        hasMore: (results[1] || []).length >= 20
      });
    }).catch(function() { self.setData({ loading: false }); });
  },
  loadMore: function() {
    var self = this;
    var nextPage = self.data.page + 1;
    http.get('/products', { page: nextPage, limit: 20, category: self.data.currentCategory }).then(function(res) {
      self.setData({ products: self.data.products.concat(res || []), page: nextPage, hasMore: (res || []).length >= 20 });
    });
  },
  onCategoryTap: function(e) {
    this.setData({ currentCategory: e.currentTarget.dataset.cat, page: 1, products: [] });
    this.loadData();
  },
  onProductTap: function(e) {
    wx.navigateTo({ url: '/pages/shop-detail/index?id=' + e.detail.id });
  },
  onAddCart: function(e) {
    var id = e.detail.id;
    var cart = wx.getStorageSync('cart') || [];

    // Find product details from loaded products list
    var product = this.data.products.find(function(p) { return p.id === id; });

    if (!product) {
      wx.showToast({ title: '商品信息获取失败', icon: 'none' });
      return;
    }

    var existIndex = -1;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === id) {
        existIndex = i;
        break;
      }
    }

    if (existIndex >= 0) {
      cart[existIndex].quantity++;
      // Update price in case it changed
      cart[existIndex].price = product.price;
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image_url: product.images[0],
        quantity: 1
      });
    }

    wx.setStorageSync('cart', cart);
    wx.showToast({ title: '已加入购物车', icon: 'success' });
  }
});
