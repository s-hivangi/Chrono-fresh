import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useListProduce } from '../../src/api/produce';
import ProduceCard from '../../src/components/ProduceCard';
import { SPACING } from '../../src/theme';
import { useAppTheme } from '../../src/context/ThemeContext';
import OutlineIcon from '../../src/components/OutlineIcon';

export default function ProduceScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const query = useListProduce('active');
  const s = makeStyles(colors);

  if (query.isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  if (query.isError) {
    return (
      <View style={s.center}>
        <OutlineIcon name="warning" color={colors.orange} size={32} />
        <Text style={s.error}>Could not load your produce right now. Pull down to try again.</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => query.refetch()}>
          <Text style={s.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      style={s.page}
      contentContainerStyle={[s.content, (query.data ?? []).length === 0 && s.contentEmpty]}
      data={query.data ?? []}
      keyExtractor={(item) => String(item.product_id)}
      refreshing={query.isFetching}
      onRefresh={query.refetch}
      ListHeaderComponent={<Text style={s.title}>Your Stash</Text>}
      ListEmptyComponent={
        <View style={s.emptyState}>
          <OutlineIcon name="produce" color={colors.muted} size={48} />
          <Text style={s.emptyTitle}>Nothing tracked yet</Text>
          <Text style={s.emptyBody}>
            Scan a piece of produce from the Scan tab and it will appear here.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <ProduceCard
          produce={item}
          onPress={() => router.push(`/detail/${item.product_id}` as any)}
        />
      )}
    />
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeStyles(colors: any) {
  return StyleSheet.create({
    page:         { flex: 1, backgroundColor: colors.bg },
    content:      { padding: SPACING.md },
    contentEmpty: { flexGrow: 1 },
    title:        { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: SPACING.md },
    center: {
      flex: 1, justifyContent: 'center', alignItems: 'center',
      backgroundColor: colors.bg, padding: SPACING.lg, gap: SPACING.sm,
    },
    errorIcon:  { fontSize: 32 },
    error:      { fontSize: 14, color: colors.text, textAlign: 'center', lineHeight: 22 },
    retryBtn:   { backgroundColor: colors.green, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
    retryText:  { color: '#fff', fontWeight: '600' },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xl * 2 },
    emptyIcon:  { fontSize: 48, marginBottom: SPACING.sm },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text, textAlign: 'center', marginBottom: SPACING.sm },
    emptyBody:  { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 22 },
  });
}
