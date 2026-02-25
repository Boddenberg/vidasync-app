/**
 * Ilustração decorativa da Home
 *
 * Composição SVG minimalista com formas orgânicas
 * que remetem a alimentos/nutrição de forma abstrata.
 * Círculos sobrepostos com opacidades suaves.
 */

import { Brand } from '@/constants/theme';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

type Props = {
  size?: number;
};

export function NutritionIllustration({ size = 180 }: Props) {
  const cx = size / 2;
  const cy = size / 2;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <LinearGradient id="grad1" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={Brand.green} stopOpacity="0.25" />
          <Stop offset="1" stopColor={Brand.green} stopOpacity="0.05" />
        </LinearGradient>
        <LinearGradient id="grad2" x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor={Brand.orange} stopOpacity="0.2" />
          <Stop offset="1" stopColor={Brand.yellow} stopOpacity="0.06" />
        </LinearGradient>
        <LinearGradient id="grad3" x1="1" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={Brand.green} stopOpacity="0.15" />
          <Stop offset="1" stopColor={Brand.yellow} stopOpacity="0.08" />
        </LinearGradient>
      </Defs>

      {/* Grande círculo de fundo */}
      <Circle cx={cx} cy={cy} r={cx * 0.88} fill="url(#grad1)" />

      {/* Círculo deslocado — laranja suave */}
      <Circle cx={cx * 1.25} cy={cy * 0.7} r={cx * 0.52} fill="url(#grad2)" />

      {/* Círculo menor — verde suave */}
      <Circle cx={cx * 0.65} cy={cy * 1.2} r={cx * 0.38} fill="url(#grad3)" />

      {/* Anel central elegante */}
      <Circle
        cx={cx}
        cy={cy}
        r={cx * 0.32}
        fill="none"
        stroke={Brand.green}
        strokeWidth={1.5}
        strokeOpacity={0.2}
      />

      {/* Ponto central */}
      <Circle cx={cx} cy={cy} r={3.5} fill={Brand.green} fillOpacity={0.4} />
    </Svg>
  );
}
