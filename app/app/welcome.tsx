import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Image, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { SHADOWS, SPACING } from '../src/theme';
import { CameraIcon, BellIcon, CalendarIcon } from '../src/components/FeatureIcons';

// ─── Palette (mint-green welcome theme) ───────────────────────────────────────
const MINT = '#D4EBD0';
const GREEN_DARK = '#2D6A2D';
const GREEN_BTN = '#3A7D3A';
const CARD_BG = '#FFFFFF';

// ─── Feature data ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    id: 'scan',
    Icon: CameraIcon,
    title: 'Instant Freshness\nScanner',
    body: 'Snap a photo to predict freshness instantly.',
  },
  {
    id: 'alerts',
    Icon: BellIcon,
    title: 'Proactive\nFreshness Alerts',
    body: 'Get reminders before things start to turn.',
  },
  {
    id: 'track',
    Icon: CalendarIcon,
    title: 'Produce Inventory\n& Shelf-Life',
    body: 'Track shelf life for everything in your kitchen.',
  },
] as const;

export default function WelcomeScreen() {
  const router = useRouter();
  const { continueAsGuest } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Leaf watermark — top right */}
        <Text style={styles.leafWatermark}>🌿</Text>

        {/* ── Logo — pushed below the status bar by SafeAreaView + paddingTop ── */}
        <View style={styles.logoBadge}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* ── Title + tagline ── */}
        <Text style={styles.appName}>Chrono-Fresh</Text>
        <Text style={styles.tagline}>
          Know exactly how fresh your produce{'\n'}is — before you reach for it.
        </Text>

        {/* ── Feature cards — 2-column grid, equal height ── */}
        <View style={styles.grid}>
          {/* Left column: Camera (top) + Bell (bottom) */}
          <View style={styles.col}>
            {FEATURES.slice(0, 2).map(({ id, Icon, title, body }) => (
              <View key={id} style={styles.card}>
                <View style={styles.iconWrap}>
                  <Icon size={56} />
                </View>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardBody}>{body}</Text>
              </View>
            ))}
          </View>

          {/* Right column: Calendar (spans full height, vertically centred) */}
          <View style={[styles.col, styles.colRight]}>
            {FEATURES.slice(2).map(({ id, Icon, title, body }) => (
              <View key={id} style={[styles.card, styles.cardTall]}>
                <View style={styles.iconWrap}>
                  <Icon size={56} />
                </View>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardBody}>{body}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Spacer pushes buttons to the bottom */}
        <View style={styles.spacer} />

        {/* ── Buttons ── */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/login')}
            accessibilityRole="button"
            accessibilityLabel="Create an account"
          >
            <Text style={styles.primaryBtnText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => { continueAsGuest(); router.replace('/(tabs)'); }}
            accessibilityRole="button"
            accessibilityLabel="Skip and continue without an account"
          >
            <Text style={styles.secondaryBtnText}>Skip for now</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            No account needed to use the app. You can always sign up later.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_GAP = 10;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: MINT,
  },
  scroll: { flex: 1 },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    // Pushes the logo well below the notification bar / Dynamic Island
    paddingTop: SPACING.xl + 96,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },

  // Watermark
  leafWatermark: {
    position: 'absolute',
    top: 4,
    right: -10,
    fontSize: 110,
    opacity: 0.15,
    transform: [{ rotate: '20deg' }],
    // Don't let it block taps
    pointerEvents: 'none' as any,
  },

  // Logo
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  logoImage: { width: 68, height: 68 },

  // Branding
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: GREEN_DARK,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    color: GREEN_DARK,
    textAlign: 'center',
    lineHeight: 23,
    opacity: 0.72,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },

  // ── Grid ──────────────────────────────────────────────────────────────────
  grid: {
    flexDirection: 'row',
    gap: CARD_GAP,
    width: '100%',
    alignItems: 'stretch',  // columns stretch to the same height
  },
  col: {
    flex: 1,
    gap: CARD_GAP,
  },
  colRight: {
    // Right column holds a single tall card
  },

  // Card
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: SPACING.md,
    gap: 6,
    ...SHADOWS.sm,
  },
  // Tall card stretches to fill the full height of both left cards + gap
  cardTall: {
    flex: 1,
    justifyContent: 'center',
  },

  iconWrap: {
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: GREEN_DARK,
    lineHeight: 19,
  },
  cardBody: {
    fontSize: 12,
    color: '#4a6c4a',
    lineHeight: 17,
  },

  spacer: { flex: 1, minHeight: SPACING.lg },

  // ── Buttons ───────────────────────────────────────────────────────────────
  actions: {
    width: '100%',
    gap: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  primaryBtn: {
    backgroundColor: GREEN_BTN,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(45,106,45,0.18)',
  },
  secondaryBtnText: {
    color: GREEN_DARK,
    fontWeight: '600',
    fontSize: 16,
  },
  disclaimer: {
    fontSize: 12,
    color: GREEN_DARK,
    textAlign: 'center',
    opacity: 0.5,
    lineHeight: 18,
  },
});
