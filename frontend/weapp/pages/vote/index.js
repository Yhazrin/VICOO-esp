var http = require('../../utils/request');
var auth = require('../../utils/auth');

Page({
  data: {
    artworks: [],
    campaignId: '',
    campaignName: '',
    loading: true,
    votedIds: [],
    dailyLimit: 3,
    votedToday: 0
  },
  onLoad: function(options) {
    this.setData({ campaignId: options.campaignId || '' });
    this.loadData();
  },
  loadData: function() {
    var self = this;
    self.setData({ loading: true });
    var url = self.data.campaignId ? '/campaigns/' + self.data.campaignId + '/artworks' : '/artworks';
    http.get(url).then(function(res) {
      self.setData({ artworks: res || [], loading: false });
    }).catch(function() { self.setData({ loading: false }); });
  },
  onVote: function(e) {
    var self = this;
    var id = e.currentTarget.dataset.id;
    if (self.data.votedIds.indexOf(id) >= 0) return;
    if (self.data.votedToday >= self.data.dailyLimit) {
      wx.showToast({ title: '\u4ECA\u65E5\u6295\u7968\u5DF2\u8FBE\u4E0A\u9650', icon: 'none' });
      return;
    }
    auth.ensureLogin().then(function() {
      http.post('/artworks/' + id + '/vote').then(function() {
        var ids = self.data.votedIds.concat([id]);
        var artworks = self.data.artworks.map(function(a) {
          if (a.id === id) a.voteCount = (a.voteCount || 0) + 1;
          return a;
        });
        self.setData({ votedIds: ids, artworks: artworks, votedToday: self.data.votedToday + 1 });
        wx.showToast({ title: '\u6295\u7968\u6210\u529F' });
      }).catch(function(err) {
        wx.showToast({ title: err.message || '\u6295\u7968\u5931\u8D25', icon: 'none' });
      });
    });
  },
  onArtworkTap: function(e) {
    wx.navigateTo({ url: '/pages/artwork/detail?id=' + e.detail.id });
  }
});
