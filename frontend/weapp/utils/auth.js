var http = require('./request');

// NOTE: Authentication is handled via httpOnly Cookies.
// The server manages the session and sets the session cookie on login.
// The client does NOT store the token locally.

function checkLogin() {
  // With httpOnly Cookies, we check local state for a quick sync check.
  // Real session validity is verified by ensureLogin() calling /api/user/me.
  var app = getApp();
  return !!app.globalData.userInfo;
}

function ensureLogin() {
  return new Promise(function(resolve, reject) {
    var app = getApp();

    // 1. Check local state
    if (app.globalData.userInfo) {
      resolve(app.globalData.userInfo);
      return;
    }

    // 2. Verify session with server
    http.get('/api/v1/user/me')
      .then(function(res) {
        // Assuming response structure is { data: { ... } } or similar
        // Adjust if the API response is direct object
        var userData = res.data || res;
        app.globalData.userInfo = userData;
        resolve(userData);
      })
      .catch(function(err) {
        // If unauthorized (401), try logging in
        if (err.statusCode === 401 || (err.message && err.message.includes('401'))) {
          doLogin()
            .then(function() {
              // After login, fetch the actual user profile
              return http.get('/api/v1/user/me');
            })
            .then(function(profileRes) {
              var userData = profileRes.data || profileRes;
              app.globalData.userInfo = userData;
              resolve(userData);
            })
            .catch(reject);
        } else {
          reject(err);
        }
      });
  });
}

function doLogin() {
  return new Promise(function(resolve, reject) {
    wx.login({
      success: function(res) {
        if (res.code) {
          http.post('/auth/wx-login', { code: res.code }).then(function(r) {
            // Server sets httpOnly session cookie on successful login.
            // Client does NOT store the token.
            resolve(r);
          }).catch(reject);
        } else {
          reject(new Error('login failed'));
        }
      },
      fail: reject
    });
  });
}

function logout() {
  // Clear local user info and invalidate server-side session.
  getApp().globalData.userInfo = null;
  http.post('/auth/logout').catch(function() {});
}

function getToken() {
  // Token is stored in httpOnly Cookie, cannot be retrieved by JavaScript.
  return null;
}

module.exports = { checkLogin: checkLogin, ensureLogin: ensureLogin, doLogin: doLogin, logout: logout, getToken: getToken };
