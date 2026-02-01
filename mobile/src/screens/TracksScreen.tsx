import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, LightTheme, DarkTheme } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const TRACKS = [
    {
        id: '1',
        name: 'AI Fundamentals',
        subtitle: 'Beginner • 12 lessons',
        progress: 0.4,
        track: 'ai_fundamentals'
    },
    {
        id: '2',
        name: 'Machine Learning',
        subtitle: 'Intermediate • 15 lessons',
        progress: 0,
        track: 'machine_learning'
    },
    {
        id: '3',
        name: 'Deep Learning',
        subtitle: 'Advanced • 20 lessons',
        progress: 0,
        track: 'deep_learning'
    },
    {
        id: '4',
        name: 'Generative AI',
        subtitle: 'Intermediate • 10 lessons',
        progress: 0,
        track: 'generative_ai'
    },
    {
        id: '5',
        name: 'Prompt Engineering',
        subtitle: 'Beginner • 8 lessons',
        progress: 0,
        track: 'prompt_engineering'
    },
];

export const TracksScreen = ({ navigation }: any) => {
    const { isDark } = useTheme();
    const colors = isDark ? DarkTheme : LightTheme;

    const handleContinue = (track: any) => {
        navigation.navigate('TrackDetail', { trackId: track.track, trackName: track.name });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[Typography.h2, { color: colors.text }]}>Tracks</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {TRACKS.map((track) => (
                    <View key={track.id} style={[styles.trackCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.trackInfo}>
                            <Text style={[Typography.h3, { color: colors.text }]}>{track.name}</Text>
                            <Text style={[Typography.caption, { color: colors.textLight, marginTop: 4 }]}>{track.subtitle}</Text>

                            <View style={[styles.progressBackground, { backgroundColor: colors.border }]}>
                                <View
                                    style={[
                                        styles.progressBar,
                                        {
                                            backgroundColor: colors.primary,
                                            width: `${track.progress * 100}%`
                                        }
                                    ]}
                                />
                            </View>
                            <Text style={[Typography.caption, { color: colors.textLight, marginTop: 4 }]}>
                                {Math.round(track.progress * 100)}% complete
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.continueButton, { backgroundColor: colors.primary }]}
                            onPress={() => handleContinue(track)}
                        >
                            <Text style={[Typography.buttonText, { color: colors.white }]}>Continue</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
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
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    trackCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    trackInfo: {
        marginBottom: 16,
    },
    progressBackground: {
        height: 8,
        borderRadius: 4,
        marginTop: 12,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    continueButton: {
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
