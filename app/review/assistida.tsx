import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';

import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { Brand } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { createFavorite } from '@/services/favorites';
import { submitReviewAdjustments } from '@/services/review-feedback';
import { clearReviewSession, getReviewSession } from '@/services/review-session';
import type { NutritionCorrection } from '@/types/nutrition';
import type { NutritionReviewDraft, PlanReviewDraft, ReviewDraft } from '@/types/review';
import { buildFoodsString } from '@/utils/helpers';
import { buildReviewDraft, buildReviewSubmitPayload } from '@/utils/review';

function sourceLabel(source: 'photo' | 'audio' | 'pdf'): string {
  if (source === 'photo') return 'Foto';
  if (source === 'audio') return 'Audio';
  return 'PDF';
}

function screenCopy(kind: 'nutrition' | 'plan') {
  if (kind === 'nutrition') {
    return {
      title: 'Resumo da refeição',
      subtitle: 'Confira os alimentos identificados e ajuste os macros se quiser.',
    };
  }

  return {
    title: 'Revisão do plano',
    subtitle: 'Organizamos o conteúdo extraído para voce revisar e ajustar se quiser.',
  };
}

function guessMimeTypeFromUri(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg';
}

async function resolveFavoriteImagePayload(
  sessionPayload: string | null,
  previewUri: string | null,
): Promise<string | null> {
  const payload = `${sessionPayload ?? ''}`.trim();
  if (payload.length > 0) {
    return payload;
  }

  const uri = `${previewUri ?? ''}`.trim();
  if (uri.length === 0) {
    return null;
  }

  if (uri.startsWith('data:')) {
    return uri;
  }

  if (/^https?:\/\//i.test(uri)) {
    return uri;
  }

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  if (!base64) {
    return null;
  }

  return `data:${guessMimeTypeFromUri(uri)};base64,${base64}`;
}

function resolveNutritionTitle(
  dishName: string | null | undefined,
  items: NutritionReviewDraft['items'],
  corrections: NutritionCorrection[],
): string {
  const explicitDishName = `${dishName ?? ''}`.trim();
  if (explicitDishName.length > 0) return explicitDishName;

  const corrected = corrections.find((entry) => entry.corrected.trim().length > 0)?.corrected?.trim();
  if (corrected) return corrected;

  const itemName = items.find((item) => item.name.trim().length > 0)?.name?.trim();
  if (itemName) return itemName;

  return 'meu prato';
}

function buildRevealStyle(progress: Animated.Value) {
  return {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  };
}

/*
 * Tela unificada de revisao assistida para fluxos de IA.
 *
 * No fluxo nutricional:
 * - prioriza leitura amigavel do resultado (titulo + macros)
 * - renderiza secoes somente quando existem dados
 * - permite edicao manual opcional para ajustes finos
 */
