import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import type { NutritionGoalValues } from '@/services/nutrition-goals';

type GoalFieldKey = keyof NutritionGoalValues;

type NutritionGoalUpdate = Partial<{
  caloriesGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}>;

type GoalFieldMeta = {
  key: GoalFieldKey;
  label: string;
  helper: string;
  placeholder: string;
  suffix: string;
  accent: string;
  surface: string;
  border: string;
};

type Props = {
  visible: boolean;
  dateLabel: string;
  currentGoals: NutritionGoalValues | null;
  goalInherited?: boolean;
  saving?: boolean;
  onSave: (updates: NutritionGoalUpdate) => void;
  onClose: () => void;
};

const EMPTY_DRAFTS: Record<GoalFieldKey, string> = {
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
};

const GOAL_FIELDS: GoalFieldMeta[] = [
  {
    key: 'calories',
    label: 'Calorias',
    helper: 'Energia total para o dia.',
    placeholder: 'Ex.: 2400',
    suffix: ' kcal',
    accent: Brand.coral,
    surface: '#FFF4ED',
    border: '#FFD9CC',
  },
  {
    key: 'protein',
    label: 'Proteina',
    helper: 'Foco em recuperacao e saciedade.',
    placeholder: 'Ex.: 150',
    suffix: 'g',
    accent: Brand.greenDark,
    surface: '#EEF9F1',
    border: '#D5ECD9',
  },
  {
    key: 'carbs',
    label: 'Carboidrato',
    helper: 'Combustivel para treino e rotina.',
    placeholder: 'Ex.: 220',
    suffix: 'g',
    accent: Brand.orange,
    surface: '#FFF7E8',
    border: '#FFE3B7',
  },
  {
    key: 'fat',
    label: 'Gordura',
    helper: 'Equilibrio e suporte hormonal.',
    placeholder: 'Ex.: 80',
    suffix: 'g',
    accent: '#D45A67',
    surface: '#FDEFF1',
    border: '#F6D3D8',
  },
];

function sanitizeGoalInput(value: string): string {
  return value.replace(/[^0-9.,]/g, '');
}

