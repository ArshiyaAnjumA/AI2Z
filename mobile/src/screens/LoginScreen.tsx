import React, { useState } from 'react';
import { Alert, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from '../services/supabase';
import { Typography, LightTheme, DarkTheme } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';

export const LoginScreen = () => {
    const { isDark } = useTheme();
    const colors = isDark ? DarkTheme : LightTheme;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const [forgotPasswordMode, setForgotPasswordMode] = useState(false);

    async function signInWithEmail() {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) Alert.alert('Error', error.message);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    }

    async function signUpWithEmail() {
        setLoading(true);
        try {
            const redirectUrl = Linking.createURL('/auth/callback');
            console.log("Redirect URL:", redirectUrl);

            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: redirectUrl
                }
            });

            if (error) Alert.alert('Error', error.message);
            else Alert.alert('Success', 'Check your email for confirmation!');
        } catch (e: any) {
            Alert.alert('Error', e.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    }

    async function sendResetPasswordEmail() {
        setLoading(true);
        try {
            const redirectUrl = 'exp://localhost:19000/--/reset-password';
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl
            });

            if (error) {
                if (error.message.includes("rate limit") || error.status === 429) {
                    Alert.alert("Too Many Attempts", "Please wait a minute before requesting another password reset email.");
                } else {
                    Alert.alert('Error', error.message);
                }
            } else {
                Alert.alert('Success', 'Password reset email sent! Please check your inbox.');
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    }

    if (forgotPasswordMode) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={[Typography.header, styles.title, { color: colors.text }]}>Reset Password</Text>

                <Text style={{ color: colors.textLight, textAlign: 'center', marginBottom: 20 }}>
                    Enter your email to receive a reset link.
                </Text>

                <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                    <TextInput
                        onChangeText={setEmail}
                        value={email}
                        placeholder="email@address.com"
                        placeholderTextColor={colors.textLight}
                        autoCapitalize={'none'}
                        style={[styles.input, { color: colors.text }]}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={sendResetPasswordEmail}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Reset Link</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                    style={{ marginTop: 20, alignSelf: 'center' }}
                    onPress={() => setForgotPasswordMode(false)}
                >
                    <Text style={{ color: colors.textLight }}>Back to Login</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[Typography.header, styles.title, { color: colors.text }]}>Welcome Back</Text>

            <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                <TextInput
                    onChangeText={(text) => setEmail(text)}
                    value={email}
                    placeholder="email@address.com"
                    placeholderTextColor={colors.textLight}
                    autoCapitalize={'none'}
                    style={[styles.input, { color: colors.text }]}
                />
            </View>
            <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                <TextInput
                    onChangeText={(text) => setPassword(text)}
                    value={password}
                    secureTextEntry={true}
                    placeholder="Password"
                    placeholderTextColor={colors.textLight}
                    autoCapitalize={'none'}
                    style={[styles.input, { color: colors.text }]}
                />
            </View>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={signInWithEmail}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, styles.secondaryButton, { borderColor: colors.border }]}
                onPress={signUpWithEmail}
                disabled={loading}
            >
                <Text style={[styles.buttonText, { color: colors.primary }]}>Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={{ marginTop: 20, alignSelf: 'center' }}
                onPress={() => setForgotPasswordMode(!forgotPasswordMode)}
            >
                <Text style={{ color: colors.textLight, textDecorationLine: 'underline' }}>
                    {forgotPasswordMode ? "Back to Login" : "Forgot Password?"}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        textAlign: 'center',
        marginBottom: 40,
    },
    inputContainer: {
        marginBottom: 10,
        borderWidth: 1,
        borderRadius: 12,
        padding: 15,
    },
    input: {
        fontSize: 16,
    },
    button: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
