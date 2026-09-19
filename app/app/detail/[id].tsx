import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useProduceById, useProduceHistory,
  useCompleteMutation,
} from '../../src/api/produce';
import { API_BASE_URL } from '../../src/api/client';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../src/theme';
import { StageBadge } from '../../src/components/StageBadge';
import { cap } from '../../src/utils/helpers';

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: produce, isLoading, isError, error } = useProduceById(id);
  const { data: history = [] } = useProduceHistory(id);
  const completeMutation = useCompleteMutation(id);

  function handleComplete(outcome: 'consumed' | 'discarded') {
    Alert.alert(
      outcome === 'consumed' ? 'Mark as Used?' : 'Mark as Discarded?',
      `Are you sure you want to mark this as ${outcome}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: outcome === 'discarded' ? 'destructive' : 'default',
          onPress: () =>
            completeMutation.mutate(outcome, {
              onSuccess: () => router.replace('/(tabs)/history' as any),
              onError: (err) => Alert.alert('Error', err.message),
            }),
        },
      ],
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.green} />
      </View>
    );
  }

  if (isError || !produce) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>⚠ {(error as Error)?.message ?? 'Not found'}</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ color: COLORS.green }}>← Go back</Text></TouchableOpacity>
      </View>
    );
  }

  const latestHistory = history[0];
  const isCompleted = produce.status === 'completed';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <StageBadge stage={produce.latest_stage} />
      </View>

      <Text style={styles.name}>{produce.display_name}</Text>
      <Text style={styles.type}>{cap(produce.produce_type)}</Text>
      {produce.completed_at && <Text style={styles.completed}>Completed {new Date(produce.completed_at).toLocaleString()}</Text>}

      {/* Thumbnail */}
      {produce.latest_thumbnail_url ? (
        <Image
          source={{ uri: `${API_BASE_URL}${produce.latest_thumbnail_url}` }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={{ fontSize: 60 }}>🥦</Text>
        </View>
      )}

      {/* Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{produce.latest_days_remaining != null ? `${produce.latest_days_remaining.toFixed(1)} days` : '—'}</Text>
          <Text style={styles.metricLabel}>Shelf Life Left</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{cap(produce.storage_type ?? 'room')}</Text>
          <Text style={styles.metricLabel}>Storage</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{isCompleted ? cap(produce.outcome ?? '') : 'Active'}</Text>
          <Text style={styles.metricLabel}>Status</Text>
        </View>
      </View>

      {/* Latest advice */}
      {latestHistory?.prediction?.advice && (
        <View style={styles.adviceBox}>
          <Text style={styles.adviceLabel}>Recommendation</Text>
          <Text style={styles.adviceText}>{latestHistory.prediction.advice}</Text>
        </View>
      )}

      {/* Actions */}
      {!isCompleted && (
        <View style={styles.actionsBox}>
          <TouchableOpacity
            style={styles.rescanBtn}
            onPress={() => router.push(`/rescan/${id}` as any)}
          >
            <Text style={styles.rescanBtnText}>📷 Rescan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.consumeBtn}
            onPress={() => handleComplete('consumed')}
            disabled={completeMutation.isPending}
          >
            <Text style={styles.consumeBtnText}>✅ Mark Used</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.discardBtn}
            onPress={() => handleComplete('discarded')}
            disabled={completeMutation.isPending}
          >
            <Text style={styles.discardBtnText}>🗑 Discard</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Scan history */}
      {history.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.histLabel}>Scan History ({history.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {history.map((img) => (
              <View key={img.image_id} style={styles.histItem}>
                {img.thumbnail_url && (
                  <Image source={{ uri: `${API_BASE_URL}${img.thumbnail_url}` }} style={styles.histThumb} resizeMode="cover" />
                )}
                <Text style={styles.histDate}>{new Date(img.capture_date).toLocaleDateString()}</Text>
                {img.prediction && <StageBadge stage={img.prediction.freshness_stage} />}
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: SPACING.md, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: COLORS.bg },
  errorText: { ...TYPOGRAPHY.body, color: COLORS.red },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  backBtn: { color: COLORS.green, fontWeight: '600', fontSize: 15 },
  name: { ...TYPOGRAPHY.h1, marginBottom: 2 },
  type: { ...TYPOGRAPHY.small, marginBottom: SPACING.md },
  completed: { ...TYPOGRAPHY.small, marginBottom: SPACING.md },
  image: { width: '100%', height: 240, borderRadius: 14, marginBottom: SPACING.md },
  imagePlaceholder: { width: '100%', height: 200, borderRadius: 14, marginBottom: SPACING.md, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  metricsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  metric: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 10, padding: SPACING.sm, alignItems: 'center', ...SHADOWS.sm },
  metricValue: { fontSize: 16, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  metricLabel: { ...TYPOGRAPHY.small, textAlign: 'center', marginTop: 2 },
  adviceBox: { backgroundColor: COLORS.surface, borderRadius: 10, padding: SPACING.sm, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  adviceLabel: { ...TYPOGRAPHY.small, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  adviceText: { ...TYPOGRAPHY.body },
  actionsBox: { gap: SPACING.sm, marginBottom: SPACING.md },
  rescanBtn: { backgroundColor: COLORS.surface, borderRadius: 10, padding: SPACING.sm + 2, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.green },
  rescanBtnText: { color: COLORS.green, fontWeight: '700' },
  consumeBtn: { backgroundColor: COLORS.green, borderRadius: 10, padding: SPACING.sm + 2, alignItems: 'center', ...SHADOWS.sm },
  consumeBtnText: { color: '#fff', fontWeight: '700' },
  discardBtn: { backgroundColor: COLORS.surface, borderRadius: 10, padding: SPACING.sm + 2, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.red },
  discardBtnText: { color: COLORS.red, fontWeight: '700' },
  historySection: { marginBottom: SPACING.md },
  histLabel: { ...TYPOGRAPHY.h3, marginBottom: SPACING.sm },
  histItem: { width: 100, marginRight: SPACING.sm, gap: 4 },
  histThumb: { width: 100, height: 80, borderRadius: 8 },
  histDate: { ...TYPOGRAPHY.small, textAlign: 'center' },
});
