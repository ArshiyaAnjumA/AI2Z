import { supabase } from './supabase';
import { getTodayString, formatToLocalDate } from '../utils/dateUtils';

// --- Profile & Stats ---

export const getProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) throw error;
    return data;
};

export const updateProfile = async (updates: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

    // specific handling: if no stats, return default (or let UI handle it)
    if (error && error.code === 'PGRST116') { // Not found
        return { xp_total: 0, streak_days: 0, lessons_completed: 0, quizzes_completed: 0 };
    }
    if (error) throw error;
    return data;
};

export const getBadges = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id);

    if (error) throw error;
    return data;
};

export const getDashboardSummary = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');

    const profile = await getProfile();
    const stats = await getStats();
    // Fetch daily lesson with personalized progression
    const today = getTodayString();
    let daily_lesson = null;

    // 1. Check if user completed a lesson today (one-per-day limit)
    // We check from yesterday local time to catch sessions that might have rolled over into UTC "tomorrow"
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatToLocalDate(yesterday);

    const { data: todaysAttempt } = await supabase
        .from('lesson_attempts')
        .select('*, lessons(*, tracks(title))')
        .eq('user_id', user.id)
        .gte('completed_at', yesterdayStr)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (todaysAttempt && todaysAttempt.lessons) {
        const lesson = Array.isArray(todaysAttempt.lessons) ? todaysAttempt.lessons[0] : todaysAttempt.lessons;
        if (lesson) {
            const trackObj = Array.isArray((lesson as any).tracks) ? (lesson as any).tracks[0] : (lesson as any).tracks;
            daily_lesson = {
                ...lesson,
                track: trackObj?.title || 'General',
                is_completed: true
            };
        }
    } else {
        // 2. No lesson today - Find the next uncompleted lesson
        // Get the order_index of the highest completed lesson
        const { data: lastCompleted } = await supabase
            .from('lesson_attempts')
            .select('lesson_id, lessons(order_index)')
            .eq('user_id', user.id)
            .order('lessons(order_index)', { ascending: false })
            .limit(1)
            .maybeSingle();

        const lastIndex = (lastCompleted as any)?.lessons?.order_index ?? -1;

        // Fetch the first lesson with a higher order_index
        let { data: nextLesson } = await supabase
            .from('lessons')
            .select('*, tracks(title)')
            .gt('order_index', lastIndex)
            .order('order_index', { ascending: true })
            .limit(1)
            .maybeSingle();

        // 3. If no next lesson found, they might have finished everything -> Trigger AI Generation
        if (!nextLesson) {
            // Get the last lesson overall to base AI generation on
            const { data: lastOverallLesson } = await supabase
                .from('lessons')
                .select('*, tracks(title)')
                .order('order_index', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (lastOverallLesson) {
                try {
                    console.log("All lessons completed. Generating new lesson with AI...");
                    await autoGenerateNextLesson(lastOverallLesson);

                    // Fetch the newly generated lesson
                    const { data: newLesson } = await supabase
                        .from('lessons')
                        .select('*, tracks(title)')
                        .gt('order_index', lastOverallLesson.order_index)
                        .limit(1)
                        .maybeSingle();

                    nextLesson = newLesson;
                } catch (err) {
                    console.warn("AI Generation failed:", err);
                }
            }
        }

        if (nextLesson) {
            daily_lesson = {
                ...nextLesson,
                track: (nextLesson as any).tracks?.title || 'General',
                is_completed: false
            };
        }
    }

    return {
        profile,
        progress: {
            xp: stats.xp_total || 0,
            streak: stats.streak_days || 0,
            level: profile.skill_level || 'Beginner',
            completed_lessons: stats.lessons_completed || 0,
            daily_minutes: stats.daily_minutes || 0,
            last_activity_date: stats.last_activity_date
        },
        daily_lesson
    };
};

// --- Learning Content ---

export const getTracks = async () => {
    // Fetch tracks and their lessons, ordered
    const { data, error } = await supabase
        .from('tracks')
        .select('*, lessons(*)')
        .order('order_index', { ascending: true });

    if (error) throw error;

    // Sort lessons within tracks in JS
    if (data) {
        data.forEach((track: any) => {
            if (track.lessons) {
                track.lessons.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
            }
        });
    }
    return data;
};

