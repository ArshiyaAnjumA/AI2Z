import { NavigationContainer, DefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../services/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { LightTheme, DarkTheme, Typography } from '../theme/tokens';
import { LoginScreen } from '../screens/LoginScreen';
import { LearnScreen } from '../screens/LearnScreen';
import { PracticeScreen } from '../screens/PracticeScreen';
import { NewsScreen } from '../screens/NewsScreen';
import { ExamScreen } from '../screens/ExamScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { CertificateScreen } from '../screens/CertificateScreen';
import { CertificatesListScreen } from '../screens/CertificatesListScreen';
import { TracksScreen } from '../screens/TracksScreen';
import { TrackDetailScreen } from '../screens/TrackDetailScreen';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View, Text } from 'react-native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LessonPlayerScreen } from '../screens/LessonPlayerScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { QuizResultsScreen } from '../screens/QuizResultsScreen';

const MainStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
    const { isDark } = useTheme();
    const colors = isDark ? DarkTheme : LightTheme;

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.tabInactive,
                tabBarStyle: {
                    backgroundColor: colors.card,
                    borderTopColor: colors.border,
                },
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'help';

                    if (route.name === 'Learn') iconName = focused ? 'school' : 'school-outline';
                    else if (route.name === 'Practice') iconName = focused ? 'code' : 'code-outline';
                    else if (route.name === 'News') iconName = focused ? 'newspaper' : 'newspaper-outline';
                    else if (route.name === 'Exam') iconName = focused ? 'document-text' : 'document-text-outline';
                    else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Learn" component={LearnScreen} />
            <Tab.Screen name="Practice" component={PracticeScreen} />
            <Tab.Screen name="News" component={NewsScreen} />
            <Tab.Screen name="Exam" component={ExamScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

export function AppNavigator() {
    const { session, isLoading } = useAuth();
    const { isDark } = useTheme();
    const colors = isDark ? DarkTheme : LightTheme;

    const navTheme = isDark ? {
        ...NavigationDarkTheme,
        colors: {
            ...NavigationDarkTheme.colors,
            primary: colors.primary,
            background: colors.background,
            card: colors.card,
            text: colors.text,
            border: colors.border,
        },
    } : {
        ...DefaultTheme,
        colors: {
            ...DefaultTheme.colors,
            primary: colors.primary,
            background: colors.background,
            card: colors.card,
            text: colors.text,
            border: colors.border,
        },
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer theme={navTheme}>
            {session ? (
                <MainStack.Navigator screenOptions={{ headerShown: false }}>
                    <MainStack.Screen name="MainTabs" component={MainTabs} />
                    <MainStack.Screen name="LessonPlayer" component={LessonPlayerScreen} options={{ presentation: 'modal' }} />
                    <MainStack.Screen name="Quiz" component={QuizScreen} />
                    <MainStack.Screen name="QuizResults" component={QuizResultsScreen} />
                    <MainStack.Screen name="Certificate" component={CertificateScreen} />
                    <MainStack.Screen name="EditProfile" component={EditProfileScreen} />
                    <MainStack.Screen name="CertificatesList" component={CertificatesListScreen} />
                    <MainStack.Screen name="Tracks" component={TracksScreen} />
                    <MainStack.Screen name="TrackDetail" component={TrackDetailScreen} />
                </MainStack.Navigator>
            ) : (
                <AuthStack.Navigator screenOptions={{ headerShown: false }}>
                    <AuthStack.Screen name="Login" component={LoginScreen} />
                </AuthStack.Navigator>
            )}
        </NavigationContainer>
    );
}
