Component({
  properties: {
    product: { type: Object, value: {} }
  },
  methods: {
    onTap: function() {
      this.triggerEvent('tap', { id: this.properties.product.id });
    },
    onAddCart: function() {
      this.triggerEvent('addcart', { id: this.properties.product.id });
    }
  }
});
