import React from 'react';
import { useRouter } from 'expo-router';
import CinematicSplash from '../src/components/CinematicSplash';

/**
 * Cinematic splash screen — shown once at app launch.
 * Auto-navigates to the Welcome screen when the animation completes.
 * Not reachable from any tab or back-button; it is always the entry point.
 */
export default function SplashScreen() {
  const router = useRouter();

  function handleAnimationComplete() {
    // Replace (not push) so the user cannot swipe/back to the splash
    router.replace('/welcome');
  }

  return <CinematicSplash onAnimationComplete={handleAnimationComplete} />;
}
