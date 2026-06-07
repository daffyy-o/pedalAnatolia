/**
 * Pedal Anatolia — Design System
 * Centralized design tokens for the entire app.
 */

export const Colors = {
  // Brand palette
  primary:     '#f91066', // hot pink — CTAs, active states, route polyline
  accent:      '#ff8552', // coral orange — secondary buttons, badges, ratings
  navy:        '#0e1428', // dark navy — screen backgrounds
  surface:     '#e0e2db', // warm gray — light surface / input fill context
  black:       '#000000',

  // Extended palette
  darkSurface: '#1a1f38', // elevated dark cards / modals
  darkBorder:  'rgba(255,255,255,0.08)',
  mutedText:   '#8b8fa3', // secondary text on dark backgrounds
  white:       '#ffffff',

  // Semantic
  success:     '#22c55e',
  error:       '#ef4444',
  warning:     '#f59e0b',

  // Overlay
  overlay:     'rgba(0,0,0,0.65)',
  glass:       'rgba(26,31,56,0.92)', // glassmorphism card bg

  // Map element colors
  routeLine:   '#f91066',
  startMarker: '#22c55e',
  endMarker:   '#f91066',
  schoolZone:  'rgba(249,16,102,0.15)',
  schoolZoneStroke: '#f91066',
};

export const Gradients = {
  primary: ['#f91066', '#f91066'] as const,
  dark:    ['#0e1428', '#1a1f38'] as const,
  success: ['#22c55e', '#16a34a'] as const,
  error:   ['#ef4444', '#b91c1c'] as const,
};

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
  huge: 48,
};

export const BorderRadius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  pill: 9999,
};

export const Typography = {
  h1:      { fontSize: 28, fontWeight: '800' as const, color: Colors.white, letterSpacing: -0.5 },
  h2:      { fontSize: 22, fontWeight: '700' as const, color: Colors.white },
  h3:      { fontSize: 18, fontWeight: '700' as const, color: Colors.white },
  h4:      { fontSize: 16, fontWeight: '700' as const, color: Colors.white },
  body:    { fontSize: 14, fontWeight: '400' as const, color: Colors.white },
  bodyBold:{ fontSize: 14, fontWeight: '600' as const, color: Colors.white },
  caption: { fontSize: 12, fontWeight: '400' as const, color: Colors.mutedText },
  muted:   { fontSize: 14, fontWeight: '400' as const, color: Colors.mutedText },
  label:   { fontSize: 12, fontWeight: '600' as const, color: Colors.mutedText },
};

export const Shadows = {
  sm: {
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  glow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const Glass = {
  background: 'rgba(26,31,56,0.92)',
  border:     'rgba(255,255,255,0.08)',
  borderWidth: 1,
  borderRadius: BorderRadius.lg,
};
