import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Typography } from '@/constants/theme';
import type { ObservabilityDashboardTab } from '@/services/observability-summary';

type TabOption = {
  id: ObservabilityDashboardTab;
  label: string;
  description: string;
};

export function ObservabilityTabs({
  activeTab,
  tabs,
  onChange,
}: {
  activeTab: ObservabilityDashboardTab;
  tabs: TabOption[];
  onChange: (tab: ObservabilityDashboardTab) => void;
}) {
  return (
    <View style={s.root}>
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <Pressable
            key={tab.id}
            style={({ pressed }) => [s.tab, active && s.tabActive, pressed && s.pressed]}
            onPress={() => onChange(tab.id)}>
            <Text style={[s.tabLabel, active && s.tabLabelActive]}>{tab.label}</Text>
            <Text style={[s.tabDescription, active && s.tabDescriptionActive]}>{tab.description}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tab: {
    minWidth: 150,
    flexGrow: 1,
    flexBasis: 150,
    borderRadius: Radii.lg,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  tabActive: {
    backgroundColor: '#EAF8EE',
    borderColor: '#C8E7D2',
  },
  tabLabel: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '800',
  },
  tabLabelActive: {
    color: Brand.greenDark,
  },
  tabDescription: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  tabDescriptionActive: {
    color: Brand.greenDark,
  },
  pressed: {
    opacity: 0.92,
  },
});
