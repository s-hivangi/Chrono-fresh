import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

const STAGE_CONFIG: Record<string, { bg: string; text: string }> = {
  Fresh:         { bg: '#dcfce7', text: '#15803d' },
  'Early Ripening': { bg: '#ecfccb', text: '#4d7c0f' },
  'Mid-Ripening':   { bg: '#fef9c3', text: '#a16207' },
  'Late Ripening':  { bg: '#ffedd5', text: '#c2410c' },
  Spoiled:       { bg: '#fee2e2', text: '#b91c1c' },
};

interface StageBadgeProps { stage?: string | null }

export function StageBadge({ stage }: StageBadgeProps) {
  if (!stage) return <View style={[styles.badge, { backgroundColor: '#f1f5f9' }]}><Text style={[styles.text, { color: COLORS.muted }]}>Pending</Text></View>;
  const cfg = STAGE_CONFIG[stage] ?? { bg: '#f1f5f9', text: COLORS.muted };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.text, { color: cfg.text }]}>{stage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  text: { fontSize: 11, fontWeight: '600' },
});
