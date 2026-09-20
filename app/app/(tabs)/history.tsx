import React from 'react';
import {
  FlatList, Image, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGlobalHistory } from '../../src/api/produce';
import { API_BASE_URL } from '../../src/api/client';
import { SPACING, SHADOWS } from '../../src/theme';
import { useAppTheme } from '../../src/context/ThemeContext';
import { STAGE_COLORS, STAGE_BG } from '../../src/utils/helpers';
import OutlineIcon from '../../src/components/OutlineIcon';

export default function HistoryScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const query = useGlobalHistory();
  const data = query.data ?? [];
  const s = makeStyles(colors);

  if (query.isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.green} />
        <Text style={s.loadingText}>Loading scan history...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={s.page}
      contentContainerStyle={[s.content, data.length === 0 && s.contentEmpty]}
      data={data}
      keyExtractor={(item) => String(item.image_id)}
      refreshing={query.isFetching}
      onRefresh={query.refetch}
      ListHeaderComponent={<Text style={s.title}>Scan History</Text>}
      ListEmptyComponent={
        query.isError ? (
          <View style={s.emptyState}>
            <OutlineIcon name="warning" color={colors.orange} size={40} />
            <Text style={s.emptyTitle}>Could not load history</Text>
            <Text style={s.emptyBody}>Check your connection and pull down to try again.</Text>
          </View>
        ) : (
          <View style={s.emptyState}>
            <OutlineIcon name="scan" color={colors.muted} size={40} />
            <Text style={s.emptyTitle}>No scans yet</Text>
            <Text style={s.emptyBody}>
              Scan a piece of produce from the Scan tab and your history will appear here.
            </Text>
            <TouchableOpacity
              style={s.scanBtn}
              onPress={() => router.push('/(tabs)/scan' as any)}
              accessibilityRole="button"
            >
              <Text style={s.scanBtnText}>Go to Scan</Text>
            </TouchableOpacity>
          </View>
        )
      }
      renderItem={({ item }) => {
        const stage = item.prediction?.freshness_stage;
        const stageColor = stage ? (STAGE_COLORS[stage] ?? colors.muted) : colors.muted;
        const stageBg = stage ? (STAGE_BG[stage] ?? colors.surface) : colors.surface;

        return (
          <TouchableOpacity
            style={s.card}
            onPress={() => router.push(`/detail/${item.product_id}` as any)}
            accessibilityRole="button"
            accessibilityLabel={`View details for ${item.display_name ?? item.produce_type ?? 'this scan'}`}
          >
            <View style={s.row}>
              {item.thumbnail_url ? (
                <Image source={{ uri: `${API_BASE_URL}${item.thumbnail_url}` }} style={s.thumbnail} />
              ) : (
                <View style={[s.thumbnail, s.placeholder]}>
                  <OutlineIcon name="produce" color={colors.muted} size={28} />
                </View>
              )}
              <View style={s.details}>
                <Text style={s.name} numberOfLines={1}>
                  {item.display_name || (item.produce_type
                    ? `${item.produce_type.charAt(0).toUpperCase()}${item.produce_type.slice(1)}`
                    : 'Produce')}
                </Text>
                <Text style={s.type}>
                  {item.produce_type
                    ? `${item.produce_type.charAt(0).toUpperCase()}${item.produce_type.slice(1)}`
                    : ''}
                </Text>
                {stage && (
                  <View style={[s.stagePill, { backgroundColor: stageBg }]}>
                    <Text style={[s.stageText, { color: stageColor }]}>{stage}</Text>
                  </View>
                )}
                <Text style={s.date}>
                  {new Date(item.capture_date).toLocaleString(undefined, {
                    dateStyle: 'medium', timeStyle: 'short',
                  })}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeStyles(colors: any) {
  return StyleSheet.create({
    page:         { flex: 1, backgroundColor: colors.bg },
    content:      { padding: SPACING.md },
    contentEmpty: { flexGrow: 1 },
    center: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.bg, gap: SPACING.sm,
    },
    loadingText: { fontSize: 14, color: colors.muted },
    title:       { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: SPACING.md },
    card: {
      backgroundColor: colors.surface, borderRadius: 12,
      padding: SPACING.sm, marginBottom: SPACING.sm,
      ...SHADOWS.sm, borderWidth: 1, borderColor: colors.border,
    },
    row:              { flexDirection: 'row', gap: 12 },
    thumbnail:        { width: 82, height: 82, borderRadius: 10 },
    placeholder:      { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
    placeholderEmoji: { fontSize: 32 },
    details:          { flex: 1, justifyContent: 'center', gap: 4 },
    name:             { fontSize: 15, fontWeight: '600', color: colors.text },
    type:             { fontSize: 12, color: colors.muted, textTransform: 'capitalize' },
    stagePill:        { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
    stageText:        { fontSize: 11, fontWeight: '600' },
    date:             { fontSize: 12, color: colors.muted },
    emptyState: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xl * 2,
    },
    emptyIcon:    { fontSize: 48, marginBottom: SPACING.md },
    emptyTitle:   { fontSize: 18, fontWeight: '600', color: colors.text, textAlign: 'center', marginBottom: SPACING.sm },
    emptyBody:    { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.md },
    scanBtn:      { backgroundColor: colors.green, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
    scanBtnText:  { color: '#fff', fontWeight: '700' },
  });
}
