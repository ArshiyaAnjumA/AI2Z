from .base import BaseFlowClient

class NewsFlowClient(BaseFlowClient):
    flow_id = "fl_news_01"

    async def simplify_news(self, article_text: str, level: str):
        """
        Simplifies news content for a specific user level.
        """
        prompt = f"""
        You are an AI news editor.
        Simplify the following AI news for level: {level}.

        Article:
        {article_text}

        Rules:
        - No hype, no marketing language
        - Explain acronyms the first time
        - Total output max 90 words
        - Return JSON exactly:
        {{
          "what_happened": "",
          "why_it_matters": "",
          "new_term": "",
          "term_explanation": ""
        }}
        """
        schema = {
            "type": "object",
            "properties": {
                "what_happened": {"type": "string"},
                "why_it_matters": {"type": "string"},
                "new_term": {"type": "string"},
                "term_explanation": {"type": "string"}
            },
            "required": ["what_happened", "why_it_matters", "new_term", "term_explanation"]
        }
        return await self._call_ai(prompt, schema)

    async def get_latest_ai_news(self):
        """
        Simulates fetching the latest AI news using the AI model as a curator.
        """
        prompt = """
        Generate a list of 3-5 major AI news headlines from the last 24-48 hours.
        Return JSON format:
        {
          "news": [
            { "source": "", "title": "", "url": "", "what_happened": "", "why_it_matters": "", "term": "", "term_explanation": "" }
          ]
        }
        """
        schema = {
            "type": "object",
            "properties": {
                "news": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "source": {"type": "string"},
                            "title": {"type": "string"},
                            "url": {"type": "string"},
                            "what_happened": {"type": "string"},
                            "why_it_matters": {"type": "string"},
                            "term": {"type": "string"},
                            "term_explanation": {"type": "string"}
                        },
                        "required": ["source", "title", "url", "what_happened", "why_it_matters", "term", "term_explanation"]
                    }
                }
            },
            "required": ["news"]
        }
        return await self._call_ai(prompt, schema)

    async def generate_quiz(self, content: str, level: str = "Beginner"):
        """
        Generates a quick quiz question based on news content.
        """
        prompt = f"""
        Based on this news: {content}
        Level: {level}
        
        Generate 1 multiple choice question.
        Return JSON:
        {{
          "questions": [
            {{
              "question": "",
              "options": ["", "", "", ""],
              "correct_index": 0,
              "explanation": ""
            }}
          ]
        }}
        """
        schema = {
            "type": "object",
            "properties": {
                "questions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "question": {"type": "string"},
                            "options": {"type": "array", "items": {"type": "string"}},
                            "correct_index": {"type": "integer"},
                            "explanation": {"type": "string"}
                        },
                        "required": ["question", "options", "correct_index", "explanation"]
                    }
                }
            },
            "required": ["questions"]
        }
        return await self._call_ai(prompt, schema)
