import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useListProduce } from '../../src/api/produce';
import ProduceCard from '../../src/components/ProduceCard';
import { COLORS, SPACING, TYPOGRAPHY } from '../../src/theme';

export default function ProduceScreen() {
  const router = useRouter();
  const query = useListProduce('active');
  if (query.isLoading) return <View style={styles.center}><ActivityIndicator color={COLORS.green} /></View>;
  if (query.isError) return <View style={styles.center}><Text style={styles.error}>{query.error.message}</Text></View>;
  return <FlatList
    style={styles.page}
    contentContainerStyle={styles.content}
    data={query.data ?? []}
    keyExtractor={(item) => String(item.product_id)}
    refreshing={query.isFetching}
    onRefresh={query.refetch}
    ListHeaderComponent={<Text style={styles.title}>My Produce</Text>}
    ListEmptyComponent={<Text style={styles.empty}>No active produce yet. Use Scan to add your first item.</Text>}
    renderItem={({ item }) => <ProduceCard produce={item} onPress={() => router.push(`/detail/${item.product_id}`)} />}
  />;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: COLORS.bg }, content: { padding: SPACING.md, flexGrow: 1 }, title: { ...TYPOGRAPHY.h1, marginBottom: SPACING.md }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }, error: { color: COLORS.red }, empty: { ...TYPOGRAPHY.body, color: COLORS.muted, textAlign: 'center', marginTop: 80 } });
