import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/services/AuthContext';
import { ThemeProvider } from './src/theme/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
