var app = getApp()

Page({
  data: {
    cartItems: [],
    loading: true,
    subtotal: '0.00'
  },
  onLoad: function () {
    this.loadCart()
  },
  onShow: function () {
    this.loadCart()
  },
  loadCart: function () {
    var cart = wx.getStorageSync('cart') || []
    this.setData({
      cartItems: cart,
      subtotal: this.calcTotal(cart),
      loading: false
    })
  },
  saveCart: function (items) {
    wx.setStorageSync('cart', items)
    this.setData({
      cartItems: items,
      subtotal: this.calcTotal(items)
    })
  },
  calcTotal: function (items) {
    var total = 0
    for (var i = 0; i < items.length; i++) {
      total += (items[i].price || 0) * items[i].quantity
    }
    return total.toFixed(2)
  },
  onMinus: function (e) {
    var id = e.currentTarget.dataset.id
    var cart = this.data.cartItems
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === id) {
        if (cart[i].quantity > 1) {
          cart[i].quantity -= 1
        }
        break
      }
    }
    this.saveCart(cart)
  },
  onPlus: function (e) {
    var id = e.currentTarget.dataset.id
    var cart = this.data.cartItems
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === id) {
        cart[i].quantity += 1
        break
      }
    }
    this.saveCart(cart)
  },
  onRemove: function (e) {
    var id = e.currentTarget.dataset.id
    var that = this
    wx.showModal({
      title: '确认删除',
      content: '确定要从购物车中移除该商品吗？',
      success: function (res) {
        if (res.confirm) {
          var cart = that.data.cartItems.filter(function (item) {
            return item.id !== id
          })
          that.saveCart(cart)
          wx.showToast({ title: '已移除', icon: 'success' })
        }
      }
    })
  },
  onClear: function () {
    var that = this
    wx.showModal({
      title: '清空购物车',
      content: '确定要清空购物车吗？',
      success: function (res) {
        if (res.confirm) {
          that.saveCart([])
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      }
    })
  },
  onCheckout: function () {
    if (this.data.cartItems.length === 0) {
      wx.showToast({ title: '购物车为空', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/order/confirm' })
  },
  onGoShop: function () {
    wx.switchTab({ url: '/pages/shop/index' })
  },
  onItemTap: function (e) {
    var id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/shop-detail/index?id=' + id })
  }
})
