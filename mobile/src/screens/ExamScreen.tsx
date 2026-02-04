import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, LightTheme, DarkTheme } from '../theme/tokens';
import { getFinalExam, submitExam } from '../services/api';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const ExamScreen = ({ navigation }: any) => {
    const { isDark } = useTheme();
    const colors = isDark ? DarkTheme : LightTheme;

    const [step, setStep] = useState<'intro' | 'playing' | 'results'>('intro');
    const [exam, setExam] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [result, setResult] = useState<any>(null);

    const startExam = async () => {
        setLoading(true);
        try {
            const data = await getFinalExam();
            // Ensure exactly 50 questions (truncating if we got the requested buffer of 55)
            if (data && data.questions && data.questions.length > 50) {
                data.questions = data.questions.slice(0, 50);
            }
            setExam(data);
            setStep('playing');
            setCurrentIndex(0);
            setAnswers([]);
        } catch (e) {
            Alert.alert("Error", "Could not load the exam. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (optionIndex: number) => {
        const newAnswers = [...answers];
        newAnswers[currentIndex] = optionIndex;
        setAnswers(newAnswers);

        if (currentIndex < exam.questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const submitExamHandler = async () => {
        setLoading(true);
        try {
            // Calculate score locally first
            let correctCount = 0;
            if (exam && exam.questions) {
                exam.questions.forEach((q: any, i: number) => {
                    if (answers[i] === q.correct_index) correctCount++;
                });
            }

            // Avoid division by zero
            const totalQuestions = exam?.questions?.length || 1;
            const score = Math.round((correctCount / totalQuestions) * 100);

            // Call API to persist attempt and generate certificate
            const resultData = await submitExam(score, answers);

            setResult(resultData);
            setStep('results');
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to submit exam.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textLight }]}>Preparing your certification exam...</Text>
            </View>
        );
    }

    if (step === 'intro') {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <ScrollView contentContainerStyle={styles.scroll}>
                    <Ionicons name="trophy-outline" size={80} color={colors.secondary} style={styles.icon} />
                    <Text style={[styles.title, { color: colors.text }]}>AI Fundamentals Certification</Text>
                    <Text style={[styles.desc, { color: colors.textLight }]}>
                        Ready to prove your expertise? This exam covers everything you've learned.
                    </Text>

                    <View style={[styles.rulesBox, { backgroundColor: isDark ? '#1A1E2E' : '#F8F9FF' }]}>
                        <Text style={[styles.ruleTitle, { color: colors.secondary }]}>Examination Rules:</Text>
                        <Text style={[styles.rule, { color: colors.text }]}>• 50 Multiple Choice Questions</Text>
                        <Text style={[styles.rule, { color: colors.text }]}>• 80% score required to pass</Text>
                        <Text style={[styles.rule, { color: colors.text }]}>• No time limit (Take your time!)</Text>
                        <Text style={[styles.rule, { color: colors.text }]}>• Instant certificate issuance upon passing</Text>
                    </View>

                    <TouchableOpacity style={[styles.startButton, { backgroundColor: colors.primary }]} onPress={startExam}>
                        <Text style={styles.startButtonText}>Begin Final Exam</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        );
    }

    if (step === 'playing' && exam) {
        const question = exam.questions[currentIndex];
        const progress = ((currentIndex + 1) / exam.questions.length) * 100;

        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.progressHeader, { borderBottomColor: colors.border }]}>
                    <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                        <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: colors.secondary }]} />
                    </View>
                    <Text style={[styles.progressText, { color: colors.textLight }]}>Question {currentIndex + 1} of {exam.questions.length}</Text>
                </View>

                <View style={styles.questionBox}>
                    <Text style={[styles.questionText, { color: colors.text }]}>{question.question}</Text>

                    {question.options.map((option: string, idx: number) => (
                        <TouchableOpacity
                            key={idx}
                            style={[
                                styles.option,
                                { backgroundColor: isDark ? '#252525' : '#F5F5F5', borderColor: colors.border },
                                answers[currentIndex] === idx && { backgroundColor: colors.primary, borderColor: colors.primary }
                            ]}
                            onPress={() => handleAnswer(idx)}
                        >
                            <Text style={[
                                styles.optionText,
                                { color: colors.text },
                                answers[currentIndex] === idx && styles.selectedOptionText
                            ]}>{option}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={[styles.footer, { borderTopColor: colors.border }]}>
                    <TouchableOpacity
                        disabled={currentIndex === 0}
                        onPress={() => setCurrentIndex(currentIndex - 1)}
                    >
                        <Text style={[styles.navText, { color: colors.primary }, currentIndex === 0 && { color: colors.tabInactive }]}>Previous</Text>
                    </TouchableOpacity>

                    {currentIndex === exam.questions.length - 1 ? (
                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: colors.success }]}
                            onPress={submitExamHandler}
                        >
                            <Text style={styles.submitButtonText}>Finish Exam</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={() => setCurrentIndex(currentIndex + 1)}>
                            <Text style={[styles.navText, { color: colors.primary }]}>Next</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>
        );
    }

    if (step === 'results' && result) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.resultsBox}>
                    <Ionicons
                        name={result.passed ? "checkmark-circle" : "close-circle"}
                        size={100}
                        color={result.passed ? colors.success : colors.error}
                    />
                    <Text style={[styles.resultsTitle, { color: colors.text }]}>
                        {result.passed ? "Congratulations!" : "Keep Practicing"}
                    </Text>
                    <Text style={[styles.scoreText, { color: colors.secondary }]}>You scored {result.score}%</Text>
                    <Text style={[styles.resultsDesc, { color: colors.textLight }]}>
                        {result.passed
                            ? "You have officially passed the AI Fundamentals Certification Exam. Your certificate is ready!"
                            : "You didn't reach the 80% passing threshold this time. Review your lessons and try again!"}
                    </Text>

                    {result.passed && (
                        <TouchableOpacity
                            style={[styles.certButton, { backgroundColor: colors.primary }]}
                            onPress={() => navigation.navigate('Certificate', { code: result.certificate.certificate_code })}
                        >
                            <Text style={styles.certButtonText}>View Certificate</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.retryButton} onPress={() => setStep('intro')}>
                        <Text style={[styles.retryButtonText, { color: colors.primary }]}>{result.passed ? "Take Again" : "Retry Exam"}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return null;
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    scroll: { padding: 30, alignItems: 'center' },
    icon: { marginBottom: 20 },
    title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
    desc: { fontSize: 16, textAlign: 'center', marginBottom: 30, lineHeight: 24 },
    rulesBox: { width: '100%', padding: 20, borderRadius: 16, marginBottom: 40 },
    ruleTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
    rule: { fontSize: 15, marginBottom: 8 },
    startButton: { paddingVertical: 18, paddingHorizontal: 40, borderRadius: 16, width: '100%' },
    startButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
    loadingText: { marginTop: 20, fontSize: 16 },
    progressHeader: { padding: 20, borderBottomWidth: 1 },
    progressBarBg: { height: 8, borderRadius: 4, marginBottom: 10 },
    progressBarFill: { height: 8, borderRadius: 4 },
    progressText: { fontSize: 14, fontWeight: 'bold' },
    questionBox: { flex: 1, padding: 24 },
    questionText: { fontSize: 22, fontWeight: 'bold', marginBottom: 30, lineHeight: 30 },
    option: { padding: 20, borderRadius: 16, marginBottom: 12, borderWidth: 1 },
    optionText: { fontSize: 16 },
    selectedOptionText: { color: 'white', fontWeight: 'bold' },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderTopWidth: 1 },
    navText: { fontSize: 16, fontWeight: 'bold' },
    submitButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
    submitButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    resultsBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    resultsTitle: { fontSize: 28, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
    scoreText: { fontSize: 40, fontWeight: '900', marginBottom: 20 },
    resultsDesc: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 40 },
    certButton: { paddingVertical: 18, borderRadius: 16, width: '100%', marginBottom: 15 },
    certButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
    retryButton: { paddingVertical: 18, width: '100%' },
    retryButtonText: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' }
});
