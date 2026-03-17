import { Platform } from 'react-native';

export const Brand = {
  forest: '#146C38',
  fresh: '#1FA750',
  mintSoft: '#DDF5E4',
  sageMist: '#EEF7F0',
  mango: '#F4A62A',
  coral: '#FF7A59',
  sky: '#2D9CDB',
  indigo: '#5B6CFF',
  ink: '#152018',
  textSoft: '#5F6F63',
  surface: '#F7FAF7',
  card: '#FFFFFF',
  borderSoft: '#DDE9DF',
  positive: '#1FA750',
  positiveBg: '#E4F7EC',
  warning: '#B96B00',
  warningBg: '#FFF3E3',
  protein: '#1FA750',
  proteinBg: '#EAF8EE',
  carb: '#F4A62A',
  carbBg: '#FFF4DD',
  fat: '#E45858',
  fatBg: '#FDE7E7',
  hydration: '#2D9CDB',
  hydrationBg: '#EAF6FD',

  // Legacy aliases used across the app.
  green: '#1FA750',
  greenSoft: '#DDF5E4',
  greenDark: '#146C38',
  greenDeeper: '#0F5B2E',
  orange: '#F4A62A',
  yellow: '#FFF4DD',
  blue: '#2D9CDB',
  blueSoft: '#EAF6FD',
  coralSoft: '#FFE8E1',
  bg: '#F7FAF7',
  bgAlt: '#EEF7F0',
  text: '#152018',
  textSecondary: '#5F6F63',
  textMuted: '#7C8A82',
  border: '#DDE9DF',
  danger: '#E45858',
  shadow: 'rgba(21, 32, 24, 0.10)',
  surfaceAlt: '#F1F7F2',
  surfaceSoft: '#EAF8EE',
  macroProtein: '#1FA750',
  macroProteinBg: '#EAF8EE',
  macroCarb: '#F4A62A',
  macroCarbBg: '#FFF4DD',
  macroFat: '#E45858',
  macroFatBg: '#FDE7E7',
};

export const Typography = {
  hero: { fontSize: 44, fontWeight: '800' as const, letterSpacing: -1.2, lineHeight: 48 },
  title: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.8, lineHeight: 36 },
  subtitle: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.25, lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '500' as const, lineHeight: 22 },
  label: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.35, lineHeight: 16 },
  caption: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.2, lineHeight: 16 },
  helper: { fontSize: 14, fontWeight: '500' as const, lineHeight: 19 },
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
  sm: 12,
  md: 18,
  lg: 20,
  xl: 28,
  xxl: 32,
  pill: 999,
};

export const Shadows = {
  soft: {
    shadowColor: '#152018',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 22,
    elevation: 3,
  },
  card: {
    shadowColor: '#152018',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 22,
    elevation: 2,
  },
  floating: {
    shadowColor: '#152018',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.07,
    shadowRadius: 26,
    elevation: 5,
  },
};

const tintColorLight = Brand.greenDark;
const tintColorDark = '#9AD9B8';

export const Colors = {
  light: {
    text: Brand.text,
    background: Brand.bg,
    tint: tintColorLight,
    icon: Brand.textSecondary,
    tabIconDefault: Brand.textMuted,
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
