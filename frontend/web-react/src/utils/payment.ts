/**
 * Invoke WeChat JSAPI payment.
 * Returns a promise that resolves on success, rejects on cancel/failure.
 */
export function invokeWechatPayment(params: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    const wx = (window as unknown as { WeixinJSBridge?: { invoke: Function } }).WeixinJSBridge;
    if (!wx) {
      reject(new Error('WeixinJSBridge not available. Please open in WeChat.'));
      return;
    }
    wx.invoke(
      'getBrandWCPayRequest',
      {
        appId: params.appId,
        timeStamp: String(params.timeStamp),
        nonceStr: params.nonceStr,
        package: params.package,
        signType: params.signType || 'MD5',
        paySign: params.paySign,
      },
      (res: { err_msg?: string }) => {
        if (res.err_msg === 'get_brand_wcpay_request:ok') {
          resolve();
        } else if (res.err_msg === 'get_brand_wcpay_request:cancel') {
          reject(new Error('Payment cancelled'));
        } else {
          reject(new Error(res.err_msg || 'Payment failed'));
        }
      },
    );
  });
}

/**
 * Detect whether the current browser is inside WeChat.
 */
export function isWechatBrowser(): boolean {
  return /MicroMessenger/i.test(navigator.userAgent);
}
