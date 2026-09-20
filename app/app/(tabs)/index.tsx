import React from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDashboard } from '../../src/api/dashboard';
import { SPACING, SHADOWS } from '../../src/theme';
import { useAppTheme } from '../../src/context/ThemeContext';
import ProduceCard from '../../src/components/ProduceCard';
import OutlineIcon from '../../src/components/OutlineIcon';
import { formatDays } from '../../src/utils/helpers';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { data, isLoading, isError, refetch, isFetching } = useDashboard();
  const s = makeStyles(colors);

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.green} />
        <Text style={s.loadingText}>Loading your produce...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={s.center}>
        <OutlineIcon name="warning" color={colors.orange} size={32} />
        <Text style={s.errorText}>
          Could not connect to the app right now. Make sure you are on the same network as the server, then try again.
        </Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => refetch()}>
          <Text style={s.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { stats, use_first = [], all_active = [] } = data!;
  const freshnessScore = stats.active_count > 0
    ? Math.round((stats.fresh_count / stats.active_count) * 100)
    : 0;
  const soonest = [...use_first, ...all_active.filter(
    (item) => !use_first.some((urgent) => urgent.product_id === item.product_id),
  )].slice(0, 3);

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.container}
      refreshControl={
        <RefreshControl
          refreshing={isFetching}
          onRefresh={() => { void refetch(); }}
          colors={[colors.green]}
        />
      }
    >
      <View style={s.heroHeader}>
        <View>
          <Text style={s.eyebrow}>CHRONO-FRESH</Text>
          <Text style={s.heading}>Your Kitchen Dashboard</Text>
          <Text style={s.subheading}>A quick read on what is fresh today.</Text>
        </View>
        <View style={[s.heroIcon, { borderColor: colors.green }]}>
          <OutlineIcon name="produce" color={colors.green} size={26} />
        </View>
      </View>

      <View style={[s.scoreCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={s.scoreCopy}>
          <Text style={s.cardKicker}>KITCHEN FRESHNESS INDEX</Text>
          <Text style={s.scoreTitle}>{freshnessScore}%</Text>
          <Text style={s.scoreNote}>{stats.fresh_count} fresh item{stats.fresh_count === 1 ? '' : 's'} today</Text>
        </View>
        <View style={[s.scoreRing, { borderColor: colors.green }]}>
          <View style={[s.scoreRingInner, { backgroundColor: colors.bg }]}>
            <Text style={[s.scoreRingText, { color: colors.green }]}>{freshnessScore}</Text>
          </View>
        </View>
      </View>

      <View style={s.metricGrid}>
        <Metric label="Items tracked" value={stats.active_count} icon="produce" color={colors.green} styles={s} />
        <Metric label="Fresh today" value={stats.fresh_count} icon="check" color={colors.green} styles={s} />
        <Metric label="Expiring soon" value={stats.use_soon_count} icon="warning" color={colors.orange} styles={s} />
      </View>

      <TouchableOpacity
        style={s.scanBtn}
        onPress={() => router.push('/(tabs)/scan' as any)}
        accessibilityRole="button"
        accessibilityLabel="Scan new produce"
      >
        <OutlineIcon name="scan" color={colors.surface} size={20} />
        <Text style={s.scanBtnText}>Add More Produce</Text>
      </TouchableOpacity>

      <View style={s.section}>
        <View style={s.sectionHeader}>
          <View>
            <Text style={s.sectionTitle}>Soonest to go</Text>
            <Text style={s.sectionNote}>Use these next to keep your kitchen fresh.</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/produce' as any)} accessibilityRole="button">
            <Text style={[s.viewAll, { color: colors.green }]}>View stash</Text>
          </TouchableOpacity>
        </View>
        {soonest.length === 0 ? (
          <View style={s.emptyState}>
            <OutlineIcon name="produce" color={colors.muted} size={48} />
            <Text style={s.emptyTitle}>Your stash is empty</Text>
            <Text style={s.emptyBody}>
              Tap "Add More Produce" above to start tracking freshness.
            </Text>
          </View>
        ) : (
          soonest.map((p) => (
            <ProduceCard key={p.product_id} produce={p} onPress={() => router.push(`/detail/${p.product_id}` as any)} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

function Metric({ label, value, icon, color, styles: s }: { label: string; value: number; icon: 'produce' | 'check' | 'warning'; color: string; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={s.metricCard}>
      <View style={[s.metricIcon, { backgroundColor: color }]}>
        <OutlineIcon name={icon} color="#FFFFFF" size={17} />
      </View>
      <Text style={s.metricValue}>{value}</Text>
      <Text style={s.metricLabel}>{label}</Text>
    </View>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeStyles(colors: any) {
  return StyleSheet.create({
    scroll:       { flex: 1, backgroundColor: colors.bg },
    container:    { padding: SPACING.md, paddingBottom: 40 },
    center: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      padding: SPACING.lg, backgroundColor: colors.bg, gap: SPACING.sm,
    },
    heroHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
    eyebrow:      { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: colors.green, marginBottom: 4 },
    heading:      { fontSize: 25, fontWeight: '700', color: colors.text },
    subheading:   { fontSize: 13, color: colors.muted, marginTop: 4 },
    heroIcon:     { width: 52, height: 52, borderWidth: 1.5, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
    loadingText:  { fontSize: 14, color: colors.muted, marginTop: SPACING.sm },
    errorIcon:    { fontSize: 32, marginBottom: SPACING.xs },
    errorText:    { fontSize: 14, color: colors.text, textAlign: 'center', lineHeight: 22 },
    retryBtn:     { backgroundColor: colors.green, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10, marginTop: SPACING.xs },
    retryText:    { color: '#fff', fontWeight: '600' },
    scoreCard:    { minHeight: 148, borderWidth: 1, borderRadius: 18, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...SHADOWS.sm },
    scoreCopy:    { flex: 1 },
    cardKicker:   { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: colors.muted },
    scoreTitle:   { fontSize: 48, lineHeight: 56, fontWeight: '700', color: colors.text, marginTop: 4 },
    scoreNote:    { fontSize: 13, color: colors.muted },
    scoreRing:    { width: 104, height: 104, borderRadius: 52, borderWidth: 10, alignItems: 'center', justifyContent: 'center' },
    scoreRingInner: { width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center' },
    scoreRingText: { fontSize: 27, fontWeight: '700' },
    metricGrid:   { flexDirection: 'row', gap: SPACING.sm, marginVertical: SPACING.md },
    metricCard:   { flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: SPACING.sm, minHeight: 94, borderWidth: 1, borderColor: colors.border },
    metricIcon:   { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    metricValue:  { fontSize: 21, fontWeight: '700', color: colors.text },
    metricLabel:  { fontSize: 11, color: colors.muted, marginTop: 2 },
    scanBtn: {
      backgroundColor: colors.green, borderRadius: 12, padding: SPACING.md,
      alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg, ...SHADOWS.md,
    },
    scanBtnText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
    section:       { marginBottom: SPACING.md },
    sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: SPACING.sm },
    sectionTitle:  { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 4 },
    sectionNote:   { fontSize: 12, color: colors.muted, marginBottom: SPACING.sm },
    viewAll:       { fontSize: 12, fontWeight: '600', marginTop: 3 },
    emptyState:    { alignItems: 'center', paddingVertical: SPACING.xl, paddingHorizontal: SPACING.md },
    emptyIcon:     { fontSize: 48, marginBottom: SPACING.sm },
    emptyTitle:    { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: SPACING.xs, textAlign: 'center' },
    emptyBody:     { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 22 },
  });
}
