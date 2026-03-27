# 请求签名验证机制

本文档说明如何在 tonghua-project 项目中使用 HMAC-SHA256 请求签名验证机制。

## 概述

为了防止请求篡改和重放攻击，所有 API 请求（`/api/*`）都必须包含有效的签名头。

## 签名机制设计

### 签名字符串格式

```
签名字符串 = method + "\n" + path + "\n" + timestamp + "\n" + nonce + "\n" + body
```

**示例：**
```
POST
/api/v1/auth/login
1640995200
abc123nonce
{"username":"test","password":"pass123"}
```

### 签名计算

```python
import hmac
import hashlib

string_to_sign = f"{method}\n{path}\n{timestamp}\n{nonce}\n{body}"
signature = hmac.new(
    secret_key.encode('utf-8'),
    string_to_sign.encode('utf-8'),
    hashlib.sha256
).hexdigest()
```

## 请求头要求

| 请求头 | 说明 | 示例值 |
|--------|------|--------|
| `X-Signature` | HMAC-SHA256 签名（十六进制） | `a1b2c3d4...` |
| `X-Timestamp` | Unix 时间戳（秒） | `1640995200` |
| `X-Nonce` | 唯一随机字符串（防重放） | `nonce_12345` |

## 防重放攻击机制

### 1. 时间戳验证

- 签名时间戳必须在当前时间的 ±5 分钟窗口内
- 超过窗口的请求会被拒绝（返回 401）

### 2. Nonce 验证

- 每个 nonce 只能使用一次
- nonce 存储在 Redis 中，过期时间为 300 秒
- 重复的 nonce 会被拒绝（返回 401）

## 客户端实现示例

### JavaScript/TypeScript

```typescript
import hmac from 'crypto-js/hmac-sha256';
import enc from 'crypto-js/enc-hex';

function generateSignature(
  method: string,
  path: string,
  timestamp: string,
  nonce: string,
  body: string,
  secretKey: string
): string {
  const stringToSign = `${method}\n${path}\n${timestamp}\n${nonce}\n${body}`;
  return hmac(stringToSign, secretKey).toString(enc);
}

// 使用示例
async function makeApiRequest(url: string, data: any) {
  const method = 'POST';
  const path = new URL(url).pathname;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = `nonce_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const body = JSON.stringify(data);

  const signature = generateSignature(method, path, timestamp, nonce, body, 'YOUR_SECRET_KEY');

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': signature,
      'X-Timestamp': timestamp,
      'X-Nonce': nonce,
    },
    body,
  });

  return response.json();
}
```

### Python

```python
import hmac
import hashlib
import time
import secrets
import json

def generate_signature(method: str, path: str, timestamp: str, nonce: str, body: str, secret_key: str) -> str:
    """生成请求签名"""
    string_to_sign = f"{method}\n{path}\n{timestamp}\n{nonce}\n{body}"
    key = secret_key.encode('utf-8')
    return hmac.new(key, string_to_sign.encode('utf-8'), hashlib.sha256).hexdigest()

def make_api_request(url: str, data: dict, secret_key: str):
    """发送带签名的 API 请求"""
    method = "POST"
    path = "/api/v1/..."  # 从 URL 提取
    timestamp = str(int(time.time()))
    nonce = f"nonce_{int(time.time())}_{secrets.token_hex(4)}"
    body = json.dumps(data)

    signature = generate_signature(method, path, timestamp, nonce, body, secret_key)

    import requests
    response = requests.post(
        url,
        json=data,
        headers={
            'X-Signature': signature,
            'X-Timestamp': timestamp,
            'X-Nonce': nonce,
        }
    )
    return response.json()

```

### Android (Kotlin)

```kotlin
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import java.util.Base64

fun generateSignature(
    method: String,
    path: String,
    timestamp: String,
    nonce: String,
    body: String,
    secretKey: String
): String {
    val stringToSign = "$method\n$path\n$timestamp\n$nonce\n$body"
    val mac = Mac.getInstance("HmacSHA256")
    val secretKeySpec = SecretKeySpec(secretKey.toByteArray(), "HmacSHA256")
    mac.init(secretKeySpec)
    val signatureBytes = mac.doFinal(stringToSign.toByteArray())
    return signatureBytes.joinToString("") { "%02x".format(it) }
}
```

## 服务器端验证

### 已实现的验证逻辑

1. **请求头检查**：验证所有必需的请求头是否存在
2. **时间戳验证**：检查时间戳是否在有效窗口内（±5 分钟）
3. **Nonce 验证**：检查 nonce 是否已使用（Redis 存储）
4. **签名验证**：使用 HMAC-SHA256 验证签名

### 返回状态码

- `401 Unauthorized`：签名无效、时间戳过期、nonce 重复
- `200 OK`：签名验证通过

## 安全注意事项

1. **密钥管理**：`APP_SECRET_KEY` 必须保密，不应在客户端代码中硬编码
2. **HTTPS**：所有请求必须使用 HTTPS 传输
3. **时间窗口**：时间戳窗口（5 分钟）可根据需要调整
4. **Nonce 长度**：Nonce 应足够随机，避免碰撞
5. **常数时间比较**：使用 `hmac.compare_digest()` 防止时序攻击

## 测试

运行签名验证测试：

```bash
cd backend
python app/tests/test_signature.py
```

测试包括：
- 签名生成验证
- 签名验证逻辑
- 无效签名检测
- 时间戳过期检测
- 签名字符串格式验证

## 相关代码文件

- `backend/app/deps.py`：签名验证函数 `verify_request_signature()`
- `backend/app/main.py`：签名验证中间件 `signature_verification_middleware()`
- `backend/app/config.py`：`APP_SECRET_KEY` 配置
- `backend/app/tests/test_signature.py`：签名验证测试
