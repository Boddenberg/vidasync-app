/**
 * Bottom sheet estilizado para ações de uma refeição.
 *
 * Substitui o Alert.alert nativo — visual consistente com o design system.
 */

import { Brand } from '@/constants/theme';
import type { Meal } from '@/types/nutrition';
import { MEAL_TYPE_LABELS } from '@/types/nutrition';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export type MealAction = {
  label: string;
  /** Letra curta exibida no ícone circular */
  icon: string;
  destructive?: boolean;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  meal: Meal | null;
  actions: MealAction[];
  onClose: () => void;
};

export function MealActionSheet({ visible, meal, actions, onClose }: Props) {
  if (!meal) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={s.header}>
            <View style={s.handle} />
            <Text style={s.mealType}>
              {MEAL_TYPE_LABELS[meal.mealType]}
              {meal.time ? ` · ${meal.time}` : ''}
            </Text>
            <Text style={s.mealFoods} numberOfLines={2}>{meal.foods}</Text>
          </View>

          {/* Ações */}
          <View style={s.actions}>
            {actions.map((action, idx) => (
              <Pressable
                key={idx}
                style={({ pressed }) => [
                  s.actionBtn,
                  pressed && s.actionBtnPressed,
                  idx < actions.length - 1 && s.actionBtnBorder,
                ]}
                onPress={() => {
                  onClose();
                  // Pequeno delay para o modal fechar antes da ação
                  setTimeout(action.onPress, 200);
                }}>
                <View style={[
                  s.actionIconWrap,
                  action.destructive && s.actionIconWrapDanger,
                ]}>
                  <Text style={[
                    s.actionIconText,
                    action.destructive && s.actionIconTextDanger,
                  ]}>{action.icon}</Text>
                </View>
                <Text style={[
                  s.actionLabel,
                  action.destructive && s.actionLabelDanger,
                ]}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Cancelar */}
          <Pressable
            style={({ pressed }) => [s.cancelBtn, pressed && s.cancelBtnPressed]}
            onPress={onClose}>
            <Text style={s.cancelText}>Cancelar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Brand.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
    gap: 6,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Brand.border,
    marginBottom: 8,
  },
  mealType: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  mealFoods: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    backgroundColor: Brand.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    gap: 14,
  },
  actionBtnPressed: {
    backgroundColor: Brand.bg,
  },
  actionBtnBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
  },
  actionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Brand.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconWrapDanger: {
    backgroundColor: '#FFF0F0',
  },
  actionIconText: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.greenDark,
  },
  actionIconTextDanger: {
    color: Brand.danger,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Brand.text,
  },
  actionLabelDanger: {
    color: Brand.danger,
  },
  cancelBtn: {
    marginTop: 10,
    backgroundColor: Brand.card,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  cancelBtnPressed: {
    backgroundColor: Brand.bg,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Brand.textSecondary,
  },
});
