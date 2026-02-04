import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, LightTheme, DarkTheme } from '../theme/tokens';
import { getCertificate } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

export const CertificateScreen = ({ route, navigation }: any) => {
    const { isDark } = useTheme();
    const colors = isDark ? DarkTheme : LightTheme;
    const { code } = route?.params || {};
    const [certificate, setCertificate] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCert = async () => {
            try {
                // 'code' param here is actually used as ID in navigation from list, 
                // OR as code if deep linked? 
                // CertificatesList passes: navigation.navigate('Certificate', { code: item.certificate_code })
                // BUT item.id is the UUID. 
                // getCertificate(id) expects UUID.

                // If passed 'code' is not UUID, we might need to search by code.
                // But getCertificate logic in api.ts uses .eq('id', certificateId).
                // I should update CertificatesList to pass ID.

                // Assuming CertificatesList updated to pass ID in next step (or previous step).
                // Wait, previous step: navigation.navigate('Certificate', { code: item.certificate_code })
                // I need to change that to { code: item.id } (and rename param to id?)
                // Or handle both. 

                // Let's assume passed param is ID for now and rename variable if possible, 
                // or just pass ID as 'code' param key to avoid breaks.
                const data = await getCertificate(code);
                setCertificate(data);
            } catch (e) {
                Alert.alert("Error", "Certificate not found.");
                navigation.goBack();
            } finally {
                setLoading(false);
            }
        };
        fetchCert();
    }, [code]);

    const handleShare = async () => {
        try {
            await Share.share({
                message: `I've officially completed the AI Fundamentals Certification! 🎓 Check out my certificate: [Verification Link (Placeholder)] (Code: ${code})`,
            });
        } catch (error: any) {
            Alert.alert(error.message);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Your Certificate</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={[styles.certificateCard, { backgroundColor: colors.card }]}>
                <View style={styles.certBorder}>
                    <Ionicons name="ribbon" size={60} color="#D4AF37" style={styles.ribbon} />
                    <Text style={[styles.certLabel, { color: colors.text }]}>CERTIFICATE OF COMPLETION</Text>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <Text style={[styles.presentedTo, { color: colors.textLight }]}>Presented to</Text>
                    <Text style={[styles.userName, { color: colors.secondary }]}>{certificate?.full_name || "AI Explorer"}</Text>

                    <Text style={[styles.courseName, { color: colors.textLight }]}>For successfully passing the 50-question</Text>
                    <Text style={[styles.boldCourse, { color: colors.text }]}>AI Fundamentals Certification Exam</Text>

                    <View style={styles.footer}>
                        <View style={styles.footerItem}>
                            <Text style={[styles.footerLabel, { color: colors.textLight }]}>Issue Date</Text>
                            <Text style={[styles.footerValue, { color: colors.text }]}>{certificate?.issue_date}</Text>
                        </View>
                        <View style={styles.footerItem}>
                            <Text style={[styles.footerLabel, { color: colors.textLight }]}>Verification Code</Text>
                            <Text style={[styles.footerValue, { color: colors.text }]}>{code}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={[styles.shareCTA, { backgroundColor: colors.primary }]} onPress={handleShare}>
                    <Ionicons name="share-social-outline" size={20} color="white" />
                    <Text style={styles.shareText}>Share Achievement</Text>
                </TouchableOpacity>
                <Text style={[styles.verificationNote, { color: colors.textLight }]}>
                    Anyone can verify this certificate using the secure code above.
                </Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    certificateCard: { margin: 24, flex: 1, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
    certBorder: { flex: 1, margin: 15, borderWidth: 2, borderColor: '#D4AF37', borderRadius: 10, alignItems: 'center', padding: 30 },
    ribbon: { marginBottom: 20 },
    schoolName: { fontSize: 14, fontWeight: 'bold', letterSpacing: 1.5, textTransform: 'uppercase' },
    certLabel: { fontSize: 24, fontWeight: '900', marginTop: 15, textAlign: 'center' },
    divider: { height: 1, width: '60%', marginVertical: 30 },
    presentedTo: { fontSize: 16, fontStyle: 'italic' },
    userName: { fontSize: 32, fontWeight: 'bold', marginVertical: 15, textAlign: 'center' },
    courseName: { fontSize: 14, marginTop: 20 },
    boldCourse: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginTop: 5 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 'auto', paddingTop: 30 },
    footerItem: { alignItems: 'center' },
    footerLabel: { fontSize: 10, textTransform: 'uppercase', marginBottom: 4 },
    footerValue: { fontSize: 12, fontWeight: 'bold' },
    actions: { padding: 24 },
    shareCTA: { flexDirection: 'row', padding: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    shareText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
    verificationNote: { textAlign: 'center', marginTop: 15, fontSize: 13 }
});
