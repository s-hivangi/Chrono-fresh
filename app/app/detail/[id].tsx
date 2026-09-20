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
import { STAGE_COLORS, STAGE_BG, cap, formatDays, getRecommendation } from '../../src/utils/helpers';
import { deriveScanId } from '../../src/utils/scanIds';
import OutlineIcon from '../../src/components/OutlineIcon';

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: produce, isLoading, isError } = useProduceById(id);
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
              onSuccess: () => router.replace('/(tabs)' as any),
              onError: () =>
                Alert.alert('Something went wrong', 'Could not update this item. Please try again.'),
            }),
        },
      ],
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.green} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (isError || !produce) {
    return (
      <View style={styles.center}>
        <OutlineIcon name="warning" color={COLORS.orange} size={36} />
        <Text style={styles.errorText}>
          Could not load this item. It may have been removed, or there was a connection problem.
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const latestHistory = history[0];
  const isCompleted = produce.status === 'completed';
  const stage = produce.latest_stage;
  const days = produce.latest_days_remaining;
  const stageColor = stage ? (STAGE_COLORS[stage] ?? COLORS.muted) : COLORS.muted;
  const stageBg = stage ? (STAGE_BG[stage] ?? '#f1f5f9') : '#f1f5f9';

  // Date-based Scan ID — derived from backend data, stable and displayable
  const scanId = deriveScanId(produce.product_id, produce.produce_type, produce.date_added);

  // Recommendation generated entirely on the frontend
  const recommendation = getRecommendation(stage, days, produce.produce_type);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Product name + scan ID */}
      <Text style={styles.name}>{produce.display_name ?? cap(produce.produce_type)}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.type}>{cap(produce.produce_type)}</Text>
        <Text style={styles.scanId}>ID: {scanId}</Text>
      </View>
      {produce.completed_at && (
        <Text style={styles.completed}>
          Completed {new Date(produce.completed_at).toLocaleDateString()}
        </Text>
      )}

      {/* Thumbnail */}
      {produce.latest_thumbnail_url ? (
        <Image
          source={{ uri: `${API_BASE_URL}${produce.latest_thumbnail_url}` }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <OutlineIcon name="produce" color={COLORS.muted} size={60} />
        </View>
      )}

      {/* ── FRESHNESS BANNER — prominent, centered, below image ── */}
      {stage ? (
        <View style={[styles.freshnessBanner, { backgroundColor: stageBg }]}>
          <Text style={[styles.freshnessLabel, { color: stageColor }]}>{stage}</Text>
          {days != null && (
            <Text style={[styles.freshnessDays, { color: stageColor }]}>
              {formatDays(days)} remaining
            </Text>
          )}
        </View>
      ) : (
        <View style={[styles.freshnessBanner, { backgroundColor: '#f1f5f9' }]}>
          <Text style={[styles.freshnessLabel, { color: COLORS.muted }]}>Pending analysis</Text>
        </View>
      )}

      {/* Metrics row */}
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{cap(produce.storage_type ?? 'room')}</Text>
          <Text style={styles.metricLabel}>Storage</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>
            {isCompleted ? cap(produce.outcome ?? 'Done') : 'Active'}
          </Text>
          <Text style={styles.metricLabel}>Status</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>
            {produce.date_added ? new Date(produce.date_added).toLocaleDateString() : '—'}
          </Text>
          <Text style={styles.metricLabel}>Date Added</Text>
        </View>
      </View>

      {/* Recommendation */}
      <View style={styles.adviceBox}>
        <Text style={styles.adviceLabel}>What to do</Text>
        <Text style={styles.adviceText}>{recommendation}</Text>
      </View>

      {/* Actions */}
      {!isCompleted && (
        <View style={styles.actionsBox}>
          <TouchableOpacity
            style={styles.rescanBtn}
            onPress={() => router.push(`/rescan/${id}` as any)}
            accessibilityRole="button"
            accessibilityLabel="Rescan this item"
          >
            <Text style={styles.rescanBtnText}>Rescan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.consumeBtn}
            onPress={() => handleComplete('consumed')}
            disabled={completeMutation.isPending}
            accessibilityRole="button"
            accessibilityLabel="Mark as used"
          >
            <Text style={styles.consumeBtnText}>Mark as Used</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.discardBtn}
            onPress={() => handleComplete('discarded')}
            disabled={completeMutation.isPending}
            accessibilityRole="button"
            accessibilityLabel="Mark as discarded"
          >
            <Text style={styles.discardBtnText}>Discard</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Scan history strip */}
      {history.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.histLabel}>Scan History ({history.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {history.map((img) => (
              <View key={img.image_id} style={styles.histItem}>
                {img.thumbnail_url && (
                  <Image
                    source={{ uri: `${API_BASE_URL}${img.thumbnail_url}` }}
                    style={styles.histThumb}
                    resizeMode="cover"
                  />
                )}
                <Text style={styles.histDate}>
                  {new Date(img.capture_date).toLocaleDateString()}
                </Text>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bg,
    padding: SPACING.lg,
  },
  loadingText: { ...TYPOGRAPHY.body, color: COLORS.muted },
  errorIcon: { fontSize: 32 },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: { color: '#fff', fontWeight: '600' },

  name: { ...TYPOGRAPHY.h1, marginBottom: 4 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  type: { ...TYPOGRAPHY.small },
  scanId: { fontSize: 11, color: COLORS.muted, fontFamily: 'SpaceMono' },
  completed: { ...TYPOGRAPHY.small, marginBottom: SPACING.sm },

  image: { width: '100%', height: 240, borderRadius: 14, marginVertical: SPACING.md },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    marginVertical: SPACING.md,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Freshness banner ──
  freshnessBanner: {
    borderRadius: 14,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  freshnessLabel: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  freshnessDays: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },

  metricsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  metric: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: SPACING.sm,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  metricValue: { fontSize: 14, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  metricLabel: { ...TYPOGRAPHY.small, textAlign: 'center', marginTop: 2 },

  adviceBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  adviceLabel: { ...TYPOGRAPHY.h3, marginBottom: 8 },
  adviceText: { ...TYPOGRAPHY.body, lineHeight: 22, color: COLORS.text },

  actionsBox: { gap: SPACING.sm, marginBottom: SPACING.md },
  rescanBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.green,
  },
  rescanBtnText: { color: COLORS.green, fontWeight: '700' },
  consumeBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  consumeBtnText: { color: '#fff', fontWeight: '700' },
  discardBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.red,
  },
  discardBtnText: { color: COLORS.red, fontWeight: '700' },

  historySection: { marginBottom: SPACING.md },
  histLabel: { ...TYPOGRAPHY.h3, marginBottom: SPACING.sm },
  histItem: { width: 100, marginRight: SPACING.sm, gap: 4 },
  histThumb: { width: 100, height: 80, borderRadius: 8 },
  histDate: { ...TYPOGRAPHY.small, textAlign: 'center' },
});
