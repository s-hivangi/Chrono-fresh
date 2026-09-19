/** Freshness stages ordered from best to worst */
export const STAGES = ['Fresh', 'Early Ripening', 'Mid-Ripening', 'Late Ripening', 'Spoiled'] as const;
export type FreshnessStage = (typeof STAGES)[number];

/** Colour palette for each stage */
export const STAGE_COLORS: Record<string, string> = {
  Fresh:        '#22c55e',
  'Early Ripening': '#84cc16',
  'Mid-Ripening':   '#eab308',
  'Late Ripening':  '#f97316',
  Spoiled:      '#ef4444',
};

export const STAGE_BG: Record<string, string> = {
  Fresh:        '#f0fdf4',
  'Early Ripening': '#f7fee7',
  'Mid-Ripening':   '#fefce8',
  'Late Ripening':  '#fff7ed',
  Spoiled:      '#fef2f2',
};

/** Returns true if the item needs urgent attention */
export function isUrgent(produce: {
  latest_stage?: string | null;
  latest_days_remaining?: number | null;
}) {
  return (
    produce.latest_stage === 'Spoiled' ||
    produce.latest_stage === 'Late Ripening' ||
    (produce.latest_days_remaining != null && produce.latest_days_remaining <= 1.5)
  );
}

/** Capitalise first letter */
export function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}
