import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, LightTheme, DarkTheme } from '../theme/tokens';
import { api } from '../services/api';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const TASKS = [
    { id: 'summarize', label: 'Summarize', icon: 'document-text-outline' },
    { id: 'extract', label: 'Extract Key Points', icon: 'list-outline' },
    { id: 'email', label: 'Write Email', icon: 'mail-outline' },
    { id: 'sql', label: 'Create SQL', icon: 'server-outline' },
];

export const PracticeScreen = () => {
    const { isDark } = useTheme();
    const colors = isDark ? DarkTheme : LightTheme;

    const [selectedTask, setSelectedTask] = useState(TASKS[0]);
    const [userPrompt, setUserPrompt] = useState("");
    const [feedback, setFeedback] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!userPrompt.trim()) return;
        setLoading(true);
        try {
            const data = await api.post('/practice/feedback', {
                task: selectedTask.label,
                user_prompt: userPrompt,
                level: 'beginner'
            });
            setFeedback(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={[Typography.header, { color: colors.text }]}>AI Playground</Text>
                <Text style={[Typography.caption, { marginBottom: 20, color: colors.textLight }]}>Master prompt engineering through practice</Text>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Choose a Task</Text>
                <View style={styles.taskGrid}>
                    {TASKS.map(task => (
                        <TouchableOpacity
                            key={task.id}
                            style={[
                                styles.taskChip,
                                { backgroundColor: colors.card, borderColor: colors.border },
                                selectedTask.id === task.id && { backgroundColor: colors.primary, borderColor: colors.primary }
                            ]}
                            onPress={() => setSelectedTask(task)}
                        >
                            <Ionicons
                                name={task.icon as any}
                                size={20}
                                color={selectedTask.id === task.id ? 'white' : colors.textLight}
                            />
                            <Text style={[styles.taskChipLabel, { color: colors.textLight }, selectedTask.id === task.id && { color: 'white' }]}>
                                {task.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Write your Prompt</Text>
                <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        multiline
                        placeholder={`Write a prompt to ${selectedTask.label.toLowerCase()}...`}
                        placeholderTextColor={colors.textLight}
                        value={userPrompt}
                        onChangeText={setUserPrompt}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }, (!userPrompt.trim() || loading) && { opacity: 0.5 }]}
                    onPress={handleSubmit}
                    disabled={!userPrompt.trim() || loading}
                >
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Get Prompt Feedback</Text>}
                </TouchableOpacity>

                {feedback && (
                    <View style={styles.feedbackContainer}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Feedback</Text>

                        <View style={styles.feedbackSection}>
                            <Text style={[styles.feedbackSub, { color: colors.textLight }]}>{`🌟 Strengths`}</Text>
                            {feedback.strengths.map((s: string, i: number) => (
                                <View key={i} style={styles.badgeWrapper}>
                                    <View style={[styles.badge, { backgroundColor: isDark ? '#1B2E1E' : '#E8F5E9' }]}>
                                        <Text style={[styles.badgeText, { color: isDark ? '#81C784' : '#2E7D32' }]}>{s}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        <View style={styles.feedbackSection}>
                            <Text style={[styles.feedbackSub, { color: colors.textLight }]}>{`🚀 Improvements`}</Text>
                            {feedback.improvements.map((im: string, i: number) => (
                                <View key={i} style={styles.badgeWrapper}>
                                    <View style={[styles.badge, { backgroundColor: isDark ? '#2E1E12' : '#FFF3E0' }]}>
                                        <Text style={[styles.badgeText, { color: isDark ? '#FFB74D' : '#E65100' }]}>{im}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        <View style={[styles.improvedCard, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
                            <Text style={[styles.label, { color: colors.textLight }]}>Try this instead:</Text>
                            <Text style={[styles.improvedText, { color: colors.text }]}>{feedback.improved_prompt}</Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scroll: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        marginTop: 10,
    },
    taskGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    taskChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 10,
        marginBottom: 10,
    },
    taskChipLabel: {
        fontSize: 14,
        marginLeft: 8,
    },
    inputCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
    },
    input: {
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    button: {
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 30,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    feedbackContainer: {
        marginTop: 10,
        paddingBottom: 40,
    },
    feedbackSection: {
        marginBottom: 20,
    },
    feedbackSub: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    badgeWrapper: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    badge: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 14,
        fontWeight: '500',
    },
    improvedCard: {
        padding: 20,
        borderRadius: 16,
        borderLeftWidth: 4,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 10,
    },
    improvedText: {
        fontSize: 16,
        fontStyle: 'italic',
        lineHeight: 24,
    }
});
