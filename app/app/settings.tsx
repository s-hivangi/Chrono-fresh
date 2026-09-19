import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Constants from 'expo-constants';
import { API_BASE_URL } from '../src/api/client';
import { isExpoGo, notificationStatus, requestNotifications } from '../src/utils/notifications';
import { COLORS, SPACING, TYPOGRAPHY } from '../src/theme';

export default function SettingsScreen() {
  const [status, setStatus] = useState('checking');
  useEffect(() => { notificationStatus().then(setStatus).catch(() => setStatus('unavailable')); }, []);
  async function enable() { setStatus(await requestNotifications()); }
  return <View style={styles.page}>
    <Text style={styles.title}>Settings</Text>
    <View style={styles.card}><Text style={styles.label}>Notifications</Text><Text style={styles.value}>Permission: {status}</Text>{isExpoGo && <Text style={styles.note}>Expo Go cannot test push notifications on Android. Use a development build for notification testing.</Text>}{!isExpoGo && status !== 'granted' && <TouchableOpacity style={styles.button} onPress={enable}><Text style={styles.buttonText}>Enable local reminders</Text></TouchableOpacity>}</View>
    <View style={styles.card}><Text style={styles.label}>Connection</Text><Text style={styles.value}>{API_BASE_URL}</Text></View>
    <View style={styles.card}><Text style={styles.label}>About ChronoFresh</Text><Text style={styles.value}>Version {Constants.expoConfig?.version ?? '1.0.0'}</Text><Text style={styles.disclaimer}>ChronoFresh provides a visual estimate only. Check smell, texture, damage and standard food-safety guidance before consuming produce.</Text></View>
  </View>;
}
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: COLORS.bg, padding: SPACING.md }, title: { ...TYPOGRAPHY.h1, marginBottom: SPACING.md }, card: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, marginBottom: 12 }, label: { ...TYPOGRAPHY.h3, marginBottom: 8 }, value: { ...TYPOGRAPHY.body, color: COLORS.muted }, note: { ...TYPOGRAPHY.small, color: '#c77b20', lineHeight: 18, marginTop: 10 }, disclaimer: { ...TYPOGRAPHY.small, lineHeight: 18, marginTop: 12 }, button: { backgroundColor: COLORS.green, borderRadius: 8, padding: 10, marginTop: 12, alignItems: 'center' }, buttonText: { color: '#fff', fontWeight: '700' } });
