import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDashboard } from '../../src/api/dashboard';
import { SPACING, SHADOWS } from '../../src/theme';
import { useAppTheme } from '../../src/context/ThemeContext';
import { isUrgent, formatDays, STAGE_COLORS, STAGE_BG } from '../../src/utils/helpers';
import { API_BASE_URL } from '../../src/api/client';
import type { ProductOut } from '../../src/types/api';
import OutlineIcon from '../../src/components/OutlineIcon';

export default function AlertsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboard();
  const [now, setNow] = useState(() => Date.now());
  const s = makeStyles(colors);

  // Alert status is time-derived. This keeps the screen accurate even while it
  // stays open at the exact moment a shelf-life window ends.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.green} />
        <Text style={s.loadingText}>Checking your produce...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={s.center}>
        <OutlineIcon name="warning" color={colors.orange} size={32} />
        <Text style={s.errorText}>{error?.message ?? 'Could not load your alerts right now.'}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => refetch()}>
          <Text style={s.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { use_first = [], all_active = [], recheck_due: serverDue = [] } = data!;
  const locallyDue = all_active.filter((item) => {
    if (!item.next_recheck_at) return false;
    const dueAt = new Date(item.next_recheck_at).getTime();
    return !Number.isNaN(dueAt) && dueAt <= now;
  });
  const dueById = new Map([...serverDue, ...locallyDue].map((item) => [item.product_id, item]));
  const recheckDue = [...dueById.values()].sort((a, b) =>
    (new Date(a.next_recheck_at ?? 0).getTime()) - (new Date(b.next_recheck_at ?? 0).getTime()),
  );
  const useFirstIds = new Set(use_first.map((p) => p.product_id));
  const additionalUrgent = all_active.filter((p) => !useFirstIds.has(p.product_id) && isUrgent(p));
  const allUrgent: ProductOut[] = [...use_first, ...additionalUrgent]
    .filter((item) => !dueById.has(item.product_id));
  const hasAlerts = recheckDue.length > 0 || allUrgent.length > 0;

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.container}
      refreshControl={
        <RefreshControl refreshing={isFetching} onRefresh={() => { void refetch(); }} colors={[colors.green]} />
      }
    >
      {hasAlerts ? (
        <>
          {recheckDue.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Recheck today</Text>
              <Text style={s.sectionNote}>
                {recheckDue.length === 1
                  ? 'Its predicted shelf-life window has ended. Rescan to confirm the next stage.'
                  : `${recheckDue.length} items have reached their predicted recheck time. Rescan to confirm their next stage.`}
              </Text>
              {recheckDue.map((item) => (
                <AlertCard
                  key={item.product_id}
                  item={item}
                  kind="recheck"
                  colors={colors}
                  styles={s}
                  onPress={() => router.push(`/detail/${item.product_id}` as any)}
                />
              ))}
            </>
          )}
          {allUrgent.length > 0 && (
            <>
              <Text style={[s.sectionTitle, recheckDue.length > 0 && s.secondarySectionTitle]}>Use soon</Text>
              <Text style={s.sectionNote}>
                {allUrgent.length === 1 ? '1 item needs your attention soon.' : `${allUrgent.length} items need your attention soon.`}
              </Text>
              {allUrgent.map((item) => (
                <AlertCard
                  key={item.product_id}
                  item={item}
                  kind="urgent"
                  colors={colors}
                  styles={s}
                  onPress={() => router.push(`/detail/${item.product_id}` as any)}
                />
              ))}
            </>
          )}
        </>
      ) : (
        <View style={s.emptyState}>
          <OutlineIcon name="bell" color={colors.green} size={44} />
          <Text style={s.emptyTitle}>All good in here</Text>
          <Text style={s.emptyBody}>
            Nothing needs your attention right now. This page checks each saved shelf-life window automatically.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function AlertCard({ item, kind, colors, styles: s, onPress }: {
  item: ProductOut;
  kind: 'recheck' | 'urgent';
  colors: any;
  styles: ReturnType<typeof makeStyles>;
  onPress: () => void;
}) {
  const stage = item.latest_stage ?? 'Unknown';
  const stageColor = STAGE_COLORS[stage] ?? colors.muted;
  const stageBg = STAGE_BG[stage] ?? colors.surface;
  const isSpoiled = stage === 'Spoiled';

  return (
    <TouchableOpacity
      style={[s.card, { borderLeftColor: stageColor, borderLeftWidth: 4 }]}
      onPress={onPress}
      activeOpacity={0.78}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${item.display_name ?? item.produce_type}`}
    >
      {item.latest_thumbnail_url ? (
        <Image source={{ uri: `${API_BASE_URL}${item.latest_thumbnail_url}` }} style={s.thumb} />
      ) : (
        <View style={[s.thumb, s.thumbPlaceholder]}>
          <OutlineIcon name="produce" color={colors.muted} size={28} />
        </View>
      )}
      <View style={s.cardContent}>
        <Text style={s.cardName} numberOfLines={1}>{item.display_name ?? item.produce_type}</Text>
        <View style={[s.stagePill, { backgroundColor: stageBg }]}>
          <Text style={[s.stageLabel, { color: stageColor }]}>{stage}</Text>
        </View>
        <Text style={[s.daysText, { color: isSpoiled ? colors.red : colors.orange }]}>
          {kind === 'recheck'
            ? 'Recheck due — rescan now'
            : (isSpoiled ? 'Should be discarded' : `${formatDays(item.latest_days_remaining)} left`)}
        </Text>
      </View>
      <Text style={s.chevron}>›</Text>
    </TouchableOpacity>
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
    heading:      { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: SPACING.sm },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
    secondarySectionTitle: { marginTop: SPACING.lg },
    sectionNote:  { fontSize: 14, color: colors.muted, marginBottom: SPACING.md },
    loadingText:  { fontSize: 14, color: colors.muted, marginTop: SPACING.sm },
    errorIcon:    { fontSize: 32, marginBottom: SPACING.sm },
    errorText:    { fontSize: 14, color: colors.text, textAlign: 'center', lineHeight: 22 },
    retryBtn:     { backgroundColor: colors.green, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10, marginTop: SPACING.sm },
    retryText:    { color: '#fff', fontWeight: '700' },
    emptyState:   { alignItems: 'center', paddingVertical: SPACING.xl * 2, paddingHorizontal: SPACING.lg },
    emptyIcon:    { fontSize: 48, marginBottom: SPACING.md },
    emptyTitle:   { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: SPACING.sm, textAlign: 'center' },
    emptyBody:    { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 22 },
    card: {
      flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12,
      padding: SPACING.md, marginBottom: SPACING.sm, alignItems: 'center',
      gap: SPACING.sm, ...SHADOWS.sm, borderWidth: 1, borderColor: colors.border,
    },
    thumb:            { width: 60, height: 60, borderRadius: 10 },
    thumbPlaceholder: { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
    thumbEmoji:       { fontSize: 28 },
    cardContent:      { flex: 1, gap: 6 },
    cardName:         { fontSize: 15, fontWeight: '600', color: colors.text },
    stagePill:        { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
    stageLabel:       { fontSize: 12, fontWeight: '600' },
    daysText:         { fontSize: 13, fontWeight: '600' },
    chevron:          { fontSize: 20, color: colors.muted, marginLeft: SPACING.xs },
  });
}
