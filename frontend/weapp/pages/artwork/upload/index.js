var http = require('../../utils/request');
var auth = require('../../utils/auth');

Page({
  data: {
    imageList: [],
    childDisplayName: '',
    description: '',
    campaignId: '',
    campaigns: [],
    guardianConsent: false,
    uploading: false
  },
  onLoad: function() {
    var self = this;
    http.get('/campaigns/active').then(function(res) {
      self.setData({ campaigns: res || [] });
    });
  },
  chooseImage: function() {
    var self = this;
    wx.chooseMedia({
      count: 3 - self.data.imageList.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: function(res) {
        var files = res.tempFiles.map(function(f) { return f.tempFilePath; });
        self.setData({ imageList: self.data.imageList.concat(files) });
      }
    });
  },
  removeImage: function(e) {
    var idx = e.currentTarget.dataset.index;
    var list = this.data.imageList;
    list.splice(idx, 1);
    this.setData({ imageList: list });
  },
  onNameInput: function(e) { this.setData({ childDisplayName: e.detail.value }); },
  onDescInput: function(e) { this.setData({ description: e.detail.value }); },
  onCampaignChange: function(e) { this.setData({ campaignId: this.data.campaigns[e.detail.value].id }); },
  onConsentChange: function(e) { this.setData({ guardianConsent: e.detail.value }); },
  submit: function() {
    var self = this;
    if (!self.data.imageList.length) { wx.showToast({ title: '请选择图片', icon: 'none' }); return; }
    if (!self.data.childDisplayName) { wx.showToast({ title: '请输入用户名', icon: 'none' }); return; }
    if (!self.data.guardianConsent) { wx.showToast({ title: '请确认监护人同意', icon: 'none' }); return; }
    auth.ensureLogin().then(function() {
      self.setData({ uploading: true });
      var formData = { childDisplayName: self.data.childDisplayName, description: self.data.description, campaignId: self.data.campaignId };
      var completed = 0;
      var failed = false;
      self.data.imageList.forEach(function(filePath) {
        http.upload('/artworks/upload', filePath, 'file', formData).then(function() {
          completed++;
          if (completed === self.data.imageList.length && !failed) {
            self.setData({ uploading: false });
            wx.showToast({ title: '上传成功' });
            setTimeout(function() { wx.navigateBack(); }, 1500);
          }
        }).catch(function() {
          failed = true;
          self.setData({ uploading: false });
          wx.showToast({ title: '上传失败', icon: 'none' });
        });
      });
    });
  }
});
