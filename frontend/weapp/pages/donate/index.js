var http = require('../../utils/request');
var auth = require('../../utils/auth');
var app = getApp();

Page({
  data: {
    amounts: [10, 50, 100, 200],
    selectedAmount: 50,
    customAmount: '',
    message: '',
    anonymous: false,
    submitting: false,
    showResult: false,
    donationResult: null
  },
  onAmountSelect: function(e) {
    this.setData({ selectedAmount: e.currentTarget.dataset.amount, customAmount: '' });
  },
  onCustomInput: function(e) {
    this.setData({ customAmount: e.detail.value, selectedAmount: 0 });
  },
  onMessageInput: function(e) { this.setData({ message: e.detail.value }); },
  onAnonymousChange: function(e) { this.setData({ anonymous: e.detail.value }); },
  getFinalAmount: function() {
    return this.data.customAmount ? parseInt(this.data.customAmount) : this.data.selectedAmount;
  },
  onSubmit: function() {
    var self = this;
    var amount = self.getFinalAmount();
    if (!amount || amount <= 0) { wx.showToast({ title: '请选择金额', icon: 'none' }); return; }
    auth.ensureLogin().then(function(userInfo) {
      self.setData({ submitting: true });
      http.post('/donations/create', {
        donor_name: self.data.anonymous
          ? '匿名用户'
          : ((userInfo && (userInfo.nickname || userInfo.email)) || '小程序用户'),
        amount: amount,
        currency: 'CNY',
        payment_method: 'wechat',
        message: self.data.message,
        is_anonymous: self.data.anonymous
      }).then(function(order) {
        wx.requestPayment({
          timeStamp: order.timeStamp,
          nonceStr: order.nonceStr,
          package: order.package,
          signType: order.signType || 'SHA256',
          paySign: order.paySign,
          success: function() {
            self.setData({
              showResult: true,
              donationResult: { amount: amount, verified: true, donationId: order.donationId },
              submitting: false
            });
          },
          fail: function() {
            self.setData({ submitting: false });
            wx.showToast({ title: '支付取消', icon: 'none' });
          },
          complete: function() {
            // Ensure UI state is properly updated regardless of success/fail
            // This callback is called after success or fail
            if (!self.data.showResult) {
              // If success/fail didn't set the result (shouldn't happen, but safety check)
              self.setData({ submitting: false });
            }
          }
        });
      }).catch(function() {
        self.setData({ submitting: false });
        wx.showToast({ title: '创建捐赠失败', icon: 'none' });
      });
    });
  },
  onCloseResult: function() { this.setData({ showResult: false }); }
});
