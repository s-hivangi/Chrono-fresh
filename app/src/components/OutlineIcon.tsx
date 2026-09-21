import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

export type OutlineIconName =
  | 'home'
  | 'scan'
  | 'history'
  | 'bell'
  | 'settings'
  | 'warning'
  | 'check'
  | 'image'
  | 'produce'
  | 'sun'
  | 'moon'
  | 'system';

interface OutlineIconProps {
  name: OutlineIconName;
  color: string;
  size?: number;
  strokeWidth?: number;
}

export default function OutlineIcon({ name, color, size = 22, strokeWidth = 1.8 }: OutlineIconProps) {
  const common = {
    fill: 'none' as const,
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' && <>
        <Path {...common} d="M3 10.5 12 3l9 7.5" />
        <Path {...common} d="M5.5 9.5V21h13V9.5M9 21v-6h6v6" />
      </>}
      {name === 'scan' && <>
        <Rect {...common} x="5" y="6" width="14" height="12" rx="2" />
        <Circle {...common} cx="12" cy="12" r="3" />
        <Path {...common} d="M8 6 9 4h6l1 2M16.5 9.5h.01" />
      </>}
      {name === 'history' && <>
        <Path {...common} d="M4 5h16v14H4zM8 9h8M8 13h8M8 17h5" />
      </>}
      {name === 'bell' && <Path {...common} d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />}
      {name === 'settings' && <>
        <Circle {...common} cx="12" cy="12" r="3" />
        <Path {...common} d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.56-1.03H6v-2.4h.84A1.7 1.7 0 0 0 8.4 10a1.7 1.7 0 0 0-.34-1.88L8 8.06l1.7-1.7.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 12.67 5.2V5h2.4v.2a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03h.1v2.4h-.1A1.7 1.7 0 0 0 19.4 15Z" />
      </>}
      {name === 'warning' && <>
        <Path {...common} d="m12 3 9 17H3L12 3Z" />
        <Line {...common} x1="12" y1="9" x2="12" y2="14" />
        <Line {...common} x1="12" y1="17" x2="12.01" y2="17" />
      </>}
      {name === 'check' && <Path {...common} d="m5 12 4 4L19 6" />}
      {name === 'image' && <>
        <Rect {...common} x="3" y="4" width="18" height="16" rx="2" />
        <Circle {...common} cx="8.5" cy="9" r="1.5" />
        <Path {...common} d="m3 17 5-5 3 3 3-4 7 7" />
      </>}
      {name === 'produce' && <>
        <Path {...common} d="M12 20c-4.5 0-7-3.2-7-7.2C5 9.2 7.7 7 12 7s7 2.2 7 5.8c0 4-2.5 7.2-7 7.2Z" />
        <Path {...common} d="M12 7c-.2-2.1.9-3.8 3.5-5M12 7c-1.8-1.3-3.5-1.4-5-.5" />
      </>}
      {name === 'sun' && <>
        <Circle {...common} cx="12" cy="12" r="4" />
        <Path {...common} d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </>}
      {name === 'moon' && <Path {...common} d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z" />}
      {name === 'system' && <>
        <Rect {...common} x="4" y="5" width="16" height="11" rx="1" />
        <Line {...common} x1="8" y1="20" x2="16" y2="20" />
        <Line {...common} x1="12" y1="16" x2="12" y2="20" />
      </>}
    </Svg>
  );
}