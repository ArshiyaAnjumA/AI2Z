import React, { useCallback, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, LightTheme, DarkTheme } from '../theme/tokens';
import { api } from '../services/api';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../services/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { supabase } from '../services/supabase';
import { Ionicons } from '@expo/vector-icons';

export const LearnScreen = () => {
    const { user } = useAuth();
    const navigation = useNavigation<any>();
    const { isDark } = useTheme();
    const colors = isDark ? DarkTheme : LightTheme;

    const [profile, setProfile] = useState<any>(null);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dailyLesson, setDailyLesson] = useState<any>(null);

    const fetchData = async () => {
        try {
            const data = await api.get('/profile/dashboard');
            setProfile(data.profile);
            setSummary(data.progress);
            setDailyLesson(data.daily_lesson);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const handleLessonStart = () => {
        if (dailyLesson) {
            // @ts-ignore
            navigation.navigate('LessonPlayer', { initialLessonData: dailyLesson });
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    }

    if (loading && !profile) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator color={colors.primary} />
            </View>
        )
    }

    const displayName = profile?.full_name || 'Arshiya'; // Using Arshiya as requested
    const displayLevel = summary?.level || profile?.skill_level || 'Beginner';

    const dailyProgress = summary?.daily_minutes || 0;
    const dailyGoal = 5;
    const progressPercent = Math.min((dailyProgress / dailyGoal) * 100, 100);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.avatarRow}>
                        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]} />
                        <Text style={[Typography.h2, { color: colors.text }]}>Hi, {displayName} 👋</Text>
                    </View>
                    <View style={[styles.levelChip, { backgroundColor: colors.primaryLight }]}>
                        <Text style={[Typography.caption, { color: colors.primaryDark, fontWeight: '600' }]}>{displayLevel}</Text>
                    </View>
                </View>
                <View style={styles.statsRow}>
                    <View style={[styles.statPill, { borderColor: colors.border }]}>
                        <Text style={[Typography.caption, { color: colors.textMedium }]}>🔥 {summary?.streak || 0}</Text>
                    </View>
                    <View style={[styles.statPill, { borderColor: colors.border, marginLeft: 8 }]}>
                        <Text style={[Typography.caption, { color: colors.textMedium }]}>⚡ {summary?.xp || 0} XP</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[Typography.h3, { color: colors.textMedium, marginBottom: 12 }]}>Continue learning</Text>

                {dailyLesson ? (
                    <View style={[styles.lessonCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.cardTop}>
                            <View style={[styles.trackPill, { backgroundColor: colors.primaryLight }]}>
                                <Text style={[Typography.caption, { color: colors.primaryDark, fontWeight: '600' }]}>
                                    {dailyLesson.track.split('_').map((word: string) =>
                                        word === 'ai' ? 'AI' : word.charAt(0).toUpperCase() + word.slice(1)
                                    ).join(' ')} • {dailyLesson.level}
                                </Text>
                            </View>
                            <Text style={[Typography.caption, { color: colors.textLight }]}>⏱ 5 min</Text>
                        </View>

                        <Text style={[Typography.h3, { color: colors.text, marginTop: 12 }]}>{dailyLesson.title}</Text>
                        <Text style={[Typography.bodySmall, { color: colors.textLight, marginTop: 4 }]} numberOfLines={2}>
                            {dailyLesson.explanation}
                        </Text>

                        <TouchableOpacity
                            style={[
                                styles.ctaButton,
                                { backgroundColor: dailyLesson.is_completed ? colors.success : colors.primary }
                            ]}
                            onPress={dailyLesson.is_completed ? undefined : handleLessonStart}
                            disabled={dailyLesson.is_completed}
                        >
                            <Text style={[Typography.buttonText, { color: colors.white }]}>
                                {dailyLesson.is_completed ? "Topic Mastered! 🚀" : "Start lesson"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
                )}

                <TouchableOpacity
                    style={styles.viewAllBtn}
                    onPress={() => navigation.navigate('Tracks')}
                >
                    <Text style={[Typography.body, { color: colors.primaryDark, fontWeight: '600' }]}>View all tracks →</Text>
                </TouchableOpacity>

                {/* Daily Goal Section */}
                <View style={[styles.section, { marginTop: 24 }]}>
                    <Text style={[Typography.h3, { color: colors.textMedium, marginBottom: 12 }]}>Daily goal</Text>
                    <View style={[styles.goalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.goalInfo}>
                            <View>
                                <Text style={[Typography.body, { color: colors.text, fontWeight: '600' }]}>{dailyGoal} minutes</Text>
                                <Text style={[Typography.caption, { color: colors.textLight }]}>{dailyProgress} / {dailyGoal} min</Text>
                            </View>
                            {dailyProgress < dailyGoal && (
                                <TouchableOpacity
                                    style={[styles.smallCta, { backgroundColor: colors.primary }]}
                                    onPress={handleLessonStart}
                                >
                                    <Text style={[Typography.caption, { color: colors.white, fontWeight: '600' }]}>Start now</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <View style={[styles.goalBarBackground, { backgroundColor: colors.border }]}>
                            <View style={[styles.goalBar, { backgroundColor: colors.primary, width: `${progressPercent}%` }]} />
                        </View>
                    </View>
                </View>

                {/* AI Term of the Day */}
                <View style={[styles.section, { marginBottom: 32 }]}>
                    <Text style={[Typography.h3, { color: colors.textMedium, marginBottom: 12 }]}>AI Term of the Day</Text>
                    <View style={[styles.termCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.termHeader}>
                            <Text style={[Typography.body, { color: colors.text, fontWeight: '600' }]}>Overfitting</Text>
                            <TouchableOpacity style={[styles.termBadge, { backgroundColor: colors.primaryLight }]}>
                                <Text style={[Typography.caption, { color: colors.primaryDark, fontSize: 11 }]}>Learn</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={[Typography.caption, { color: colors.textLight, marginTop: 4 }]}>
                            When a model learns the training data too well, including its noise, failing to generalize to new data.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerLeft: {
        flex: 1,
    },
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
    },
    levelChip: {
        alignSelf: 'flex-start',
        paddingVertical: 2,
        paddingHorizontal: 10,
        borderRadius: 999,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statPill: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 40,
    },
    lessonCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        // Subtle shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    trackPill: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 999,
    },
    ctaButton: {
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    viewAllBtn: {
        marginTop: 16,
        alignSelf: 'flex-start',
    },
    section: {
        marginTop: 20,
    },
    goalCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    goalInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    smallCta: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    goalBarBackground: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    goalBar: {
        height: '100%',
        borderRadius: 3,
    },
    practiceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    practiceTile: {
        width: '48%',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
    },
    tileIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    termCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    termHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    termBadge: {
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 999,
    }
});
