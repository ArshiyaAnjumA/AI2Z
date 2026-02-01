import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, LightTheme, DarkTheme } from '../theme/tokens';
import { api } from '../services/api';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const EditProfileScreen = ({ route, navigation }: any) => {
    const { isDark } = useTheme();
    const colors = isDark ? DarkTheme : LightTheme;

    const { profile } = route.params;
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [targetGoal, setTargetGoal] = useState(profile?.target_goal || '');
    const [skillLevel, setSkillLevel] = useState(profile?.skill_level || 'Beginner');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert("Required", "Please enter your full name.");
            return;
        }

        setLoading(true);
        try {
            await api.patch('/profile/me', {
                full_name: fullName,
                target_goal: targetGoal,
                skill_level: skillLevel
            });
            Alert.alert("Success", "Profile updated successfully!");
            navigation.goBack();
        } catch (e) {
            Alert.alert("Error", "Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    const GoalOption = ({ label }: { label: string }) => (
        <TouchableOpacity
            style={[
                styles.option,
                { backgroundColor: isDark ? '#252525' : '#F0F0F0', borderColor: colors.border },
                targetGoal === label && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => setTargetGoal(label)}
        >
            <Text style={[styles.optionText, { color: colors.text }, targetGoal === label && styles.selectedOptionText]}>{label}</Text>
        </TouchableOpacity>
    );

    const LevelOption = ({ label }: { label: string }) => (
        <TouchableOpacity
            style={[
                styles.option,
                { backgroundColor: isDark ? '#252525' : '#F0F0F0', borderColor: colors.border },
                skillLevel === label && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => setSkillLevel(label)}
        >
            <Text style={[styles.optionText, { color: colors.text }, skillLevel === label && styles.selectedOptionText]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading}>
                    {loading ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.label, { color: colors.textLight }]}>Full Name</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: isDark ? '#1A1A1A' : '#F8F9FB', borderColor: colors.border, color: colors.text }]}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.textLight}
                />

                <Text style={[styles.label, { color: colors.textLight }]}>Your Goal</Text>
                <View style={styles.optionsGrid}>
                    <GoalOption label="AI Foundations" />
                    <GoalOption label="GenAI" />
                    <GoalOption label="Prompt Engineering" />
                    <GoalOption label="Career Switch" />
                </View>

                <Text style={[styles.label, { color: colors.textLight }]}>Skill Level</Text>
                <View style={styles.optionsGrid}>
                    <LevelOption label="Beginner" />
                    <LevelOption label="Intermediate" />
                    <LevelOption label="Advanced" />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    saveText: { fontWeight: 'bold', fontSize: 16 },
    content: { padding: 24 },
    label: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, marginTop: 24, textTransform: 'uppercase' },
    input: { padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1 },
    optionsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    option: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, marginRight: 10, marginBottom: 10, borderWidth: 1 },
    optionText: { fontSize: 14 },
    selectedOptionText: { color: 'white', fontWeight: 'bold' },
});
