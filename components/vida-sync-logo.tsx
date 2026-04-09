import { StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';

type Props = {
  size?: number;
  tagline?: boolean;
};

export function VidaSyncLogo({ size = 36, tagline = false }: Props) {
  return (
    <View style={s.root}>
      <View style={s.row}>
        <Text style={[s.vida, { fontSize: size, color: Brand.green }]}>Vida</Text>
        <Text style={[s.sync, { fontSize: size, color: Brand.orange }]}>Sync</Text>
      </View>
      {tagline ? (
        <Text style={[s.tagline, { fontSize: size * 0.33, color: Brand.textSecondary }]}>
          Seu diario nutricional inteligente
        </Text>
      ) : null}
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
    letterSpacing: -0.5,
  },
  sync: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
