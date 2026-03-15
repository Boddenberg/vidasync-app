import { Platform } from 'react-native';

export const Brand = {
  green: '#16A34A',
  greenSoft: '#DCFCE7',
  greenDark: '#166534',
  greenDeeper: '#14532D',
  orange: '#F59E0B',
  yellow: '#FDE68A',
  blue: '#2563EB',
  blueSoft: '#E7EEFF',
  coral: '#EF4444',
  coralSoft: '#FDE8E8',
  bg: '#F4F8F5',
  bgAlt: '#EEF5F0',
  card: '#FFFFFF',
  text: '#10231A',
  textSecondary: '#4C6258',
  textMuted: '#7B8F86',
  border: '#D6E3DA',
  danger: '#BE123C',
  shadow: 'rgba(21, 33, 38, 0.1)',
  surfaceAlt: '#F2F7F3',
  surfaceSoft: '#EAF3EC',
  macroProtein: '#2563EB',
  macroProteinBg: '#E7EEFF',
  macroCarb: '#F59E0B',
  macroCarbBg: '#FFF4DB',
  macroFat: '#DC2626',
  macroFatBg: '#FEE2E2',
  hydration: '#38BDF8',
  hydrationBg: '#EAF8FF',
};

export const Typography = {
  hero: { fontSize: 38, fontWeight: '800' as const, letterSpacing: -1, lineHeight: 42 },
  title: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.6, lineHeight: 32 },
  subtitle: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '500' as const, lineHeight: 21 },
  label: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.35, lineHeight: 16 },
  caption: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.25, lineHeight: 15 },
  helper: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
};

export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const Radii = {
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 34,
  pill: 999,
};

export const Shadows = {
  soft: {
    shadowColor: '#1F2933',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.09,
    shadowRadius: 24,
    elevation: 4,
  },
  card: {
    shadowColor: '#1F2933',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  floating: {
    shadowColor: '#1A2129',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 26,
    elevation: 8,
  },
};

const tintColorLight = Brand.green;
const tintColorDark = '#9AD9B8';

export const Colors = {
  light: {
    text: Brand.text,
    background: Brand.bg,
    tint: tintColorLight,
    icon: Brand.textSecondary,
    tabIconDefault: '#A4AFB7',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'Avenir Next',
    serif: 'ui-serif',
    rounded: 'Avenir Next',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'sans-serif',
    mono: 'monospace',
  },
  web: {
    sans: "'Avenir Next', 'Nunito Sans', 'Segoe UI', sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'Avenir Next', 'Nunito Sans', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
  },
});
