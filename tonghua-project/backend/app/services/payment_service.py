"""WeChat Pay integration service."""

import time
import secrets
import hashlib
import logging
import xml.etree.ElementTree as ET
from decimal import Decimal
from typing import Optional, Dict, Any
import httpx
from app.config import settings

logger = logging.getLogger(__name__)


class WeChatPayService:
    """WeChat Pay unified order service."""

    def __init__(self):
        # Raise exception if required configs are missing
        if not settings.WECHAT_APP_ID:
            raise ValueError("WECHAT_APP_ID environment variable is required for payment security")
        self.app_id = settings.WECHAT_APP_ID
        if not settings.WECHAT_MCH_ID:
            raise ValueError("WECHAT_MCH_ID environment variable is required for payment security")
        self.mch_id = settings.WECHAT_MCH_ID
        # Use dedicated WeChat Pay API key, not the system AES key
        # Raise exception if API key is not configured (security requirement)
        if not settings.WECHAT_PAY_API_KEY:
            raise ValueError("WECHAT_PAY_API_KEY environment variable is required for payment security")
        self.api_key = settings.WECHAT_PAY_API_KEY
        # Use dedicated WeChat Pay notification URL, not CORS origins
        if not settings.WECHAT_NOTIFY_URL:
            raise ValueError("WECHAT_NOTIFY_URL environment variable is required for payment notifications")
        self.notify_url = settings.WECHAT_NOTIFY_URL

    def generate_nonce_str(self) -> str:
        """Generate random nonce string using cryptographically secure random."""
        return secrets.token_hex(16)  # 32 hex characters

    def generate_order_no(self) -> str:
        """Generate unique order number."""
        timestamp = int(time.time())
        random_part = secrets.randbelow(9000) + 1000
        return f"TH{timestamp}{random_part}"

    def calculate_sign(self, params: Dict[str, Any]) -> str:
        """
        Calculate WeChat Pay signature (SHA256).

        WeChat Pay signature algorithm:
        1. Sort parameters by key
        2. Concatenate key=value pairs
        3. Add API key at the end
        4. SHA256 hash the result

        Security note: WeChat Pay supports both MD5 and SHA256. SHA256 is cryptographically
        stronger and should be used in production. The API key must be properly configured
        in the WeChat Pay merchant backend.
        """
        sorted_params = sorted([(k, v) for k, v in params.items() if v is not None and v != ""])
        sign_str = "&".join([f"{k}={v}" for k, v in sorted_params])
        sign_str += f"&key={self.api_key}"

        return hashlib.sha256(sign_str.encode('utf-8')).hexdigest().upper()

    def _call_unified_order_api(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call WeChat Pay unified order API.

        Args:
            params: Parameters for the unified order request

        Returns:
            Dictionary containing prepay_id from WeChat API

        Raises:
            Exception: If API call fails or returns error
        """
        # Calculate signature and add to params
        params["sign"] = self.calculate_sign(params)

        # Build XML request body
        xml_elements = ["<xml>"]
        for k, v in params.items():
            if v is not None:
                xml_elements.append(f"<{k}><![CDATA[{v}]]></{k}>")
        xml_elements.append("</xml>")
        xml_body = "".join(xml_elements).encode("utf-8")

        logger.info(f"Calling WeChat Unified Order API for order: {params['out_trade_no']}")

        try:
            # Make async HTTP request to WeChat API
            response = httpx.post(
                "https://api.mch.weixin.qq.com/pay/unifiedorder",
                content=xml_body,
                headers={"Content-Type": "application/xml"},
                timeout=30.0
            )
            response.raise_for_status()

            # Parse XML response
            root = ET.fromstring(response.text)

            # Check return_code
            return_code_elem = root.find("return_code")
            return_msg_elem = root.find("return_msg")
            result_code_elem = root.find("result_code")

            if return_code_elem is None or return_code_elem.text != "SUCCESS":
                err_msg = return_msg_elem.text if return_msg_elem is not None else "Unknown error"
                logger.error(f"WeChat API return failure: {err_msg}")
                raise Exception(f"WeChat API error: {err_msg}")

            if result_code_elem is None or result_code_elem.text != "SUCCESS":
                err_code_elem = root.find("err_code")
                err_msg_elem = root.find("err_code_des")
                err_code = err_code_elem.text if err_code_elem is not None else "UNKNOWN"
                err_msg = err_msg_elem.text if err_msg_elem is not None else "Unknown error"
                logger.error(f"WeChat unified order failure: {err_code} - {err_msg}")
                raise Exception(f"WeChat unified order error: {err_msg}")

            prepay_id_elem = root.find("prepay_id")
            if prepay_id_elem is None or not prepay_id_elem.text:
                raise Exception("WeChat API returned no prepay_id")

            prepay_id = prepay_id_elem.text
            logger.info(f"Successfully obtained prepay_id: {prepay_id}")

            return {
                "prepay_id": prepay_id,
                "result_code": "SUCCESS"
            }

        except httpx.RequestError as e:
            logger.error(f"WeChat API HTTP request failed: {str(e)}")
            raise Exception(f"WeChat API connection failed: {str(e)}")
        except ET.ParseError as e:
            logger.error(f"Failed to parse WeChat API response: {str(e)}")
            raise Exception("Invalid response from WeChat API")
        except Exception as e:
            logger.error(f"WeChat API call failed: {str(e)}")
            raise

    def create_unified_order(self, order_no: str, amount: Decimal, description: str, trade_type: str = "JSAPI", openid: Optional[str] = None, donation_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Create WeChat Pay unified order.

        Args:
            order_no: Order number
            amount: Payment amount in CNY (in yuan, not fen)
            description: Product description
            trade_type: Trade type (JSAPI for mini-program)
            openid: User's WeChat openid (required for JSAPI)
            donation_id: Donation ID if this is a donation payment

        Returns:
            Dictionary with payment parameters for wx.requestPayment
        """
        # Server-side amount verification
        if amount <= 0:
            raise ValueError("Amount must be positive")

        # Convert amount to fen (WeChat Pay uses fen)
        amount_fen = int(amount * 100)

        # Build WeChat Pay unified order parameters
        params = {
            "appid": self.app_id,
            "mch_id": self.mch_id,
            "nonce_str": self.generate_nonce_str(),
            "body": description[:127],  # WeChat limit: 127 chars
            "out_trade_no": order_no,
            "total_fee": amount_fen,
            "spbill_create_ip": "127.0.0.1",  # In production, use real IP
            "notify_url": self.notify_url,
            "trade_type": trade_type,
        }

        if openid and trade_type == "JSAPI":
            params["openid"] = openid

        # Call real WeChat API to get prepay_id
        try:
            api_response = self._call_unified_order_api(params)
            prepay_id = api_response["prepay_id"]
        except Exception as e:
            logger.error(f"Failed to create unified order: {str(e)}")
            raise

        # Generate frontend payment parameters for wx.requestPayment
        timestamp = str(int(time.time()))
        nonce_str = self.generate_nonce_str()
        package = f"prepay_id={prepay_id}"

        # Sign the payment parameters that will be sent to frontend
        sign_params = {
            "appId": self.app_id,
            "timeStamp": timestamp,
            "nonceStr": nonce_str,
            "package": package,
            "signType": "SHA256",
        }

        pay_sign = self.calculate_sign(sign_params)

        result = {
            "timeStamp": timestamp,
            "nonceStr": nonce_str,
            "package": package,
            "signType": "SHA256",
            "paySign": pay_sign,
            "transactionId": prepay_id,
            "order_no": order_no,
            "amount": str(amount),
            "description": description,
        }

        if donation_id:
            result["donationId"] = donation_id

        return result

    def _generate_wx_payment_params(self, order_no: str, amount: Decimal, description: str, donation_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Generate mock wx.requestPayment parameters.

        In production, you would:
        1. Call WeChat unified order API: https://api.mch.weixin.qq.com/pay/unifiedorder
        2. Parse XML response
        3. Extract prepay_id
        4. Generate signature for wx.requestPayment
        """
        prepay_id = f"wx{int(time.time())}{secrets.randbelow(900000) + 100000}"

        # Generate parameters for wx.requestPayment
        timestamp = str(int(time.time()))
        nonce_str = self.generate_nonce_str()
        package = f"prepay_id={prepay_id}"

        # Sign the payment parameters
        sign_params = {
            "appId": self.app_id,
            "timeStamp": timestamp,
            "nonceStr": nonce_str,
            "package": package,
            "signType": "SHA256",
        }

        pay_sign = self.calculate_sign(sign_params)

        result = {
            "timeStamp": timestamp,
            "nonceStr": nonce_str,
            "package": package,
            "signType": "SHA256",
            "paySign": pay_sign,
            "transactionId": prepay_id,  # WeChat prepay_id serves as transaction ID for verification
            "order_no": order_no,
            "amount": str(amount),
            "description": description,
        }

        if donation_id:
            result["donationId"] = donation_id

        return result

    def verify_payment_signature(self, params: Dict[str, Any]) -> bool:
        """
        Verify WeChat Pay callback signature.

        Args:
            params: Callback parameters including sign

        Returns:
            True if signature is valid
        """
        if "sign" not in params:
            return False

        expected_sign = self.calculate_sign(params)
        return params["sign"] == expected_sign


# Singleton instance
payment_service = WeChatPayService()
