import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, LightTheme, DarkTheme } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

export const TrackDetailScreen = ({ route, navigation }: any) => {
    const { trackId, trackName } = route.params;
    const { isDark } = useTheme();
    const colors = isDark ? DarkTheme : LightTheme;

    const [lessons, setLessons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLessons();
    }, [trackId]);

    const fetchLessons = async () => {
        try {
            const data = await api.get(`/tracks/${trackId}/lessons`);
            setLessons(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleLessonClick = (lesson: any) => {
        navigation.navigate('LessonPlayer', { initialLessonData: lesson });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[Typography.h2, { color: colors.text }]}>{trackName}</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {lessons.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={[Typography.body, { color: colors.textLight, textAlign: 'center' }]}>
                                No lessons available for this track yet.
                            </Text>
                        </View>
                    ) : (
                        <>
                            {lessons.map((lesson, index) => {
                                const isLocked = lesson.is_locked;
                                const isCompleted = lesson.is_completed;

                                return (
                                    <TouchableOpacity
                                        key={lesson.id}
                                        style={[
                                            styles.lessonCard,
                                            {
                                                backgroundColor: isLocked ? colors.background : colors.card,
                                                borderColor: colors.border,
                                                opacity: isLocked ? 0.6 : 1
                                            }
                                        ]}
                                        onPress={() => !isLocked && handleLessonClick(lesson)}
                                        disabled={isLocked}
                                    >
                                        <View style={styles.lessonInfo}>
                                            <Text style={[Typography.caption, { color: colors.textLight, marginBottom: 4 }]}>
                                                Lesson {index + 1} • {lesson.level}
                                            </Text>
                                            <Text style={[Typography.h3, { color: colors.text }]}>
                                                {lesson.title} {isLocked && '🔒'} {isCompleted && '✅'}
                                            </Text>
                                            {!isLocked && (
                                                <Text style={[Typography.bodySmall, { color: colors.textLight, marginTop: 4 }]} numberOfLines={2}>
                                                    {lesson.explanation}
                                                </Text>
                                            )}
                                        </View>
                                        <Ionicons
                                            name={isLocked ? "lock-closed" : (isCompleted ? "checkmark-circle" : "play-circle")}
                                            size={32}
                                            color={isLocked ? colors.textLight : (isCompleted ? colors.success : colors.primary)}
                                        />
                                    </TouchableOpacity>
                                );
                            })}

                            <View key="coming-soon" style={[styles.comingSoonCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                <Ionicons name="sparkles" size={24} color={colors.primary} style={{ marginBottom: 8 }} />
                                <Text style={[Typography.h3, { color: colors.textMedium, textAlign: 'center' }]}>Infinite Learning</Text>
                                <Text style={[Typography.body, { color: colors.textLight, textAlign: 'center', marginTop: 4 }]}>
                                    More lessons will unlock as soon as you finish the current ones!
                                </Text>
                            </View>
                        </>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 16,
    },
    lessonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    lessonInfo: {
        flex: 1,
        marginRight: 12,
    },
    emptyState: {
        padding: 32,
        alignItems: 'center',
    },
    comingSoonCard: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 12,
        borderStyle: 'dashed',
        marginTop: 12,
        opacity: 0.7,
    }
});
