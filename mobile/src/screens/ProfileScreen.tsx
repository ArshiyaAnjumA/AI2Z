import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, LightTheme, DarkTheme } from '../theme/tokens';
import { api } from '../services/api';
import { useAuth } from '../services/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const ProfileScreen = ({ navigation }: any) => {
    const { signOut } = useAuth();
    const { isDark, toggleTheme, theme } = useTheme();
    const colors = isDark ? DarkTheme : LightTheme;

    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [badges, setBadges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const [profileRes, statsRes, badgesRes] = await Promise.all([
                api.get('/profile/me'),
                api.get('/profile/stats'),
                api.get('/profile/badges')
            ]);
            setProfile(profileRes);
            setStats(statsRes);
            setBadges(badgesRes);
        } catch (e) {
            console.error("Error fetching profile data:", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, []);

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const StatCard = ({ label, value, icon, color }: any) => (
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View>
                <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
                <Text style={[styles.statLabel, { color: colors.textLight }]}>{label}</Text>
            </View>
        </View>
    );

    const dynamicStyles = {
        container: { backgroundColor: colors.background },
        header: { backgroundColor: colors.card, borderBottomColor: colors.border },
        name: { color: colors.text },
        sectionTitle: { color: colors.text },
        badgeCard: { backgroundColor: colors.card },
        badgeTitle: { color: colors.text },
        certButton: { backgroundColor: colors.card },
        certButtonText: { color: colors.text },
        settingsSection: { backgroundColor: colors.card, borderTopColor: colors.border },
        settingItem: { borderBottomColor: colors.border },
        settingLabel: { color: colors.text },
    };

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {/* Header */}
                <View style={[styles.header, dynamicStyles.header]}>
                    <View style={styles.avatarContainer}>
                        {profile?.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                                <Text style={styles.avatarText}>
                                    {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                                </Text>
                            </View>
                        )}
                        <TouchableOpacity
                            style={[styles.editBadge, { backgroundColor: colors.secondary }]}
                            onPress={() => navigation.navigate('EditProfile', { profile })}
                        >
                            <Ionicons name="pencil" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={[styles.name, dynamicStyles.name]}>{profile?.full_name || 'AI Enthusiast'}</Text>
                        <Text style={[styles.caption, { color: colors.textLight }]}>
                            {profile?.skill_level} • {profile?.target_goal}
                        </Text>
                    </View>
                </View>

                {/* Stats Grid */}
                <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Your Progress</Text>
                <View style={styles.statsGrid}>
                    <StatCard label="XP Total" value={stats?.xp_total || 0} icon="flash" color="#FF9500" />
                    <StatCard label="Streak" value={`${stats?.streak_days || 0} days`} icon="flame" color="#FF3B30" />
                    <StatCard label="Lessons" value={stats?.lessons_completed || 0} icon="book" color="#5856D6" />
                    <StatCard label="Quizzes" value={stats?.quizzes_completed || 0} icon="checkmark-circle" color="#34C759" />
                </View>

                {/* Badges */}
                <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Achievements</Text>
                {badges.length > 0 ? (
                    <FlatList
                        data={badges}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.badgesList}
                        renderItem={({ item }) => (
                            <View style={[styles.badgeCard, dynamicStyles.badgeCard]}>
                                <View style={styles.badgeIcon}>
                                    <Ionicons name="trophy" size={32} color="#D4AF37" />
                                </View>
                                <Text style={[styles.badgeTitle, dynamicStyles.badgeTitle]}>{item.badge_title}</Text>
                            </View>
                        )}
                    />
                ) : (
                    <View style={[styles.emptyBadges, { backgroundColor: colors.border + '20' }]}>
                        <Text style={[styles.emptyText, { color: colors.textLight }]}>Complete challenges to earn badges!</Text>
                    </View>
                )}

                {/* Certificates */}
                <TouchableOpacity
                    style={[styles.certButton, dynamicStyles.certButton]}
                    onPress={() => navigation.navigate('CertificatesList')}
                >
                    <Ionicons name="ribbon-outline" size={24} color={colors.primary} />
                    <Text style={[styles.certButtonText, dynamicStyles.certButtonText]}>View My Certificates</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
                </TouchableOpacity>

                {/* Settings / Actions */}
                <View style={[styles.settingsSection, dynamicStyles.settingsSection]}>
                    <View style={[styles.settingItem, dynamicStyles.settingItem]}>
                        <Ionicons name="notifications-outline" size={22} color={colors.text} />
                        <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>Notifications</Text>
                        <View style={styles.spacer} />
                        <Ionicons name="toggle" size={32} color={colors.primary} />
                    </View>
                    <TouchableOpacity style={[styles.settingItem, dynamicStyles.settingItem]} onPress={toggleTheme}>
                        <Ionicons name={isDark ? "moon" : "moon-outline"} size={22} color={colors.text} />
                        <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>Dark Mode</Text>
                        <View style={styles.spacer} />
                        <Ionicons name={isDark ? "toggle" : "toggle-outline"} size={32} color={isDark ? colors.primary : colors.textLight} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
                        <Ionicons name="log-out-outline" size={22} color={colors.error} />
                        <Text style={[styles.settingLabel, { color: colors.error }]}>Log Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 24, borderBottomWidth: 1 },
    avatarContainer: { position: 'relative' },
    avatar: { width: 80, height: 80, borderRadius: 40 },
    avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 32, color: 'white', fontWeight: 'bold' },
    editBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' },
    headerInfo: { marginLeft: 20, flex: 1 },
    name: { fontSize: 22, fontWeight: 'bold' },
    caption: { fontSize: 14, marginTop: 4 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 24, marginTop: 32, marginBottom: 16 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16 },
    statCard: { width: '44%', padding: 16, borderRadius: 16, margin: '3%', flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    statIconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    statValue: { fontSize: 18, fontWeight: 'bold' },
    statLabel: { fontSize: 12 },
    badgesList: { paddingHorizontal: 20 },
    badgeCard: { width: 100, alignItems: 'center', marginRight: 15, padding: 15, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    badgeIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF9E6', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    badgeTitle: { fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
    emptyBadges: { padding: 20, marginHorizontal: 24, borderRadius: 16, alignItems: 'center' },
    emptyText: { fontSize: 14 },
    certButton: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginTop: 24, padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    certButtonText: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '600' },
    settingsSection: { marginTop: 32, borderTopWidth: 1 },
    settingItem: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    settingLabel: { marginLeft: 15, fontSize: 16, fontWeight: '500' },
    spacer: { flex: 1 },
    logoutButton: { flexDirection: 'row', alignItems: 'center', padding: 20 },
});
