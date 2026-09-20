import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, TouchableOpacity, View, ScrollView, Switch,
} from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { isExpoGo, notificationStatus, requestNotifications } from '../../src/utils/notifications';
import { useAuth } from '../../src/context/AuthContext';
import { useAppTheme, type ThemeMode } from '../../src/context/ThemeContext';
import { SPACING, SHADOWS } from '../../src/theme';
import OutlineIcon, { type OutlineIconName } from '../../src/components/OutlineIcon';

function friendlyNotificationStatus(status: string): string {
  switch (status) {
    case 'granted':      return 'Enabled';
    case 'denied':       return 'Turned off in system settings';
    case 'undetermined': return 'Not set up yet';
    case 'checking':     return 'Checking...';
    case 'unavailable':  return 'Not available on this device';
    default:             return 'Unknown';
  }
}

const MODES: { key: ThemeMode; label: string; icon: OutlineIconName }[] = [
  { key: 'light',  label: 'Light',  icon: 'sun' },
  { key: 'system', label: 'System', icon: 'system' },
  { key: 'dark',   label: 'Dark',   icon: 'moon' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, mode, setMode } = useAppTheme();
  const { isGuest, userEmail, signOut } = useAuth();
  const [notifStatus, setNotifStatus] = useState('checking');

  useEffect(() => {
    notificationStatus().then(setNotifStatus).catch(() => setNotifStatus('unavailable'));
  }, []);

  async function enableNotifications() {
    const result = await requestNotifications();
    setNotifStatus(result);
  }

  // Dynamic styles derived from current theme colors
  const s = makeStyles(colors);

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      {/* ── Appearance ── */}
      <View style={s.card}>
        <Text style={s.cardLabel}>Appearance</Text>
        <Text style={s.cardValue}>Choose how Chrono-Fresh looks</Text>
        <View style={s.modeRow}>
          {MODES.map(({ key, label, icon }) => {
            const active = mode === key;
            return (
              <TouchableOpacity
                key={key}
                style={[s.modeBtn, active && s.modeBtnActive]}
                onPress={() => setMode(key)}
                accessibilityRole="radio"
                accessibilityLabel={`${label} mode`}
                accessibilityState={{ selected: active }}
              >
                <OutlineIcon name={icon} color={active ? colors.green : colors.muted} size={22} />
                <Text style={[s.modeLabel, active && s.modeLabelActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Account ── */}
      <View style={s.card}>
        <Text style={s.cardLabel}>Account</Text>
        {isGuest ? (
          <>
            <Text style={s.cardValue}>You are browsing without an account.</Text>
            <TouchableOpacity
              style={s.actionBtn}
              onPress={() => router.push('/login')}
              accessibilityRole="button"
              accessibilityLabel="Create an account"
            >
              <Text style={s.actionBtnText}>Create Account</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={s.cardValue}>{userEmail}</Text>
            <TouchableOpacity
              style={[s.actionBtn, s.actionBtnOutline]}
              onPress={signOut}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              <Text style={s.actionBtnOutlineText}>Sign Out</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ── Notifications ── */}
      <View style={s.card}>
        <Text style={s.cardLabel}>Reminders</Text>
        <Text style={s.cardValue}>{friendlyNotificationStatus(notifStatus)}</Text>
        {isExpoGo && (
          <Text style={s.note}>
            Reminders require a development or production build — they cannot be tested in Expo Go.
          </Text>
        )}
        {!isExpoGo && notifStatus !== 'granted' && notifStatus !== 'checking' && (
          <TouchableOpacity
            style={s.actionBtn}
            onPress={enableNotifications}
            accessibilityRole="button"
            accessibilityLabel="Enable produce reminders"
          >
            <Text style={s.actionBtnText}>Enable Reminders</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Scan history ── */}
      <TouchableOpacity
        style={s.card}
        onPress={() => router.push('/(tabs)/history' as any)}
        accessibilityRole="button"
        accessibilityLabel="View scan history"
      >
        <View style={s.linkRow}>
          <View style={s.linkContent}>
            <Text style={s.cardLabel}>Scan History</Text>
            <Text style={s.cardValue}>View all past scans</Text>
          </View>
          <Text style={s.chevron}>›</Text>
        </View>
      </TouchableOpacity>

      {/* ── About ── */}
      <View style={s.card}>
        <Text style={s.cardLabel}>About Chrono-Fresh</Text>
        <Text style={s.cardValue}>Version {Constants.expoConfig?.version ?? '1.0.0'}</Text>
        <Text style={s.disclaimer}>
          Chrono-Fresh provides a visual freshness estimate based on the appearance of your produce.
          Always use your judgement — check smell, texture, and any visible damage before consuming.
          This app is not a substitute for food safety guidance.
        </Text>
      </View>
    </ScrollView>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeStyles(colors: any) {
  return StyleSheet.create({
    page:    { flex: 1, backgroundColor: colors.bg },
    content: { padding: SPACING.md, paddingBottom: 40 },
    title:   { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: SPACING.md },
    card: {
      backgroundColor: colors.surface,
      padding: SPACING.md,
      borderRadius: 12,
      marginBottom: SPACING.sm,
      ...SHADOWS.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardLabel: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 6 },
    cardValue: { fontSize: 14, color: colors.muted, lineHeight: 20 },
    note: {
      fontSize: 12,
      color: '#c77b20',
      lineHeight: 18,
      marginTop: SPACING.sm,
    },
    disclaimer: {
      fontSize: 12,
      color: colors.muted,
      lineHeight: 18,
      marginTop: SPACING.sm,
    },

    // Mode picker
    modeRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
      marginTop: SPACING.sm,
    },
    modeBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: SPACING.sm,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      gap: 4,
    },
    modeBtnActive: {
      borderColor: colors.green,
      backgroundColor: colors.surface,
      ...SHADOWS.sm,
    },
    modeIcon:  { fontSize: 20 },
    modeLabel: { fontSize: 12, fontWeight: '500', color: colors.muted },
    modeLabelActive: { color: colors.green, fontWeight: '700' },

    // Buttons
    actionBtn: {
      backgroundColor: colors.green,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: SPACING.md,
      marginTop: SPACING.sm,
      alignItems: 'center' as const,
    },
    actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    actionBtnOutline: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.red,
    },
    actionBtnOutlineText: { color: colors.red, fontWeight: '700', fontSize: 14 },

    // Links
    linkRow:     { flexDirection: 'row', alignItems: 'center' },
    linkContent: { flex: 1 },
    chevron:     { fontSize: 20, color: colors.muted, marginLeft: SPACING.xs },
  });
}
