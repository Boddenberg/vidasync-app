import { ScrollView, StyleSheet, View } from 'react-native';

import { FeedbackCenter } from '@/components/feedback/feedback-center';
import { Brand } from '@/constants/theme';

export default function FeedbackScreen() {
  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <FeedbackCenter />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  scroll: {
    padding: 18,
    paddingBottom: 48,
  },
});
