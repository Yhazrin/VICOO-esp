"""
Test MiniMax-M2.7-highspeed model with the VICOO welfare agent system prompt.
Usage: python tools/test_minimax_agent.py
"""
import httpx
import json
import asyncio
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import os
API_KEY = os.environ.get("MINIMAX_API_KEY", "")
API_BASE = "https://api.minimax.chat/v1"
MODEL = os.environ.get("MINIMAX_MODEL", "MiniMax-M2.7-highspeed")

SYSTEM_PROMPT = """你是「Uniqlo × VICOO 公益」平台助手，也是「Uniqlo × VICOO 公益」的专属公益智能体。语气温暖、克制、专业。
你需要根据页面语境推荐对应商品，并优先使用站内数据库与检索结果回答：
1) 如果当前是 Uniqlo/常规商城语境，默认优先推荐常规商品（/shop/{id}）。
2) 如果当前是 Impact/公益语境，默认优先推荐公益商品（/impact/shop/{id}）。
3) 但当用户明确强调"可持续/公益/捐赠/环保/sustainable/impact/charity"时，即使在 Uniqlo 页面也要优先推荐 Impact 商品。
4) 如果用户表达"推荐/找商品/包/衣物"等需求但没有明确 Uniqlo 或 Impact，先追问其偏好（Uniqlo 还是 Impact），再给推荐。
5) 进行商品推荐时，尽量返回可点击链接，并给出推荐理由（材质、价格、公益比例、溯源等）。
6) 需要同时理解中英文同义词（如 T-shirt/T恤、bag/包、clothes/衣物）并做匹配推荐。
7) 优先基于站内数据库内容回答，不要编造站外商品或链接。
8) 如果用户问到订单、支付、隐私，请只给基础状态说明，不泄露敏感信息。
9) 涉及儿童信息、支付与法律问题，提醒以站内条款与客服为准。
10) 引导用户了解和参与捐赠（解释捐赠档位、流程、证书）。
11) 查询并报告公益活动的筹款进度和影响力数据。
12) 帮助用户查询个人捐赠记录和历史。
13) 介绍旧衣回收流程和意义。
14) 查询公益商品的供应链溯源信息。
15) 解释影响力基金的分配机制（60% 艺术家 / 30% 学校 / 10% 慈善池）。
当用户表达公益相关意图时，主动调用对应工具获取实时数据，给出温暖、专业的回复。
回复中如果包含捐赠记录、活动进度、影响力基金等结构化数据，请使用以下格式标记，以便前端渲染为可视化卡片：
:::action-card[donation-list]{...json_data}
:::action-card[campaign-progress]{...json_data}
:::action-card[impact-fund]{...json_data}
其中 json_data 为对应数据的 JSON 字符串。"""

TEST_CASES = [
    {
        "name": "捐赠引导",
        "messages": [{"role": "user", "content": "我想了解捐赠流程和档位"}],
    },
    {
        "name": "活动进度查询",
        "messages": [{"role": "user", "content": "当前公益筹款活动进展如何？"}],
    },
    {
        "name": "影响力数据",
        "messages": [{"role": "user", "content": "平台的公益影响力数据如何？"}],
    },
    {
        "name": "旧衣回收",
        "messages": [{"role": "user", "content": "如何参与旧衣回收？"}],
    },
    {
        "name": "商品推荐 (Impact 语境)",
        "messages": [{"role": "user", "content": "推荐一些公益商品给我看看"}],
    },
    {
        "name": "影响力基金分配",
        "messages": [{"role": "user", "content": "影响力基金是怎么分配的？"}],
    },
]


async def test_single(client: httpx.AsyncClient, case: dict) -> dict:
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            *case["messages"],
        ],
        "temperature": 0.7,
        "max_tokens": 800,
    }
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    try:
        resp = await client.post(
            f"{API_BASE}/chat/completions",
            headers=headers,
            json=payload,
            timeout=30.0,
        )
        resp.raise_for_status()
        data = resp.json()
        reply = data["choices"][0]["message"]["content"].strip()
        return {"name": case["name"], "status": "ok", "reply": reply, "model": data.get("model", MODEL)}
    except Exception as e:
        return {"name": case["name"], "status": "error", "error": str(e)}


async def main():
    print(f"=== MiniMax Agent Test ({MODEL}) ===\n")
    async with httpx.AsyncClient() as client:
        for case in TEST_CASES:
            print(f"--- {case['name']} ---")
            print(f"  User: {case['messages'][0]['content']}")
            result = await test_single(client, case)
            if result["status"] == "ok":
                print(f"  Model: {result['model']}")
                # Truncate long replies for display
                reply = result["reply"]
                if len(reply) > 500:
                    reply = reply[:500] + "..."
                print(f"  Reply:\n{reply}\n")
            else:
                print(f"  ERROR: {result['error']}\n")
    print("=== Test Complete ===")


if __name__ == "__main__":
    asyncio.run(main())
