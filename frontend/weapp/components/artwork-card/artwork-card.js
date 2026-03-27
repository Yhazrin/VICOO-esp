Component({
  properties: {
    artwork: { type: Object, value: {} },
    showVote: { type: Boolean, value: true }
  },
  methods: {
    onTap: function() {
      this.triggerEvent('tap', { id: this.properties.artwork.id });
    },
    onVote: function() {
      this.triggerEvent('vote', { id: this.properties.artwork.id });
    },
    onShare: function() {
      return { title: this.properties.artwork.title, path: '/pages/artwork/detail?id=' + this.properties.artwork.id };
    }
  }
});
