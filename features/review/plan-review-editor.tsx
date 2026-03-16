import { Pressable, Text, TextInput, View } from 'react-native';

import { AppInput } from '@/components/app-input';
import { Brand } from '@/constants/theme';
import { s } from '@/features/review/review-editor-styles';
import type { PlanReviewDraft } from '@/types/review';

type Props = {
  draft: PlanReviewDraft;
  onChangeSection: (itemId: string, field: 'title' | 'text', value: string) => void;
  onAddSection: () => void;
  onRemoveSection: (itemId: string) => void;
};

export function PlanReviewEditor({ draft, onChangeSection, onAddSection, onRemoveSection }: Props) {
  return (
    <>
      <View style={s.card}>
        <Text style={s.sectionTitle}>Texto extraído</Text>
        <TextInput
          value={draft.extractedText}
          onChangeText={() => null}
          editable={false}
          multiline
          style={[s.multiInput, s.readonlyInput]}
        />
      </View>

      <View style={s.card}>
        <Text style={s.sectionTitle}>Seções</Text>
        {draft.sections.map((section) => (
          <View key={section.id} style={s.itemCard}>
            <Text style={s.inputLabel}>Título</Text>
            <AppInput
              value={section.title}
              onChangeText={(value) => onChangeSection(section.id, 'title', value)}
              placeholder="Título da seção"
            />

            <Text style={s.inputLabel}>Texto</Text>
            <TextInput
              value={section.text}
              onChangeText={(value) => onChangeSection(section.id, 'text', value)}
              placeholder="Conteúdo da seção"
              placeholderTextColor={Brand.textSecondary}
              multiline
              style={s.multiInput}
            />

            <PressableButton label="Remover seção" onPress={() => onRemoveSection(section.id)} tone="danger" />
          </View>
        ))}

        <PressableButton label="+ Adicionar seção" onPress={onAddSection} tone="positive" />
      </View>
    </>
  );
}

function PressableButton({
  label,
  onPress,
  tone,
}: {
  label: string;
  onPress: () => void;
  tone: 'positive' | 'danger';
}) {
  const buttonStyle = tone === 'positive' ? s.addButton : s.removeButton;
  const textStyle = tone === 'positive' ? s.addButtonText : s.removeButtonText;

  return (
    <Pressable style={buttonStyle} onPress={onPress}>
      <Text style={textStyle}>
        {label}
      </Text>
    </Pressable>
  );
}
