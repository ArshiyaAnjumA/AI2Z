import { Platform } from 'react-native';
import { supabase } from './supabase';

// Use 10.0.2.2 for Android Emulator, localhost for iOS/Web
const DEV_API_URL = Platform.select({
    android: 'http://10.0.2.2:8000',
    ios: 'http://192.168.0.4:8000', // Update loopback to LAN IP for physical device
    default: 'http://192.168.0.4:8000',
});

// Helper to get auth token
const getAuthToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
};

export const api = {
    get: async (endpoint: string) => {
        const token = await getAuthToken();
        console.log(`API GET: ${endpoint}`);
        try {
            const response = await fetch(`${DEV_API_URL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`API Error [${response.status}]: ${errorBody}`);
                throw new Error('API Error: ' + response.statusText);
            }
            return await response.json();
        } catch (e) {
            console.error(`API Fetch Failure [${endpoint}]:`, e);
            throw e;
        }
    },

    post: async (endpoint: string, body: any) => {
        const token = await getAuthToken();
        console.log(`API POST: ${endpoint}`);
        try {
            const response = await fetch(`${DEV_API_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`API Error [${response.status}]: ${errorBody}`);
                throw new Error(`API Error [${response.status}]: ${errorBody}`);
            }
            return await response.json();
        } catch (e) {
            console.error(`API Fetch Failure [${endpoint}]:`, e);
            throw e;
        }
    },

    patch: async (endpoint: string, body: any) => {
        const token = await getAuthToken();
        try {
            const response = await fetch(`${DEV_API_URL}${endpoint}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) throw new Error('API Error: ' + response.statusText);
            return await response.json();
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
};

// Term of the Day
export const getTermOfDay = async () => {
    return await api.get('/terms/daily');
};
