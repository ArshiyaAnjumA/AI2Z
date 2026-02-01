import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Hardcoded for now, or via Env (Expo requires 'EXPO_PUBLIC_' prefix for auto-inline)
// Since user gave us keys, we can hardcode for M1 or use a proper .env approach
// Just hardcoding the Derived URL and Anon Key for simplicity in M1 Demo

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

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
