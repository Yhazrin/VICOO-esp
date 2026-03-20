#!/usr/bin/env python3
import hmac
import hashlib
import time
import json
import requests

secret_key = 'test-secret-key-for-development-only'
base_url = 'http://localhost:8080/api/v1'

def generate_signature(method, path, timestamp, nonce, body):
    string_to_sign = f'{method}\n{path}\n{timestamp}\n{nonce}\n{body}'
    return hmac.new(secret_key.encode('utf-8'), string_to_sign.encode('utf-8'), hashlib.sha256).hexdigest()

# Test login
method = 'POST'
path = '/api/v1/auth/login'
timestamp = str(int(time.time()))
nonce = 'test-nonce-12345'
body = json.dumps({'email': 'testuser@example.com', 'password': 'password123'})

signature = generate_signature(method, path, timestamp, nonce, body)

print(f'Signature: {signature}')
print(f'Timestamp: {timestamp}')

response = requests.post(
    f'{base_url}/auth/login',
    json={'email': 'testuser@example.com', 'password': 'password123'},
    headers={
        'Content-Type': 'application/json',
        'X-Signature': signature,
        'X-Timestamp': timestamp,
        'X-Nonce': nonce
    }
)
print(f'Status: {response.status_code}')
print(f'Response: {response.text}')

if response.status_code == 200:
    data = response.json()
    access_token = data['data']['token']['access_token']
    print(f'\nAccess token: {access_token[:50]}...')

    # Test /users/me endpoint
    method = 'GET'
    path = '/api/v1/users/me'
    timestamp = str(int(time.time()))
    nonce = 'test-nonce-12346'
    body = ''

    signature = generate_signature(method, path, timestamp, nonce, body)

    response = requests.get(
        f'{base_url}/users/me',
        headers={
            'Authorization': f'Bearer {access_token}',
            'X-Signature': signature,
            'X-Timestamp': timestamp,
            'X-Nonce': nonce
        }
    )
    print(f'\n/users/me Status: {response.status_code}')
    print(f'/users/me Response: {response.text}')