export const getLessonsForTrack = async (trackId: string) => {
    const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('track_id', trackId)
        .order('order_index', { ascending: true });

    if (error) throw error;
    return data;
};

export const getLesson = async (lessonId: string) => {
    const { data, error } = await supabase
        .from('lessons')
        // Get track title too
        .select('*, tracks(title)')
        .eq('id', lessonId)
        .single();

    if (error) throw error;

    // Flatten track title for UI
    if (data) {
        data.track = data.tracks?.title || 'General';
    }
    return data;
};

export const completeLesson = async (lessonId: string, score: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
        .from('lesson_attempts')
        .insert({
            user_id: user.id,
            lesson_id: lessonId,
            score: score
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

// --- AI Functions (Edge Functions) ---

// Auto-generate next lesson
export const autoGenerateNextLesson = async (currentLesson: any) => {
    // Fire and forget logic usually, but here we define the async function
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return; // Silent fail if no session

    try {
        // 1. Get previous titles in this track
        const { data: existingLessons } = await supabase
            .from('lessons')
            .select('title')
            .eq('track_id', currentLesson.track_id);

        const previousTitles = existingLessons?.map(l => l.title) || [];

        // 2. Determine prompt/topic
        // We ask the AI to generate the next logical step
        const nextTopicPrompt = `Next concept after ${currentLesson.title} in ${currentLesson.track || 'General'}`;

        // 3. Call Edge Function
        const { data, error } = await supabase.functions.invoke('generate-lesson', {
            body: {
                topic: nextTopicPrompt,
                level: currentLesson.level || 'Beginner',
                previous_titles: previousTitles
            },
            headers: {
                Authorization: `Bearer ${session.access_token}`
            }
        });

        if (error) throw error;
        if (!data) throw new Error("No data returned from AI");

        // 4. Save to DB
        // Find max order_index
        const { data: maxOrder } = await supabase
            .from('lessons')
            .select('order_index')
            .eq('track_id', currentLesson.track_id)
            .order('order_index', { ascending: false })
            .limit(1)
            .single();

        const nextIndex = (maxOrder?.order_index || 0) + 1;

        await supabase.from('lessons').insert({
            track_id: currentLesson.track_id,
            title: data.title,
            topic: data.topic || currentLesson.track, // Fallback
            explanation: data.explanation,
            analogy: data.analogy,
            key_takeaway: data.key_takeaway,
            level: currentLesson.level || 'Beginner',
            order_index: nextIndex
        });

        console.log("Successfully auto-generated next lesson:", data.title);

    } catch (e) {
        console.warn("Auto-generation failed:", e);
    }
};

export const generateQuiz = async (lessonId: string) => {
    // 1. Check cache mechanism
    const { data: existingQuiz } = await supabase
        .from('quizzes')
        .select('*')
        .eq('lesson_id', lessonId)
        .single();

    if (existingQuiz) {
        return {
            id: existingQuiz.id,
            lesson_id: existingQuiz.lesson_id,
            questions: existingQuiz.questions_json
        };
    }

    // 2. Not found, fetch lesson text
    const lesson = await getLesson(lessonId);
    if (!lesson) throw new Error('Lesson not found');

    const lessonText = `${lesson.title}\n\n${lesson.content?.explanation || lesson.explanation}\n\n${lesson.content?.key_takeaway || lesson.key_takeaway}`;
    const level = 'Beginner';

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No user logged in');

    // 3. Call Edge Function
    const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { lesson_text: lessonText, level },
        headers: {
            Authorization: `Bearer ${session.access_token}`
        }
    });

    if (error) throw error;

    // 4. Save to Cache
    const { data: savedQuiz, error: saveError } = await supabase
        .from('quizzes')
        .insert({
            lesson_id: lessonId,
            questions_json: data,
            title: `Quiz: ${lesson.title}`
            // Add other fields if schema requires, e.g. prompt?
        })
        .select()
        .single();

    if (saveError) {
        console.warn("Failed to cache quiz:", saveError);
        // Return generated data anyway
        return {
            id: 'generated-quiz',
            lesson_id: lessonId,
            questions: data
        };
    }

    return {
        id: savedQuiz.id,
        lesson_id: savedQuiz.lesson_id,
        questions: savedQuiz.questions_json
    };
};

export const submitQuiz = async (quizId: string, score: number, answers: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
        .from('quiz_attempts')
        .insert({
            user_id: user.id,
            quiz_id: quizId !== 'generated-quiz' ? quizId : null,
            score: score,
            answers_json: answers
        });

    if (error) {
        console.warn("Quiz submission error:", error);
    }

    return { status: 'success', xp_earned: score >= 70 ? 10 : 2 };
};

export const getPracticeFeedback = async (task: string, userPrompt: string, level: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No user logged in');

    const { data, error } = await supabase.functions.invoke('practice-feedback', {
        body: { task, user_prompt: userPrompt, level },
        headers: {
            Authorization: `Bearer ${session.access_token}`
        }
    });
    if (error) throw error;
    return data;
};

export const getFinalExam = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No user logged in');

    const { data, error } = await supabase.functions.invoke('generate-final-exam', {
        body: {
            topics: "AI Basics, Machine Learning, Neural Networks, Ethics",
            count: 55, // Request buffer to ensure we get at least 50
            level: "Beginner"
        },
        headers: {
            Authorization: `Bearer ${session.access_token}`
        }
    });

    if (error) throw error;
    return {
        id: 'final-exam-gen',
        title: 'AI Fundamentals Certification Exam',
        questions: data
    };
};

