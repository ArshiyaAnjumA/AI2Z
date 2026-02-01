from .base import BaseFlowClient

class LessonFlowClient(BaseFlowClient):
    flow_id = "fl_lesson_01"

    async def generate_lesson(self, topic: str, level: str, previous_titles: list[str] = None):
        """
        Inputs:
        - topic: string
        - level: string (Beginner | Intermediate | Advanced)
        - previous_titles: list of strings (lessons already covered)
        """
        
        history_context = ""
        if previous_titles:
            history_context = f"The user has ALREADY completed these lessons: {', '.join(previous_titles)}. Do NOT generate a lesson on these specific sub-topics again. Generate the NEXT logical concept in the sequence."

        prompt = f"""
        You are an expert AI educator.
        Generate a Duolingo-style lesson on: {topic} for level: {level}.
        
        {history_context}

        Rules:
        - Use simple language
        - No math, no code
        - Explanation max 120 words
        - Include exactly 1 real-world analogy
        - Explain any acronym the first time it appears
        - Output MUST be valid JSON only. Do not include markdown.

        Return JSON exactly in this shape:
        {{
          "title": "A short, catchy title different from previous ones",
          "explanation": "",
          "analogy": "",
          "key_takeaway": ""
        }}
        """
        
        schema = {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "explanation": {"type": "string"},
                "analogy": {"type": "string"},
                "key_takeaway": {"type": "string"}
            },
            "required": ["title", "explanation", "analogy", "key_takeaway"],
            "additionalProperties": False
        }
        
        return await self._call_ai(prompt, schema)
