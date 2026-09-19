import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'react-native-reanimated';
import { ScanSessionProvider } from '../src/context/ScanSessionContext';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => { if (error) throw error; }, [error]);
  useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);

  if (!loaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ScanSessionProvider><Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="scan/review" options={{ title: 'Review Scan', headerStyle: { backgroundColor: '#F4F8F0' }, headerTintColor: '#469110' }} />
        <Stack.Screen name="scan/result" options={{ title: 'Result', headerStyle: { backgroundColor: '#F4F8F0' }, headerTintColor: '#469110' }} />
        <Stack.Screen name="detail/[id]" options={{ title: 'Produce Detail', headerStyle: { backgroundColor: '#F4F8F0' }, headerTintColor: '#469110' }} />
        <Stack.Screen name="rescan/[id]" options={{ title: 'Rescan', headerStyle: { backgroundColor: '#F4F8F0' }, headerTintColor: '#469110' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings', headerStyle: { backgroundColor: '#F4F8F0' }, headerTintColor: '#469110' }} />
      </Stack></ScanSessionProvider>
    </QueryClientProvider>
  );
}
