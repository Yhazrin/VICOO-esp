var app = getApp();
var BASE_URL = app.globalData.baseUrl;
var MAX_RETRIES = 3;
var isRefreshing = false;
var refreshQueue = [];

function generateNonce() {
  // Use wx.getRandomValues for secure random bytes (WeChat MiniProgram API)
  var array = new Uint8Array(16);
  if (typeof wx !== 'undefined' && wx.getRandomValues) {
    wx.getRandomValues(array);
  } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback: Use Math.random for non-cryptographic randomness (better than predictable LCG)
    // Note: This is not cryptographically secure but prevents simple replay attacks based on timestamp.
    // For production, ensure wx.getRandomValues is available.
    for (var i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
}

function request(options) {
  return new Promise(function(resolve, reject) {
    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'X-Timestamp': Date.now().toString(),
        'X-Nonce': generateNonce()
      },
      // WeChat runtime automatically manages httpOnly Cookie authentication
      success: function(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          // Session expired - redirect to login
          if (options._refreshAttempted) {
            // Use switchTab for Tab Bar pages, navigateTo for regular pages
            var loginUrl = '/pages/user/index';
            var isTabPage = loginUrl.startsWith('/pages/') &&
                           (loginUrl.includes('/pages/user/') ||
                            loginUrl.includes('/pages/shop/') ||
                            loginUrl.includes('/pages/home/'));
            if (isTabPage) {
              wx.switchTab({ url: loginUrl });
            } else {
              wx.navigateTo({ url: loginUrl });
            }
            reject(new Error('Session expired. Please log in again.'));
            return;
          }
          options._refreshAttempted = true;
          // Token expired, retrying request (refresh logic should be handled if necessary)
          resolve(request(options));
        } else {
          var msg = (res.data && res.data.message) ? res.data.message : 'Request Error';
          wx.showToast({ title: msg, icon: 'none' });
          reject(new Error(msg));
        }
      },
      fail: function(err) {
        if (options._retry && options._retry < MAX_RETRIES) {
          options._retry = (options._retry || 0) + 1;
          setTimeout(function() { resolve(request(options)); }, 1000);
        } else {
          wx.showToast({ title: 'Network Error', icon: 'none' });
          reject(err);
        }
      }
    });
  });
}

// Authentication is managed via httpOnly Cookie.
// Server handles session management through Set-Cookie headers.

function get(url, data) {
  return request({ url: url, method: 'GET', data: data });
}

function post(url, data) {
  return request({ url: url, method: 'POST', data: data });
}

function put(url, data) {
  return request({ url: url, method: 'PUT', data: data });
}

function del(url, data) {
  return request({ url: url, method: 'DELETE', data: data });
}

function upload(url, filePath, name, formData) {
  return new Promise(function(resolve, reject) {
    wx.uploadFile({
      url: BASE_URL + url,
      filePath: filePath,
      name: name || 'file',
      formData: formData || {},
      header: {
        'X-Timestamp': Date.now().toString(),
        'X-Nonce': generateNonce()
      },
      // WeChat runtime automatically manages httpOnly Cookie authentication
      success: function(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            var data = JSON.parse(res.data);
            if (data.success !== false) {
              resolve(data);
            } else {
              reject(new Error(data.message || 'Upload failed'));
            }
          } catch (e) {
            // If response is not JSON (e.g., plain text), resolve with it
            resolve(res.data);
          }
        } else if (res.statusCode === 401) {
          // Session expired - redirect to login
          // Use switchTab for Tab Bar pages, navigateTo for regular pages
          var loginUrl = '/pages/user/index';
          var isTabPage = loginUrl.startsWith('/pages/') &&
                         (loginUrl.includes('/pages/user/') ||
                          loginUrl.includes('/pages/shop/') ||
                          loginUrl.includes('/pages/home/'));
          if (isTabPage) {
            wx.switchTab({ url: loginUrl });
          } else {
            wx.navigateTo({ url: loginUrl });
          }
          reject(new Error('Session expired. Please log in again.'));
        } else {
          var msg = 'Upload failed: ' + res.statusCode;
          try {
            var errData = JSON.parse(res.data);
            if (errData.message) msg = errData.message;
          } catch (e) { /* ignore */ }
          reject(new Error(msg));
        }
      },
      fail: function(err) {
        wx.showToast({ title: '网络错误', icon: 'none' });
        reject(err);
      }
    });
  });
}

module.exports = { request: request, get: get, post: post, put: put, del: del, upload: upload };
