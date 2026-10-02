import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import CinematicSplash from '../src/components/CinematicSplash';
import { useAuth } from '../src/context/AuthContext';

/**
 * Cinematic splash screen — shown once at app launch.
 * Auto-navigates to the Welcome screen when the animation completes.
 * Not reachable from any tab or back-button; it is always the entry point.
 */
export default function SplashScreen() {
  const router = useRouter();
  const { isLoading, isLoggedIn } = useAuth();
  const [animationDone, setAnimationDone] = useState(false);

  useEffect(() => {
    if (animationDone && !isLoading) router.replace(isLoggedIn ? '/(tabs)' : '/welcome');
  }, [animationDone, isLoading, isLoggedIn, router]);

  function handleAnimationComplete() {
    // Replace (not push) so the user cannot swipe/back to the splash
    setAnimationDone(true);
  }

  return <CinematicSplash onAnimationComplete={handleAnimationComplete} />;
}
