import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, LightTheme, DarkTheme } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const TracksScreen = ({ navigation }: any) => {
    const { isDark } = useTheme();
    const colors = isDark ? DarkTheme : LightTheme;
    const [tracks, setTracks] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        loadTracks();
    }, []);

    const loadTracks = async () => {
        try {
            const { getTracks } = require('../services/api');
            const data = await getTracks();
            setTracks(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const handleContinue = (track: any) => {
        navigation.navigate('TrackDetail', { trackId: track.id, trackName: track.title });
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
                {loading ? (
                    <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
                ) : (
                    tracks.map((track) => (
                        <View key={track.id} style={[styles.trackCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={styles.trackInfo}>
                                <Text style={[Typography.h3, { color: colors.text }]}>{track.title}</Text>
                                <Text style={[Typography.caption, { color: colors.textLight, marginTop: 4 }]}>{track.description}</Text>
                                <Text style={[Typography.caption, { color: colors.textLight, marginTop: 4 }]}>
                                    {track.lessons ? track.lessons.length : 0} lessons
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.continueButton, { backgroundColor: colors.primary }]}
                                onPress={() => handleContinue(track)}
                            >
                                <Text style={[Typography.buttonText, { color: colors.white }]}>Continue</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
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
