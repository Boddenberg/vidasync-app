import { Platform } from 'react-native';

export const Brand = {
  green: '#74C69D',
  greenSoft: '#DDF3E7',
  greenDark: '#2D7A58',
  greenDeeper: '#1F5E43',
  orange: '#E4B84A',
  yellow: '#F6DC8E',
  blue: '#6FA8FF',
  blueSoft: '#E9F2FF',
  coral: '#F18B73',
  coralSoft: '#FFEDE8',
  bg: '#FAFAF7',
  bgAlt: '#F8F7F3',
  card: '#FFFFFF',
  text: '#1F2933',
  textSecondary: '#5E6A73',
  textMuted: '#8B97A1',
  border: '#E5E9E4',
  danger: '#D14A56',
  shadow: 'rgba(21, 33, 38, 0.1)',
  surfaceAlt: '#F6F8F4',
  surfaceSoft: '#EFF5EE',
  macroProtein: '#6F9DF1',
  macroProteinBg: '#EAF1FF',
  macroCarb: '#D8A739',
  macroCarbBg: '#FFF5DA',
  macroFat: '#EA7D62',
  macroFatBg: '#FFEDE7',
  hydration: '#64A9FF',
  hydrationBg: '#ECF5FF',
};

export const Typography = {
  hero: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -1.1, lineHeight: 40 },
  title: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.6, lineHeight: 30 },
  subtitle: { fontSize: 17, fontWeight: '700' as const, letterSpacing: -0.2, lineHeight: 23 },
  body: { fontSize: 15, fontWeight: '500' as const, lineHeight: 22 },
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
