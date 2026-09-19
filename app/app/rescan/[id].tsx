import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRescanMutation } from '../../src/api/produce';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../src/theme';

export default function RescanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const rescanMutation = useRescanMutation(id);

  async function pickImage() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status === 'granted') {
      const result = await ImagePicker.launchCameraAsync({ quality: 1 });
      if (!result.canceled) setImageUri(result.assets[0].uri);
    } else {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
      if (!result.canceled) setImageUri(result.assets[0].uri);
    }
  }

  async function handleRescan() {
    if (!imageUri) return;
    const compressed = await ImageManipulator.manipulateAsync(
      imageUri, [{ resize: { width: 1080 } }],
      { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG },
    );
    const fd = new FormData();
    fd.append('file', { uri: compressed.uri, type: 'image/jpeg', name: 'rescan.jpg' } as any);
    rescanMutation.mutate(fd, {
      onSuccess: () => {
        Alert.alert('Rescan saved!', 'The freshness timeline has been updated.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      },
      onError: (err) => Alert.alert('Error', err.message),
    });
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.heading}>Rescan Produce</Text>
      <Text style={styles.sub}>Upload a new image to update the freshness reading for this item.</Text>

      <View style={styles.pickRow}>
        <TouchableOpacity style={styles.pickBtn} onPress={pickImage}>
          <Text style={styles.pickBtnText}>📷 Take / Choose Photo</Text>
        </TouchableOpacity>
      </View>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
      )}

      <TouchableOpacity
        style={[styles.actionBtn, (!imageUri || rescanMutation.isPending) && styles.disabledBtn]}
        onPress={handleRescan}
        disabled={!imageUri || rescanMutation.isPending}
      >
        {rescanMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.actionBtnText}>Save Rescan</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: SPACING.md, paddingBottom: 40 },
  backRow: { marginBottom: SPACING.sm },
  backText: { color: COLORS.green, fontWeight: '600', fontSize: 15 },
  heading: { ...TYPOGRAPHY.h1, marginBottom: SPACING.sm },
  sub: { ...TYPOGRAPHY.body, color: COLORS.muted, marginBottom: SPACING.md },
  pickRow: { marginBottom: SPACING.md },
  pickBtn: { backgroundColor: COLORS.green, borderRadius: 12, padding: SPACING.md, alignItems: 'center', ...SHADOWS.md },
  pickBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  preview: { width: '100%', height: 220, borderRadius: 12, marginBottom: SPACING.md },
  actionBtn: { backgroundColor: COLORS.green, borderRadius: 12, padding: SPACING.md, alignItems: 'center', ...SHADOWS.md },
  disabledBtn: { backgroundColor: '#a1a1aa' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
