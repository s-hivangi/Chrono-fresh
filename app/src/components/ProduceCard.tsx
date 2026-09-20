import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';
import { StageBadge } from './StageBadge';
import { isUrgent, cap, formatDays } from '../utils/helpers';
import { API_BASE_URL } from '../api/client';
import type { ProductOut } from '../types/api';
import OutlineIcon from './OutlineIcon';

interface ProduceCardProps {
  produce: ProductOut;
  onPress: () => void;
}

export default function ProduceCard({ produce, onPress }: ProduceCardProps) {
  const urgent = isUrgent(produce);
  return (
    <TouchableOpacity
      style={[styles.card, urgent && styles.urgentCard]}
      onPress={onPress}
      activeOpacity={0.78}
    >
      {produce.latest_thumbnail_url ? (
        <Image
          source={{ uri: `${API_BASE_URL}${produce.latest_thumbnail_url}` }}
          style={styles.thumb}
        />
      ) : (
        <View style={styles.thumbPlaceholder}>
          <OutlineIcon name="produce" color={COLORS.muted} size={28} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{produce.display_name}</Text>
        <Text style={styles.type}>{cap(produce.produce_type)}</Text>
        <View style={styles.row}>
          <StageBadge stage={produce.latest_stage} />
          <Text style={styles.days}>{formatDays(produce.latest_days_remaining)}</Text>
        </View>
      </View>
      {urgent && <View style={styles.urgentDot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  urgentCard: { borderColor: '#f97316', borderWidth: 1.5 },
  thumb: { width: 56, height: 56, borderRadius: 8 },
  thumbPlaceholder: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 4 },
  name: { ...TYPOGRAPHY.h3 },
  type: { ...TYPOGRAPHY.small },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  days: { fontSize: 12, color: COLORS.muted },
  urgentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f97316' },
});
