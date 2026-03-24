import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/app-card';
import { Brand, Radii, Typography } from '@/constants/theme';

export function HistoryPanoramaCard() {
  return (
    <AppCard style={s.card}>
      <View style={s.header}>
        <View style={s.iconWrap}>
          <Ionicons name="stats-chart-outline" size={18} color={Brand.greenDark} />
        </View>

        <View style={s.copy}>
          <Text style={s.eyebrow}>Panorama</Text>
          <Text style={s.title}>Visão rápida dos últimos dias</Text>
          <Text style={s.hint}>Estou preparando um resumo simples para acompanhar água, calorias e registros recentes.</Text>
        </View>
      </View>
    </AppCard>
  );
}

const s = StyleSheet.create({
  card: {
    gap: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: Radii.md,
    backgroundColor: Brand.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  title: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  hint: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
});
