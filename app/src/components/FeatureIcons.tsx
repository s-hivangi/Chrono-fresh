/**
 * Custom outline SVG icons for Chrono-Fresh.
 * Drawn to match the reference design — green stroke, no fill, clean minimal lines.
 */
import React from 'react';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';

const STROKE = '#2E7D32'; // brand.primary
const SW = 2.2; // strokeWidth

// ── Camera ────────────────────────────────────────────────────────────────────
export function CameraIcon({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* Camera body */}
      <Rect
        x="4" y="18" width="56" height="38"
        rx="6" ry="6"
        fill="none" stroke={STROKE} strokeWidth={SW}
        strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Viewfinder hump */}
      <Path
        d="M20 18 L20 12 Q20 8 24 8 L30 8 Q34 8 34 12 L34 18"
        fill="none" stroke={STROKE} strokeWidth={SW}
        strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Lens outer ring */}
      <Circle
        cx="32" cy="37" r="10"
        fill="none" stroke={STROKE} strokeWidth={SW}
      />
      {/* Lens inner ring */}
      <Circle
        cx="32" cy="37" r="5"
        fill="none" stroke={STROKE} strokeWidth={SW}
      />
      {/* Flash dot */}
      <Circle
        cx="49" cy="26" r="2"
        fill={STROKE}
      />
    </Svg>
  );
}

// ── Bell ──────────────────────────────────────────────────────────────────────
export function BellIcon({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* Bell body */}
      <Path
        d="M32 8 C20 8 16 18 16 28 L16 42 L48 42 L48 28 C48 18 44 8 32 8 Z"
        fill="none" stroke={STROKE} strokeWidth={SW}
        strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Left and right side droop */}
      <Path
        d="M10 42 Q10 46 16 46 L48 46 Q54 46 54 42"
        fill="none" stroke={STROKE} strokeWidth={SW}
        strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Clapper */}
      <Path
        d="M26 46 Q26 54 32 54 Q38 54 38 46"
        fill="none" stroke={STROKE} strokeWidth={SW}
        strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Stem at top */}
      <Line
        x1="32" y1="4" x2="32" y2="8"
        stroke={STROKE} strokeWidth={SW} strokeLinecap="round"
      />
    </Svg>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────────────
export function CalendarIcon({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* Body */}
      <Rect
        x="6" y="10" width="52" height="48"
        rx="5" ry="5"
        fill="none" stroke={STROKE} strokeWidth={SW}
        strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Header bar */}
      <Line
        x1="6" y1="24" x2="58" y2="24"
        stroke={STROKE} strokeWidth={SW}
      />
      {/* Ring hooks */}
      <Line x1="20" y1="4" x2="20" y2="16" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <Line x1="44" y1="4" x2="44" y2="16" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      {/* Grid of dots — 3 columns × 3 rows */}
      {[32, 42, 52].map((y) =>
        [16, 26, 36, 46].map((x) => (
          <Circle key={`${x}-${y}`} cx={x} cy={y} r={2} fill={STROKE} />
        ))
      )}
    </Svg>
  );
}
