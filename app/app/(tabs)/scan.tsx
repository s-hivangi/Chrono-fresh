import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useScanSession } from '../../src/context/ScanSessionContext';
import { SPACING, TYPOGRAPHY } from '../../src/theme';
import { useAppTheme } from '../../src/context/ThemeContext';
import OutlineIcon from '../../src/components/OutlineIcon';

export default function ScanScreen() {
  const router = useRouter();
  const session = useScanSession();
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
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
    <TouchableOpacity style={styles.primary} onPress={() => choose(true)}>
      <OutlineIcon name="scan" color="#fff" size={20} />
      <Text style={styles.primaryText}>Open Camera</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.secondary} onPress={() => choose(false)}>
      <OutlineIcon name="image" color={colors.green} size={20} />
      <Text style={styles.secondaryText}>Choose from Gallery</Text>
    </TouchableOpacity>
    <Text style={styles.note}>ChronoFresh estimates freshness from visible appearance. Always check smell, texture and damage too.</Text>
  </View>;
}

function makeStyles(colors: typeof import('../../src/theme').COLORS) {
  return StyleSheet.create({ page: { flex: 1, backgroundColor: colors.bg, padding: SPACING.lg }, title: { ...TYPOGRAPHY.h1, color: colors.text, marginTop: SPACING.lg }, sub: { ...TYPOGRAPHY.body, color: colors.muted, marginVertical: SPACING.lg }, primary: { backgroundColor: colors.green, padding: SPACING.md, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md }, primaryText: { color: colors.surface, fontWeight: '700', fontSize: 16 }, secondary: { backgroundColor: colors.surface, padding: SPACING.md, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: SPACING.sm, borderWidth: 1, borderColor: colors.green }, secondaryText: { color: colors.green, fontWeight: '700' }, note: { ...TYPOGRAPHY.small, color: colors.muted, marginTop: SPACING.xl, lineHeight: 18 } });
}
