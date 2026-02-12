import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Hardcoded for now, or via Env (Expo requires 'EXPO_PUBLIC_' prefix for auto-inline)
// Since user gave us keys, we can hardcode for M1 or use a proper .env approach
// Just hardcoding the Derived URL and Anon Key for simplicity in M1 Demo

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qiuagkmftiawzbbfibsb.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpdWFna21mdGlhd3piYmZpYnNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTYwNjEsImV4cCI6MjA4NTM5MjA2MX0.Vaic9trhK9DYYZn8Wh8AFFKEy6Jp0sHbHmc6nV5DEfw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: {
            getItem: (key) => SecureStore.getItemAsync(key),
            setItem: (key, value) => SecureStore.setItemAsync(key, value),
            removeItem: (key) => SecureStore.deleteItemAsync(key),
        },
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