export const submitExam = async (score: number, answers: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');

    // 1. Get Exam ID (Assuming single main exam for now)
    const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('id, passing_score')
        .eq('title', 'AI Fundamentals Certification Exam')
        .single();

    // Fallback if exam doesn't exist (DB not seeded), use dummy or handle error
    const examId = examData?.id || null;
    const passingScore = examData?.passing_score || 80;
    const passed = score >= passingScore;

    // 2. Record Attempt
    if (examId) {
        await supabase.from('exam_attempts').insert({
            user_id: user.id,
            exam_id: examId,
            score,
            passed,
            answers
        });
    }

    // 3. Issue Certificate if Passed
    let certificate = null;
    if (passed) {
        // Check if already exists?
        const { data: existingCert } = await supabase
            .from('user_certificates')
            .select('*')
            .eq('user_id', user.id)
            .eq('exam_id', examId) // Might be null if examId null
            .maybeSingle(); // Use maybeSingle to avoid error if multiple (shouldn't happen but safe)

        if (existingCert) {
            certificate = existingCert;
        } else {
            const code = 'CERT-' + Math.random().toString(36).substring(2, 10).toUpperCase();
            const { data: newCert, error: certError } = await supabase
                .from('user_certificates')
                .insert({
                    user_id: user.id,
                    exam_id: examId,
                    certificate_code: code,
                    certificate_url: `https://ailearn.app/verify/${code}` // Dummy URL
                })
                .select()
                .single();

            if (!certError) certificate = newCert;
        }
    }

    return {
        passed,
        score,
        certificate
    };
};


// --- Term of Day ---
export const getTermOfDay = async () => {
    try {
        const { data, error } = await supabase
            .from('ai_terms')
            .select('*');

        if (error) {
            console.warn("Term of Day Error:", error);
            return null;
        }

        if (data && data.length > 0) {
            const randomTerm = data[Math.floor(Math.random() * data.length)];
            return randomTerm;
        }
    } catch (err) {
        console.warn("Term of Day Exception:", err);
    }
    return null;
};

// --- Certificates ---

export const getCertificates = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
        .from('user_certificates')
        .select('*, exams!exam_id(title)') // Explicit FK hint
        .eq('user_id', user.id);

    if (error) throw error;
    return data;
};

export const getCertificate = async (certificateId: string) => {
    const { data, error } = await supabase
        .from('user_certificates')
        .select('*, exams!exam_id(title)')
        .eq('id', certificateId)
        .single();

    if (error) throw error;
    return data;
};


