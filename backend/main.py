from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from datetime import date
from backend.auth import get_current_user, supabase
from backend.models import (
    UserProfile, LessonCompleteRequest, ProgressSummary,
    Quiz, QuizQuestion, QuizSubmitRequest, QuizResult, QuestionFeedback, Lesson,
    PracticeSubmitRequest, PracticeFeedbackResponse, NewsItem, NewsQuizSubmitRequest,
    Exam, ExamSubmitRequest, Certificate, UserProfileUpdate, UserStats, UserBadge,
    DashboardSummary, AITerm
)
from backend.ai.lesson_flow_client import LessonFlowClient
from backend.ai.quiz_flow_client import QuizFlowClient
from backend.ai.practice_feedback_flow_client import PracticeFeedbackFlowClient
from backend.ai.news_flow_client import NewsFlowClient
from backend.ai.exam_flow_client import ExamFlowClient
from datetime import datetime, date

app = FastAPI(title="AI Learning App Backend")

# CORS setup
origins = [
    "*", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AI Clients
lesson_client = LessonFlowClient()
quiz_client = QuizFlowClient()
practice_client = PracticeFeedbackFlowClient()
news_client = NewsFlowClient()
exam_client = ExamFlowClient()

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "backend"}

# --- Protected Endpoints ---

@app.get("/profile/me", response_model=UserProfile)
async def get_profile(user = Depends(get_current_user)):
    try:
        res = supabase.table("user_profile").select("*").eq("user_id", user.id).execute()
        if not res or not res.data:
            # Auto-create profile if missing
            new_profile = {
                "user_id": user.id,
                "full_name": user.email.split('@')[0] if user.email else "User",
                "skill_level": "Beginner",
                "target_goal": "AI Foundations"
            }
            res = supabase.table("user_profile").insert(new_profile).execute()
        
        data = res.data[0]
        return UserProfile(
            user_id=data["user_id"],
            email=user.email or "",
            full_name=data.get("full_name"),
            avatar_url=data.get("avatar_url"),
            target_goal=data.get("target_goal"),
            skill_level=data.get("skill_level")
        )
    except Exception as e:
        print(f"Error in get_profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch profile")

