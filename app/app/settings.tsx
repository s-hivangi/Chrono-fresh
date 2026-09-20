// This file exists only for Expo Router route compatibility.
// The Settings screen is accessible through the bottom tab bar at (tabs)/settings.
// This stub prevents a ghost /settings route from rendering.
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function SettingsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/(tabs)/settings' as any);
  }, []);
  return null;
}
