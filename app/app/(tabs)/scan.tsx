import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useScanSession } from '../../src/context/ScanSessionContext';
import { COLORS, SPACING, TYPOGRAPHY } from '../../src/theme';

export default function ScanScreen() {
  const router = useRouter();
  const session = useScanSession();
  async function choose(camera: boolean) {
    if (camera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return Alert.alert('Camera permission needed', 'You can still select a photo from your gallery.');
    }
    const result = camera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (!result.canceled) {
      session.setImageUri(result.assets[0].uri);
      session.setResult(null);
      router.push('/scan/review');
    }
  }
  return <View style={styles.page}>
    <Text style={styles.title}>Scan Produce</Text>
    <Text style={styles.sub}>Take a clear photo in good light, or choose one from your gallery.</Text>
    <TouchableOpacity style={styles.primary} onPress={() => choose(true)}><Text style={styles.primaryText}>📷 Open Camera</Text></TouchableOpacity>
    <TouchableOpacity style={styles.secondary} onPress={() => choose(false)}><Text style={styles.secondaryText}>🖼 Choose from Gallery</Text></TouchableOpacity>
    <Text style={styles.note}>ChronoFresh estimates freshness from visible appearance. Always check smell, texture and damage too.</Text>
  </View>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: COLORS.bg, padding: SPACING.lg }, title: { ...TYPOGRAPHY.h1, marginTop: SPACING.lg }, sub: { ...TYPOGRAPHY.body, color: COLORS.muted, marginVertical: SPACING.lg }, primary: { backgroundColor: COLORS.green, padding: SPACING.md, borderRadius: 12, alignItems: 'center', marginBottom: SPACING.md }, primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 }, secondary: { backgroundColor: COLORS.surface, padding: SPACING.md, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.green }, secondaryText: { color: COLORS.green, fontWeight: '700' }, note: { ...TYPOGRAPHY.small, marginTop: SPACING.xl, lineHeight: 18 } });
