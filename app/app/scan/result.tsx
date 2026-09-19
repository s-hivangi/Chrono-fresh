import React from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useCreateProduceMutation } from '../../src/api/produce';
import { useScanSession } from '../../src/context/ScanSessionContext';
import { scheduleProduceReminder } from '../../src/utils/notifications';
import { COLORS, SPACING, TYPOGRAPHY } from '../../src/theme';

export default function ResultScreen() {
  const router = useRouter();
  const session = useScanSession();
  const create = useCreateProduceMutation();
  const result = session.result;
  if (!result || !session.imageUri) return <View style={styles.center}><Text>No analysis result available.</Text><TouchableOpacity onPress={() => router.replace('/(tabs)/scan')}><Text style={styles.link}>Start a scan</Text></TouchableOpacity></View>;
  async function save() {
    if (!session.imageUri || !result) return;
    const form = new FormData();
    form.append('file', { uri: session.imageUri, type: 'image/jpeg', name: 'produce.jpg' } as any);
    form.append('produce_type', session.produceType);
    form.append('storage_type', session.storageType);
    form.append('analysis_token', result.analysis_token);
    try {
      const saved = await create.mutateAsync(form);
      await scheduleProduceReminder(session.produceType, result.days_remaining).catch(() => false);
      session.reset();
      router.replace(`/detail/${saved.product_id}`);
    } catch (error) { Alert.alert('Could not save', (error as Error).message); }
  }
  return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
    <Image source={{ uri: session.imageUri }} style={styles.image} resizeMode="cover" />
    <Text style={styles.produce}>{result.produce_type}</Text><Text style={styles.stage}>{result.freshness_stage}</Text>
    <View style={styles.metrics}><View style={styles.metric}><Text style={styles.value}>{result.days_remaining_display}</Text><Text style={styles.caption}>remaining</Text></View><View style={styles.metric}><Text style={styles.value}>{Math.round(result.confidence * 100)}%</Text><Text style={styles.caption}>confidence</Text></View></View>
    <View style={styles.card}><Text style={styles.cardTitle}>Recommendation</Text><Text style={styles.body}>{result.advice}</Text><Text style={styles.body}>Storage: {result.refrigeration_trigger ? 'Refrigerate promptly' : session.storageType}</Text><Text style={styles.body}>Priority: {result.fifo_priority}</Text></View>
    <Text style={styles.disclaimer}>ChronoFresh provides an estimate based on visible appearance. Check smell, texture, damage and normal food-safety guidance before consuming.</Text>
    <TouchableOpacity style={styles.primary} onPress={save} disabled={create.isPending}>{create.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Add to My Produce</Text>}</TouchableOpacity>
    <TouchableOpacity onPress={() => { session.reset(); router.replace('/(tabs)/scan'); }}><Text style={styles.link}>Scan Again</Text></TouchableOpacity>
  </ScrollView>;
}
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: COLORS.bg }, content: { padding: SPACING.md, paddingBottom: 40 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, image: { width: '100%', height: 220, borderRadius: 14 }, produce: { ...TYPOGRAPHY.small, textTransform: 'uppercase', marginTop: 16 }, stage: { ...TYPOGRAPHY.h1, color: COLORS.green, marginBottom: 16 }, metrics: { flexDirection: 'row', gap: 10 }, metric: { flex: 1, backgroundColor: COLORS.surface, padding: 16, borderRadius: 12 }, value: { fontSize: 20, fontWeight: '700', color: COLORS.text }, caption: { ...TYPOGRAPHY.small }, card: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginTop: 14, gap: 8 }, cardTitle: { ...TYPOGRAPHY.h3 }, body: { ...TYPOGRAPHY.body }, disclaimer: { ...TYPOGRAPHY.small, lineHeight: 18, marginVertical: 16 }, primary: { backgroundColor: COLORS.green, padding: 16, borderRadius: 12, alignItems: 'center' }, primaryText: { color: '#fff', fontWeight: '700' }, link: { color: COLORS.green, textAlign: 'center', marginTop: 16 } });
