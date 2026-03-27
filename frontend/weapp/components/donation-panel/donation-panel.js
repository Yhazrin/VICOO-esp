Component({
  properties: {
    amounts: {
      type: Array,
      value: [50, 100, 200, 500]
    }
  },
  data: {
    selectedAmount: 100,
    customAmount: '',
    isCustom: false
  },
  methods: {
    onSelectAmount: function(e) {
      var amount = e.currentTarget.dataset.amount
      this.setData({
        selectedAmount: amount,
        isCustom: false,
        customAmount: ''
      })
      this.triggerEvent('change', { amount: amount })
    },
    onCustomInput: function(e) {
      var val = e.detail.value
      this.setData({
        customAmount: val,
        isCustom: true,
        selectedAmount: 0
      })
      var amount = parseFloat(val) || 0
      this.triggerEvent('change', { amount: amount })
    },
    onCustomFocus: function() {
      this.setData({ isCustom: true, selectedAmount: 0 })
    }
  }
})
