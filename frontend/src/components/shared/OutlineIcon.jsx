import React from 'react';

const PATHS = {
  home: 'M3 10.5 12 3l9 7.5M5.5 9.5V21h13V9.5M9 21v-6h6v6',
  scan: 'M5 8a2 2 0 0 1 2-2h1l1-2h6l1 2h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8Zm7 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  history: 'M4 5h16v14H4zM8 9h8M8 13h8M8 17h5',
  analytics: 'M5 19V9M12 19V5M19 19v-7',
  produce: 'M12 20c-4.5 0-7-3.2-7-7.2C5 9.2 7.7 7 12 7s7 2.2 7 5.8c0 4-2.5 7.2-7 7.2ZM12 7c-.2-2.1.9-3.8 3.5-5M12 7c-1.8-1.3-3.5-1.4-5-.5',
  warning: 'm12 3 9 17H3L12 3Zm0 6v5m0 3h.01',
  camera: 'M5 8a2 2 0 0 1 2-2h1l1-2h6l1 2h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8Zm7 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  check: 'm5 12 4 4L19 6',
  trash: 'M5 7h14M10 11v5M14 11v5M7 7l1 13h8l1-13M9 7l1-3h4l1 3',
  sun: 'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  moon: 'M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z',
};

export default function OutlineIcon({ name, size = 22, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={PATHS[name]} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}