@app.patch("/profile/me", response_model=UserProfile)
async def update_profile(request: UserProfileUpdate, user = Depends(get_current_user)):
    try:
        update_data = {k: v for k, v in request.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_data["updated_at"] = datetime.now().isoformat()
        res = supabase.table("user_profile").update(update_data).eq("user_id", user.id).execute()
        
        if not res or not res.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        data = res.data[0]
        return UserProfile(
            user_id=data["user_id"],
            email=user.email or "",
            full_name=data.get("full_name"),
            avatar_url=data.get("avatar_url"),
            target_goal=data.get("target_goal"),
            skill_level=data.get("skill_level")
        )
    except Exception as e:
        print(f"Error in update_profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

@app.get("/profile/dashboard", response_model=DashboardSummary)
async def get_dashboard(user = Depends(get_current_user)):
    try:
        # Check and update streak
        try:
            today = date.today()
            stats_res = supabase.table("user_stats").select("*").eq("user_id", user.id).execute()
            
            if stats_res and stats_res.data:
                stats = stats_res.data[0]
                last_active = stats.get("last_active_date")
                current_streak = stats.get("streak_days", 0)
                
                new_streak = current_streak
                should_update = False
                
                if last_active:
                    last_date = date.fromisoformat(last_active)
                    if last_date == today:
                        pass # Already active today
                    elif (today - last_date).days == 1:
                        new_streak += 1 # Consecutive day
                        should_update = True
                    else:
                        new_streak = 1 # Streak broken
                        should_update = True
                else:
                    new_streak = 1 # First time
                    should_update = True
                
                if should_update:
                    supabase.table("user_stats").update({
                        "streak_days": new_streak,
                        "last_active_date": today.isoformat()
                    }).eq("user_id", user.id).execute()
            else:
                 # Create stats if missing
                supabase.table("user_stats").insert({
                    "user_id": user.id,
                    "streak_days": 1,
                    "last_active_date": today.isoformat()
                }).execute()

        except Exception as e:
            print(f"Error updating streak: {e}")

        # We consolidate 3 calls into 1 auth check context
        profile = await get_profile(user)
        progress = await get_progress_summary(user)
        
        # Get daily lesson with logic from below
        topic = TOPICS[date.today().day % len(TOPICS)]
        daily_lesson = None
        try:
            daily_lesson = await get_daily_lesson(level=profile.skill_level or "beginner", topic=topic, user=user)
        except Exception as e:
            print(f"Error fetching daily lesson for dashboard: {e}")
            
        return DashboardSummary(
            profile=profile,
            progress=progress,
            daily_lesson=daily_lesson
        )
    except Exception as e:
        print(f"Error in get_dashboard: {e}")
        raise HTTPException(status_code=500, detail="Failed to load dashboard")

@app.get("/profile/stats", response_model=UserStats)
async def get_stats(user = Depends(get_current_user)):
    try:
        res = supabase.table("user_stats").select("*").eq("user_id", user.id).execute()
        if not res or not res.data:
            # Auto-create stats if missing
            new_stats = {"user_id": user.id}
            res = supabase.table("user_stats").insert(new_stats).execute()
        
        return UserStats(**res.data[0])
    except Exception as e:
        print(f"Error in get_stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch stats")

@app.get("/profile/badges", response_model=List[UserBadge])
async def get_badges(user = Depends(get_current_user)):
    try:
        res = supabase.table("user_badges").select("*").eq("user_id", user.id).execute()
        return [UserBadge(**b) for b in res.data]
    except Exception as e:
        print(f"Error in get_badges: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch badges")

@app.get("/me", response_model=UserProfile)
async def get_me_legacy(user = Depends(get_current_user)):
    # Redirecting legacy /me to new /profile/me
    return await get_profile(user)

@app.get("/progress/summary", response_model=ProgressSummary)
async def get_progress_summary(user = Depends(get_current_user)):
    try:
        # Fetch stats
        s_res = supabase.table("user_stats").select("*").eq("user_id", user.id).execute()
        # Fetch profile for level
        p_res = supabase.table("user_profile").select("skill_level").eq("user_id", user.id).execute()
        
        stats = s_res.data[0] if s_res and s_res.data else {
            "xp_total": 0,
            "streak_days": 0,
            "lessons_completed": 0
        }
        
        level = "Beginner"
        if p_res and p_res.data:
            level = p_res.data[0].get("skill_level", "Beginner")
            
        return ProgressSummary(
            xp=stats.get("xp_total", 0),
            streak=stats.get("streak_days", 0),
            level=level,
            completed_lessons=stats.get("lessons_completed", 0),
            daily_minutes=stats.get("daily_minutes", 0),
            last_activity_date=stats.get("last_activity_date")
        )
    except Exception as e:
        print(f"Error in get_progress_summary: {e}")
        # Return default if error
        return ProgressSummary(xp=0, streak=0, level="Beginner", completed_lessons=0)

@app.get("/terms/daily", response_model=AITerm)
async def get_term_of_day():
    """
    Returns the AI term of the day.
    Uses deterministic rotation based on day of year so all users see the same term each day.
    """
    try:
        # Get all terms from database
        response = supabase.table("ai_terms").select("*").execute()
        
        if not response or not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="No terms found in database")
        
        terms = response.data
        total_terms = len(terms)
        
        # Use day of year to select term (deterministic)
        today = date.today()
        day_of_year = today.timetuple().tm_yday  # 1-365/366
        term_index = day_of_year % total_terms
        
        selected_term = terms[term_index]
        
        return AITerm(
            id=selected_term["id"],
            term=selected_term["term"],
            definition=selected_term["definition"],
            category=selected_term.get("category"),
            difficulty=selected_term.get("difficulty")
        )
    except Exception as e:
        print(f"Error in get_term_of_day: {e}")
        # Return a fallback term
        return AITerm(
            id="fallback",
            term="Machine Learning",
            definition="A subset of AI that enables systems to learn and improve from experience without being explicitly programmed.",
            category="ML",
            difficulty="Beginner"
        )


@app.post("/progress/lesson_complete")
def complete_lesson(request: LessonCompleteRequest, user = Depends(get_current_user)):
    # 1. Log attempt in lesson_attempts
    # 2. Update XP in profiles
    try:
        # Validate UUID format
        import uuid
        try:
            uuid.UUID(request.lesson_id)
        except ValueError:
            print(f"Warning: Invalid lesson_id received: '{request.lesson_id}'. Skipping persistence.")
            return {"status": "success", "info": "Progress tracked locally (invalid ID)"}

        # Insert attempt
        db_res = supabase.table("lesson_attempts").insert({
            "user_id": user.id,
            "lesson_id": request.lesson_id, 
            "score": request.score
        }).execute()

        # Update XP and lessons_completed in user_stats
        response = supabase.table("user_stats").select("*").eq("user_id", user.id).execute()
        
        if response and response.data and len(response.data) > 0:
            current_stats = response.data[0]
            current_xp = current_stats.get("xp_total", 0)
            current_lessons = current_stats.get("lessons_completed", 0)
            current_daily_minutes = current_stats.get("daily_minutes", 0)
            last_activity_date = current_stats.get("last_activity_date")
            
            # Check if it's a new day - reset daily_minutes if so
            today = date.today().isoformat()
            if last_activity_date != today:
                # New day! Reset daily progress
                current_daily_minutes = 0
            
            new_xp = current_xp + 10
            new_lessons = current_lessons + 1
            new_daily_minutes = current_daily_minutes + 5
            
            supabase.table("user_stats").update({
                "xp_total": new_xp,
                "lessons_completed": new_lessons,
                "daily_minutes": new_daily_minutes,
                "last_activity_date": today
            }).eq("user_id", user.id).execute()
        else:
            # If stats don't exist, create them with initial values
            new_xp = 10
            new_lessons = 1
            new_daily_minutes = 5
            try:
                supabase.table("user_stats").insert({
                    "user_id": user.id,
                    "xp_total": new_xp,
                    "lessons_completed": new_lessons,
                    "daily_minutes": new_daily_minutes,
                    "streak_days": 1,
                    "last_activity_date": date.today().isoformat()
                }).execute()
            except Exception as inner_e:
                print(f"Handled concurrent insert in lesson_complete: {inner_e}")
                # Try update again since it must exist now
                res = supabase.table("user_stats").select("*").eq("user_id", user.id).execute()
                if res and res.data and len(res.data) > 0:
                    current_stats = res.data[0]
                    current_xp = current_stats.get("xp_total", 0)
                    current_lessons = current_stats.get("lessons_completed", 0)
                    new_xp = current_xp + 10
                    new_lessons = current_lessons + 1
                    
                    supabase.table("user_stats").update({
                        "xp_total": new_xp,
                        "lessons_completed": new_lessons
                    }).eq("user_id", user.id).execute()
        
        return {"status": "success", "new_xp": new_xp}
    except Exception as e:
        print(f"Error updating progress: {e}")
        raise HTTPException(status_code=500, detail="Failed to update progress")

TOPICS = ["Machine Learning Basics", "Neural Networks", "Transformer Architecture", "AI Ethics", "Prompt Engineering"]

# --- Public/Placeholder Endpoints ---

import json
import random
from backend.models import Lesson

# Load seeds
with open("backend/data/lessons.json", "r") as f:
    LESSONS_DB = json.load(f)

with open("backend/data/quizzes.json", "r") as f:
    QUIZZES_DB = json.load(f)

@app.post("/quizzes/generate", response_model=Quiz)
async def generate_quiz(lesson_id: str, user = Depends(get_current_user)):
    # 1. Get Lesson Text
    try:
        l_res = supabase.table("lessons").select("*").eq("id", lesson_id).execute()
        if not l_res or not l_res.data:
            raise HTTPException(status_code=404, detail="Lesson not found for quiz generation")
        
        lesson = l_res.data[0]
        lesson_text = f"{lesson['title']}\n\n{lesson['explanation']}\n\n{lesson['key_takeaway']}"

        # 2. Check if quiz already exists for this lesson
        q_res = supabase.table("quizzes").select("*").eq("lesson_id", lesson_id).execute()
        if q_res and q_res.data:
            db_quiz = q_res.data[0]
            client_questions = [QuizQuestion(**q) for q in db_quiz["questions_json"]]
            return Quiz(id=db_quiz["id"], lesson_id=lesson_id, questions=client_questions)

        # 3. Generate new quiz
        print(f"Generating new quiz for lesson {lesson_id}...")
        quiz_data = await quiz_client.generate_quiz(lesson["explanation"], lesson["level"])
        
        # 4. Save to DB
        insert_res = supabase.table("quizzes").insert({
            "lesson_id": lesson_id,
            "questions_json": quiz_data  # quiz_data is already the questions list
        }).execute()
        
        if insert_res and insert_res.data:
            db_quiz = insert_res.data[0]
            client_questions = [QuizQuestion(**q) for q in db_quiz["questions_json"]]
            return Quiz(id=db_quiz["id"], lesson_id=lesson_id, questions=client_questions)

    except Exception as e:
        print(f"Error in generate_quiz: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate AI quiz")

@app.post("/quizzes/submit", response_model=QuizResult)
def submit_quiz(request: QuizSubmitRequest, user = Depends(get_current_user)):
    try:
        res = supabase.table("quizzes").select("*").eq("id", request.quiz_id).execute()
        if not res or not res.data:
            raise HTTPException(status_code=404, detail="Quiz instance not found")
        
        db_quiz = res.data[0]
        questions = db_quiz["questions_json"]
        
        feedback = []
        correct_count = 0
        
        for i, q in enumerate(questions):
            user_answer = request.answers[i] if i < len(request.answers) else -1
            is_correct = user_answer == q["correct_index"]
            if is_correct:
                correct_count += 1
            
            feedback.append(QuestionFeedback(
                question_id=q.get("id"),
                correct=is_correct,
                correct_index=q["correct_index"],
                explanation=q["explanation"]
            ))
        
        score = int((correct_count / len(questions)) * 100)
        xp_earned = correct_count * 5
        
        supabase.table("quiz_attempts").insert({
            "user_id": user.id,
            "quiz_id": request.quiz_id,
            "score": score,
            "answers_json": request.answers
        }).execute()
        
        # Update user_stats with XP and quizzes_completed
        stat_res = supabase.table("user_stats").select("*").eq("user_id", user.id).execute()
        
        if stat_res and stat_res.data:
            current_stats = stat_res.data[0]
            new_xp = current_stats.get("xp_total", 0) + xp_earned
            new_quizzes = current_stats.get("quizzes_completed", 0) + 1
            
            supabase.table("user_stats").update({
                "xp_total": new_xp,
                "quizzes_completed": new_quizzes
            }).eq("user_id", user.id).execute()
        else:
            # Create stats if missing
            supabase.table("user_stats").insert({
                "user_id": user.id,
                "xp_total": xp_earned,
                "quizzes_completed": 1,
                "streak_days": 1
            }).execute()
            
        return QuizResult(
            score=score,
            xp_earned=xp_earned,
            feedback=feedback
        )
    except Exception as e:
        print(f"Error submitting quiz: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit quiz")

@app.get("/lessons/daily", response_model=Lesson)
async def get_daily_lesson(level: str = "beginner", topic: str = None, user = Depends(get_current_user)):
    if not topic:
        topic = TOPICS[date.today().day % len(TOPICS)]
    
    try:
        today_start = datetime.combine(date.today(), datetime.min.time()).isoformat()
        res = supabase.table("lessons").select("*")\
            .eq("topic", topic)\
            .eq("level", level)\
            .gte("created_at", today_start)\
            .execute()
        
        if res and res.data:
            lesson_dict = res.data[0]
            # Check if completed
            attempt = supabase.table("lesson_attempts").select("*").eq("user_id", user.id).eq("lesson_id", lesson_dict["id"]).execute()
            is_completed = True if attempt and attempt.data else False
            
            return Lesson(**lesson_dict, track="ai_fundamentals", is_completed=is_completed)

        print(f"Generating lesson for {topic} at {level} level...")
        lesson_data = await lesson_client.generate_lesson(topic, level, previous_titles=[])
        
        # Double-Check: Did someone else generate it while we were waiting?
        check_res = supabase.table("lessons").select("*")\
            .eq("topic", topic)\
            .eq("level", level)\
            .gte("created_at", today_start)\
            .execute()
            
        if check_res and check_res.data:
            print(f"Race condition detected! Using lesson generated by another user.")
            lesson_dict = check_res.data[0]
            # Check if completed (reuse logic or simple default)
            # Since it was JUST generated, it's unlikely completed, but for safety:
            attempt = supabase.table("lesson_attempts").select("*").eq("user_id", user.id).eq("lesson_id", lesson_dict["id"]).execute()
            is_completed = True if attempt and attempt.data else False
            return Lesson(**lesson_dict, track="ai_fundamentals", is_completed=is_completed)

        db_res = supabase.table("lessons").insert({
            "topic": topic,
            "level": level,
            "title": lesson_data["title"],
            "explanation": lesson_data["explanation"],
            "analogy": lesson_data["analogy"],
            "key_takeaway": lesson_data["key_takeaway"]
        }).execute()
        
        if db_res and db_res.data:
            # New generated lesson is obviously not completed yet
            return Lesson(**db_res.data[0], track="ai_fundamentals", is_completed=False)
            
    except Exception as e:
        print(f"AI/DB Error in get_daily_lesson: {e}")
        return Lesson(
            id="00000000-0000-0000-0000-000000000000",
            track="ai_fundamentals",
            topic=topic,
            level=level,
            title=f"Intro to {topic}",
            explanation="AI generation is briefly unavailable. Try again in a moment!",
            analogy="Like a waiter taking a short break.",
            key_takeaway="Persistence is key."
        )

TRACK_TOPIC_MAP = {
    "ai_fundamentals": "Machine Learning Basics",
    "machine_learning": "Neural Networks",
    "deep_learning": "Transformer Architecture",
    "generative_ai": "AI Ethics",
    "prompt_engineering": "Prompt Engineering"
}

@app.get("/tracks/{track_id}/lessons", response_model=List[Lesson])
async def get_track_lessons(track_id: str, user = Depends(get_current_user)):
    topic = TRACK_TOPIC_MAP.get(track_id)
    # Default to first topic if not found for robustness
    if not topic:
         topic = "Machine Learning Basics"
    
    try:
        # Fetch lessons sorted by creation time
        res = supabase.table("lessons").select("*").eq("topic", topic).order("created_at").execute()
        
        # Fetch user attempts for completion status
        attempts_res = supabase.table("lesson_attempts").select("lesson_id").eq("user_id", user.id).execute()
        completed_ids = set(item['lesson_id'] for item in attempts_res.data) if attempts_res and attempts_res.data else set()

        lessons = []
        seen_titles = set()
        
        # Deduplicate & Process
        if res and res.data:
            # First pass: Deduplicate
            unique_data = []
            for l in res.data:
                norm_title = l["title"].strip().lower()
                if norm_title not in seen_titles:
                    unique_data.append(l)
                    seen_titles.add(norm_title)
            
            # Second pass: Apply progression logic
            previous_completed = True # First lesson always unlocked
            
            for l in unique_data:
                is_completed = l["id"] in completed_ids
                is_locked = not previous_completed
                
                # Create lesson object with status
                lesson_obj = Lesson(
                    **l, 
                    track=track_id,
                    is_locked=is_locked,
                    is_completed=is_completed
                )
                lessons.append(lesson_obj)
                
                # Set previous_completed for NEXT iteration
                # Note: If current is completed, next is unlocked.
                previous_completed = is_completed
        
        # If empty, generate Intro lesson
        if not lessons:
            print(f"Track {track_id} empty. Generating intro lesson...")
            try:
                lesson_data = await lesson_client.generate_lesson(topic, "Beginner", previous_titles=[])
                db_res = supabase.table("lessons").insert({
                    "topic": topic,
                    "level": "Beginner",
                    "title": lesson_data["title"],
                    "explanation": lesson_data["explanation"],
                    "analogy": lesson_data["analogy"],
                    "key_takeaway": lesson_data["key_takeaway"]
                }).execute()
                
                if db_res and db_res.data:
                    # New lesson is always unlocked
                    l = db_res.data[0]
                    lessons.append(Lesson(
                        **l, 
                        track=track_id,
                        is_locked=False,
                        is_completed=False
                    ))
            except Exception as e:
                print(f"Failed to generate intro lesson: {e}")
        
        # Infinite Learning: If the LAST lesson is completed, generate the NEXT one.
        elif lessons and lessons[-1].is_completed:
             print(f"Last lesson in {track_id} completed. Generating next lesson...")
             try:
                # Determine level based on count (simple logic for now)
                count = len(lessons)
                level = "Beginner" if count < 5 else ("Intermediate" if count < 15 else "Advanced")
                
                # Context aware generation
                previous_titles = list(seen_titles)
                
                lesson_data = await lesson_client.generate_lesson(topic, level, previous_titles=previous_titles)
                db_res = supabase.table("lessons").insert({
                    "topic": topic,
                    "level": level,
                    "title": lesson_data["title"],
                    "explanation": lesson_data["explanation"],
                    "analogy": lesson_data["analogy"],
                    "key_takeaway": lesson_data["key_takeaway"]
                }).execute()
                
                if db_res and db_res.data:
                    l = db_res.data[0]
                    # New lesson is unlocked (since previous was completed) but not completed
                    lessons.append(Lesson(
                        **l, 
                        track=track_id,
                        is_locked=False,
                        is_completed=False
                    ))
             except Exception as e:
                print(f"Failed to generate next lesson: {e}")

        return lessons
    except Exception as e:
        print(f"Error fetching track lessons: {e}")
        return []

@app.get("/lessons/{lesson_id}", response_model=Lesson)
def get_lesson_by_id(lesson_id: str, user = Depends(get_current_user)):
    try:
        res = supabase.table("lessons").select("*").eq("id", lesson_id).execute()
        if res and res.data:
            lesson = res.data[0]
            # Log View analytics
            try:
                supabase.table("lesson_views").insert({
                    "user_id": user.id,
                    "lesson_id": lesson_id
                }).execute()
            except: pass
            return Lesson(**lesson, track="ai_fundamentals")
    except Exception as e:
        print(f"Error in get_lesson_by_id: {e}")
    
    raise HTTPException(status_code=404, detail="Lesson not found")

@app.get("/lessons")
def get_lessons():
    try:
        res = supabase.table("lessons").select("*").limit(20).execute()
        return res.data
    except:
        return []

@app.get("/quizzes")
def get_quizzes():
    return [{"id": 1, "title": "Daily Quiz"}]

@app.post("/practice/feedback", response_model=PracticeFeedbackResponse)
async def get_practice_feedback(request: PracticeSubmitRequest, user = Depends(get_current_user)):
    try:
        feedback = await practice_client.get_feedback(
            task=request.task, 
            user_prompt=request.user_prompt, 
            level=request.level
        )
        
        # Store attempt
        supabase.table("practice_attempts").insert({
            "user_id": user.id,
            "task": request.task,
            "user_prompt": request.user_prompt,
            "feedback_json": feedback
        }).execute()
        
        return PracticeFeedbackResponse(**feedback)
    except Exception as e:
        print(f"Error in practice feedback: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate practice feedback")

@app.get("/news/today", response_model=List[NewsItem])
async def get_today_news(user = Depends(get_current_user)):
    try:
        today = date.today().isoformat()
        res = supabase.table("news_items").select("*").eq("published_date", today).execute()
        
        if res and res.data and len(res.data) > 0:
            return [NewsItem(**item) for item in res.data]

        # Ingestion logic: If no news today, generate some!
        print("Ingesting latest AI news...")
        news_data = await news_client.get_latest_ai_news() 
        # Note: get_latest_ai_news internally calls simplify_news with defaults
        
        ingested_items = []
        for item in news_data.get("news", []):
            # Generate quiz questions for this news item
            content_for_quiz = f"{item['title']}. {item['what_happened']}"
            quiz_data = await news_client.generate_quiz(content_for_quiz)
            
            db_res = supabase.table("news_items").insert({
                "source": item["source"],
                "title": item["title"],
                "url": item["url"],
                "what_happened": item["what_happened"],
                "why_it_matters": item["why_it_matters"],
                "term": item["term"],
                "term_explanation": item["term_explanation"],
                "quiz_json": quiz_data["questions"],
                "published_date": today
            }).execute()
            
            if db_res and db_res.data:
                ingested_items.append(NewsItem(**db_res.data[0]))
        
        return ingested_items
    except Exception as e:
        print(f"Error in get_today_news: {e}")
        return []

@app.post("/news/quiz/submit")
async def submit_news_quiz(request: NewsQuizSubmitRequest, user = Depends(get_current_user)):
    try:
        supabase.table("news_quiz_attempts").insert({
            "user_id": user.id,
            "news_id": request.news_id,
            "score": request.score
        }).execute()
        
        # Award XP for news quiz (e.g., 5 XP)
        profile_res = supabase.table("profiles").select("xp").eq("id", user.id).execute()
        if profile_res and profile_res.data:
            new_xp = profile_res.data[0].get("xp", 0) + 5
            supabase.table("profiles").update({"xp": new_xp}).eq("id", user.id).execute()
            
        return {"status": "success", "xp_earned": 5}
    except Exception as e:
        print(f"Error submitting news quiz: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit news quiz")

@app.get("/exams/final", response_model=Exam)
async def get_final_exam(user = Depends(get_current_user)):
    try:
        print(f"Checking for existing exam for user {user.id}...")
        # Check if an exam already exists
        res = supabase.table("exams").select("*").eq("title", "AI Fundamentals Certification Exam").execute()
        
        if res and res.data:
            print("Found existing exam in database.")
            db_exam = res.data[0]
            questions = [QuizQuestion(**q) for q in db_exam["questions_json"]]
            return Exam(id=db_exam["id"], title=db_exam["title"], description=db_exam["description"], questions=questions)

        # Generate new exam
        print("Starting AI generation for Final Exam (15 questions)...")
        ai_exam = await exam_client.generate_final_exam(
            topics="AI, Machine Learning, Deep Learning, NLP, Computer Vision, Ethics",
            count=15,
            level="Intermediate"
        )
        print(f"AI generation complete. Received {len(ai_exam)} questions.")
        
        insert_res = supabase.table("exams").insert({
            "title": "AI Fundamentals Certification Exam",
            "description": "Comprehensive evaluation of AI principles, from ML to Ethics.",
            "questions_json": ai_exam["questions"]
        }).execute()
        
        if insert_res and insert_res.data:
            print("Successfully inserted exam into Supabase.")
            db_exam = insert_res.data[0]
            questions = [QuizQuestion(**q) for q in db_exam["questions_json"]]
            return Exam(id=db_exam["id"], title=db_exam["title"], description=db_exam["description"], questions=questions)

    except Exception as e:
        print(f"CRITICAL ERROR in get_final_exam: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.post("/exams/submit")
async def submit_exam(request: ExamSubmitRequest, user = Depends(get_current_user)):
    try:
        e_res = supabase.table("exams").select("*").eq("id", request.exam_id).execute()
        if not e_res or not e_res.data:
            raise HTTPException(status_code=404, detail="Exam not found")
        
        exam = e_res.data[0]
        questions = exam["questions_json"]
        
        correct_count = 0
        for i, answer in enumerate(request.answers):
            if i < len(questions) and answer == questions[i]["correct_index"]:
                correct_count += 1
        
        score = int((correct_count / len(questions)) * 100)
        passed = score >= 80

        # Store attempt
        supabase.table("exam_attempts").insert({
            "user_id": user.id,
            "exam_id": request.exam_id,
            "score": score,
            "passed": passed
        }).execute()

        # If passed, issue certificate automatically
        certificate = None
        if passed:
            import string
            import random
            cert_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
            
            c_res = supabase.table("certificates").insert({
                "user_id": user.id,
                "exam_id": request.exam_id,
                "certificate_code": cert_code
            }).execute()
            
            if c_res and c_res.data:
                certificate = c_res.data[0]

        return {
            "score": score,
            "passed": passed,
            "correct_count": correct_count,
            "total_questions": len(questions),
            "certificate": certificate
        }
    except Exception as e:
        print(f"Error submitting exam: {e}")
        raise HTTPException(status_code=500, detail="Failed to process exam submission")

@app.get("/certificates/me", response_model=List[Certificate])
async def get_my_certificates(user = Depends(get_current_user)):
    res = supabase.table("certificates").select("*").eq("user_id", user.id).execute()
    return [Certificate(**c) for c in res.data]

@app.get("/certificates/verify/{code}", response_model=Certificate)
async def verify_certificate(code: str):
    res = supabase.table("certificates").select("*").eq("certificate_code", code).execute()
    if not res or not res.data:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    # Ideally fetch profile to get full_name
    cert = res.data[0]
    try:
        p_res = supabase.table("user_profile").select("full_name").eq("user_id", cert["user_id"]).execute()
        if p_res and p_res.data:
            cert["full_name"] = p_res.data[0].get("full_name") or "Learner"
    except Exception as e:
        print(f"Error fetching profile for certificate: {e}")
        
    return Certificate(**cert)

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Learning App API"}
