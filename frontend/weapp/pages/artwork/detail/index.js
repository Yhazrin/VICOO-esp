var http = require('../../utils/request');
var auth = require('../../utils/auth');

Page({
  data: {
    artwork: null,
    loading: true,
    voted: false
  },
  onLoad: function(options) {
    this.artworkId = options.id;
    this.loadDetail();
  },
  loadDetail: function() {
    var self = this;
    http.get('/artworks/' + self.artworkId).then(function(res) {
      self.setData({ artwork: res, loading: false, voted: res.hasVoted });
    }).catch(function() { self.setData({ loading: false }); });
  },
  onVote: function() {
    var self = this;
    if (self.data.voted) return;
    auth.ensureLogin().then(function() {
      http.post('/artworks/' + self.artworkId + '/vote').then(function() {
        var artwork = self.data.artwork;
        artwork.voteCount = (artwork.voteCount || 0) + 1;
        self.setData({ artwork: artwork, voted: true });
        wx.showToast({ title: '\u6295\u7968\u6210\u529F' });
      }).catch(function(err) {
        wx.showToast({ title: err.message || '\u6295\u7968\u5931\u8D25', icon: 'none' });
      });
    });
  },
  onShopTap: function() {
    wx.navigateTo({ url: '/pages/shop/index?artworkId=' + this.artworkId });
  },
  onShareAppMessage: function() {
    var art = this.data.artwork || {};
    return { title: art.title || '\u7AE5\u753B\u4F5C\u54C1', path: '/pages/artwork/detail?id=' + this.artworkId };
  }
});
