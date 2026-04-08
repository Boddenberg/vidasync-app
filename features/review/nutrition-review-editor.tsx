import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, Text, View } from 'react-native';

import { AppInput } from '@/components/app-input';
import { Brand } from '@/constants/theme';
import { s } from '@/features/review/review-editor-styles';
import { buildRevealStyle, sourceLabel } from '@/features/review/review-utils';
import type { NutritionCorrection } from '@/types/nutrition';
import type { NutritionReviewDraft, NutritionReviewDraftItem, NutritionReviewItemStatus } from '@/types/review';

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

export function NutritionReviewEditor(props: Props) {
  const { draft, source, title, photoUri, corrections, onChangeSummary } = props;
  const [showManualEditor, setShowManualEditor] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

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

  useEffect(() => {
    setSelectedItemId((current) =>
      current && draft.items.some((item) => item.id === current) ? current : null,
    );
  }, [draft.items]);

  return (
    <>
      <Animated.View style={[s.nutritionHeroCard, buildRevealStyle(heroAnim)]}>
        <View style={s.nutritionHeroGlowTop} />
        <View style={s.nutritionHeroGlowBottom} />

        <View style={s.nutritionHeroHeader}>
          <View style={s.nutritionHeroCopy}>
            <View style={s.nutritionHeroBadgeRow}>
              <View style={s.heroEyebrowPill}>
                <Text style={s.heroEyebrowText}>Revisao guiada</Text>
              </View>
              <View style={s.heroSourcePill}>
                <Ionicons
                  name={source === 'photo' ? 'camera-outline' : 'mic-outline'}
                  size={13}
                  color={Brand.greenDark}
                />
                <Text style={s.heroSourceText}>{sourceLabel(source)}</Text>
              </View>
            </View>

            <Text style={s.nutritionHeroTitle}>{title}</Text>
            <Text style={s.nutritionHeroSubtitle}>
              Revise os itens identificados antes de salvar a refeicao.
            </Text>
          </View>

          {photoUri ? (
            <Image source={{ uri: photoUri }} style={s.nutritionHeroPhoto} />
          ) : (
            <View style={s.nutritionHeroPhotoFallback}>
              <Ionicons name="restaurant-outline" size={22} color={Brand.textSecondary} />
            </View>
          )}
        </View>

        <View style={s.nutritionHeroMetaRow}>
          <InfoBadge
            label={`${draft.items.length}`}
            text={draft.items.length === 1 ? 'ingrediente' : 'ingredientes'}
          />
          {corrections.length > 0 ? (
            <InfoBadge label={`${corrections.length}`} text="ajustes auto" warm />
          ) : null}
        </View>

        <View style={s.summaryGrid}>
          <SummaryMetricCard
            label="Calorias"
            value={draft.summary.calories}
            color={Brand.greenDark}
            accentBg="#ECF8ED"
          />
          <SummaryMetricCard
            label="Proteina"
            value={draft.summary.protein}
            color="#2D89C6"
            accentBg="#E8F4FC"
          />
          <SummaryMetricCard
            label="Carboidratos"
            value={draft.summary.carbs}
            color="#D98A32"
            accentBg="#FFF2E4"
          />
          <SummaryMetricCard
            label="Gorduras"
            value={draft.summary.fat}
            color="#D24E40"
            accentBg="#FEEDEA"
          />
        </View>
      </Animated.View>

      {corrections.length > 0 ? (
        <Animated.View style={[s.reviewCard, buildRevealStyle(correctionAnim)]}>
          <View style={s.sectionHeaderRow}>
            <View style={s.sectionCopy}>
              <Text style={s.sectionTitle}>Ajustes automaticos</Text>
              <Text style={s.sectionHint}>Itens recalculados pela IA antes desta revisao.</Text>
            </View>
            <View style={s.sectionCountBadge}>
              <Text style={s.sectionCountText}>{corrections.length}</Text>
            </View>
          </View>

          <View style={s.correctionsWrap}>
            {corrections.map((entry, index) => (
              <View key={`${entry.original}-${entry.corrected}-${index}`} style={s.correctionBadge}>
                <Text style={s.correctionFrom}>{entry.original}</Text>
                <Ionicons name="arrow-forward" size={12} color={Brand.textSecondary} />
                <Text style={s.correctionTo}>{entry.corrected}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      ) : null}

      <Animated.View style={[s.reviewCard, buildRevealStyle(itemsAnim)]}>
        <View style={s.sectionHeaderRow}>
          <View style={s.sectionCopy}>
            <Text style={s.sectionTitle}>Ingredientes identificados</Text>
            <Text style={s.sectionHint}>Cards compactos prontos para a proxima etapa de edicao.</Text>
          </View>
          {draft.items.length > 0 ? (
            <View style={s.sectionCountBadge}>
              <Text style={s.sectionCountText}>{draft.items.length}</Text>
            </View>
          ) : null}
        </View>

        {draft.items.length > 0 ? (
          <View style={s.ingredientList}>
            {draft.items.map((item) => {
              const isSelected = selectedItemId === item.id;

              return (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    s.ingredientCard,
                    isSelected && s.ingredientCardActive,
                    pressed && s.ingredientCardPressed,
                  ]}
                  onPress={() => setSelectedItemId((current) => (current === item.id ? null : item.id))}>
                  <View style={s.ingredientHeader}>
                    <View style={s.ingredientCopy}>
                      <Text style={s.ingredientName}>{item.name || 'Ingrediente sem nome'}</Text>
                      {item.quantityLabel ? (
                        <Text style={s.ingredientMetaText}>{item.quantityLabel}</Text>
                      ) : null}
                    </View>

                    <View style={s.ingredientHeaderRight}>
                      <StatusPill status={item.status} />
                      <Ionicons
                        name={isSelected ? 'chevron-up-outline' : 'chevron-forward-outline'}
                        size={16}
                        color={Brand.textSecondary}
                      />
                    </View>
                  </View>

                  <View style={s.detectedMacroRow}>
                    <MacroChip label="kcal" value={item.calories} color={Brand.greenDark} bg="#ECF8ED" compact />
                    <MacroChip label="prot" value={item.protein} color="#2D89C6" bg="#E8F4FC" compact />
                    <MacroChip label="carb" value={item.carbs} color="#D98A32" bg="#FFF2E4" compact />
                    <MacroChip label="gord" value={item.fat} color="#D24E40" bg="#FEEDEA" compact />
                  </View>

                  {item.precisaRevisao ? (
                    <Text style={s.ingredientAttentionText}>Este item foi sinalizado para revisao.</Text>
                  ) : null}

                  {isSelected ? <IngredientReviewDetails item={item} /> : null}
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text style={s.emptyInlineText}>
            Nesta leitura recebemos apenas o resumo geral, sem separacao por itens.
          </Text>
        )}
      </Animated.View>

      <Animated.View style={[s.reviewCard, buildRevealStyle(editorAnim)]}>
        <View style={s.sectionHeaderRow}>
          <View style={s.sectionCopy}>
            <Text style={s.sectionTitle}>Ajustes rapidos</Text>
            <Text style={s.sectionHint}>
              Ajuste apenas o resumo total agora. A edicao por ingrediente entra na proxima etapa.
            </Text>
          </View>

          <Pressable style={s.manualToggleButton} onPress={() => setShowManualEditor((current) => !current)}>
            <Text style={s.manualToggleText}>{showManualEditor ? 'Ocultar' : 'Ajustar totais'}</Text>
          </Pressable>
        </View>

        {showManualEditor ? (
          <View style={s.manualEditorBody}>
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
                <Text style={s.inputLabel}>Proteina</Text>
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
          </View>
        ) : (
          <Text style={s.manualHint}>
            Use esta opcao apenas se quiser corrigir os totais antes do reenvio.
          </Text>
        )}
      </Animated.View>
    </>
  );
}

function IngredientReviewDetails({ item }: { item: NutritionReviewDraftItem }) {
  return (
    <View style={s.ingredientDetailsCard}>
      {item.warnings.length > 0 ? (
        <View style={s.ingredientWarningsList}>
          {item.warnings.map((warning, index) => (
            <Text key={`${warning}-${index}`} style={s.ingredientWarningText}>
              {warning}
            </Text>
          ))}
        </View>
      ) : null}

      <Text style={s.ingredientFutureHint}>
        A edicao detalhada deste ingrediente entra na proxima etapa da revisao.
      </Text>
    </View>
  );
}

function InfoBadge({
  label,
  text,
  warm,
}: {
  label: string;
  text: string;
  warm?: boolean;
}) {
  return (
    <View style={[s.infoBadge, warm && s.infoBadgeWarm]}>
      <Text style={[s.infoBadgeValue, warm && s.infoBadgeValueWarm]}>{label}</Text>
      <Text style={s.infoBadgeText}>{text}</Text>
    </View>
  );
}

function SummaryMetricCard({
  label,
  value,
  color,
  accentBg,
}: {
  label: string;
  value: string;
  color: string;
  accentBg: string;
}) {
  return (
    <View style={s.summaryMetricCard}>
      <View style={[s.summaryMetricAccent, { backgroundColor: accentBg }]}>
        <Text style={[s.summaryMetricAccentText, { color }]}>{label}</Text>
      </View>
      <Text style={s.summaryMetricValue}>{value}</Text>
    </View>
  );
}

function StatusPill({ status }: { status: NutritionReviewItemStatus }) {
  const palette = resolveStatusPalette(status);

  return (
    <View style={[s.statusPill, { backgroundColor: palette.bg }]}>
      <Text style={[s.statusPillText, { color: palette.text }]}>{palette.label}</Text>
    </View>
  );
}

function resolveStatusPalette(status: NutritionReviewItemStatus) {
  if (status === 'manual') {
    return { label: 'Manual', bg: Brand.hydrationBg, text: Brand.hydration };
  }

  if (status === 'added') {
    return { label: 'Adicionado', bg: Brand.positiveBg, text: Brand.greenDark };
  }

  if (status === 'recalculated') {
    return { label: 'Recalculado', bg: Brand.warningBg, text: Brand.warning };
  }

  return { label: 'Automatico', bg: Brand.surfaceSoft, text: Brand.greenDark };
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
