import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, LightTheme, DarkTheme } from '../theme/tokens';
import { generateQuiz, submitQuiz } from '../services/api';
import { useTheme } from '../theme/ThemeContext';

export const QuizScreen = ({ route, navigation }: any) => {
    const { isDark } = useTheme();
    const colors = isDark ? DarkTheme : LightTheme;
    const { lessonId } = route.params;
    const [quiz, setQuiz] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);

    useEffect(() => {
        fetchQuiz();
    }, []);

    const fetchQuiz = async () => {
        try {
            const data = await generateQuiz(lessonId);
            setQuiz(data);
            setAnswers(new Array(data.questions.length).fill(-1));
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to generate quiz', [
                {
                    text: 'OK',
                    onPress: () => navigation.navigate('MainTabs')
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectOption = (index: number) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = index;
        setAnswers(newAnswers);
    };

    const handleNext = () => {
        if (answers[currentQuestionIndex] === -1) {
            Alert.alert('Selection Required', 'Please select an option before continuing.');
            return;
        }

        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            submitQuizHandler();
        }
    };

    const submitQuizHandler = async () => {
        setLoading(true);
        try {
            const result = await submitQuiz(quiz.id, 100, answers); // Simplified score logic
            // Note: submitQuiz in api.ts calculates score roughly or accepts it. 
            // We should calculate score here properly if needed.

            // Calculate score for display
            let correctCount = 0;
            const feedback = quiz.questions.map((q: any, i: number) => {
                const isCorrect = answers[i] === q.correct_index;
                if (isCorrect) correctCount++;
                return {
                    question: q.question,
                    correct: isCorrect,
                    correct_index: q.correct_index,
                    explanation: q.explanation || "No explanation provided."
                };
            });
            const scoreVal = Math.round((correctCount / quiz.questions.length) * 100);

            // Submit with actual score to record attempt
            const { xp_earned } = await submitQuiz(quiz.id, scoreVal, answers);

            const resultData = {
                score: scoreVal,
                xp_earned: xp_earned || (scoreVal >= 70 ? 10 : 2),
                feedback: feedback
            };

            navigation.replace('QuizResults', { result: resultData, questions: quiz.questions, answers });
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to submit quiz');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !quiz) {
        return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;
    }

    if (!quiz) {
        return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const progress = (currentQuestionIndex + 1) / quiz.questions.length;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.progressBarContainer, { backgroundColor: isDark ? '#333' : '#E5E5E5' }]}>
                <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
            </View>

            <View style={styles.header}>
                <Text style={[styles.questionCount, { color: colors.textLight }]}>
                    Question {currentQuestionIndex + 1} of {quiz.questions.length}
                </Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={[Typography.subheader, { color: colors.text }]}>{currentQuestion.question}</Text>

                <View style={styles.optionsContainer}>
                    {currentQuestion.options.map((option: string, index: number) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.optionButton,
                                { backgroundColor: colors.card, borderColor: colors.border },
                                answers[currentQuestionIndex] === index && { borderColor: colors.primary, backgroundColor: isDark ? '#1A2F42' : '#F0F7FF' }
                            ]}
                            onPress={() => handleSelectOption(index)}
                        >
                            <Text style={[
                                styles.optionText,
                                { color: colors.text },
                                answers[currentQuestionIndex] === index && { color: colors.primary, fontWeight: 'bold' }
                            ]}>
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }, loading && { opacity: 0.5 }]}
                    onPress={handleNext}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.buttonText}>
                            {currentQuestionIndex === quiz.questions.length - 1 ? 'Finish Quiz' : 'Continue'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    progressBarContainer: { height: 6 },
    progressBarFill: { height: '100%' },
    header: { padding: 20 },
    questionCount: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
    scrollContent: { padding: 20 },
    optionsContainer: { marginTop: 30 },
    optionButton: { padding: 20, borderRadius: 16, marginBottom: 12, borderWidth: 2 },
    optionText: { fontSize: 16 },
    footer: { padding: 20, borderTopWidth: 1 },
    button: { padding: 18, borderRadius: 16, alignItems: 'center' },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 18 }
});
