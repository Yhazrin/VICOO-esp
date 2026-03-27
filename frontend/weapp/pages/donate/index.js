var http = require('../../utils/request');
var auth = require('../../utils/auth');

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
    auth.ensureLogin().then(function() {
      self.setData({ submitting: true });
      http.post('/donations/create', {
        amount: amount * 100,
        message: self.data.message,
        anonymous: self.data.anonymous
      }).then(function(order) {
        wx.requestPayment({
          timeStamp: order.timeStamp,
          nonceStr: order.nonceStr,
          package: order.package,
          signType: order.signType || 'RSA',
          paySign: order.paySign,
          success: function() {
            // Verify payment with server before showing success
            http.post('/donations/verify', {
              orderId: order.orderId || order.donationId,
              transactionId: order.transactionId
            }).then(function(verified) {
              self.setData({
                showResult: true,
                donationResult: { amount: amount, verified: true },
                submitting: false
              });
            }).catch(function() {
              // Payment went through but verification failed - still show success
              // Server will reconcile asynchronously
              self.setData({
                showResult: true,
                donationResult: { amount: amount, verified: false },
                submitting: false
              });
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
        wx.showToast({ title: '创建订单失败', icon: 'none' });
      });
    });
  },
  onCloseResult: function() { this.setData({ showResult: false }); }
});
