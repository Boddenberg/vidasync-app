import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Brand, Radii, Shadows, Typography } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Brand.greenDark,
        tabBarInactiveTintColor: Brand.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        tabBarStyle: s.tabBar,
        tabBarItemStyle: s.tabBarItem,
        tabBarLabelStyle: s.tabBarLabel,
        tabBarActiveBackgroundColor: Brand.surfaceSoft,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={21} name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Pratos',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={21} name={focused ? 'restaurant' : 'restaurant-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Progresso',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={20} name={focused ? 'stats-chart' : 'stats-chart-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Fit',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={20}
              name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
              color={color}
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
    borderTopWidth: 1,
    borderTopColor: Brand.border,
    backgroundColor: Brand.card,
    minHeight: 78,
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 10,
    ...Shadows.floating,
  },
  tabBarItem: {
    borderRadius: Radii.lg,
    marginHorizontal: 6,
    marginVertical: 4,
  },
  tabBarLabel: {
    ...Typography.caption,
    marginTop: 2,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
