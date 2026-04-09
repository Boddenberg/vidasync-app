import { Platform } from 'react-native';

type NavigationPalette = {
  text: string;
  background: string;
  tint: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
};

export type BrandPalette = {
  forest: string;
  fresh: string;
  mintSoft: string;
  sageMist: string;
  mango: string;
  coral: string;
  sky: string;
  indigo: string;
  ink: string;
  textSoft: string;
  surface: string;
  card: string;
  borderSoft: string;
  positive: string;
  positiveBg: string;
  warning: string;
  warningBg: string;
  protein: string;
  proteinBg: string;
  carb: string;
  carbBg: string;
  fat: string;
  fatBg: string;
  hydration: string;
  hydrationBg: string;
  green: string;
  greenSoft: string;
  greenDark: string;
  greenDeeper: string;
  orange: string;
  yellow: string;
  blue: string;
  blueSoft: string;
  coralSoft: string;
  bg: string;
  bgAlt: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  danger: string;
  shadow: string;
  surfaceAlt: string;
  surfaceSoft: string;
  macroProtein: string;
  macroProteinBg: string;
  macroCarb: string;
  macroCarbBg: string;
  macroFat: string;
  macroFatBg: string;
};

export type ThemePaletteKey = 'meadow' | 'ocean' | 'sunset' | 'orchid';

type ThemePaletteOption = {
  key: ThemePaletteKey;
  label: string;
  description: string;
  preview: readonly [string, string, string];
};

