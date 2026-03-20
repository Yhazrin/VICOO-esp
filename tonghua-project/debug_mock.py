import asyncio
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock

original_get = AsyncClient.get

def mock_side_effect(self, *args, **kwargs):
    print(f"Mock called with self={self}, args={args}, kwargs={kwargs}")
    return original_get(self, *args, **kwargs)

# Test 1: Positional URL
print("--- Test 1: Positional URL ---")
with patch('httpx._client.AsyncClient.get', side_effect=mock_side_effect):
    client = AsyncClient()
    try:
        # Simulate what tests do
        # Note: we can't actually await get() without an event loop here
        # but we can check the arguments passed to mock
        import inspect
        sig = inspect.signature(original_get)
        print(f"Original signature: {sig}")
    except Exception as e:
        print(f"Error: {e}")

# Test 2: Check how httpx calls get
print("\n--- Test 2: Inspecting httpx call ---")
# Just checking source code or signature
print(f"AsyncClient.get signature: {AsyncClient.get.__text_signature__}")
