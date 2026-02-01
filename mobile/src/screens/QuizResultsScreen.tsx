import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, LightTheme, DarkTheme } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';

export const QuizResultsScreen = ({ route, navigation }: any) => {
    const { isDark } = useTheme();
    const colors = isDark ? DarkTheme : LightTheme;
    const { result, questions, answers } = route.params;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Quiz Results</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.scoreCard, { backgroundColor: colors.primary }]}>
                    <Text style={styles.scoreText}>{result.score}%</Text>
                    <Text style={styles.xpText}>+{result.xp_earned} XP earned</Text>
                </View>

                <Text style={[Typography.subheader, { marginTop: 30, marginBottom: 15, color: colors.text }]}>Question Review</Text>

                {result.feedback.map((item: any, index: number) => (
                    <View key={index} style={[styles.feedbackItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.questionHeader}>
                            <Text style={[styles.questionIndex, { color: colors.textLight }]}>Q{index + 1}</Text>
                            <View style={[
                                styles.statusBadge,
                                { backgroundColor: item.correct ? (isDark ? '#1B3921' : '#E8F5E9') : (isDark ? '#442726' : '#FFEBEE') }
                            ]}>
                                <Text style={{ color: item.correct ? (isDark ? '#81C784' : '#2E7D32') : (isDark ? '#E57373' : '#C62828'), fontWeight: 'bold', fontSize: 12 }}>
                                    {item.correct ? 'CORRECT' : 'INCORRECT'}
                                </Text>
                            </View>
                        </View>

                        <Text style={[styles.questionText, { color: colors.text }]}>{questions[index].question}</Text>

                        {!item.correct && (
                            <View style={[styles.answerBox, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]}>
                                <Text style={[styles.label, { color: colors.textLight }]}>Your Answer: <Text style={{ fontWeight: 'normal', color: colors.text }}>{questions[index].options[answers[index]]}</Text></Text>
                                <Text style={[styles.label, { marginTop: 5, color: colors.textLight }]}>Correct Answer: <Text style={{ fontWeight: 'normal', color: isDark ? '#81C784' : '#2E7D32' }}>{questions[index].options[item.correct_index]}</Text></Text>
                            </View>
                        )}

                        <Text style={[styles.explanationText, { color: colors.textLight }]}>
                            <Text style={{ fontWeight: 'bold' }}>Tip: </Text>{item.explanation}
                        </Text>
                    </View>
                ))}
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('MainTabs')}>
                    <Text style={styles.buttonText}>Return to Home</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold' },
    content: { padding: 20 },
    scoreCard: { padding: 40, borderRadius: 24, alignItems: 'center' },
    scoreText: { fontSize: 64, fontWeight: 'bold', color: 'white' },
    xpText: { fontSize: 18, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
    feedbackItem: { padding: 20, borderRadius: 16, marginBottom: 15, borderWidth: 1 },
    questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    questionIndex: { fontSize: 14, fontWeight: 'bold' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    questionText: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
    answerBox: { padding: 12, borderRadius: 8, marginBottom: 10 },
    label: { fontSize: 14, fontWeight: 'bold' },
    explanationText: { fontSize: 14, lineHeight: 20 },
    footer: { padding: 20, borderTopWidth: 1 },
    button: { padding: 18, borderRadius: 16, alignItems: 'center' },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 18 }
});
