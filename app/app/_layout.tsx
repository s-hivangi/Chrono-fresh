import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'react-native-reanimated';
import { ScanSessionProvider } from '../src/context/ScanSessionContext';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { Text } from 'react-native';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

(Text as typeof Text & { defaultProps?: { style?: unknown } }).defaultProps = {
  ...((Text as typeof Text & { defaultProps?: { style?: unknown } }).defaultProps ?? {}),
  style: { fontFamily: 'Poppins_400Regular' },
};

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Splash is the true entry point; it replaces itself with welcome automatically
  initialRouteName: 'splash',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => { if (error) throw error; }, [error]);
  useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);

  if (!loaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ScanSessionProvider>
            <Stack>
            {/* Cinematic splash — no header, replaces itself with welcome */}
            <Stack.Screen name="splash" options={{ headerShown: false }} />

            {/* Onboarding flow — no header on these screens */}
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
            <Stack.Screen
              name="login"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />

            {/* Main app tabs — no header (tabs manage their own) */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/* Detail & action stack screens */}
            <Stack.Screen
              name="detail/[id]"
              options={{
                title: 'Produce Detail',
                headerStyle: { backgroundColor: '#F4F8F0' },
                headerTintColor: '#469110',
                headerTitleStyle: { fontFamily: 'Poppins_600SemiBold' },
              }}
            />
            <Stack.Screen
              name="scan/review"
              options={{
                title: 'Review Photo',
                headerStyle: { backgroundColor: '#F4F8F0' },
                headerTintColor: '#469110',
                headerTitleStyle: { fontFamily: 'Poppins_600SemiBold' },
              }}
            />
            <Stack.Screen
              name="scan/result"
              options={{
                title: 'Scan Result',
                headerStyle: { backgroundColor: '#F4F8F0' },
                headerTintColor: '#469110',
                headerTitleStyle: { fontFamily: 'Poppins_600SemiBold' },
              }}
            />
            <Stack.Screen
              name="rescan/[id]"
              options={{
                title: 'Rescan',
                headerStyle: { backgroundColor: '#F4F8F0' },
                headerTintColor: '#469110',
                headerTitleStyle: { fontFamily: 'Poppins_600SemiBold' },
              }}
            />
          </Stack>
          </ScanSessionProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
