import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, LightTheme, DarkTheme } from '../theme/tokens';
import { api } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';

export const CertificatesListScreen = ({ navigation }: any) => {
    const { isDark } = useTheme();
    const colors = isDark ? DarkTheme : LightTheme;
    const [certificates, setCertificates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchCertificates = async () => {
        try {
            const data = await api.get('/certificates/me');
            setCertificates(data);
        } catch (e) {
            console.error("Error fetching certificates:", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchCertificates();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchCertificates();
    }, []);

    const renderItem = ({ item }: any) => (
        <TouchableOpacity
            style={styles.certCard}
            onPress={() => navigation.navigate('Certificate', { code: item.certificate_code })}
        >
            <View style={styles.iconContainer}>
                <Ionicons name="ribbon" size={32} color="#D4AF37" />
            </View>
            <View style={styles.infoContainer}>
                <Text style={[styles.certTitle, { color: colors.text }]}>AI Fundamentals Certificate</Text>
                <Text style={[styles.certDate, { color: colors.textLight }]}>Issued on {item.issue_date}</Text>
                <Text style={[styles.certCode, { color: colors.textLight }]}>Code: {item.certificate_code}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textLight} />
        </TouchableOpacity>
    );

    if (loading && !refreshing) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>My Certificates</Text>
                <View style={{ width: 28 }} />
            </View>

            <FlatList
                data={certificates}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="school-outline" size={80} color={colors.textLight} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No certificates yet</Text>
                        <Text style={[styles.emptyText, { color: colors.textLight }]}>Complete the AI Fundamentals final exam to earn your first certification!</Text>
                        <TouchableOpacity
                            style={[styles.examButton, { backgroundColor: colors.primary }]}
                            onPress={() => navigation.navigate('MainTabs', { screen: 'Exam' })}
                        >
                            <Text style={styles.examButtonText}>Go to Exam</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    listContent: { padding: 20 },
    certCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1 },
    iconContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF9E6', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    infoContainer: { flex: 1 },
    certTitle: { fontSize: 16, fontWeight: 'bold' },
    certDate: { fontSize: 13, marginTop: 2 },
    certCode: { fontSize: 12, marginTop: 2, fontStyle: 'italic' },
    emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 20 },
    emptyText: { textAlign: 'center', marginTop: 10, lineHeight: 20 },
    examButton: { marginTop: 30, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12 },
    examButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
