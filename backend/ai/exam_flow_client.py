from .base import BaseFlowClient

class ExamFlowClient(BaseFlowClient):
    flow_id = "fl_exam_01"

    async def generate_final_exam(self, topics: str, count: int, level: str):
        """
        Inputs:
        - topics: string (comma-separated list)
        - count: integer
        - level: string (Beginner | Intermediate | Advanced)
        """
        prompt = f"""
        You are a certification exam author.

        Create a professional AI fundamentals exam for level: {level}.

        Topics:
        {topics}

        Number of questions:
        {count}

        Rules:
        - Multiple-choice only
        - Exactly {count} questions
        - 4 options each
        - One correct answer
        - Mix easy/medium/hard (include difficulty field)
        - Avoid ambiguous wording
        - Output MUST be valid JSON only

        Return JSON array exactly:
        [
          {{
            "question": "",
            "options": ["", "", "", ""],
            "correct_index": 0,
            "difficulty": "easy"
          }}
        ]
        """
        
        schema = {
            "type": "object",
            "properties": {
                "questions": {
                    "type": "array",
                    "minItems": count,
                    "maxItems": count,
                    "items": {
                        "type": "object",
                        "properties": {
                            "question": {"type": "string"},
                            "options": {"type": "array", "minItems": 4, "maxItems": 4, "items": {"type": "string"}},
                            "correct_index": {"type": "integer", "minimum": 0, "maximum": 3},
                            "difficulty": {"type": "string", "enum": ["easy", "medium", "hard"]}
                        },
                        "required": ["question", "options", "correct_index", "difficulty"]
                    }
                }
            },
            "required": ["questions"]
        }
        
        res = await self._call_ai(prompt, schema)
        return res.get("questions", [])
