import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { Brand } from '@/constants/theme';

type Props = {
  name: keyof typeof Ionicons.glyphMap;
  focusedName?: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
  size?: number;
};

export function TabBarIcon({ name, focusedName, color, focused, size = 22 }: Props) {
  const iconName = focused && focusedName ? focusedName : name;

  return (
    <View style={s.wrap}>
      <Ionicons name={iconName} size={size} color={color} />
      <View style={[s.dot, focused ? s.dotActive : null]} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  dotActive: {
    backgroundColor: Brand.greenDeeper,
  },
});
