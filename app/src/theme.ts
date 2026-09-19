/** Design tokens for ChronoFresh Mobile */
export const COLORS = {
  bg:      '#F4F8F0',
  surface: '#FFFFFF',
  border:  '#D6E3CE',
  text:    '#111A0D',
  muted:   '#A08890',
  green:   '#469110',
  greenDark: '#00520A',
  orange:  '#f97316',
  red:     '#ef4444',
  yellow:  '#eab308',
  lime:    '#84cc16',
};

export const TYPOGRAPHY = {
  h1: { fontSize: 24, fontWeight: '700' as const, color: COLORS.text },
  h2: { fontSize: 18, fontWeight: '600' as const, color: COLORS.text },
  h3: { fontSize: 15, fontWeight: '600' as const, color: COLORS.text },
  body: { fontSize: 14, color: COLORS.text },
  small: { fontSize: 12, color: COLORS.muted },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

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
