from .base import BaseFlowClient

class PracticeFeedbackFlowClient(BaseFlowClient):
    flow_id = "fl_practice_01"

    async def get_feedback(self, task: str, user_prompt: str, level: str):
        """
        Inputs:
        - task: string
        - user_prompt: string
        - level: string (Beginner | Intermediate | Advanced)
        """
        prompt = f"""
        You are a senior prompt engineer and mentor.

        Task:
        {task}

        User's prompt:
        {user_prompt}

        Learner level:
        {level}

        Evaluate the prompt on:
        - clarity
        - specificity
        - missing constraints

        Rules:
        - Friendly, constructive tone
        - Give exactly 2 strengths and exactly 2 improvements
        - Provide a rewritten improved prompt
        - Output MUST be valid JSON only

        Return JSON exactly:
        {{
          "strengths": ["", ""],
          "improvements": ["", ""],
          "improved_prompt": ""
        }}
        """
        
        schema = {
            "type": "object",
            "properties": {
                "strengths": {"type": "array", "minItems": 2, "maxItems": 2, "items": {"type": "string"}},
                "improvements": {"type": "array", "minItems": 2, "maxItems": 2, "items": {"type": "string"}},
                "improved_prompt": {"type": "string"}
            },
            "required": ["strengths", "improvements", "improved_prompt"]
        }
        
        return await self._call_ai(prompt, schema)
