/** Freshness stages ordered from best to worst */
export const STAGES = ['Fresh', 'Early Ripening', 'Mid-Ripening', 'Late Ripening', 'Spoiled'] as const;
export type FreshnessStage = (typeof STAGES)[number];

/** Colour palette for each stage — single source of truth used app-wide */
export const STAGE_COLORS: Record<string, string> = {
  Fresh:            '#2E7D32',   // brand.primary
  'Early Ripening': '#7CB342',   // ripeness.earlyRipe
  'Mid-Ripening':   '#FFB300',   // ripeness.midRipe
  'Late Ripening':  '#FB8C00',   // ripeness.lateRipe
  Spoiled:          '#E53935',   // ripeness.spoiled
};

export const STAGE_BG: Record<string, string> = {
  Fresh:            '#E8F5E9',   // brand.mint
  'Early Ripening': '#F1F8E9',
  'Mid-Ripening':   '#FFF8E1',
  'Late Ripening':  '#FFE0B2',
  Spoiled:          '#FFEBEE',
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

/**
 * Formats a days-remaining number consistently throughout the app.
 * Always rounds to 1 decimal place. Returns "—" for null/undefined.
 */
export function formatDays(days: number | null | undefined): string {
  if (days == null) return '—';
  return `${days.toFixed(1)} days`;
}

/**
 * Generates a plain-language recommendation based on freshness stage,
 * days remaining, and optionally the produce type.
 *
 * This is the single source of truth for recommendation text across the app.
 * The backend's `advice` field is intentionally ignored on the frontend — this
 * function ensures consistent, consumer-friendly phrasing on every screen.
 */
export function getRecommendation(
  stage: string | null | undefined,
  days: number | null | undefined,
  produceType?: string | null,
): string {
  const d = days != null ? days.toFixed(1) : null;
  const type = (produceType ?? '').toLowerCase();

  // Storage tips per produce type
  function storageTip(): string {
    if (type === 'banana') {
      return 'Keep it away from other fruit if you can — bananas release ethylene gas that speeds up ripening in everything nearby.';
    }
    if (type === 'guava') {
      return 'Leave it at room temperature while it is still firm. Once it feels soft, move it to the fridge to slow ripening.';
    }
    return 'Keep it in the fridge to help slow down the ripening.';
  }

  switch (stage) {
    case 'Fresh':
      return d != null
        ? `Still fresh, about ${d} days left. ${storageTip()} No rush to eat this yet.`
        : `Still fresh. ${storageTip()} No rush to eat this yet.`;

    case 'Early Ripening':
      return d != null
        ? `Starting to ripen, about ${d} days left. Move it to the fridge now if you have not already — it will help slow things down. Plan to eat it in the next few days.`
        : `Starting to ripen. Move it to the fridge now if you have not already. Plan to eat it in the next few days.`;

    case 'Mid-Ripening':
      return d != null
        ? `Fully ripe, about ${d} days left. This is the best time to eat it — do not wait too long or the texture will start going. Eat it within the next ${d} days for the best taste.`
        : `Fully ripe. This is the best time to eat it — do not wait too long or the texture will start going.`;

    case 'Late Ripening':
      return d != null
        ? `Getting overripe, only about ${d} days left. Eat it today or tomorrow if you can — it will not hold much longer even in the fridge.`
        : `Getting overripe. Eat it as soon as possible — it will not hold much longer.`;

    case 'Spoiled':
      return `This one has spoiled and is not safe to eat. Time to toss it.`;

    default:
      return d != null
        ? `About ${d} days of shelf life remaining.`
        : `Freshness information not available.`;
  }
}
