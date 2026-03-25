import { Stack } from 'expo-router';

import { Brand } from '@/constants/theme';
import { HistoryWaterAnalysisScreen } from '@/features/history/history-water-analysis-screen';

export default function WaterAnalysisRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Analise de agua',
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
          headerTintColor: Brand.hydration,
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: Brand.bg },
          contentStyle: { backgroundColor: Brand.bg },
        }}
      />
      <HistoryWaterAnalysisScreen />
    </>
  );
}
