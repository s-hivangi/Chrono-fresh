import React from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useCreateProduceMutation } from '../../src/api/produce';
import { useScanSession } from '../../src/context/ScanSessionContext';
import { scheduleProduceReminder } from '../../src/utils/notifications';
import { generateScanId } from '../../src/utils/scanIds';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../src/theme';
import { STAGE_COLORS, STAGE_BG, formatDays, getRecommendation } from '../../src/utils/helpers';

/** Translate numeric confidence (0-1) into a plain label + color dot. */
function confidenceIndicator(confidence: number): { label: string; color: string } {
  if (confidence >= 0.80) return { label: 'High confidence', color: '#22c55e' };
  if (confidence >= 0.55) return { label: 'Moderate confidence', color: '#eab308' };
  return { label: 'Low confidence — scan again for a better read', color: '#f97316' };
}

export default function ResultScreen() {
  const router = useRouter();
  const session = useScanSession();
  const create = useCreateProduceMutation();
  const result = session.result;

  if (!result || !session.imageUri) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>No analysis result available.</Text>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/scan')}
          style={styles.linkBtn}
          accessibilityRole="button"
        >
          <Text style={styles.linkText}>Start a new scan</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stage = result.freshness_stage;
  const stageColor = STAGE_COLORS[stage] ?? COLORS.muted;
  const stageBg = STAGE_BG[stage] ?? '#f1f5f9';
  const { label: confLabel, color: confColor } = confidenceIndicator(result.confidence);
  const recommendation = getRecommendation(stage, result.days_remaining, result.produce_type);

  async function save() {
    if (!session.imageUri || !result) return;
    try {
      // Generate a proper scan ID before saving (increments the AsyncStorage counter)
      await generateScanId(result.produce_type);

      const form = new FormData();
      form.append('file', { uri: session.imageUri, type: 'image/jpeg', name: 'produce.jpg' } as any);
      form.append('produce_type', session.produceType);
      form.append('storage_type', session.storageType);
      form.append('analysis_token', result.analysis_token);

      const saved = await create.mutateAsync(form);
      await scheduleProduceReminder(session.produceType, result.days_remaining).catch(() => false);
      session.reset();
      // Navigate to the detail screen so the user can see their full result immediately
      router.replace(`/detail/${saved.product_id}` as any);
    } catch {
      Alert.alert(
        'Could not save',
        'Something went wrong while saving your scan. Please try again.',
      );
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      {/* Scanned image */}
      <Image source={{ uri: session.imageUri }} style={styles.image} resizeMode="cover" />

      {/* Produce type label */}
      <Text style={styles.produceLabel}>{result.produce_type.toUpperCase()}</Text>

      {/* ── Freshness banner — prominent, centered ── */}
      <View style={[styles.freshnessBanner, { backgroundColor: stageBg }]}>
        <Text style={[styles.freshnessStage, { color: stageColor }]}>{stage}</Text>
        <Text style={[styles.freshnessDays, { color: stageColor }]}>
          {formatDays(result.days_remaining)} remaining
        </Text>
      </View>

      {/* Confidence indicator (no raw numbers) */}
      <View style={styles.confidenceRow}>
        <View style={[styles.confidenceDot, { backgroundColor: confColor }]} />
        <Text style={styles.confidenceText}>{confLabel}</Text>
      </View>

      {/* Recommendation */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>What to do</Text>
        <Text style={styles.cardBody}>{recommendation}</Text>
      </View>

      {/* Disclaimer */}
      <Text style={styles.disclaimer}>
        This is an estimate based on visible appearance. Check smell, texture, and any damage before consuming.
      </Text>

      {/* Save button */}
      <TouchableOpacity
        style={[styles.primary, create.isPending && styles.primaryDisabled]}
        onPress={save}
        disabled={create.isPending}
        accessibilityRole="button"
          accessibilityLabel="Add to your stash"
      >
        {create.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryText}>Add to Your Stash</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.scanAgainBtn}
        onPress={() => { session.reset(); router.replace('/(tabs)/scan'); }}
        accessibilityRole="button"
        accessibilityLabel="Scan again"
      >
        <Text style={styles.scanAgainText}>Scan Again</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: SPACING.md, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  centerText: { ...TYPOGRAPHY.body, color: COLORS.muted, textAlign: 'center', marginBottom: SPACING.md },
  linkBtn: { paddingVertical: 12, paddingHorizontal: 24 },
  linkText: { color: COLORS.green, fontWeight: '700', fontSize: 15 },

  image: { width: '100%', height: 220, borderRadius: 14, marginBottom: SPACING.md },
  produceLabel: {
    ...TYPOGRAPHY.small,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },

  // Freshness banner
  freshnessBanner: {
    borderRadius: 14,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  freshnessStage: {
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

  // Confidence row
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  confidenceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  confidenceText: { ...TYPOGRAPHY.small, color: COLORS.muted },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardTitle: { ...TYPOGRAPHY.h3, marginBottom: 8 },
  cardBody: { ...TYPOGRAPHY.body, lineHeight: 22 },

  disclaimer: {
    ...TYPOGRAPHY.small,
    lineHeight: 18,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },

  primary: {
    backgroundColor: COLORS.green,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  primaryDisabled: { backgroundColor: COLORS.muted },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  scanAgainBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  scanAgainText: { color: COLORS.green, fontWeight: '600', fontSize: 15 },
});
