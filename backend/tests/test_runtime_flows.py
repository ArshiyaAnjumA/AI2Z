import asyncio
import json
import os
from dotenv import load_dotenv

# Add project root to sys.path
import sys
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.append(project_root)

# Load environment variables
load_dotenv(os.path.join(project_root, '.env'))

from backend.ai.lesson_flow_client import LessonFlowClient
from backend.ai.quiz_flow_client import QuizFlowClient
from backend.ai.practice_feedback_flow_client import PracticeFeedbackFlowClient
from backend.ai.news_flow_client import NewsFlowClient
from backend.ai.exam_flow_client import ExamFlowClient

async def run_tests():
    print("🚀 Starting Runtime Flows Verification...\n")
    
    # 1. Lesson Flow
    print("--- FLOW 1: lesson_flow ---")
    lesson_client = LessonFlowClient()
    lessons = []
    
    # Test 1
    print("Test 1: topic='Generative AI', level='Beginner'")
    l1 = await lesson_client.generate_lesson("Generative AI", "Beginner")
    print(json.dumps(l1, indent=2))
    lessons.append(l1)
    
    # Test 2
    print("Test 2: topic='Overfitting', level='Intermediate'")
    l2 = await lesson_client.generate_lesson("Overfitting", "Intermediate")
    print(json.dumps(l2, indent=2))
    lessons.append(l2)
    print("\n")

    # 2. Quiz Flow
    print("--- FLOW 2: quiz_flow ---")
    quiz_client = QuizFlowClient()
    
    # Test 1
    print("Test 1: using explanation from lesson_flow test(1), level='Beginner'")
    q1 = await quiz_client.generate_quiz(l1.get('explanation', ''), "Beginner")
    print(json.dumps(q1, indent=2))
    
    # Test 2
    print("Test 2: mock text, level='Beginner'")
    q2 = await quiz_client.generate_quiz("Machine learning uses data to learn patterns and make predictions.", "Beginner")
    print(json.dumps(q2, indent=2))
    print("\n")

    # 3. Practice Feedback Flow
    print("--- FLOW 3: practice_feedback_flow ---")
    prac_client = PracticeFeedbackFlowClient()
    
    # Test 1
    print("Test 1: task='Summarize AI news', level='Beginner'")
    pf1 = await prac_client.get_feedback("Summarize an AI news article for beginners in 3 bullet points.", "summarize this article", "Beginner")
    print(json.dumps(pf1, indent=2))
    
    # Test 2
    print("Test 2: task='Extract action items', level='Intermediate'")
    pf2 = await prac_client.get_feedback("Write a prompt to extract action items from meeting notes.", "give action items", "Intermediate")
    print(json.dumps(pf2, indent=2))
    print("\n")

    # 4. News Flow
    print("--- FLOW 4: news_flow ---")
    news_client = NewsFlowClient()
    
    # Test 1
    print("Test 1: article='reasoning model', level='Beginner'")
    n1 = await news_client.simplify_news("A company released a new reasoning model that improves step-by-step problem solving...", "Beginner")
    print(json.dumps(n1, indent=2))
    
    # Test 2
    print("Test 2: article='RAG', level='Beginner'")
    n2 = await news_client.simplify_news("Researchers introduced Retrieval-Augmented Generation (RAG) to reduce hallucinations by grounding answers in documents...", "Beginner")
    print(json.dumps(n2, indent=2))
    print("\n")

    # 5. Exam Flow
    print("--- FLOW 5: exam_flow ---")
    exam_client = ExamFlowClient()
    
    # Test 1
    print("Test 1: count=10, level='Intermediate'")
    e1 = await exam_client.generate_final_exam("AI, Machine Learning, Deep Learning, Generative AI, Prompt Engineering", 10, "Intermediate")
    print(f"Generated {len(e1)} questions.")
    
    # Test 2
    print("Test 2: count=5, level='Advanced'")
    e2 = await exam_client.generate_final_exam("AGI, Transformers, RAG, Hallucinations, Evaluation", 5, "Advanced")
    print(f"Generated {len(e2)} questions.")
    print("\n")

    print("✅ All tests completed!")

if __name__ == "__main__":
    asyncio.run(run_tests())
