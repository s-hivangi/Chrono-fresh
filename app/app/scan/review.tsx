import React from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import { useAnalyzeMutation } from '../../src/api/produce';
import { useMeta } from '../../src/api/meta';
import { useScanSession } from '../../src/context/ScanSessionContext';
import { COLORS, SPACING, TYPOGRAPHY } from '../../src/theme';

export default function ReviewScreen() {
  const router = useRouter();
  const session = useScanSession();
  const meta = useMeta();
  const analyze = useAnalyzeMutation();
  if (!session.imageUri) return <View style={styles.center}><Text>No image selected.</Text><TouchableOpacity onPress={() => router.replace('/(tabs)/scan')}><Text style={styles.link}>Choose an image</Text></TouchableOpacity></View>;
  async function runAnalysis() {
    if (!session.imageUri) return;
    try {
      const image = await ImageManipulator.manipulateAsync(session.imageUri, [{ resize: { width: 1080 } }], { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG });
      const form = new FormData();
      form.append('file', { uri: image.uri, type: 'image/jpeg', name: 'produce.jpg' } as any);
      form.append('produce_type', session.produceType);
      const result = await analyze.mutateAsync(form);
      session.setImageUri(image.uri);
      session.setResult(result);
      router.push('/scan/result');
    } catch (error) { Alert.alert('Analysis failed', (error as Error).message); }
  }
  return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
    <Image source={{ uri: session.imageUri }} style={styles.image} resizeMode="cover" />
    <Text style={styles.label}>Produce type</Text>
    <View style={styles.choices}>{(meta.data?.produce_types ?? ['tomato', 'banana', 'guava', 'apple', 'mango']).map((type) => <TouchableOpacity key={type} onPress={() => session.setProduceType(type)} style={[styles.choice, session.produceType === type && styles.selected]}><Text style={session.produceType === type ? styles.selectedText : styles.choiceText}>{type}</Text></TouchableOpacity>)}</View>
    <Text style={styles.label}>Storage</Text>
    <View style={styles.choices}>{(meta.data?.storage_options ?? ['room', 'fridge', 'container']).map((type) => <TouchableOpacity key={type} onPress={() => session.setStorageType(type)} style={[styles.choice, session.storageType === type && styles.selected]}><Text style={session.storageType === type ? styles.selectedText : styles.choiceText}>{type}</Text></TouchableOpacity>)}</View>
    <TouchableOpacity style={styles.primary} onPress={runAnalysis} disabled={analyze.isPending}>{analyze.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Analyze</Text>}</TouchableOpacity>
    <TouchableOpacity onPress={() => router.replace('/(tabs)/scan')}><Text style={styles.change}>Change photo</Text></TouchableOpacity>
  </ScrollView>;
}
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: COLORS.bg }, content: { padding: SPACING.md }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, link: { color: COLORS.green, marginTop: 12 }, image: { width: '100%', height: 260, borderRadius: 14, marginBottom: SPACING.md }, label: { ...TYPOGRAPHY.h3, marginVertical: 10 }, choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, choice: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 8 }, selected: { backgroundColor: COLORS.green, borderColor: COLORS.green }, choiceText: { color: COLORS.text, textTransform: 'capitalize' }, selectedText: { color: '#fff', textTransform: 'capitalize', fontWeight: '700' }, primary: { backgroundColor: COLORS.green, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 28 }, primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 }, change: { color: COLORS.green, textAlign: 'center', marginTop: 16 } });
