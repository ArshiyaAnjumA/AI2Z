from pydantic import BaseModel
from typing import Optional, List

class UserProfile(BaseModel):
    user_id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    target_goal: Optional[str] = None
    skill_level: Optional[str] = None

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    target_goal: Optional[str] = None
    skill_level: Optional[str] = None

class UserStats(BaseModel):
    xp_total: int
    streak_days: int
    lessons_completed: int
    quizzes_completed: int
    practice_completed: int
    exams_attempted: int
    certificates_earned: int

class UserBadge(BaseModel):
    id: str
    badge_key: str
    badge_title: str
    badge_description: Optional[str] = None
    earned_at: str

class LessonCompleteRequest(BaseModel):
    lesson_id: str
    score: int

class ProgressSummary(BaseModel):
    xp: int
    streak: int
    level: str
    completed_lessons: int
    daily_minutes: int

class Lesson(BaseModel):
    id: str
    track: str
    topic: str
    level: str
    title: str
    explanation: str
    analogy: str
    key_takeaway: str
    is_locked: bool = False
    is_completed: bool = False

class QuizQuestion(BaseModel):
    id: Optional[str] = None
    question: str
    options: List[str]
    correct_index: Optional[int] = None 
    explanation: Optional[str] = None 

class Quiz(BaseModel):
    id: str
    lesson_id: str
    questions: List[QuizQuestion]

class QuizSubmitRequest(BaseModel):
    quiz_id: str
    answers: List[int]

class QuestionFeedback(BaseModel):
    question_id: Optional[str] = None
    correct: bool
    correct_index: int
    explanation: str

class QuizResult(BaseModel):
    score: int
    xp_earned: int
    feedback: List[QuestionFeedback]

class PracticeSubmitRequest(BaseModel):
    task: str
    user_prompt: str
    level: str = "beginner"

class PracticeFeedbackResponse(BaseModel):
    strengths: List[str]
    improvements: List[str]
    improved_prompt: str

class NewsItem(BaseModel):
    id: str
    published_date: str
    source: str
    title: str
    url: Optional[str] = None
    what_happened: str
    why_it_matters: str
    term: Optional[str] = None
    term_explanation: Optional[str] = None
    quiz_json: Optional[List[dict]] = None

class NewsQuizSubmitRequest(BaseModel):
    news_id: str
    score: int

class Exam(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    questions: List[QuizQuestion]

class ExamSubmitRequest(BaseModel):
    exam_id: str
    answers: List[int]

class Certificate(BaseModel):
    id: str
    user_id: str
    exam_id: str
    issue_date: str
    certificate_code: str
    full_name: Optional[str] = None
class DashboardSummary(BaseModel):
    profile: UserProfile
    progress: ProgressSummary
    daily_lesson: Optional[Lesson] = None
