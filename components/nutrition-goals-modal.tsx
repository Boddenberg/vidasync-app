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
    helper: 'Energia diaria.',
    placeholder: 'Ex.: 2400',
    suffix: ' kcal',
    accent: Brand.coral,
    surface: '#FFF4ED',
    border: '#FFD9CC',
  },
  {
    key: 'protein',
    label: 'Proteina',
    helper: 'Recuperacao e saciedade.',
    placeholder: 'Ex.: 150',
    suffix: 'g',
    accent: Brand.greenDark,
    surface: '#EEF9F1',
    border: '#D5ECD9',
  },
  {
    key: 'carbs',
    label: 'Carboidrato',
    helper: 'Combustivel para treino.',
    placeholder: 'Ex.: 220',
    suffix: 'g',
    accent: Brand.orange,
    surface: '#FFF7E8',
    border: '#FFE3B7',
  },
  {
    key: 'fat',
    label: 'Gordura',
    helper: 'Equilibrio hormonal.',
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
  currentGoals,
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

  const hasChanges = Object.keys(updates).length > 0;

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
            </View>

            <Text style={s.title}>Painel nutricional</Text>
          </View>

          <ScrollView
            contentContainerStyle={s.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
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
          </ScrollView>

          <View style={s.actions}>
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
  const feedbackText = hasDraft
    ? parsedValue !== null
      ? `Novo alvo: ${formatGoalValue(parsedValue, suffix)}`
      : 'Digite um numero valido maior que zero.'
    : null;

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
          <Text style={[s.fieldCurrentBadgeText, { color: accent }]} numberOfLines={1}>
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

      {feedbackText ? (
        <Text style={[s.fieldFootnote, parsedValue === null && s.fieldFootnoteError]}>{feedbackText}</Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
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
    padding: 18,
    gap: 14,
    maxHeight: '88%',
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
    gap: 10,
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
  eyebrow: {
    ...Typography.caption,
    color: Brand.greenDark,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '800',
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    color: Brand.text,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  body: {
    paddingBottom: 2,
  },
  grid: {
    gap: 10,
  },
  fieldCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(21,32,24,0.08)',
    padding: 12,
    gap: 10,
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
    maxWidth: '38%',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
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
    gap: 8,
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
