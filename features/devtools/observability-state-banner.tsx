import { StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Typography } from '@/constants/theme';
import type { ObservabilityExecutiveDataQuality } from '@/services/observability-summary';

function bannerColors(tone: ObservabilityExecutiveDataQuality['tone']) {
  if (tone === 'positive') return { bg: '#EAF8EE', border: '#C8E7D2', text: Brand.greenDark };
  if (tone === 'warning') return { bg: '#FFF3E3', border: '#F3D2A8', text: '#B96B00' };
  if (tone === 'critical') return { bg: '#FDE7E7', border: '#F5C2C2', text: Brand.danger };
  return { bg: Brand.bg, border: Brand.border, text: Brand.textSecondary };
}

export function ObservabilityStateBanner({
  dataQuality,
}: {
  dataQuality: ObservabilityExecutiveDataQuality;
}) {
  const colors = bannerColors(dataQuality.tone);

  return (
    <View style={[s.root, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[s.title, { color: colors.text }]}>{dataQuality.title}</Text>
      <Text style={s.description}>{dataQuality.description}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  title: {
    ...Typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  description: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
});
