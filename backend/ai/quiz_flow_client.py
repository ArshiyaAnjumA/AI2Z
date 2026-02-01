from .base import BaseFlowClient

class QuizFlowClient(BaseFlowClient):
    flow_id = "fl_quiz_01"

    async def generate_quiz(self, lesson_text: str, level: str):
        """
        Inputs:
        - lesson_text: string
        - level: string (Beginner | Intermediate | Advanced)
        """
        prompt = f"""
        You are an AI learning designer.

        Create exactly 3 multiple-choice questions from the lesson below.

        Lesson:
        {lesson_text}

        Rules:
        - Difficulty: {level}
        - Exactly 3 questions
        - Each question has 4 options
        - One correct answer only
        - Wrong options must be realistic (not silly)
        - No “all of the above” or “none of the above”
        - Include a 1-sentence explanation for the correct answer
        - Output MUST be valid JSON only

        Return JSON array exactly in this shape:
        [
          {{
            "question": "",
            "options": ["", "", "", ""],
            "correct_index": 0,
            "explanation": ""
          }}
        ]
        """
        
        schema = {
            "type": "object",
            "properties": {
                "questions": {
                    "type": "array",
                    "minItems": 3,
                    "maxItems": 3,
                    "items": {
                        "type": "object",
                        "properties": {
                            "question": {"type": "string"},
                            "options": {"type": "array", "minItems": 4, "maxItems": 4, "items": {"type": "string"}},
                            "correct_index": {"type": "integer", "minimum": 0, "maximum": 3},
                            "explanation": {"type": "string"}
                        },
                        "required": ["question", "options", "correct_index", "explanation"]
                    }
                }
            },
            "required": ["questions"]
        }
        
        # Note: Since the user requested a JSON array, but OpenAI's response_format type: json_object 
        # requires a root object, we wrap it.
        res = await self._call_ai(prompt, schema)
        return res.get("questions", [])
