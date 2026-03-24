import { Stack } from 'expo-router';

import { Brand } from '@/constants/theme';
import { HistoryPanoramaScreen } from '@/features/history/history-panorama-screen';

export default function ProgressPanoramaRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Panorama',
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
          headerTintColor: Brand.greenDark,
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: Brand.bg },
          contentStyle: { backgroundColor: Brand.bg },
        }}
      />
      <HistoryPanoramaScreen />
    </>
  );
}