const meadowPalette: BrandPalette = {
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

const oceanPalette: BrandPalette = {
  forest: '#0F6174',
  fresh: '#1690AE',
  mintSoft: '#DDF3F8',
  sageMist: '#EDF8FB',
  mango: '#F2A754',
  coral: '#FF8266',
  sky: '#2390D2',
  indigo: '#496BDE',
  ink: '#112B35',
  textSoft: '#607784',
  surface: '#F6FBFD',
  card: '#FFFFFF',
  borderSoft: '#D8E8EE',
  positive: '#1690AE',
  positiveBg: '#E4F5F9',
  warning: '#AF6A13',
  warningBg: '#FFF1E1',
  protein: '#1690AE',
  proteinBg: '#E5F5FA',
  carb: '#F2A754',
  carbBg: '#FFF2DF',
  fat: '#E36B68',
  fatBg: '#FDE8E8',
  hydration: '#2390D2',
  hydrationBg: '#E8F5FD',
  green: '#1690AE',
  greenSoft: '#DDF3F8',
  greenDark: '#0F6174',
  greenDeeper: '#0B4F5F',
  orange: '#F2A754',
  yellow: '#FFF2DF',
  blue: '#2390D2',
  blueSoft: '#E8F5FD',
  coralSoft: '#FFE9E2',
  bg: '#F6FBFD',
  bgAlt: '#EDF8FB',
  text: '#112B35',
  textSecondary: '#607784',
  textMuted: '#7A919A',
  border: '#D8E8EE',
  danger: '#E36B68',
  shadow: 'rgba(17, 43, 53, 0.10)',
  surfaceAlt: '#EAF6F9',
  surfaceSoft: '#E4F5F9',
  macroProtein: '#1690AE',
  macroProteinBg: '#E5F5FA',
  macroCarb: '#F2A754',
  macroCarbBg: '#FFF2DF',
  macroFat: '#E36B68',
  macroFatBg: '#FDE8E8',
};

const sunsetPalette: BrandPalette = {
  forest: '#8A4636',
  fresh: '#D27058',
  mintSoft: '#FCEAE3',
  sageMist: '#FFF5F0',
  mango: '#F1A64F',
  coral: '#E16861',
  sky: '#5C97D4',
  indigo: '#7B69D8',
  ink: '#341E18',
  textSoft: '#7A655E',
  surface: '#FFF9F6',
  card: '#FFFFFF',
  borderSoft: '#F0DED6',
  positive: '#D27058',
  positiveBg: '#FCEEE8',
  warning: '#A86616',
  warningBg: '#FFF1E1',
  protein: '#D27058',
  proteinBg: '#FCEEE8',
  carb: '#F1A64F',
  carbBg: '#FFF2DE',
  fat: '#D95656',
  fatBg: '#FCE7E7',
  hydration: '#5C97D4',
  hydrationBg: '#EBF4FD',
  green: '#D27058',
  greenSoft: '#FCEAE3',
  greenDark: '#8A4636',
  greenDeeper: '#743729',
  orange: '#F1A64F',
  yellow: '#FFF2DE',
  blue: '#5C97D4',
  blueSoft: '#EBF4FD',
  coralSoft: '#FFE8E3',
  bg: '#FFF9F6',
  bgAlt: '#FFF5F0',
  text: '#341E18',
  textSecondary: '#7A655E',
  textMuted: '#957C74',
  border: '#F0DED6',
  danger: '#D95656',
  shadow: 'rgba(52, 30, 24, 0.10)',
  surfaceAlt: '#FEF1EB',
  surfaceSoft: '#FCEEE8',
  macroProtein: '#D27058',
  macroProteinBg: '#FCEEE8',
  macroCarb: '#F1A64F',
  macroCarbBg: '#FFF2DE',
  macroFat: '#D95656',
  macroFatBg: '#FCE7E7',
};

const orchidPalette: BrandPalette = {
  forest: '#5E3276',
  fresh: '#8E52C2',
  mintSoft: '#F0E7F9',
  sageMist: '#F8F3FC',
  mango: '#E7A24B',
  coral: '#DA6C97',
  sky: '#5B8BE8',
  indigo: '#7A5DFD',
  ink: '#281B31',
  textSoft: '#6E6078',
  surface: '#FBF8FD',
  card: '#FFFFFF',
  borderSoft: '#E6DDF0',
  positive: '#8E52C2',
  positiveBg: '#F1E9FB',
  warning: '#9C6913',
  warningBg: '#FFF2E0',
  protein: '#8E52C2',
  proteinBg: '#F1E9FB',
  carb: '#E7A24B',
  carbBg: '#FFF1DE',
  fat: '#D45A79',
  fatBg: '#FCE6EE',
  hydration: '#5B8BE8',
  hydrationBg: '#EAF2FE',
  green: '#8E52C2',
  greenSoft: '#F0E7F9',
  greenDark: '#5E3276',
  greenDeeper: '#4B275E',
  orange: '#E7A24B',
  yellow: '#FFF1DE',
  blue: '#5B8BE8',
  blueSoft: '#EAF2FE',
  coralSoft: '#FCE7F0',
  bg: '#FBF8FD',
  bgAlt: '#F8F3FC',
  text: '#281B31',
  textSecondary: '#6E6078',
  textMuted: '#8A7C94',
  border: '#E6DDF0',
  danger: '#D45A79',
  shadow: 'rgba(40, 27, 49, 0.10)',
  surfaceAlt: '#F4ECFB',
  surfaceSoft: '#F1E9FB',
  macroProtein: '#8E52C2',
  macroProteinBg: '#F1E9FB',
  macroCarb: '#E7A24B',
  macroCarbBg: '#FFF1DE',
  macroFat: '#D45A79',
  macroFatBg: '#FCE6EE',
};

const brandPalettes: Record<ThemePaletteKey, BrandPalette> = {
  meadow: meadowPalette,
  ocean: oceanPalette,
  sunset: sunsetPalette,
  orchid: orchidPalette,
};

export const THEME_PALETTE_OPTIONS: readonly ThemePaletteOption[] = [
  {
    key: 'meadow',
    label: 'Verde Botanico',
    description: 'Mantem a identidade original com verdes frescos e fundos leves.',
    preview: [meadowPalette.greenDark, meadowPalette.green, meadowPalette.bgAlt],
  },
  {
    key: 'ocean',
    label: 'Azul Oceano',
    description: 'Traz um visual mais calmo, limpo e refrescante para o app inteiro.',
    preview: [oceanPalette.greenDark, oceanPalette.green, oceanPalette.bgAlt],
  },
  {
    key: 'sunset',
    label: 'Por do Sol',
    description: 'Aquece a interface com tons terrosos, laranja suave e clima acolhedor.',
    preview: [sunsetPalette.greenDark, sunsetPalette.green, sunsetPalette.bgAlt],
  },
  {
    key: 'orchid',
    label: 'Orquidea',
    description: 'Entrega uma identidade elegante, vibrante e mais premium.',
    preview: [orchidPalette.greenDark, orchidPalette.green, orchidPalette.bgAlt],
  },
];

export const DEFAULT_THEME_PALETTE_KEY: ThemePaletteKey = 'meadow';

function buildThemeColors(brand: BrandPalette) {
  const light: NavigationPalette = {
    text: brand.text,
    background: brand.bg,
    tint: brand.greenDark,
    icon: brand.textSecondary,
    tabIconDefault: brand.textMuted,
    tabIconSelected: brand.greenDark,
  };

  const dark: NavigationPalette = {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#C9B2FF',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#C9B2FF',
  };

  return { light, dark };
}

function buildShadows(brand: BrandPalette) {
  return {
    soft: {
      shadowColor: brand.text,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.05,
      shadowRadius: 22,
      elevation: 3,
    },
    card: {
      shadowColor: brand.text,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.05,
      shadowRadius: 22,
      elevation: 2,
    },
    floating: {
      shadowColor: brand.text,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.07,
      shadowRadius: 26,
      elevation: 5,
    },
  };
}

let activeThemePaletteKey: ThemePaletteKey = DEFAULT_THEME_PALETTE_KEY;

export const Brand: BrandPalette = { ...brandPalettes[DEFAULT_THEME_PALETTE_KEY] };

const initialColors = buildThemeColors(Brand);

export const Colors = {
  light: { ...initialColors.light },
  dark: { ...initialColors.dark },
};

const initialShadows = buildShadows(Brand);

export const Shadows = {
  soft: { ...initialShadows.soft },
  card: { ...initialShadows.card },
  floating: { ...initialShadows.floating },
};

export function isThemePaletteKey(value: string | null | undefined): value is ThemePaletteKey {
  return value === 'meadow' || value === 'ocean' || value === 'sunset' || value === 'orchid';
}

export function getThemePalette(key: ThemePaletteKey): BrandPalette {
  return brandPalettes[key];
}

export function getThemePaletteOption(key: ThemePaletteKey): ThemePaletteOption {
  return THEME_PALETTE_OPTIONS.find((option) => option.key === key) ?? THEME_PALETTE_OPTIONS[0];
}

export function getActiveThemePaletteKey() {
  return activeThemePaletteKey;
}

export function applyBrandPalette(key: ThemePaletteKey) {
  activeThemePaletteKey = key;

  const nextBrand = brandPalettes[key];
  Object.assign(Brand, nextBrand);

  const nextColors = buildThemeColors(nextBrand);
  Object.assign(Colors.light, nextColors.light);
  Object.assign(Colors.dark, nextColors.dark);

  const nextShadows = buildShadows(nextBrand);
  Object.assign(Shadows.soft, nextShadows.soft);
  Object.assign(Shadows.card, nextShadows.card);
  Object.assign(Shadows.floating, nextShadows.floating);
}

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
