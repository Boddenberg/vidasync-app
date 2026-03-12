import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Typography } from '@/constants/theme';
import type { Meal } from '@/types/nutrition';
import { MEAL_TYPE_LABELS } from '@/types/nutrition';

export type MealAction = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap | string;
  destructive?: boolean;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  meal: Meal | null;
  actions: MealAction[];
  onClose: () => void;
};

function normalizeIcon(icon: string): keyof typeof Ionicons.glyphMap {
  if (icon in Ionicons.glyphMap) {
    return icon as keyof typeof Ionicons.glyphMap;
  }
  return 'ellipse-outline';
}

export function MealActionSheet({ visible, meal, actions, onClose }: Props) {
  if (!meal) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={s.header}>
            <View style={s.handle} />
            <Text style={s.mealType}>
              {MEAL_TYPE_LABELS[meal.mealType]}
              {meal.time ? ` • ${meal.time}` : ''}
            </Text>
            <Text style={s.mealFoods} numberOfLines={2}>
              {meal.foods}
            </Text>
          </View>

          <View style={s.actions}>
            {actions.map((action, idx) => (
              <Pressable
                key={`${action.label}-${idx}`}
                style={({ pressed }) => [
                  s.actionBtn,
                  idx < actions.length - 1 && s.actionBtnBorder,
                  pressed && s.actionBtnPressed,
                ]}
                onPress={() => {
                  onClose();
                  setTimeout(action.onPress, 180);
                }}>
                <View style={[s.actionIconWrap, action.destructive && s.actionIconWrapDanger]}>
                  <Ionicons
                    name={normalizeIcon(action.icon)}
                    size={18}
                    color={action.destructive ? Brand.danger : Brand.greenDark}
                  />
                </View>
                <Text style={[s.actionLabel, action.destructive && s.actionLabelDanger]}>{action.label}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={({ pressed }) => [s.cancelBtn, pressed && s.actionBtnPressed]} onPress={onClose}>
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
    backgroundColor: 'rgba(31,41,51,0.32)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Brand.bg,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
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
    width: 42,
    height: 4,
    borderRadius: Radii.pill,
    backgroundColor: Brand.border,
    marginBottom: 8,
  },
  mealType: {
    ...Typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: Brand.textSecondary,
  },
  mealFoods: {
    ...Typography.subtitle,
    fontSize: 15,
    fontWeight: '700',
    color: Brand.text,
    textAlign: 'center',
    lineHeight: 21,
  },
  actions: {
    backgroundColor: Brand.card,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Brand.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 12,
  },
  actionBtnPressed: {
    opacity: 0.85,
  },
  actionBtnBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
  },
  actionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: Brand.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconWrapDanger: {
    backgroundColor: '#FFEDEE',
  },
  actionLabel: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '600',
  },
  actionLabelDanger: {
    color: Brand.danger,
  },
  cancelBtn: {
    marginTop: 10,
    backgroundColor: Brand.card,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    ...Typography.body,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
});
