export const LightTheme = {
    primary: '#8B5CF6',
    primaryDark: '#6B21A8',
    primaryLight: '#EDE9FE',
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0F172A',
    textLight: '#64748B',
    textMedium: '#334155',
    border: '#E5E7EB',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    tabInactive: '#94A3B8',
    white: '#FFFFFF',
    secondary: '#10B981', // Added emerald for secondary
};

export const DarkTheme = {
    primary: '#A78BFA',
    primaryDark: '#7C3AED',
    primaryLight: '#2E1065',
    background: '#0F172A',
    card: '#1E293B',
    text: '#F8FAFC',
    textLight: '#94A3B8',
    textMedium: '#E2E8F0',
    border: '#334155',
    error: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
    tabInactive: '#64748B',
    white: '#FFFFFF',
    secondary: '#34D399', // Added emerald for secondary
};

export const Colors = LightTheme;

export const Typography = {
    h2: {
        fontSize: 22,
        fontWeight: '500' as const,
    },
    h3: {
        fontSize: 18,
        fontWeight: '500' as const,
    },
    body: {
        fontSize: 15,
        fontWeight: '400' as const,
    },
    bodySmall: {
        fontSize: 14,
        fontWeight: '400' as const,
    },
    caption: {
        fontSize: 13,
        fontWeight: '400' as const,
    },
    buttonText: {
        fontSize: 15,
        fontWeight: '500' as const,
    },
    // Legacy support
    header: {
        fontSize: 24,
        fontWeight: 'bold' as const,
    },
    subheader: {
        fontSize: 18,
        fontWeight: '600' as const,
    },
};
