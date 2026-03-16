import { Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { s } from '@/features/home/home-screen.styles';
import { formatDateChip } from '@/features/home/home-utils';

type Props = {
  selectedDate: string;
  onOpenRegisterOptions: () => void;
};

export function HomeRegisterCard({ selectedDate, onOpenRegisterOptions }: Props) {
  return (
    <View style={s.actionCard}>
      <Text style={s.sectionTitle}>Registrar refeição</Text>
      <Text style={s.sectionSub}>
        Busque um alimento, use foto, reaproveite pratos salvos ou monte manualmente o que entrou em {formatDateChip(selectedDate)}.
      </Text>
      <AppButton title="Registrar refeição" onPress={onOpenRegisterOptions} />
    </View>
  );
}
