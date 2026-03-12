import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Brand, Radii, Shadows, Typography } from '@/constants/theme';

const SHOW_DEVTOOLS_TAB = true;

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
        tabBarActiveBackgroundColor: 'transparent',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
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
          title: 'Historico',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={20} name={focused ? 'time' : 'time-outline'} color={color} />
          ),
        }}
      />
      {SHOW_DEVTOOLS_TAB && (
        <Tabs.Screen
          name="devtools"
          options={{
            title: 'Ferramentas',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons size={20} name={focused ? 'construct' : 'construct-outline'} color={color} />
            ),
          }}
        />
      )}
    </Tabs>
  );
}

const s = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    borderTopColor: Brand.border,
    backgroundColor: Brand.card,
    minHeight: 64,
    paddingTop: 7,
    paddingBottom: 8,
    ...Shadows.card,
  },
  tabBarItem: {
    borderRadius: Radii.md,
    marginHorizontal: 2,
    marginVertical: 2,
  },
  tabBarLabel: {
    ...Typography.caption,
    marginTop: 1,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
