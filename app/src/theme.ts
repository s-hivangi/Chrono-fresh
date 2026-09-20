/** Design tokens for ChronoFresh Mobile — new canonical palette */

// ─── Raw palette (mirrors the new colors spec) ───────────────────────────────
const brand = {
  primaryDark: '#1B5E20',
  primary:     '#2E7D32',
  mint:        '#E8F5E9',
  border:      '#A5D6A7',
};

const ripeness = {
  fresh:     { main: '#2E7D32', bg: '#E8F5E9' },
  earlyRipe: { main: '#7CB342', bg: '#F1F8E9' },
  midRipe:   { main: '#FFB300', bg: '#FFF8E1' },
  lateRipe:  { main: '#FB8C00', bg: '#FFE0B2' },
  spoiled:   { main: '#E53935', bg: '#FFEBEE' },
};

const neutral = {
  background:    '#F4F6F8',
  surface:       '#FFFFFF',
  textPrimary:   '#1F2937',
  textSecondary: '#6B7280',
  border:        '#E5E7EB',
  disabled:      '#9CA3AF',
};

// ─── Exported COLORS — same shape as before so every screen compiles ─────────
export const COLORS = {
  // Backgrounds
  bg:        neutral.background,
  surface:   neutral.surface,

  // Borders
  border:    neutral.border,

  // Text
  text:      neutral.textPrimary,
  muted:     neutral.textSecondary,

  // Brand greens
  green:     brand.primary,       // '#2E7D32'
  greenDark: brand.primaryDark,   // '#1B5E20'

  // Ripeness accent colours (used on buttons, badges, alerts)
  orange:    ripeness.lateRipe.main,   // '#FB8C00'
  red:       ripeness.spoiled.main,    // '#E53935'
  yellow:    ripeness.midRipe.main,    // '#FFB300'
  lime:      ripeness.earlyRipe.main,  // '#7CB342'
};

// ─── Dark-mode colour overrides ───────────────────────────────────────────────
export const DARK_COLORS: typeof COLORS = {
  bg:        '#0F1710',   // near-black green tint
  surface:   '#1C2B1E',   // dark card surface
  border:    '#2E4230',   // subtle dark border
  text:      '#E8F5E9',   // near-white text
  muted:     '#7FA882',   // muted sage green
  green:     '#4CAF50',   // brighter green for contrast on dark bg
  greenDark: '#2E7D32',
  orange:    '#FFB74D',
  red:       '#EF5350',
  yellow:    '#FFD54F',
  lime:      '#AED581',
};

export const TYPOGRAPHY = {
  h1:    { fontFamily: 'Poppins_700Bold', fontSize: 24, fontWeight: '700' as const, color: COLORS.text },
  h2:    { fontFamily: 'Poppins_600SemiBold', fontSize: 18, fontWeight: '600' as const, color: COLORS.text },
  h3:    { fontFamily: 'Poppins_600SemiBold', fontSize: 15, fontWeight: '600' as const, color: COLORS.text },
  body:  { fontFamily: 'Poppins_400Regular', fontSize: 14, color: COLORS.text },
  small: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.muted },
};

// ─── Spacing ──────────────────────────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// ─── Shadows ──────────────────────────────────────────────────────────────────
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};
