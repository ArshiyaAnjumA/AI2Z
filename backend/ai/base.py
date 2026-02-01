from openai import AsyncOpenAI
import os
import json
from typing import Dict, Any

class BaseFlowClient:
    def __init__(self, model_name="gpt-4o-mini"):
        # The user requested OpenAI
        api_key = os.getenv("OPENAI_API_KEY") 
        if not api_key:
            print("Warning: OPENAI_API_KEY not set")
            
        self.client = AsyncOpenAI(api_key=api_key)
        self.model_name = model_name

    async def _call_ai(self, prompt: str, schema: Dict[str, Any] = None) -> Dict[str, Any]:
        try:
            messages = [
                {"role": "system", "content": "You are a helpful educational assistant. You must return only valid JSON."},
                {"role": "user", "content": prompt}
            ]
            
            if schema:
                messages[0]["content"] += f" Match this schema: {json.dumps(schema)}"

            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            print(f"OpenAI Call Error: {e}")
            return {"error": str(e), "raw": "Check logs for details"}