function parseGoalInput(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function formatGoalValue(value: number | null, suffix: string): string {
  if (value === null) return 'Sem meta';
  return `${Number.isInteger(value) ? value : value.toFixed(1)}${suffix}`;
}

export function NutritionGoalsModal({
  visible,
  dateLabel,
  currentGoals,
  goalInherited = false,
  saving = false,
  onSave,
  onClose,
}: Props) {
  const [drafts, setDrafts] = useState<Record<GoalFieldKey, string>>(EMPTY_DRAFTS);

  useEffect(() => {
    if (!visible) {
      setDrafts(EMPTY_DRAFTS);
    }
  }, [visible]);

  const setDraftValue = (key: GoalFieldKey, value: string) => {
    setDrafts((prev) => ({ ...prev, [key]: sanitizeGoalInput(value) }));
  };

  const updates = useMemo(() => {
    const next: NutritionGoalUpdate = {};

    const caloriesGoal = parseGoalInput(drafts.calories);
    const proteinGoal = parseGoalInput(drafts.protein);
    const carbsGoal = parseGoalInput(drafts.carbs);
    const fatGoal = parseGoalInput(drafts.fat);

    if (drafts.calories.trim() && caloriesGoal !== null) next.caloriesGoal = caloriesGoal;
    if (drafts.protein.trim() && proteinGoal !== null) next.proteinGoal = proteinGoal;
    if (drafts.carbs.trim() && carbsGoal !== null) next.carbsGoal = carbsGoal;
    if (drafts.fat.trim() && fatGoal !== null) next.fatGoal = fatGoal;

    return next;
  }, [drafts]);

  const changeCount = Object.keys(updates).length;
  const hasChanges = changeCount > 0;
  const statusCopy = goalInherited ? 'Base herdada do plano atual' : 'Metas personalizadas para este dia';
  const footerCopy = hasChanges
    ? `${changeCount} ajuste${changeCount > 1 ? 's' : ''} pronto${changeCount > 1 ? 's' : ''} para salvar.`
    : 'Preencha somente o que voce quer alterar. Campos vazios ficam como estao.';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}>
        <Pressable style={s.backdrop} onPress={onClose} />

        <View style={s.card}>
          <View pointerEvents="none" style={s.glowTop} />
          <View pointerEvents="none" style={s.glowBottom} />
          <View style={s.handle} />

          <View style={s.header}>
            <View style={s.headerBadges}>
              <View style={s.eyebrowBadge}>
                <Text style={s.eyebrow}>Ajustar metas</Text>
              </View>
              <View style={[s.statusBadge, goalInherited ? s.statusBadgeMuted : s.statusBadgeWarm]}>
                <Text style={[s.statusBadgeText, goalInherited ? s.statusBadgeTextMuted : s.statusBadgeTextWarm]}>
                  {goalInherited ? 'Base herdada' : 'Edicao do dia'}
                </Text>
              </View>
            </View>

            <Text style={s.title}>Seu painel nutricional</Text>
            <Text style={s.subtitle}>
              Atualize so o que mudou, sem cara de formulario pesado. O restante continua igual.
            </Text>

            <View style={s.heroMetaRow}>
              <View style={s.heroMetaCard}>
                <Text style={s.heroMetaLabel}>Data</Text>
                <Text style={s.heroMetaValue}>{dateLabel}</Text>
              </View>
              <View style={s.heroMetaCard}>
                <Text style={s.heroMetaLabel}>Status</Text>
                <Text style={s.heroMetaValue}>{statusCopy}</Text>
              </View>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={s.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={s.sectionCard}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionEyebrow}>Metas atuais</Text>
                <Text style={s.sectionSubtitle}>Use estes valores como referencia antes de editar.</Text>
              </View>

              <View style={s.currentWrap}>
                {GOAL_FIELDS.map((field) => (
                  <GoalChip
                    key={field.key}
                    label={field.label}
                    helper={field.helper}
                    value={formatGoalValue(currentGoals?.[field.key] ?? null, field.suffix)}
                    accent={field.accent}
                    surface={field.surface}
                    border={field.border}
                  />
                ))}
              </View>
            </View>

            <View style={s.sectionCard}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionEyebrow}>Novos valores</Text>
                <Text style={s.sectionSubtitle}>Preencha apenas os campos que voce quer trocar hoje.</Text>
              </View>

              <View style={s.grid}>
                {GOAL_FIELDS.map((field) => (
                  <GoalFieldCard
                    key={field.key}
                    label={field.label}
                    helper={field.helper}
                    value={drafts[field.key]}
                    placeholder={field.placeholder}
                    currentValue={currentGoals?.[field.key] ?? null}
                    suffix={field.suffix}
                    accent={field.accent}
                    surface={field.surface}
                    border={field.border}
                    onChangeText={(value) => setDraftValue(field.key, value)}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={s.actions}>
            <View style={s.footerSummary}>
              <Text style={s.footerSummaryText}>{footerCopy}</Text>
            </View>

            <View style={s.actionRow}>
              <View style={s.primaryAction}>
                <AppButton
                  title="Salvar metas"
                  onPress={() => onSave(updates)}
                  loading={saving}
                  disabled={!hasChanges}
                />
              </View>
              <View style={s.secondaryAction}>
                <AppButton
                  title="Fechar"
                  variant="secondary"
                  onPress={onClose}
                  disabled={saving}
                  textStyle={s.secondaryActionText}
                />
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function GoalChip({
  label,
  helper,
  value,
  accent,
  surface,
  border,
}: {
  label: string;
  helper: string;
  value: string;
  accent: string;
  surface: string;
  border: string;
}) {
  return (
    <View style={[s.goalChip, { backgroundColor: surface, borderColor: border }]}>
      <View style={s.goalChipTop}>
        <View style={[s.goalDot, { backgroundColor: accent }]} />
        <Text style={s.goalChipLabel}>{label}</Text>
      </View>
      <Text style={s.goalChipValue}>{value}</Text>
      <Text style={s.goalChipHelper}>{helper}</Text>
    </View>
  );
}

function GoalFieldCard({
  label,
  helper,
  value,
  placeholder,
  currentValue,
  suffix,
  accent,
  surface,
  border,
  onChangeText,
}: {
  label: string;
  helper: string;
  value: string;
  placeholder: string;
  currentValue: number | null;
  suffix: string;
  accent: string;
  surface: string;
  border: string;
  onChangeText: (value: string) => void;
}) {
  const parsedValue = parseGoalInput(value);
  const hasDraft = value.trim().length > 0;
  const currentText = formatGoalValue(currentValue, suffix);
  const helperText = hasDraft
    ? parsedValue !== null
      ? `Novo alvo: ${formatGoalValue(parsedValue, suffix)}`
      : 'Digite um numero valido maior que zero.'
    : currentValue === null
      ? 'Sem meta definida ainda. Preencha se quiser criar uma.'
      : `Se deixar vazio, mantemos ${currentText}.`;

  return (
    <View style={[s.fieldCard, hasDraft && { borderColor: accent }]}>
      <View style={s.fieldHeader}>
        <View style={s.fieldCopy}>
          <View style={s.fieldTitleRow}>
            <View style={[s.fieldDot, { backgroundColor: accent }]} />
            <Text style={s.fieldTitle}>{label}</Text>
          </View>
          <Text style={s.fieldHelper}>{helper}</Text>
        </View>

        <View style={[s.fieldCurrentBadge, { backgroundColor: surface, borderColor: border }]}>
          <Text style={[s.fieldCurrentBadgeText, { color: accent }]} numberOfLines={2}>
            {currentText}
          </Text>
        </View>
      </View>

      <AppInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType="numeric"
        style={[s.fieldInput, hasDraft && { borderColor: accent }]}
      />

      <Text style={[s.fieldFootnote, hasDraft && parsedValue === null && s.fieldFootnoteError]}>{helperText}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 35, 26, 0.40)',
  },
  card: {
    backgroundColor: '#FCFDFC',
    borderRadius: Radii.xxl,
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.10)',
    padding: 20,
    gap: 16,
    maxHeight: '92%',
    overflow: 'hidden',
    ...Shadows.floating,
  },
  glowTop: {
    position: 'absolute',
    top: -82,
    right: -54,
    width: 208,
    height: 208,
    borderRadius: 104,
    backgroundColor: 'rgba(31,167,80,0.12)',
  },
  glowBottom: {
    position: 'absolute',
    left: -44,
    bottom: -64,
    width: 156,
    height: 156,
    borderRadius: 78,
    backgroundColor: 'rgba(255,122,89,0.08)',
  },
  handle: {
    width: 46,
    height: 5,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(21,32,24,0.12)',
    alignSelf: 'center',
  },
  header: {
    gap: 12,
  },
  headerBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  eyebrowBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radii.pill,
    backgroundColor: '#EAF8EE',
    borderWidth: 1,
    borderColor: '#D8EAD9',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radii.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  eyebrow: {
    ...Typography.caption,
    color: Brand.greenDark,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '800',
  },
  statusBadgeWarm: {
    backgroundColor: '#FFF4ED',
    borderColor: '#FFD9CC',
  },
  statusBadgeMuted: {
    backgroundColor: '#F3F6F4',
    borderColor: Brand.border,
  },
  statusBadgeText: {
    ...Typography.caption,
    fontWeight: '800',
  },
  statusBadgeTextWarm: {
    color: Brand.coral,
  },
  statusBadgeTextMuted: {
    color: Brand.textSecondary,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    color: Brand.text,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  heroMetaCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(21,32,24,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
  },
  heroMetaLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroMetaValue: {
    ...Typography.helper,
    color: Brand.text,
    fontWeight: '700',
  },
  body: {
    gap: 16,
    paddingBottom: 4,
  },
  sectionCard: {
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(21,32,24,0.08)',
    padding: 16,
    gap: 14,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionEyebrow: {
    ...Typography.caption,
    color: Brand.greenDark,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  sectionSubtitle: {
    ...Typography.helper,
    color: Brand.textSecondary,
  },
  currentWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  goalChip: {
    minWidth: '47%',
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  goalChipTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  goalChipLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  goalChipValue: {
    fontSize: 22,
    lineHeight: 26,
    color: Brand.text,
    fontWeight: '800',
  },
  goalChipHelper: {
    ...Typography.helper,
    color: Brand.textSecondary,
  },
  grid: {
    gap: 12,
  },
  fieldCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(21,32,24,0.08)',
    padding: 14,
    gap: 12,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  fieldCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  fieldTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  fieldTitle: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '800',
  },
  fieldHelper: {
    ...Typography.helper,
    color: Brand.textSecondary,
  },
  fieldCurrentBadge: {
    maxWidth: '42%',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  fieldCurrentBadgeText: {
    ...Typography.caption,
    textAlign: 'center',
    fontWeight: '800',
  },
  fieldInput: {
    backgroundColor: '#FCFDFC',
    borderRadius: 18,
    borderColor: 'rgba(21,32,24,0.10)',
  },
  fieldFootnote: {
    ...Typography.caption,
    color: Brand.textSecondary,
    lineHeight: 18,
  },
  fieldFootnoteError: {
    color: Brand.danger,
  },
  actions: {
    gap: 10,
  },
  footerSummary: {
    borderRadius: 18,
    backgroundColor: '#F4FAF5',
    borderWidth: 1,
    borderColor: '#DDEFE1',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  footerSummaryText: {
    ...Typography.helper,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryAction: {
    flex: 2,
    minWidth: 0,
  },
  secondaryAction: {
    flex: 1,
    minWidth: 0,
  },
  secondaryActionText: {
    ...Typography.body,
    fontWeight: '800',
    lineHeight: 20,
  },
});
