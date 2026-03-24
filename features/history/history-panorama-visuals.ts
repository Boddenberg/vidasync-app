import { Brand } from '@/constants/theme';

export type PanoramaVisualVersion = 'v1' | 'v2' | 'v3' | 'v4';

export type PanoramaVisualOption = {
  key: PanoramaVisualVersion;
  label: string;
  title: string;
  note: string;
};

export type PanoramaVisualSpec = {
  chartStyle: 'area' | 'lollipop' | 'step' | 'capsule';
  stageSurface: string;
  stageBorder: string;
  stageInsetSurface: string;
  stageInsetBorder: string;
  selectionSurface: string;
  selectionBorder: string;
  eyebrowSurface: string;
  eyebrowText: string;
  axisSurface: string | null;
  axisBorder: string | null;
  axisText: string;
  xAxisSurface: string | null;
  xAxisBorder: string | null;
  xAxisText: string;
  legendSurface: string | null;
  legendBorder: string | null;
  valueSurface: string;
  valueBorder: string;
  valueLabel: string;
  hintTone: string;
  titleTone: string;
  stageDecoration: 'mist' | 'beam' | 'editorial' | 'pulse';
  gridOpacity: number;
  gridDashArray?: string;
  lineWidth: number;
  dotRadius: number;
  selectedDotRadius: number;
  barOpacity: number;
};

export const PANORAMA_VISUAL_OPTIONS: PanoramaVisualOption[] = [
  {
    key: 'v1',
    label: 'Versao 1',
    title: 'Calma suave',
    note: 'Linha com area suave para agua e calorias, com leitura classica e mais familiar.',
  },
  {
    key: 'v2',
    label: 'Versao 2',
    title: 'Lollipop',
    note: 'Pontos com hastes verticais e ritmo mais marcado, para deixar cada dia mais legivel.',
  },
  {
    key: 'v3',
    label: 'Versao 3',
    title: 'Step',
    note: 'Linha em degraus e visual mais editorial, destacando mudancas de nivel entre os dias.',
  },
  {
    key: 'v4',
    label: 'Versao 4',
    title: 'Capsulas',
    note: 'Colunas em capsula com trilho de fundo e mais presenca visual sem perder a leitura.',
  },
];

export function getPanoramaVisualSpec(version: PanoramaVisualVersion): PanoramaVisualSpec {
  switch (version) {
    case 'v2':
      return {
        chartStyle: 'lollipop',
        stageSurface: '#EEF5F0',
        stageBorder: '#D3E3D7',
        stageInsetSurface: '#FFFFFF',
        stageInsetBorder: '#D7E7DB',
        selectionSurface: '#F7FBF8',
        selectionBorder: '#D3E5D6',
        eyebrowSurface: '#E0F3E6',
        eyebrowText: Brand.greenDark,
        axisSurface: '#F2F7F3',
        axisBorder: '#D8E6DB',
        axisText: Brand.greenDark,
        xAxisSurface: '#FFFFFF',
        xAxisBorder: '#D7E7DB',
        xAxisText: Brand.textSecondary,
        legendSurface: '#FFFFFF',
        legendBorder: '#D7E7DB',
        valueSurface: '#FFFFFF',
        valueBorder: '#D7E7DB',
        valueLabel: Brand.greenDark,
        hintTone: Brand.textSecondary,
        titleTone: Brand.text,
        stageDecoration: 'beam',
        gridOpacity: 0.95,
        gridDashArray: '3 5',
        lineWidth: 3.6,
        dotRadius: 3.8,
        selectedDotRadius: 6,
        barOpacity: 0.82,
      };
    case 'v3':
      return {
        chartStyle: 'step',
        stageSurface: '#FFFFFF',
        stageBorder: '#E0EAE2',
        stageInsetSurface: '#FBFDFB',
        stageInsetBorder: '#E4ECE5',
        selectionSurface: '#FFFFFF',
        selectionBorder: '#E0EAE2',
        eyebrowSurface: '#F3F7F4',
        eyebrowText: Brand.textSecondary,
        axisSurface: null,
        axisBorder: null,
        axisText: Brand.textMuted,
        xAxisSurface: null,
        xAxisBorder: null,
        xAxisText: Brand.textMuted,
        legendSurface: null,
        legendBorder: null,
        valueSurface: '#FFFFFF',
        valueBorder: '#E0EAE2',
        valueLabel: Brand.textSecondary,
        hintTone: Brand.textSecondary,
        titleTone: Brand.text,
        stageDecoration: 'editorial',
        gridOpacity: 0.72,
        gridDashArray: '2 6',
        lineWidth: 2.6,
        dotRadius: 2.8,
        selectedDotRadius: 5.2,
        barOpacity: 0.74,
      };
    case 'v4':
      return {
        chartStyle: 'capsule',
        stageSurface: '#ECF7F0',
        stageBorder: '#CBE3D1',
        stageInsetSurface: '#F8FCF9',
        stageInsetBorder: '#D3E7D8',
        selectionSurface: '#F4FBF6',
        selectionBorder: '#CAE4D0',
        eyebrowSurface: '#DDF4E3',
        eyebrowText: Brand.greenDark,
        axisSurface: '#F8FCF9',
        axisBorder: '#D7E6DA',
        axisText: Brand.greenDark,
        xAxisSurface: '#F4FBF6',
        xAxisBorder: '#CFE5D5',
        xAxisText: Brand.greenDark,
        legendSurface: '#F8FCF9',
        legendBorder: '#D3E7D8',
        valueSurface: '#FFFFFF',
        valueBorder: '#D5E8D9',
        valueLabel: Brand.greenDark,
        hintTone: Brand.textSecondary,
        titleTone: Brand.text,
        stageDecoration: 'pulse',
        gridOpacity: 0.92,
        gridDashArray: '4 4',
        lineWidth: 3.8,
        dotRadius: 4.1,
        selectedDotRadius: 6.4,
        barOpacity: 0.86,
      };
    case 'v1':
    default:
      return {
        chartStyle: 'area',
        stageSurface: '#F4FAF6',
        stageBorder: '#D5E6D8',
        stageInsetSurface: '#FCFEFC',
        stageInsetBorder: '#E2ECE4',
        selectionSurface: '#F7FBF8',
        selectionBorder: '#D7E7DB',
        eyebrowSurface: '#E7F6EB',
        eyebrowText: Brand.greenDark,
        axisSurface: '#F9FCF9',
        axisBorder: '#E2ECE4',
        axisText: Brand.textSecondary,
        xAxisSurface: '#F9FCF9',
        xAxisBorder: '#E2ECE4',
        xAxisText: Brand.textSecondary,
        legendSurface: '#F9FCF9',
        legendBorder: '#E2ECE4',
        valueSurface: '#FFFFFF',
        valueBorder: '#DDE9DF',
        valueLabel: Brand.greenDark,
        hintTone: Brand.textSecondary,
        titleTone: Brand.text,
        stageDecoration: 'mist',
        gridOpacity: 0.84,
        gridDashArray: '4 5',
        lineWidth: 3.2,
        dotRadius: 3.4,
        selectedDotRadius: 5.6,
        barOpacity: 0.78,
      };
  }
}
