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
import { Brand, Radii, Typography } from '@/constants/theme';
import type { NutritionGoalValues } from '@/services/nutrition-goals';

type NutritionGoalUpdate = Partial<{
  caloriesGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}>;

type Props = {
  visible: boolean;
  dateLabel: string;
  currentGoals: NutritionGoalValues | null;
  goalInherited?: boolean;
  saving?: boolean;
  onSave: (updates: NutritionGoalUpdate) => void;
  onClose: () => void;
};

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
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  useEffect(() => {
    if (!visible) {
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
    }
  }, [visible]);

  const updates = useMemo(() => {
    const next: NutritionGoalUpdate = {};

    const caloriesGoal = parseGoalInput(calories);
    const proteinGoal = parseGoalInput(protein);
    const carbsGoal = parseGoalInput(carbs);
    const fatGoal = parseGoalInput(fat);

    if (calories.trim() && caloriesGoal !== null) next.caloriesGoal = caloriesGoal;
    if (protein.trim() && proteinGoal !== null) next.proteinGoal = proteinGoal;
    if (carbs.trim() && carbsGoal !== null) next.carbsGoal = carbsGoal;
    if (fat.trim() && fatGoal !== null) next.fatGoal = fatGoal;

    return next;
  }, [calories, protein, carbs, fat]);

  const hasChanges = Object.keys(updates).length > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}>
        <Pressable style={s.backdrop} onPress={onClose} />

        <View style={s.card}>
          <View style={s.header}>
            <Text style={s.eyebrow}>Metas do dia</Text>
            <Text style={s.title}>{dateLabel}</Text>
            <Text style={s.subtitle}>
              Campos vazios não são alterados. {goalInherited ? 'A base atual está herdada.' : 'Você pode atualizar só o que mudou.'}
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={s.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={s.currentWrap}>
              <GoalChip label="Calorias" value={formatGoalValue(currentGoals?.calories ?? null, ' kcal')} />
              <GoalChip label="Proteína" value={formatGoalValue(currentGoals?.protein ?? null, 'g')} />
              <GoalChip label="Carboidrato" value={formatGoalValue(currentGoals?.carbs ?? null, 'g')} />
              <GoalChip label="Gordura" value={formatGoalValue(currentGoals?.fat ?? null, 'g')} />
            </View>

            <View style={s.grid}>
              <View style={s.field}>
                <Text style={s.label}>Calorias</Text>
                <AppInput
                  value={calories}
                  onChangeText={(value) => setCalories(sanitizeGoalInput(value))}
                  placeholder={currentGoals?.calories != null ? String(currentGoals.calories) : 'Ex.: 2400'}
                  keyboardType="numeric"
                />
              </View>

              <View style={s.field}>
                <Text style={s.label}>Proteína</Text>
                <AppInput
                  value={protein}
                  onChangeText={(value) => setProtein(sanitizeGoalInput(value))}
                  placeholder={currentGoals?.protein != null ? String(currentGoals.protein) : 'Ex.: 150'}
                  keyboardType="numeric"
                />
              </View>

              <View style={s.field}>
                <Text style={s.label}>Carboidrato</Text>
                <AppInput
                  value={carbs}
                  onChangeText={(value) => setCarbs(sanitizeGoalInput(value))}
                  placeholder={currentGoals?.carbs != null ? String(currentGoals.carbs) : 'Ex.: 220'}
                  keyboardType="numeric"
                />
              </View>

              <View style={s.field}>
                <Text style={s.label}>Gordura</Text>
                <AppInput
                  value={fat}
                  onChangeText={(value) => setFat(sanitizeGoalInput(value))}
                  placeholder={currentGoals?.fat != null ? String(currentGoals.fat) : 'Ex.: 80'}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </ScrollView>

          <View style={s.actions}>
            <View style={s.primaryAction}>
              <AppButton
                title="Salvar metas"
                onPress={() => onSave(updates)}
                loading={saving}
                disabled={!hasChanges}
              />
            </View>
            <View style={s.secondaryAction}>
              <AppButton title="Fechar" variant="secondary" onPress={onClose} disabled={saving} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function GoalChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.goalChip}>
      <Text style={s.goalChipLabel}>{label}</Text>
      <Text style={s.goalChipValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 35, 26, 0.34)',
  },
  card: {
    backgroundColor: Brand.bg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 20,
    gap: 16,
  },
  header: {
    gap: 6,
  },
  eyebrow: {
    ...Typography.caption,
    color: Brand.greenDark,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '800',
  },
  title: {
    ...Typography.title,
    color: Brand.text,
    fontWeight: '800',
  },
  subtitle: {
    ...Typography.helper,
    color: Brand.textSecondary,
  },
  body: {
    gap: 16,
  },
  currentWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalChip: {
    minWidth: '47%',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 3,
  },
  goalChipLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  goalChipValue: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '700',
  },
  grid: {
    gap: 12,
  },
  field: {
    gap: 6,
  },
  label: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryAction: {
    flex: 2,
  },
  secondaryAction: {
    flex: 1,
  },
});
