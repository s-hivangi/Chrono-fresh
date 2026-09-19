import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useDashboard } from '../../src/api/dashboard';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../src/theme';
import ProduceCard from '../../src/components/ProduceCard';

export default function HomeScreen() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboard();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.green} />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>⚠ {(error as Error).message}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { stats, use_first = [], all_active = [] } = data!;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => { void refetch(); }} colors={[COLORS.green]} />}
    >
      <View style={styles.headingRow}><Text style={styles.heading}>ChronoFresh</Text><TouchableOpacity onPress={() => router.push('/settings')}><Text style={styles.settings}>⚙ Settings</Text></TouchableOpacity></View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.active_count}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: COLORS.orange }]}>
          <Text style={[styles.statValue, { color: COLORS.orange }]}>{stats.use_soon_count}</Text>
          <Text style={styles.statLabel}>Use Soon</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: COLORS.green }]}>
          <Text style={[styles.statValue, { color: COLORS.green }]}>{stats.fresh_count}</Text>
          <Text style={styles.statLabel}>Fresh</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: COLORS.red }]}>
          <Text style={[styles.statValue, { color: COLORS.red }]}>{stats.spoiled_count}</Text>
          <Text style={styles.statLabel}>Spoiled</Text>
        </View>
      </View>

      {/* Scan button */}
      <TouchableOpacity
        style={styles.scanBtn}
        onPress={() => router.push('/(tabs)/scan' as any)}
      >
        <Text style={styles.scanBtnText}>📷  Scan New Produce</Text>
      </TouchableOpacity>

      {/* Use First */}
      {use_first.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Use First</Text>
          {use_first.map((p) => (
            <ProduceCard
              key={p.product_id}
              produce={p}
              onPress={() => router.push(`/detail/${p.product_id}` as any)}
            />
          ))}
        </View>
      )}

      {/* All active */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Good for Later</Text>
        {all_active.length === 0 ? (
          <Text style={styles.emptyText}>Nothing yet — tap Scan to get started.</Text>
        ) : (
          all_active.filter((p) => !use_first.some((urgent) => urgent.product_id === p.product_id)).map((p) => (
            <ProduceCard
              key={p.product_id}
              produce={p}
              onPress={() => router.push(`/detail/${p.product_id}` as any)}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: SPACING.md, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.md, backgroundColor: COLORS.bg },
  heading: { ...TYPOGRAPHY.h1, marginBottom: SPACING.md },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settings: { color: COLORS.green, fontWeight: '600' },
  loadingText: { ...TYPOGRAPHY.body, marginTop: SPACING.sm, color: COLORS.muted },
  errorText: { ...TYPOGRAPHY.body, color: COLORS.red, marginBottom: SPACING.sm, textAlign: 'center' },
  retryBtn: { backgroundColor: COLORS.green, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: '#fff', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 10, padding: SPACING.sm, borderTopWidth: 3, borderTopColor: COLORS.muted, ...SHADOWS.sm },
  statValue: { fontSize: 20, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  statLabel: { fontSize: 11, color: COLORS.muted, textAlign: 'center', marginTop: 2 },
  scanBtn: { backgroundColor: COLORS.green, borderRadius: 12, padding: SPACING.md, alignItems: 'center', marginBottom: SPACING.md, ...SHADOWS.md },
  scanBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  section: { marginBottom: SPACING.md },
  sectionTitle: { ...TYPOGRAPHY.h2, marginBottom: SPACING.sm },
  emptyText: { ...TYPOGRAPHY.body, color: COLORS.muted, textAlign: 'center', paddingVertical: SPACING.md },
});
