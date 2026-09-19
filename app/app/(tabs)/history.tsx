import React from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useGlobalHistory } from '../../src/api/produce';
import { API_BASE_URL } from '../../src/api/client';
import { COLORS, SPACING, TYPOGRAPHY } from '../../src/theme';

export default function HistoryScreen() {
  const router = useRouter();
  const query = useGlobalHistory();
  const data = query.data ?? [];
  return <FlatList style={styles.page} contentContainerStyle={styles.content} data={data} keyExtractor={(item) => String(item.image_id)} refreshing={query.isFetching} onRefresh={query.refetch}
    ListHeaderComponent={<Text style={styles.title}>Scan History</Text>}
    ListEmptyComponent={<Text style={styles.empty}>{query.isError ? query.error.message : 'No scans yet. Analyze a produce image to start your history.'}</Text>}
    renderItem={({ item }) => <TouchableOpacity style={styles.card} onPress={() => router.push(`/detail/${item.product_id}`)}><View style={styles.row}>{item.thumbnail_url ? <Image source={{ uri: `${API_BASE_URL}${item.thumbnail_url}` }} style={styles.thumbnail} /> : <View style={[styles.thumbnail, styles.placeholder]}><Text>🍎</Text></View>}<View style={styles.details}><Text style={styles.name}>{item.display_name || `Produce #${item.product_id}`}</Text><Text style={styles.type}>{item.produce_type || 'Produce'}</Text><Text style={styles.stage}>{item.prediction?.freshness_stage || 'Pending'}</Text><Text style={styles.completed}>{new Date(item.capture_date).toLocaleString()}</Text></View></View></TouchableOpacity>}
  />;
}
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: COLORS.bg }, content: { padding: SPACING.md, flexGrow: 1 }, title: { ...TYPOGRAPHY.h1, marginBottom: SPACING.md }, card: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 10, marginBottom: 12 }, row: { flexDirection: 'row', gap: 12 }, thumbnail: { width: 82, height: 82, borderRadius: 10 }, placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg }, details: { flex: 1, justifyContent: 'center' }, name: { ...TYPOGRAPHY.h3 }, type: { ...TYPOGRAPHY.small, color: COLORS.muted, textTransform: 'capitalize', marginTop: 3 }, stage: { color: COLORS.green, fontWeight: '700', marginTop: 6 }, completed: { ...TYPOGRAPHY.small, color: COLORS.muted, marginTop: 6 }, empty: { textAlign: 'center', color: COLORS.muted, marginTop: 60 } });
