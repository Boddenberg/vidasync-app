import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { TabBarIcon } from '@/components/tab-bar-icon';
import { Brand, Shadows, Typography } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Brand.greenDeeper,
        tabBarInactiveTintColor: Brand.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        tabBarStyle: s.tabBar,
        tabBarItemStyle: s.tabBarItem,
        tabBarLabelStyle: s.tabBarLabel,
        // Remove qualquer fundo no estado ativo — o indicador é o próprio ícone + dot.
        tabBarActiveBackgroundColor: 'transparent',
        tabBarInactiveBackgroundColor: 'transparent',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="home-outline" focusedName="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Pratos',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name="restaurant-outline"
              focusedName="restaurant"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Progresso',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name="stats-chart-outline"
              focusedName="stats-chart"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Fitty',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name="chatbubble-ellipses-outline"
              focusedName="chatbubble-ellipses"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="devtools"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  tabBar: {
    borderTopWidth: 0,
    backgroundColor: '#FFFFFF',
    minHeight: 78,
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 6,
    ...Shadows.floating,
  },
  tabBarItem: {
    marginHorizontal: 2,
    paddingVertical: 2,
    // Sem borderRadius nem background para evitar a "caixinha branca" no estado ativo.
  },
  tabBarLabel: {
    ...Typography.caption,
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
