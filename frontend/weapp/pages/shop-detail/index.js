var app = getApp()
var request = require('../../utils/request')

Page({
  data: {
    product: null,
    loading: true,
    quantity: 1,
    currentImageIndex: 0
  },
  onLoad: function (options) {
    var id = options.id ? parseInt(options.id) : 1
    this.loadProduct(id)
  },
  loadProduct: function (id) {
    var that = this
    that.setData({ loading: true })

    // Fetch product data from API instead of using mock data
    request.get('/products/' + id)
      .then(function (res) {
        if (res.success && res.data) {
          that.setData({
            product: res.data,
            loading: false
          })
          wx.setNavigationBarTitle({ title: res.data.title || '商品详情' })
        } else {
          // Fallback to error message
          that.setData({ loading: false })
          wx.showToast({ title: '商品加载失败', icon: 'none' })
        }
      })
      .catch(function (err) {
        console.error('Failed to load product:', err)
        that.setData({ loading: false })
        wx.showToast({ title: '网络错误，请重试', icon: 'none' })
      })
  },
  onImageChange: function (e) {
    this.setData({ currentImageIndex: e.detail.current })
  },
  onMinus: function () {
    if (this.data.quantity > 1) {
      this.setData({ quantity: this.data.quantity - 1 })
    }
  },
  onPlus: function () {
    if (this.data.quantity < this.data.product.stock) {
      this.setData({ quantity: this.data.quantity + 1 })
    }
  },
  onAddCart: function () {
    var product = this.data.product
    var quantity = this.data.quantity
    var cart = wx.getStorageSync('cart') || []

    var existIndex = -1
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === product.id) {
        existIndex = i
        break
      }
    }

    if (existIndex >= 0) {
      cart[existIndex].quantity += quantity
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image_url: product.images[0],
        quantity: quantity
      })
    }

    wx.setStorageSync('cart', cart)
    wx.showToast({ title: '已加入购物车', icon: 'success' })
  },
  onBuyNow: function () {
    this.onAddCart()
    wx.navigateTo({ url: '/pages/cart/index' })
  },
  onShareAppMessage: function () {
    var p = this.data.product
    return {
      title: p ? p.title : '童画公益商店',
      path: '/pages/shop-detail/index?id=' + (p ? p.id : 1)
    }
  }
})
