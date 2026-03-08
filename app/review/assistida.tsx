import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { Brand } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { submitReviewAdjustments } from '@/services/review-feedback';
import { clearReviewSession, getReviewSession } from '@/services/review-session';
import type { NutritionReviewDraft, PlanReviewDraft, ReviewDraft } from '@/types/review';
import { buildReviewDraft, buildReviewSubmitPayload } from '@/utils/review';

function sourceLabel(source: 'photo' | 'audio' | 'pdf'): string {
  if (source === 'photo') return 'Foto';
  if (source === 'audio') return 'Audio';
  return 'PDF';
}

function kindLabel(kind: 'nutrition' | 'plan'): string {
  return kind === 'nutrition' ? 'Analise nutricional' : 'Plano alimentar';
}

/*
 * Tela unificada de revisao assistida para todos os fluxos de IA.
 *
 * Responsabilidades:
 * - mostrar warnings e dados extraidos
 * - permitir ajuste manual dos campos
 * - confirmar revisao localmente
 * - reenviar ajustes para o BFF
 */
export default function AssistedReviewScreen() {
  const router = useRouter();
  const session = getReviewSession();

  const [draft, setDraft] = useState<ReviewDraft | null>(
    session ? buildReviewDraft(session) : null,
  );
  const resend = useAsync(submitReviewAdjustments);

  const traceId = useMemo(() => {
    if (!session) return null;
    return session.kind === 'nutrition' ? session.result.traceId : session.result.traceId;
  }, [session]);

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
          <Text style={s.title}>Revisao assistida</Text>
          <Text style={s.emptyText}>Nenhum dado disponivel para revisao.</Text>
          <AppButton title="Voltar" onPress={closeReview} />
        </View>
      </View>
    );
  }

  const warnings = draft.warnings;

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Revisao assistida</Text>
        <Text style={s.subtitle}>
          Revise os dados extraidos pela IA, ajuste se necessario e confirme.
        </Text>

        <View style={s.metaCard}>
          <Text style={s.metaLabel}>{kindLabel(session.kind)}</Text>
          <Text style={s.metaText}>Fonte: {sourceLabel(session.source)}</Text>
          {traceId ? <Text style={s.metaText}>trace_id: {traceId}</Text> : null}
        </View>

        {warnings.length > 0 ? (
          <View style={s.warningCard}>
            <Text style={s.sectionTitle}>Warnings</Text>
            {warnings.map((warning, index) => (
              <Text key={`${warning}-${index}`} style={s.warningText}>
                - {warning}
              </Text>
            ))}
          </View>
        ) : null}

        {draft.kind === 'nutrition' ? (
          <NutritionReviewEditor
            draft={draft}
            onChangeSummary={updateNutritionSummary}
            onChangeItem={updateNutritionItem}
            onAddItem={addNutritionItem}
            onRemoveItem={removeNutritionItem}
          />
        ) : (
          <PlanReviewEditor
            draft={draft}
            onChangeSection={updatePlanSection}
            onAddSection={addPlanSection}
            onRemoveSection={removePlanSection}
          />
        )}

        <View style={s.card}>
          <Text style={s.sectionTitle}>Observacao do usuario</Text>
          <TextInput
            value={draft.observation}
            onChangeText={updateObservation}
            placeholder="Explique ajustes importantes para o backend..."
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
            <Text style={s.successTitle}>Reenvio concluido</Text>
            <Text style={s.successText}>Status: {resend.data.status}</Text>
            {resend.data.traceId ? (
              <Text style={s.successText}>trace_id: {resend.data.traceId}</Text>
            ) : null}
            {resend.data.message ? (
              <Text style={s.successText}>{resend.data.message}</Text>
            ) : null}
            {resend.data.warnings.length > 0 ? (
              <Text style={s.successText}>
                Warnings: {resend.data.warnings.join(' | ')}
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <View style={s.footer}>
        <View style={s.footerRow}>
          <View style={s.footerButton}>
            <AppButton title="Confirmar revisao" onPress={closeReview} />
          </View>
          <View style={s.footerButton}>
            <AppButton
              title="Reenviar ajustado"
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
  onChangeSummary,
  onChangeItem,
  onAddItem,
  onRemoveItem,
}: NutritionEditorProps) {
  return (
    <>
      <View style={s.card}>
        <Text style={s.sectionTitle}>Resumo final</Text>
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

      <View style={s.card}>
        <Text style={s.sectionTitle}>Itens detectados</Text>
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

            {item.warnings.length > 0 ? (
              <Text style={s.itemWarning}>{item.warnings.join(' | ')}</Text>
            ) : null}

            <Pressable style={s.removeButton} onPress={() => onRemoveItem(item.id)}>
              <Text style={s.removeButtonText}>Remover item</Text>
            </Pressable>
          </View>
        ))}

        <Pressable style={s.addButton} onPress={onAddItem}>
          <Text style={s.addButtonText}>+ Adicionar item</Text>
        </Pressable>
      </View>
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
  metaCard: {
    backgroundColor: Brand.card,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  metaLabel: {
    fontSize: 12,
    color: Brand.greenDark,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaText: {
    fontSize: 12,
    color: Brand.textSecondary,
  },
  warningCard: {
    backgroundColor: '#FFF7E6',
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.text,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  warningText: {
    fontSize: 12,
    color: '#8A6D3B',
  },
  card: {
    backgroundColor: Brand.card,
    borderRadius: 14,
    padding: 14,
    gap: 10,
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
  itemWarning: {
    fontSize: 11,
    color: Brand.danger,
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

