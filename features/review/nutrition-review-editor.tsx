import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, Text, View } from 'react-native';

import { AppInput } from '@/components/app-input';
import { Brand } from '@/constants/theme';
import { s } from '@/features/review/review-editor-styles';
import { buildRevealStyle, sourceLabel } from '@/features/review/review-utils';
import type { NutritionCorrection } from '@/types/nutrition';
import type { NutritionReviewDraft } from '@/types/review';

type Props = {
  draft: NutritionReviewDraft;
  source: 'photo' | 'audio';
  title: string;
  photoUri: string | null;
  corrections: NutritionCorrection[];
  onChangeSummary: (
    field: 'calories' | 'protein' | 'carbs' | 'fat',
    value: string,
  ) => void;
  onChangeItem: (
    itemId: string,
    field: 'name' | 'calories' | 'protein' | 'carbs' | 'fat',
    value: string,
  ) => void;
  onAddItem: () => void;
  onRemoveItem: (itemId: string) => void;
};

export function NutritionReviewEditor({
  draft,
  source,
  title,
  photoUri,
  corrections,
  onChangeSummary,
  onChangeItem,
  onAddItem,
  onRemoveItem,
}: Props) {
  const [showManualEditor, setShowManualEditor] = useState(false);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const correctionAnim = useRef(new Animated.Value(0)).current;
  const itemsAnim = useRef(new Animated.Value(0)).current;
  const editorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sequence = [heroAnim, correctionAnim, itemsAnim, editorAnim];
    sequence.forEach((value) => value.setValue(0));

    Animated.stagger(
      100,
      sequence.map((value) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [
    correctionAnim,
    draft.items.length,
    draft.summary.calories,
    draft.summary.carbs,
    draft.summary.fat,
    draft.summary.protein,
    editorAnim,
    heroAnim,
    itemsAnim,
    title,
  ]);

  return (
    <>
      <Animated.View style={[s.heroCard, buildRevealStyle(heroAnim)]}>
        <View style={s.heroGlowMain} />
        <View style={s.heroGlowSecondary} />

        <Text style={s.heroLabel}>Alimento reconhecido</Text>
        {photoUri ? <Image source={{ uri: photoUri }} style={s.heroPhoto} /> : null}
        <Text style={s.heroTitle}>{title}</Text>
        <Text style={s.heroCalories}>{draft.summary.calories}</Text>
        <Text style={s.heroSubtitle}>
          Estimativa total da análise por {sourceLabel(source).toLowerCase()}.
        </Text>

        <View style={s.heroMacroRow}>
          <MacroChip label="Proteína" value={draft.summary.protein} color="#2D89C6" bg="#E8F4FC" />
          <MacroChip label="Carbo" value={draft.summary.carbs} color="#D98A32" bg="#FFF2E4" />
          <MacroChip label="Gordura" value={draft.summary.fat} color="#D24E40" bg="#FEEDEA" />
        </View>
      </Animated.View>

      {corrections.length > 0 ? (
        <Animated.View style={[s.card, buildRevealStyle(correctionAnim)]}>
          <Text style={s.sectionTitle}>Ajustes automáticos</Text>
          {corrections.map((entry, index) => (
            <View key={`${entry.original}-${entry.corrected}-${index}`} style={s.correctionRow}>
              <Text style={s.correctionFrom}>{entry.original}</Text>
              <Text style={s.correctionArrow}>para</Text>
              <Text style={s.correctionTo}>{entry.corrected}</Text>
            </View>
          ))}
        </Animated.View>
      ) : null}

      <Animated.View style={[s.card, buildRevealStyle(itemsAnim)]}>
        <Text style={s.sectionTitle}>Itens encontrados</Text>

        {draft.items.length > 0 ? (
          <View style={s.detectedList}>
            {draft.items.map((item) => (
              <View key={item.id} style={s.detectedItem}>
                <View style={s.detectedItemHeader}>
                  <Text style={s.detectedName}>{item.name || 'Item sem nome'}</Text>
                </View>

                <View style={s.detectedMacroRow}>
                  <MacroChip label="kcal" value={item.calories} color={Brand.greenDark} bg="#ECF8ED" compact />
                  <MacroChip label="prot" value={item.protein} color="#2D89C6" bg="#E8F4FC" compact />
                  <MacroChip label="carb" value={item.carbs} color="#D98A32" bg="#FFF2E4" compact />
                  <MacroChip label="gord" value={item.fat} color="#D24E40" bg="#FEEDEA" compact />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={s.emptyInlineText}>
            Nesta leitura recebemos apenas o resumo geral, sem separação por itens.
          </Text>
        )}
      </Animated.View>

      <Animated.View style={[s.card, buildRevealStyle(editorAnim)]}>
        <Pressable style={s.manualToggleButton} onPress={() => setShowManualEditor((current) => !current)}>
          <Text style={s.manualToggleText}>
            {showManualEditor ? 'Ocultar ajustes manuais' : 'Ajustar manualmente (opcional)'}
          </Text>
        </Pressable>

        {showManualEditor ? (
          <View style={s.manualEditorBody}>
            <Text style={s.inputLabel}>Resumo de macros</Text>
            <View style={s.gridRow}>
              <View style={s.gridCell}>
                <Text style={s.inputLabel}>Calorias</Text>
                <AppInput
                  value={draft.summary.calories}
                  onChangeText={(value) => onChangeSummary('calories', value)}
                  placeholder="0 kcal"
                />
              </View>
              <View style={s.gridCell}>
                <Text style={s.inputLabel}>Proteína</Text>
                <AppInput
                  value={draft.summary.protein}
                  onChangeText={(value) => onChangeSummary('protein', value)}
                  placeholder="0 g"
                />
              </View>
            </View>

            <View style={s.gridRow}>
              <View style={s.gridCell}>
                <Text style={s.inputLabel}>Carboidratos</Text>
                <AppInput
                  value={draft.summary.carbs}
                  onChangeText={(value) => onChangeSummary('carbs', value)}
                  placeholder="0 g"
                />
              </View>
              <View style={s.gridCell}>
                <Text style={s.inputLabel}>Gorduras</Text>
                <AppInput
                  value={draft.summary.fat}
                  onChangeText={(value) => onChangeSummary('fat', value)}
                  placeholder="0 g"
                />
              </View>
            </View>

            <Text style={s.inputLabel}>Itens</Text>
            {draft.items.length === 0 ? (
              <Text style={s.emptyInlineText}>
                Nenhum item separado. Você pode adicionar manualmente.
              </Text>
            ) : null}

            {draft.items.map((item) => (
              <View key={item.id} style={s.itemCard}>
                <Text style={s.inputLabel}>Nome do item</Text>
                <AppInput
                  value={item.name}
                  onChangeText={(value) => onChangeItem(item.id, 'name', value)}
                  placeholder="Nome do alimento"
                />

                <View style={s.gridRow}>
                  <View style={s.gridCell}>
                    <Text style={s.inputLabel}>Calorias</Text>
                    <AppInput
                      value={item.calories}
                      onChangeText={(value) => onChangeItem(item.id, 'calories', value)}
                      placeholder="0 kcal"
                    />
                  </View>
                  <View style={s.gridCell}>
                    <Text style={s.inputLabel}>Proteína</Text>
                    <AppInput
                      value={item.protein}
                      onChangeText={(value) => onChangeItem(item.id, 'protein', value)}
                      placeholder="0 g"
                    />
                  </View>
                </View>

                <View style={s.gridRow}>
                  <View style={s.gridCell}>
                    <Text style={s.inputLabel}>Carboidratos</Text>
                    <AppInput
                      value={item.carbs}
                      onChangeText={(value) => onChangeItem(item.id, 'carbs', value)}
                      placeholder="0 g"
                    />
                  </View>
                  <View style={s.gridCell}>
                    <Text style={s.inputLabel}>Gorduras</Text>
                    <AppInput
                      value={item.fat}
                      onChangeText={(value) => onChangeItem(item.id, 'fat', value)}
                      placeholder="0 g"
                    />
                  </View>
                </View>

                <Pressable style={s.removeButton} onPress={() => onRemoveItem(item.id)}>
                  <Text style={s.removeButtonText}>Remover item</Text>
                </Pressable>
              </View>
            ))}

            <Pressable style={s.addButton} onPress={onAddItem}>
              <Text style={s.addButtonText}>+ Adicionar item</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={s.manualHint}>
            Use esta opção apenas se quiser corrigir nomes ou macros antes do reenvio.
          </Text>
        )}
      </Animated.View>
    </>
  );
}

function MacroChip({
  label,
  value,
  color,
  bg,
  compact = false,
}: {
  label: string;
  value: string;
  color: string;
  bg: string;
  compact?: boolean;
}) {
  return (
    <View style={[s.macroChip, compact && s.macroChipCompact, { backgroundColor: bg }]}>
      <Text style={[s.macroChipLabel, { color }]}>{label}</Text>
      <Text style={[s.macroChipValue, { color }]}>{value}</Text>
    </View>
  );
}
