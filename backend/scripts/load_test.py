import asyncio
import httpx
import time
import statistics
from typing import List

BASE_URL = "http://localhost:8000/api"
ENDPOINTS = [
    "/campaigns",
    "/artworks",
    "/donations/stats",
    "/health"
]

async def fetch(client: httpx.AsyncClient, url: str) -> float:
    start = time.time()
    try:
        response = await client.get(url)
        response.raise_for_status()
        return time.time() - start
    except Exception as e:
        print(f"Request failed: {e}")
        return 0.0

async def user_session(user_id: int, num_requests: int):
    results = []
    async with httpx.AsyncClient(timeout=10.0) as client:
        for i in range(num_requests):
            for endpoint in ENDPOINTS:
                duration = await fetch(client, f"{BASE_URL}{endpoint}")
                if duration > 0:
                    results.append(duration)
            # Small random delay between "user" actions
            await asyncio.sleep(0.1)
    return results

async def run_load_test(num_users: int, requests_per_user: int):
    print(f"Starting load test: {num_users} concurrent users, {requests_per_user} requests each...")
    start_time = time.time()
    
    tasks = [user_session(i, requests_per_user) for i in range(num_users)]
    all_results = await asyncio.gather(*tasks)
    
    flattened_results = [res for user_res in all_results for res in user_res]
    total_duration = time.time() - start_time
    
    if not flattened_results:
        print("No successful requests.")
        return

    print("\n--- Load Test Results ---")
    print(f"Total Requests: {len(flattened_results)}")
    print(f"Total Time: {total_duration:.2f}s")
    print(f"Requests/sec: {len(flattened_results) / total_duration:.2f}")
    print(f"Average Latency: {statistics.mean(flattened_results)*1000:.2f}ms")
    print(f"Median Latency: {statistics.median(flattened_results)*1000:.2f}ms")
    print(f"Min Latency: {min(flattened_results)*1000:.2f}ms")
    print(f"Max Latency: {max(flattened_results)*1000:.2f}ms")

if __name__ == "__main__":
    asyncio.run(run_load_test(num_users=10, requests_per_user=5))
