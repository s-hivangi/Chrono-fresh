import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@chrono_fresh_scan_id_counters';

/** Maps produce type to its single uppercase initial. */
const PRODUCE_INITIAL: Record<string, string> = {
  tomato:  'T',
  banana:  'B',
  guava:   'G',
  apple:   'A',
  mango:   'M',
};

function getInitial(produceType: string): string {
  return PRODUCE_INITIAL[produceType.toLowerCase()] ?? produceType.charAt(0).toUpperCase();
}

/** Returns a zero-padded 2-digit string. */
function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Generates a date-based scan ID like "T-2009-01".
 * Reads and increments a per-day counter from AsyncStorage.
 *
 * @param produceType - e.g. "tomato"
 * @param date        - the scan date (defaults to now)
 * @returns e.g. "T-2009-01"
 */
export async function generateScanId(
  produceType: string,
  date: Date = new Date(),
): Promise<string> {
  const initial = getInitial(produceType);
  const ddmm = `${pad2(date.getDate())}${pad2(date.getMonth() + 1)}`;
  const counterKey = `${initial}-${ddmm}`;

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const counters: Record<string, number> = raw ? JSON.parse(raw) : {};

    const next = (counters[counterKey] ?? 0) + 1;
    counters[counterKey] = next;

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(counters));

    return `${counterKey}-${pad2(next)}`;
  } catch {
    // Fallback: if AsyncStorage fails, use a timestamp-derived number
    const fallback = (date.getHours() * 60 + date.getMinutes()) % 99 + 1;
    return `${counterKey}-${pad2(fallback)}`;
  }
}

/**
 * Derives a deterministic display ID from already-stored backend data,
 * without incrementing the counter. Used to display existing items.
 *
 * Falls back gracefully when date_added is unavailable.
 *
 * @param productId   - numeric product_id from backend
 * @param produceType - e.g. "tomato"
 * @param dateAdded   - ISO date string from backend (e.g. "2026-09-20T...")
 */
export function deriveScanId(
  productId: number,
  produceType: string,
  dateAdded?: string | null,
): string {
  const initial = getInitial(produceType);
  const date = dateAdded ? new Date(dateAdded) : new Date();
  const ddmm = `${pad2(date.getDate())}${pad2(date.getMonth() + 1)}`;
  // Use product_id to produce a stable 2-digit suffix (1-99) for display only.
  // This does NOT increment the counter; it just gives a stable label for existing items.
  const seq = (productId % 99) + 1;
  return `${initial}-${ddmm}-${pad2(seq)}`;
}
