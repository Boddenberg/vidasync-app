/**
 * VidaSync — Design System
 * Identidade visual: saúde, leveza, alimentação natural, tecnologia amigável.
 */

import { Platform } from 'react-native';

export const Brand = {
  green: '#7BC47F',
  greenDark: '#4CAF50',
  orange: '#F4A261',
  yellow: '#F6D365',
  bg: '#F9FAF7',
  card: '#FFFFFF',
  text: '#3A3A3A',
  textSecondary: '#7A7A7A',
  border: '#EDEEEB',
  danger: '#E05656',
  shadow: 'rgba(0,0,0,0.04)',
};

const tintColorLight = Brand.green;
const tintColorDark = '#A8E6A3';

export const Colors = {
  light: {
    text: Brand.text,
    background: Brand.bg,
    tint: tintColorLight,
    icon: Brand.textSecondary,
    tabIconDefault: '#B0B0B0',
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
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
