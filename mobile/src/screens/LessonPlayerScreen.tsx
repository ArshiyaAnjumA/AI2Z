import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ProgressBarAndroid, ActivityIndicator, ScrollView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, LightTheme, DarkTheme } from '../theme/tokens';
import { Lesson } from '../types/lesson';
import { getLesson, completeLesson } from '../services/api';
import { useTheme } from '../theme/ThemeContext';

// Props would typically come from Navigation Params
export const LessonPlayerScreen = ({ route, navigation }: any) => {
    const { isDark } = useTheme();
    const colors = isDark ? DarkTheme : LightTheme;

    const { lessonId, initialLessonData } = route.params || {};
    const [lesson, setLesson] = useState<Lesson | null>(initialLessonData || null);
    const [loading, setLoading] = useState(!initialLessonData);
    const [currentPage, setCurrentPage] = useState(0);

    // Pages structure:
    // 0: Intro (Topic + Title)
    // 1: Explanation
    // 2: Analogy
    // 3: Key Takeaway + Complete
    const TOTAL_PAGES = 4;

    React.useEffect(() => {
        if (!lesson && lessonId) {
            fetchLesson();
        }
    }, [lessonId]);

    const fetchLesson = async () => {
        try {
            const data = await getLesson(lessonId);
            setLesson(data);
        } catch (e) {
            console.error(e);
            // alert('Failed to load lesson');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (currentPage < TOTAL_PAGES - 1) {
            setCurrentPage(currentPage + 1);
        } else {
            // Finish
            handleComplete();
        }
    };

    const handleComplete = async () => {
        if (lesson) {
            try {
                // Call completeLesson directly (Database Trigger handles XP/Streak)
                await completeLesson(lesson.id, 100);

                // Check if this is a placeholder lesson (quiz won't exist for it)
                if (lesson.id === '00000000-0000-0000-0000-000000000000') {
                    // Skip quiz for placeholder lessons, return to main tabs
                    navigation.navigate('MainTabs');
                    return;
                }

                // TRIGGER AUTO-GENERATION (Fire and Forget)
                // We import and call this here so it runs while user takes the quiz
                const { autoGenerateNextLesson } = require('../services/api');
                autoGenerateNextLesson(lesson).catch((err: any) => console.warn("Background Gen Error:", err));

                navigation.navigate('Quiz', { lessonId: lesson.id });
            } catch (e) {
                console.error(e);
                // Navigate to main tabs on error instead of goBack
                navigation.navigate('MainTabs');
            }
        }
    };

    if (loading) {
        return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;
    }

    if (!lesson) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <Text style={[Typography.subheader, { color: colors.text }]}>Lesson not found.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                    <Text style={{ color: colors.primary }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const renderContent = () => {
        switch (currentPage) {
            case 0:
                return (
                    <View style={styles.pageContent}>
                        <Text style={[Typography.caption, { fontSize: 14, textTransform: 'uppercase', color: colors.primary }]}>
                            {lesson.track.replace('_', ' ')} • {lesson.level}
                        </Text>
                        <Text style={[Typography.header, { marginTop: 10, color: colors.text }]}>{lesson.title}</Text>
                        <Text style={[Typography.subheader, { marginTop: 20, color: colors.textLight }]}>Topic: {lesson.topic}</Text>
                    </View>
                );
            case 1:
                return (
                    <View style={styles.pageContent}>
                        <Text style={[Typography.subheader, { color: colors.text }]}>Making Sense of it</Text>
                        <Text style={[Typography.body, { marginTop: 20, lineHeight: 28, color: colors.text }]}>{lesson.explanation}</Text>
                    </View>
                );
            case 2:
                return (
                    <View style={styles.pageContent}>
                        <Text style={[Typography.subheader, { color: colors.text }]}>Think of it like...</Text>
                        <View style={[styles.analogyBox, { backgroundColor: isDark ? '#1C3236' : '#E0F7FA', borderLeftColor: colors.primary }]}>
                            <Text style={[Typography.body, { fontStyle: 'italic', color: colors.text }]}>"{lesson.analogy}"</Text>
                        </View>
                    </View>
                );
            case 3:
                return (
                    <View style={styles.pageContent}>
                        <Text style={[Typography.subheader, { color: colors.text }]}>Key Takeaway</Text>
                        <Text style={[Typography.header, { marginTop: 20, color: colors.primary }]}>{lesson.key_takeaway}</Text>
                        <View style={{ marginTop: 40 }}>
                            <Text style={[Typography.body, { color: colors.text }]}>Ready to test your knowledge?</Text>
                        </View>
                    </View>
                );
            default: return null;
        }
    };

    const progress = (currentPage + 1) / TOTAL_PAGES;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.progressBarContainer, { backgroundColor: isDark ? '#333' : '#E5E5E5' }]}>
                <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
            </View>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={{ fontSize: 24, color: colors.textLight }}>×</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                {renderContent()}
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleNext}>
                    <Text style={styles.buttonText}>
                        {currentPage === TOTAL_PAGES - 1 ? 'Finish Lesson' : 'Continue'}
                    </Text>
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    progressBarContainer: { height: 6, width: '100%' },
    progressBarFill: { height: '100%' },
    header: { padding: 16, alignItems: 'flex-start' },
    pageContent: { padding: 24, flex: 1, justifyContent: 'center' },
    analogyBox: { marginTop: 20, padding: 20, borderRadius: 12, borderLeftWidth: 4 },
    footer: { padding: 20, borderTopWidth: 1 },
    button: { padding: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 18, textTransform: 'uppercase' }
});
