function formatDate(date, fmt) {
  var d = new Date(date);
  fmt = fmt || 'yyyy-MM-dd';
  var y = d.getFullYear();
  var M = d.getMonth() + 1;
  var dd = d.getDate();
  return y + '-' + (M < 10 ? '0' + M : M) + '-' + (dd < 10 ? '0' + dd : dd);
}

function formatPrice(cents) {
  return '\u00A5' + (cents / 100).toFixed(2);
}

function formatImageUrl(url, width) {
  if (!url) return '';
  if (url.indexOf('http') === 0) return url;
  return getApp().globalData.baseUrl + '/uploads/' + url;
}
function debounce(fn, delay) {
  var timer = null;
  return function() {
    var args = arguments;
    var ctx = this;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function() { fn.apply(ctx, args); }, delay || 300);
  };
}

function throttle(fn, interval) {
  var last = 0;
  return function() {
    var now = Date.now();
    if (now - last >= (interval || 300)) {
      last = now;
      fn.apply(this, arguments);
    }
  };
}

module.exports = { formatDate: formatDate, formatPrice: formatPrice, formatImageUrl: formatImageUrl, debounce: debounce, throttle: throttle };
