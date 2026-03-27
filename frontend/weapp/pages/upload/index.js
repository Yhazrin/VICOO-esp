var app = getApp()
var request = require('../../utils/request')

var MOCK_CAMPAIGNS = [
  { id: 1, title: '绿色地球 · 环保时装秀', status: 'active' },
  { id: 2, title: '童心绘梦 · 春日画展', status: 'active' },
  { id: 3, title: '海洋守护者', status: 'active' },
  { id: 4, title: '星空梦想家', status: 'ended' }
]

Page({
  data: {
    campaigns: [],
    activeCampaigns: [],
    selectedCampaignIndex: -1,
    title: '',
    displayName: '',
    description: '',
    imagePath: '',
    guardianConsent: false,
    submitting: false
  },
  onLoad: function (options) {
    var that = this
    var activeCampaigns = MOCK_CAMPAIGNS.filter(function (c) {
      return c.status === 'active'
    })
    that.setData({
      campaigns: MOCK_CAMPAIGNS,
      activeCampaigns: activeCampaigns
    })

    // Pre-select campaign if passed
    if (options && options.campaign_id) {
      var idx = activeCampaigns.findIndex(function (c) {
        return c.id === parseInt(options.campaign_id)
      })
      if (idx >= 0) {
        that.setData({ selectedCampaignIndex: idx })
      }
    }
  },
  onChooseImage: function () {
    var that = this
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        that.setData({ imagePath: res.tempFilePaths[0] })
      }
    })
  },
  onRemoveImage: function () {
    this.setData({ imagePath: '' })
  },
  onCampaignChange: function (e) {
    this.setData({ selectedCampaignIndex: e.detail.value })
  },
  onTitleInput: function (e) {
    this.setData({ title: e.detail.value })
  },
  onDisplayNameInput: function (e) {
    this.setData({ displayName: e.detail.value })
  },
  onDescInput: function (e) {
    this.setData({ description: e.detail.value })
  },
  onConsentChange: function (e) {
    this.setData({ guardianConsent: e.detail.value.length > 0 })
  },
  onSubmit: function () {
    var that = this

    if (!that.data.title.trim()) {
      wx.showToast({ title: '请输入作品标题', icon: 'none' })
      return
    }
    if (!that.data.imagePath) {
      wx.showToast({ title: '请选择作品图片', icon: 'none' })
      return
    }
    if (that.data.selectedCampaignIndex < 0) {
      wx.showToast({ title: '请选择参加的活动', icon: 'none' })
      return
    }
    if (!that.data.displayName.trim()) {
      wx.showToast({ title: '请输入展示名称', icon: 'none' })
      return
    }
    if (!that.data.guardianConsent) {
      wx.showToast({ title: '请确认监护人知情同意', icon: 'none' })
      return
    }

    that.setData({ submitting: true })

    var campaign = that.data.activeCampaigns[that.data.selectedCampaignIndex]
    var formData = {
      title: that.data.title,
      display_name: that.data.displayName,
      description: that.data.description,
      campaign_id: campaign.id,
      guardian_consent: 'true'
    }

    // Real upload
    var request = require('../../utils/request')
    request.upload('/artworks/upload', that.data.imagePath, 'image', formData)
      .then(function(res) {
        that.setData({ submitting: false })
        wx.showToast({ title: '上传成功，等待审核', icon: 'success', duration: 2000 })
        setTimeout(function () {
          wx.navigateBack()
        }, 2000)
      })
      .catch(function(err) {
        that.setData({ submitting: false })
        wx.showToast({ title: err.message || '上传失败', icon: 'none' })
      })
  }
})
