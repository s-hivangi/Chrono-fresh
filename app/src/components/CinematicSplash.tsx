import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, Dimensions, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const SPLASH_DURATION = 2500;

interface CinematicSplashProps {
  onAnimationComplete: () => void;
}

export default function CinematicSplash({ onAnimationComplete }: CinematicSplashProps) {
  const fadeAnim        = useRef(new Animated.Value(0)).current;
  const scaleAnim       = useRef(new Animated.Value(0.75)).current;
  const taglineFade     = useRef(new Animated.Value(0)).current;
  const loadingProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // Tagline fades in 500ms after logo starts
    setTimeout(() => {
      Animated.timing(taglineFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 500);

    // Loading bar fills over full duration
    Animated.timing(loadingProgress, {
      toValue: 1,
      duration: SPLASH_DURATION,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(onAnimationComplete, SPLASH_DURATION);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      {/* Background gradient — dark green */}
      <LinearGradient
        colors={['#1A2E0D', '#0D1A06', '#050D02']}
        style={StyleSheet.absoluteFill}
      />

      {/* Logo + name + tagline */}
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/*
          The logo PNG has a white background.
          We display it inside a white circle — this makes the white
          background seamless and it looks like a clean logo badge.
        */}
        <View style={styles.logoBadge}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.appName}>Chrono-Fresh</Text>

        <Animated.Text style={[styles.tagline, { opacity: taglineFade }]}>
          Know your produce. Reduce your waste.
        </Animated.Text>
      </Animated.View>

      {/* Progress bar */}
      <View style={styles.loadingContainer}>
        <View style={styles.loadingBarBackground}>
          <Animated.View
            style={[
              styles.loadingBarFill,
              {
                width: loadingProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={['#469110', '#84cc16', '#eab308']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientFill}
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 20,
  },
  // White circle badge — makes the white-background logo look intentional
  logoBadge: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    // Subtle glow ring
    shadowColor: '#84cc16',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  logo: {
    width: 110,
    height: 110,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.3,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 90,
    width: width * 0.65,
  },
  loadingBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  gradientFill: {
    flex: 1,
  },
});