export default function AssistedReviewScreen() {
  const router = useRouter();
  const session = getReviewSession();

  const [draft, setDraft] = useState<ReviewDraft | null>(
    session ? buildReviewDraft(session) : null,
  );
  const resend = useAsync(submitReviewAdjustments);
  const saveFavorite = useAsync(createFavorite);

  function closeReview() {
    clearReviewSession();
    router.back();
  }

  async function handleResend() {
    if (!session || !draft) return;
    const payload = buildReviewSubmitPayload(session, draft);
    await resend.execute(payload);
  }

  function updateObservation(value: string) {
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, observation: value };
    });
  }

  function updateNutritionSummary(
    field: 'calories' | 'protein' | 'carbs' | 'fat',
    value: string,
  ) {
    setDraft((prev) => {
      if (!prev || prev.kind !== 'nutrition') return prev;
      return {
        ...prev,
        summary: {
          ...prev.summary,
          [field]: value,
        },
      };
    });
  }

  function updateNutritionItem(
    itemId: string,
    field: 'name' | 'calories' | 'protein' | 'carbs' | 'fat',
    value: string,
  ) {
    setDraft((prev) => {
      if (!prev || prev.kind !== 'nutrition') return prev;
      return {
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId ? { ...item, [field]: value } : item,
        ),
      };
    });
  }

  function addNutritionItem() {
    setDraft((prev) => {
      if (!prev || prev.kind !== 'nutrition') return prev;
      const nextId = `nutrition-item-${prev.items.length + 1}`;
      return {
        ...prev,
        items: [
          ...prev.items,
          {
            id: nextId,
            name: '',
            calories: '',
            protein: '',
            carbs: '',
            fat: '',
            precisaRevisao: false,
            warnings: [],
          },
        ],
      };
    });
  }

  function removeNutritionItem(itemId: string) {
    setDraft((prev) => {
      if (!prev || prev.kind !== 'nutrition') return prev;
      return {
        ...prev,
        items: prev.items.filter((item) => item.id !== itemId),
      };
    });
  }

  function updatePlanSection(itemId: string, field: 'title' | 'text', value: string) {
    setDraft((prev) => {
      if (!prev || prev.kind !== 'plan') return prev;
      return {
        ...prev,
        sections: prev.sections.map((section) =>
          section.id === itemId ? { ...section, [field]: value } : section,
        ),
      };
    });
  }

  function addPlanSection() {
    setDraft((prev) => {
      if (!prev || prev.kind !== 'plan') return prev;
      const nextId = `plan-section-${prev.sections.length + 1}`;
      return {
        ...prev,
        sections: [
          ...prev.sections,
          {
            id: nextId,
            title: '',
            text: '',
          },
        ],
      };
    });
  }

  function removePlanSection(itemId: string) {
    setDraft((prev) => {
      if (!prev || prev.kind !== 'plan') return prev;
      return {
        ...prev,
        sections: prev.sections.filter((section) => section.id !== itemId),
      };
    });
  }

  if (!session || !draft) {
    return (
      <View style={s.root}>
        <View style={s.emptyWrap}>
          <Text style={s.title}>Revisão assistida</Text>
          <Text style={s.emptyText}>Nenhum dado disponivel para revisao.</Text>
          <AppButton title="Voltar" onPress={closeReview} />
        </View>
      </View>
    );
  }

  const copy = screenCopy(session.kind);
  const nutritionPhotoPreviewUri =
    session.kind === 'nutrition' && session.source === 'photo'
      ? session.photoPreviewUri ?? session.photoPayload ?? null
      : null;
  const nutritionPhotoPayload =
    session.kind === 'nutrition' && session.source === 'photo'
      ? session.photoPayload ?? null
      : null;
  const nutritionContext =
    session.kind === 'nutrition' && draft.kind === 'nutrition'
      ? (() => {
          const corrections = session.result.corrections.filter(
            (entry) =>
              entry.original.trim().length > 0 && entry.corrected.trim().length > 0,
          );
          return {
            corrections,
            title: resolveNutritionTitle(session.result.detectedDishName, draft.items, corrections),
            source: session.source,
          };
        })()
      : null;

  async function handleSaveToFavorites() {
    if (!session || !draft || session.kind !== 'nutrition' || draft.kind !== 'nutrition') return;

    const dishName =
      nutritionContext?.title?.trim() ||
      resolveNutritionTitle(session.result.detectedDishName, draft.items, []);
    const itemsLabel = draft.items
      .map((item) => item.name.trim())
      .filter((item) => item.length > 0)
      .join(', ');
    const foods = itemsLabel.length > 0 ? buildFoodsString(dishName, itemsLabel) : dishName;
    const favoriteImagePayload = await resolveFavoriteImagePayload(
      nutritionPhotoPayload,
      nutritionPhotoPreviewUri,
    );

    await saveFavorite.execute({
      foods,
      nutrition: {
        calories: `${draft.summary.calories}`.trim(),
        protein: `${draft.summary.protein}`.trim(),
        carbs: `${draft.summary.carbs}`.trim(),
        fat: `${draft.summary.fat}`.trim(),
      },
      imageBase64: favoriteImagePayload,
    });
  }

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>{copy.title}</Text>
        <Text style={s.subtitle}>{copy.subtitle}</Text>

        {draft.kind === 'nutrition' && nutritionContext ? (
          <NutritionReviewEditor
            draft={draft}
            source={nutritionContext.source}
            title={nutritionContext.title}
            photoUri={nutritionPhotoPreviewUri}
            corrections={nutritionContext.corrections}
            onChangeSummary={updateNutritionSummary}
            onChangeItem={updateNutritionItem}
            onAddItem={addNutritionItem}
            onRemoveItem={removeNutritionItem}
          />
        ) : draft.kind === 'plan' ? (
          <PlanReviewEditor
            draft={draft}
            onChangeSection={updatePlanSection}
            onAddSection={addPlanSection}
            onRemoveSection={removePlanSection}
          />
        ) : null}

        <View style={s.card}>
          <Text style={s.sectionTitle}>Quer acrescentar algo?</Text>
          <TextInput
            value={draft.observation}
            onChangeText={updateObservation}
            placeholder="Escreva observacoes opcionais sobre esta analise..."
            placeholderTextColor={Brand.textSecondary}
            multiline
            style={s.multiInput}
          />
        </View>

        {resend.error ? (
          <View style={s.errorCard}>
            <Text style={s.errorText}>{resend.error}</Text>
            <Pressable onPress={handleResend}>
              <Text style={s.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {resend.data ? (
          <View style={s.successCard}>
            <Text style={s.successTitle}>Ajustes enviados</Text>
            <Text style={s.successText}>
              Recebemos suas observacoes. Obrigado por ajudar a melhorar seus registros.
            </Text>
          </View>
        ) : null}

        {draft.kind === 'nutrition' ? (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Quer guardar essa refeicao?</Text>
            <AppButton
              title="Salvar em Meus pratos"
              onPress={handleSaveToFavorites}
              loading={saveFavorite.loading}
            />
            {saveFavorite.error ? <Text style={s.errorText}>{saveFavorite.error}</Text> : null}
            {saveFavorite.data ? (
              <Text style={s.successText}>Pronto! Essa refeicao foi salva em Meus pratos.</Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <View style={s.footer}>
        <View style={s.footerRow}>
          <View style={s.footerButton}>
            <AppButton title="Tudo certo" onPress={closeReview} />
          </View>
          <View style={s.footerButton}>
            <AppButton
              title="Enviar ajustes"
              onPress={handleResend}
              loading={resend.loading}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

type NutritionEditorProps = {
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

function NutritionReviewEditor({
  draft,
  source,
  title,
  photoUri,
  corrections,
  onChangeSummary,
  onChangeItem,
  onAddItem,
  onRemoveItem,
}: NutritionEditorProps) {
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
          Estimativa total da analise por {sourceLabel(source).toLowerCase()}.
        </Text>

        <View style={s.heroMacroRow}>
          <MacroChip label="Proteina" value={draft.summary.protein} color="#2D89C6" bg="#E8F4FC" />
          <MacroChip label="Carbo" value={draft.summary.carbs} color="#D98A32" bg="#FFF2E4" />
          <MacroChip label="Gordura" value={draft.summary.fat} color="#D24E40" bg="#FEEDEA" />
        </View>
      </Animated.View>

      {corrections.length > 0 ? (
        <Animated.View style={[s.card, buildRevealStyle(correctionAnim)]}>
          <Text style={s.sectionTitle}>Ajustes automaticos</Text>
          {corrections.map((entry, index) => (
            <View key={`${entry.original}-${entry.corrected}-${index}`} style={s.correctionRow}>
              <Text style={s.correctionFrom}>{entry.original}</Text>
              <Text style={s.correctionArrow}>→</Text>
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
                  <MacroChip
                    label="kcal"
                    value={item.calories}
                    color={Brand.greenDark}
                    bg="#ECF8ED"
                    compact
                  />
                  <MacroChip
                    label="prot"
                    value={item.protein}
                    color="#2D89C6"
                    bg="#E8F4FC"
                    compact
                  />
                  <MacroChip
                    label="carb"
                    value={item.carbs}
                    color="#D98A32"
                    bg="#FFF2E4"
                    compact
                  />
                  <MacroChip
                    label="gord"
                    value={item.fat}
                    color="#D24E40"
                    bg="#FEEDEA"
                    compact
                  />
                </View>

              </View>
            ))}
          </View>
        ) : (
          <Text style={s.emptyInlineText}>
            Nesta leitura recebemos apenas o resumo geral, sem separacao por itens.
          </Text>
        )}
      </Animated.View>

      <Animated.View style={[s.card, buildRevealStyle(editorAnim)]}>
        <Pressable
          style={s.manualToggleButton}
          onPress={() => setShowManualEditor((prev) => !prev)}>
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

            <Text style={s.inputLabel}>Itens</Text>
            {draft.items.length === 0 ? (
              <Text style={s.emptyInlineText}>
                Nenhum item separado. Voce pode adicionar manualmente.
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
                    <Text style={s.inputLabel}>Proteina</Text>
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
            Use esta opcao apenas se quiser corrigir nomes ou macros antes do reenvio.
          </Text>
        )}
      </Animated.View>
    </>
  );
}

type PlanEditorProps = {
  draft: PlanReviewDraft;
  onChangeSection: (itemId: string, field: 'title' | 'text', value: string) => void;
  onAddSection: () => void;
  onRemoveSection: (itemId: string) => void;
};

function PlanReviewEditor({
  draft,
  onChangeSection,
  onAddSection,
  onRemoveSection,
}: PlanEditorProps) {
  return (
    <>
      <View style={s.card}>
        <Text style={s.sectionTitle}>Texto extraido</Text>
        <TextInput
          value={draft.extractedText}
          onChangeText={() => null}
          editable={false}
          multiline
          style={[s.multiInput, s.readonlyInput]}
        />
      </View>

      <View style={s.card}>
        <Text style={s.sectionTitle}>Secoes</Text>
        {draft.sections.map((section) => (
          <View key={section.id} style={s.itemCard}>
            <Text style={s.inputLabel}>Titulo</Text>
            <AppInput
              value={section.title}
              onChangeText={(value) => onChangeSection(section.id, 'title', value)}
              placeholder="Titulo da secao"
            />

            <Text style={s.inputLabel}>Texto</Text>
            <TextInput
              value={section.text}
              onChangeText={(value) => onChangeSection(section.id, 'text', value)}
              placeholder="Conteudo da secao"
              placeholderTextColor={Brand.textSecondary}
              multiline
              style={s.multiInput}
            />

            <Pressable style={s.removeButton} onPress={() => onRemoveSection(section.id)}>
              <Text style={s.removeButtonText}>Remover secao</Text>
            </Pressable>
          </View>
        ))}

        <Pressable style={s.addButton} onPress={onAddSection}>
          <Text style={s.addButtonText}>+ Adicionar secao</Text>
        </Pressable>
      </View>
    </>
  );
}

type MacroChipProps = {
  label: string;
  value: string;
  color: string;
  bg: string;
  compact?: boolean;
};

function MacroChip({ label, value, color, bg, compact = false }: MacroChipProps) {
  return (
    <View style={[s.macroChip, compact && s.macroChipCompact, { backgroundColor: bg }]}>
      <Text style={[s.macroChipLabel, { color }]}>{label}</Text>
      <Text style={[s.macroChipValue, { color }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  scroll: {
    padding: 20,
    gap: 12,
    paddingBottom: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Brand.text,
  },
  subtitle: {
    fontSize: 13,
    color: Brand.textSecondary,
    lineHeight: 19,
  },
  heroCard: {
    backgroundColor: '#F2FAF3',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DCECDC',
    padding: 16,
    gap: 10,
    overflow: 'hidden',
  },
  heroGlowMain: {
    position: 'absolute',
    top: -92,
    right: -78,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(123,196,127,0.24)',
  },
  heroGlowSecondary: {
    position: 'absolute',
    bottom: -54,
    left: -36,
    width: 122,
    height: 122,
    borderRadius: 61,
    backgroundColor: 'rgba(93,173,226,0.14)',
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.greenDark,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroPhoto: {
    width: '100%',
    height: 170,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCECDC',
    backgroundColor: Brand.bg,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Brand.text,
    letterSpacing: -0.4,
  },
  heroCalories: {
    fontSize: 26,
    fontWeight: '700',
    color: Brand.greenDark,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 12,
    color: Brand.textSecondary,
  },
  heroMacroRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  correctionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    backgroundColor: Brand.bg,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  correctionFrom: {
    flex: 1,
    fontSize: 12,
    color: Brand.textSecondary,
  },
  correctionArrow: {
    fontSize: 14,
    color: Brand.greenDark,
    fontWeight: '700',
  },
  correctionTo: {
    flex: 1,
    fontSize: 12,
    color: Brand.text,
    fontWeight: '600',
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.text,
  },
  card: {
    backgroundColor: Brand.card,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  detectedList: {
    gap: 10,
  },
  detectedItem: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    padding: 10,
    gap: 8,
    backgroundColor: Brand.bg,
  },
  detectedItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detectedName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Brand.text,
  },
  detectedMacroRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  macroChip: {
    borderRadius: 9,
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 2,
    minWidth: 70,
  },
  macroChipCompact: {
    minWidth: 0,
    paddingVertical: 4,
    paddingHorizontal: 7,
  },
  macroChipLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },
  macroChipValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gridCell: {
    flex: 1,
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.textSecondary,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  emptyInlineText: {
    fontSize: 12,
    color: Brand.textSecondary,
    lineHeight: 18,
  },
  manualToggleButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CDE6CF',
    backgroundColor: '#F5FCF6',
    paddingVertical: 10,
    alignItems: 'center',
  },
  manualToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.greenDark,
  },
  manualHint: {
    fontSize: 12,
    color: Brand.textSecondary,
    lineHeight: 18,
  },
  manualEditorBody: {
    gap: 10,
  },
  multiInput: {
    borderWidth: 1.5,
    borderColor: Brand.border,
    borderRadius: 14,
    backgroundColor: Brand.bg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: Brand.text,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  readonlyInput: {
    opacity: 0.8,
  },
  addButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Brand.green,
    borderStyle: 'dashed',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#F2FAF3',
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.greenDark,
  },
  removeButton: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.danger,
  },
  errorCard: {
    backgroundColor: '#FFF0F0',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: Brand.danger,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.danger,
  },
  successCard: {
    backgroundColor: '#ECF8ED',
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.greenDark,
  },
  successText: {
    fontSize: 12,
    color: Brand.textSecondary,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Brand.bg,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  footerButton: {
    flex: 1,
  },
  emptyWrap: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: Brand.textSecondary,
  },
});
