import asyncio
import sys
import os
import json
import logging

logging.basicConfig(level=logging.ERROR)

sys.path.append("/Users/yuki/Documents/GitHub/Clarivo/backend-ai")
from dotenv import load_dotenv
load_dotenv("/Users/yuki/Documents/GitHub/Clarivo/backend-ai/.env")

async def main():
    try:
        from routes.tree_ai import tree_expand, ExpandRequest
        from fastapi import Request
        class MockRequest:
            headers = {}
        
        req = ExpandRequest(user_id="alex_demo", current_path=[])
        res = await tree_expand(req, MockRequest())
        print("RESULT:")
        print(res)
    except Exception as e:
        print("EXCEPTION:")
        import traceback
        traceback.print_exc()

asyncio.run(main())
