import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, Platform } from 'react-native';
import { Typography, LightTheme, DarkTheme } from '../theme/tokens';
import { api } from '../services/api';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const NewsScreen = () => {
    const { isDark } = useTheme();
    const colors = isDark ? DarkTheme : LightTheme;

    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNews, setSelectedNews] = useState<any>(null);
    const [quizVisible, setQuizVisible] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);

    const fetchNews = async () => {
        try {
            const data = await api.get('/news/today');
            setNews(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();
    }, []);

    const handleQuizStart = (item: any) => {
        setSelectedNews(item);
        setCurrentQuestionIndex(0);
        setScore(0);
        setQuizVisible(true);
    };

    const handleAnswer = async (index: number) => {
        const isCorrect = index === selectedNews.quiz_json[currentQuestionIndex].correct_index;
        if (isCorrect) setScore(score + 1);

        if (currentQuestionIndex < selectedNews.quiz_json.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            const finalScore = isCorrect ? score + 1 : score;
            const percentage = Math.round((finalScore / selectedNews.quiz_json.length) * 100);

            try {
                await api.post('/news/quiz/submit', {
                    news_id: selectedNews.id,
                    score: percentage
                });
            } catch (e) {
                console.error(e);
            }

            Alert.alert(
                "Quiz Complete!",
                `You scored ${percentage}% and earned +5 XP!`,
                [{ text: "Great!", onPress: () => setQuizVisible(false) }]
            );
        }
    };

    const renderNewsItem = ({ item }: { item: any }) => (
        <View style={[styles.newsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
                <Text style={[styles.sourceText, { color: colors.secondary }]}>{item.source}</Text>
                <Text style={[styles.dateText, { color: colors.textLight }]}>{item.published_date}</Text>
            </View>
            <Text style={[styles.newsTitle, { color: colors.text }]}>{item.title}</Text>

            <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textLight }]}>WHAT HAPPENED</Text>
                <Text style={[styles.sectionText, { color: colors.text }]}>{item.what_happened}</Text>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textLight }]}>WHY IT MATTERS</Text>
                <Text style={[styles.sectionText, { color: colors.text }]}>{item.why_it_matters}</Text>
            </View>

            {item.term && (
                <View style={[styles.termBox, { backgroundColor: isDark ? '#1A1E2E' : '#F0F4FF', borderColor: isDark ? '#2E3A59' : '#D0D9FF' }]}>
                    <View style={styles.termHeader}>
                        <Ionicons name="bulb-outline" size={16} color={colors.secondary} />
                        <Text style={[styles.termTitle, { color: colors.text }]}>Key Term: {item.term}</Text>
                    </View>
                    <Text style={[styles.termDesc, { color: colors.textLight }]}>{item.term_explanation}</Text>
                </View>
            )}

            <TouchableOpacity
                style={[styles.quizButton, { backgroundColor: colors.primary }]}
                onPress={() => handleQuizStart(item)}
            >
                <Ionicons name="help-circle-outline" size={20} color="white" />
                <Text style={styles.quizButtonText}>Quiz Me</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {loading ? (
                <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
            ) : (
                <FlatList
                    style={{ flex: 1 }}
                    data={news}
                    keyExtractor={(item) => item.id}
                    renderItem={renderNewsItem}
                    ListHeaderComponent={
                        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                            <Text style={[Typography.header, { color: colors.text }]}>AI Daily</Text>
                            <Text style={[Typography.caption, { color: colors.textLight }]}>Simplified news & quick quizzes</Text>
                        </View>
                    }
                    contentContainerStyle={styles.list}
                    refreshing={loading}
                    onRefresh={fetchNews}
                />
            )}

            <Modal visible={quizVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>News Quiz</Text>
                            <TouchableOpacity onPress={() => setQuizVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textLight} />
                            </TouchableOpacity>
                        </View>

                        {selectedNews && selectedNews.quiz_json && (
                            <View style={styles.quizBody}>
                                <Text style={[styles.questionCount, { color: colors.primary }]}>
                                    Question {currentQuestionIndex + 1} of {selectedNews.quiz_json.length}
                                </Text>
                                <Text style={[styles.questionText, { color: colors.text }]}>
                                    {selectedNews.quiz_json[currentQuestionIndex].question}
                                </Text>

                                {selectedNews.quiz_json[currentQuestionIndex].options.map((option: string, index: number) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[styles.optionButton, { backgroundColor: isDark ? '#252525' : '#F5F5F5', borderColor: colors.border }]}
                                        onPress={() => handleAnswer(index)}
                                    >
                                        <Text style={[styles.optionText, { color: colors.text }]}>{option}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        borderBottomWidth: 1,
    },
    list: {
        padding: 16,
        paddingBottom: 40,
    },
    newsCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    sourceText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    dateText: {
        fontSize: 12,
    },
    newsTitle: {
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 16,
    },
    section: {
        marginBottom: 12,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 4,
        letterSpacing: 1,
    },
    sectionText: {
        fontSize: 15,
        lineHeight: 22,
    },
    termBox: {
        padding: 12,
        borderRadius: 12,
        marginTop: 8,
        borderWidth: 1,
    },
    termHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    termTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 6,
    },
    termDesc: {
        fontSize: 13,
        lineHeight: 18,
    },
    quizButton: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    quizButtonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        minHeight: '60%',
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    quizBody: {
        flex: 1,
    },
    questionCount: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    questionText: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 24,
        lineHeight: 30,
    },
    optionButton: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '500',
    }
});
