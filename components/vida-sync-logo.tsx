/**
 * Logo VidaSync
 *
 * "Vida" em verde (#7BC47F) + "Sync" em laranja (#F4A261)
 * Pode ser usado na splash, login, headers etc.
 */

import { Brand } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  size?: number;
  /** Mostrar tagline abaixo */
  tagline?: boolean;
};

export function VidaSyncLogo({ size = 36, tagline = false }: Props) {
  return (
    <View style={s.root}>
      <View style={s.row}>
        <Text style={[s.vida, { fontSize: size }]}>Vida</Text>
        <Text style={[s.sync, { fontSize: size }]}>Sync</Text>
      </View>
      {tagline && (
        <Text style={[s.tagline, { fontSize: size * 0.33 }]}>
          Seu diário nutricional inteligente
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vida: {
    fontWeight: '800',
    color: Brand.green,
    letterSpacing: -0.5,
  },
  sync: {
    fontWeight: '800',
    color: Brand.orange,
    letterSpacing: -0.5,
  },
  tagline: {
    color: Brand.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
