import { Platform } from 'react-native';

export const Brand = {
  forest: '#176A45',
  fresh: '#21A663',
  mintSoft: '#DDF4E8',
  sageMist: '#EEF6F1',
  mango: '#F7B545',
  coral: '#FF7A59',
  sky: '#59B8FF',
  indigo: '#5B6CFF',
  ink: '#142018',
  textSoft: '#5F6E64',
  surface: '#FAFCF9',
  card: '#FFFFFF',
  borderSoft: '#DDE7DF',
  positive: '#1E8E57',
  positiveBg: '#E4F7EC',
  warning: '#B96B00',
  warningBg: '#FFF1DD',
  protein: '#4A63FF',
  proteinBg: '#EEF0FF',
  carb: '#D78B00',
  carbBg: '#FFF3D9',
  fat: '#D84B4B',
  fatBg: '#FFE3E0',
  hydration: '#1778B5',
  hydrationBg: '#E3F4FF',

  // Legacy aliases used across the app.
  green: '#21A663',
  greenSoft: '#DDF4E8',
  greenDark: '#176A45',
  greenDeeper: '#0F5034',
  orange: '#F7B545',
  yellow: '#FFF1DD',
  blue: '#5B6CFF',
  blueSoft: '#EEF0FF',
  coralSoft: '#FFE3E0',
  bg: '#FAFCF9',
  bgAlt: '#EEF6F1',
  text: '#142018',
  textSecondary: '#5F6E64',
  textMuted: '#7C8A82',
  border: '#DDE7DF',
  danger: '#D84B4B',
  shadow: 'rgba(20, 32, 24, 0.10)',
  surfaceAlt: '#F3F7F4',
  surfaceSoft: '#EAF6EE',
  macroProtein: '#4A63FF',
  macroProteinBg: '#EEF0FF',
  macroCarb: '#D78B00',
  macroCarbBg: '#FFF3D9',
  macroFat: '#D84B4B',
  macroFatBg: '#FFE3E0',
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
    shadowColor: '#142018',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  card: {
    shadowColor: '#142018',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 2,
  },
  floating: {
    shadowColor: '#142018',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
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