// Generate daily AI news using Supabase Edge Function
export const generateDailyNews = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;

        console.log("Generating daily AI news via Edge Function...");

        // Call Edge Function
        const { data: newsContent, error: funcError } = await supabase.functions.invoke('generate-daily-news-v2', {
            headers: {
                Authorization: `Bearer ${session.access_token}`
            }
        });

        if (funcError) throw funcError;
        if (!newsContent) throw new Error("No news content returned");

        // Save to database with today's date (Local Time)
        const today = getTodayString();
        const { data: savedNews, error: saveError } = await supabase
            .from('news_items')
            .insert({
                title: newsContent.title,
                source: newsContent.source || 'AI Daily',
                what_happened: newsContent.what_happened,
                why_it_matters: newsContent.why_it_matters,
                term: newsContent.term,
                term_explanation: newsContent.term_explanation,
                quiz_json: newsContent.quiz,
                published_date: today
            })
            .select()
            .single();

        if (saveError) {
            console.error("Error saving news:", saveError);
            return null;
        }

        console.log("Successfully generated daily news:", savedNews.title);
        return savedNews;
    } catch (err) {
        console.error("Failed to generate daily news:", err);
    }
    return null;
};

// In-memory lock to prevent race conditions during news generation
let isGeneratingNews = false;

export const getNews = async () => {
    // Calculate 7 days ago (Local Date)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = formatToLocalDate(sevenDaysAgo);

    // Fetch recent news (last 7 days only)
    const { data, error } = await supabase
        .from('news_items')
        .select('*')
        .gte('published_date', sevenDaysAgoStr) // Reverted from published_at
        .order('published_date', { ascending: false }); // Reverted from published_at

    if (error) throw error;

    // Check if news exists for today (Local Time)
    const today = getTodayString();
    const hasNewsToday = data?.some(item => item.published_date === today); // Reverted logic to match published_date

    // If no news for today and not already generating, generate it
    if (!hasNewsToday && !isGeneratingNews) {
        isGeneratingNews = true;
        console.log("No news for today. Generating new article...");
        try {
            const newNews = await generateDailyNews();

            if (newNews) {
                // Re-fetch to include the new news
                const { data: updatedData } = await supabase
                    .from('news_items')
                    .select('*')
                    .gte('published_date', sevenDaysAgoStr) // Reverted from published_at
                    .order('published_date', { ascending: false }); // Reverted from published_at

                return updatedData || data;
            }
        } finally {
            isGeneratingNews = false;
        }
    }

    return data;
};



export const submitNewsQuiz = async (newsId: string, score: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');

    // Insert attempt
    const { data, error } = await supabase
        .from('news_quiz_attempts')
        .insert({
            user_id: user.id,
            news_id: newsId, // Table column is news_id
            score: score
        })
        .select()
        .single();

    if (error) {
        console.warn("News quiz submission error:", error);
        // Don't throw if just scoring
        return { success: false };
    }

    // Trigger automatically awards XP via DB trigger 'handle_news_quiz_completion'
    // We can assume +5 XP
    return { success: true, xp_earned: 5 };
};

// --- Legacy API Compat (Optional) ---
export const api = {
    get: async (path: string) => {
        if (path === '/profile/me') return getProfile();
        if (path === '/profile/stats') return getStats();
        if (path === '/profile/badges') return getBadges();
        if (path === '/profile/dashboard') return getDashboardSummary();

        // Handle /tracks/{id}/lessons
        const trackLessonsMatch = path.match(/^\/tracks\/([a-zA-Z0-9-]+)\/lessons$/);
        if (trackLessonsMatch) {
            return getLessonsForTrack(trackLessonsMatch[1]);
        }

        if (path.startsWith('/tracks')) {
            return getTracks();
        }
        if (path === '/quizzes') return [{ id: 1, title: 'Daily Quiz' }];
        throw new Error(`Unimplemented GET path: ${path}`);
    },
    post: async (path: string, body: any) => {
        if (path === '/quizzes/generate') return generateQuiz(body.lesson_id);
        if (path === '/practice/feedback') return getPracticeFeedback(body.task, body.user_prompt, body.level);
        // ...
        throw new Error(`Unimplemented POST path: ${path}`);
    },
    patch: async (path: string, body: any) => {
        if (path === '/profile/me') return updateProfile(body);
        throw new Error(`Unimplemented PATCH path: ${path}`);
    }
};
