/**
 * App-wide theme context.
 * Provides light/dark colours and persists the user's choice via AsyncStorage.
 *
 * Usage in any component:
 *   const { colors, mode, setMode } = useAppTheme();
 */
import React, {
  createContext, useContext, useEffect, useState, useMemo,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, DARK_COLORS } from '../theme';

// ─── Types ────────────────────────────────────────────────────────────────────
export type ThemeMode = 'light' | 'dark' | 'system';
export type AppColors = typeof COLORS;

interface ThemeContextValue {
  colors:  AppColors;
  isDark:  boolean;
  mode:    ThemeMode;
  setMode: (m: ThemeMode) => void;
}

const STORAGE_KEY = '@chrono_fresh/theme_mode';

// ─── Context ──────────────────────────────────────────────────────────────────
const ThemeContext = createContext<ThemeContextValue>({
  colors:  COLORS,
  isDark:  false,
  mode:    'dark',
  setMode: () => undefined,
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [mode, setModeState] = useState<ThemeMode>('dark');

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setModeState(stored);
        }
      })
      .catch(() => {/* ignore */});
  }, []);

  function setMode(m: ThemeMode) {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {/* ignore */});
  }

  const isDark = useMemo(() => {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return systemScheme === 'dark';
  }, [mode, systemScheme]);

  const colors = isDark ? DARK_COLORS : COLORS;

  return (
    <ThemeContext.Provider value={{ colors, isDark, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
