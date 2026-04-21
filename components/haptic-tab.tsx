import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      // Remove o ripple branco do Android que causa o "flash feio" ao selecionar.
      android_ripple={{ color: 'transparent', borderless: true, radius: 0 }}
      pressOpacity={0.7}
      onPressIn={(ev) => {
        Haptics.selectionAsync();
        props.onPressIn?.(ev);
      }}
    />
  );
}
