import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Typography } from '@/constants/theme';
import type { Favorite, MealType } from '@/types/nutrition';
import { MEAL_TYPE_LABELS } from '@/types/nutrition';

type MealTypeModalProps = {
  favorite: Favorite | null;
  onClose: () => void;
  onConfirm: (type: MealType) => void;
};

type ActionsModalProps = {
  favorite: Favorite | null;
  onClose: () => void;
  onUseAsMeal: (favorite: Favorite) => void;
  onEdit: (favorite: Favorite) => void;
  onDelete: (favorite: Favorite) => void;
};

const MEAL_TYPE_ICON_CONFIG: Record<
  MealType,
  { name: 'sunny-outline' | 'restaurant-outline' | 'cafe-outline' | 'moon-outline' | 'bed-outline'; color: string; bg: string }
> = {
  breakfast: { name: 'sunny-outline', color: '#F57C00', bg: '#FFF3E0' },
  lunch: { name: 'restaurant-outline', color: Brand.greenDark, bg: '#E8F5E9' },
  snack: { name: 'cafe-outline', color: '#D6A624', bg: '#FFF8E1' },
  dinner: { name: 'moon-outline', color: '#7E57C2', bg: '#EDE7F6' },
  supper: { name: 'bed-outline', color: '#5C6BC0', bg: '#E8EAF6' },
};

export function ExploreMealTypeModal({ favorite, onClose, onConfirm }: MealTypeModalProps) {
  return (
    <Modal visible={!!favorite} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={s.handleWrap}>
            <View style={s.handle} />
          </View>
          <Text style={s.sheetTitle}>Adicionar em qual refeicao?</Text>
          {favorite ? <Text style={s.sheetSubtitle}>{favorite.foods}</Text> : null}

          <View style={s.sheetActions}>
            {(['breakfast', 'lunch', 'snack', 'dinner', 'supper'] as MealType[]).map((type, index) => {
              const config = MEAL_TYPE_ICON_CONFIG[type];

              return (
                <View key={type}>
                  {index > 0 ? <View style={s.sheetBorder} /> : null}
                  <Pressable style={({ pressed }) => [s.sheetBtn, pressed && s.sheetBtnPressed]} onPress={() => onConfirm(type)}>
                    <View style={[s.sheetIconWrap, { backgroundColor: config.bg }]}>
                      <Ionicons name={config.name} size={18} color={config.color} />
                    </View>
                    <Text style={s.sheetBtnLabel}>{MEAL_TYPE_LABELS[type]}</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>

          <Pressable style={({ pressed }) => [s.sheetCancelBtn, pressed && s.sheetBtnPressed]} onPress={onClose}>
            <Text style={s.sheetCancelText}>Cancelar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function ExploreFavoriteActionsModal({
  favorite,
  onClose,
  onUseAsMeal,
  onEdit,
  onDelete,
}: ActionsModalProps) {
  return (
    <Modal visible={!!favorite} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={s.handleWrap}>
            <View style={s.handle} />
          </View>

          {favorite ? (
            <View style={s.sheetHeaderRow}>
              {favorite.imageUrl ? (
                <Image source={{ uri: favorite.imageUrl }} style={s.sheetThumb} />
              ) : (
                <View style={s.sheetThumbPlaceholder}>
                  <Ionicons name="restaurant-outline" size={18} color={Brand.textSecondary} />
                </View>
              )}
              <Text style={s.sheetHeaderName} numberOfLines={2}>
                {favorite.foods}
              </Text>
            </View>
          ) : null}

          <View style={s.sheetActions}>
            <SheetAction
              label="Usar como refeicao"
              icon="add-circle-outline"
              iconColor={Brand.greenDark}
              iconBg="#E8F5E9"
              onPress={() => favorite && onUseAsMeal(favorite)}
            />
            <View style={s.sheetBorder} />
            <SheetAction
              label="Editar"
              icon="create-outline"
              iconColor="#1E88E5"
              iconBg="#E6F2FF"
              onPress={() => favorite && onEdit(favorite)}
            />
            <View style={s.sheetBorder} />
            <SheetAction
              label="Apagar"
              icon="trash-outline"
              iconColor={Brand.danger}
              iconBg="#FFEDEE"
              danger
              onPress={() => {
                if (!favorite) return;
                Alert.alert('Remover prato?', favorite.foods, [
                  { text: 'Remover', style: 'destructive', onPress: () => onDelete(favorite) },
                  { text: 'Cancelar', style: 'cancel' },
                ]);
              }}
            />
          </View>

          <Pressable style={({ pressed }) => [s.sheetCancelBtn, pressed && s.sheetBtnPressed]} onPress={onClose}>
            <Text style={s.sheetCancelText}>Cancelar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SheetAction({
  label,
  icon,
  iconColor,
  iconBg,
  danger = false,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [s.sheetBtn, pressed && s.sheetBtnPressed]} onPress={onPress}>
      <View style={[s.sheetIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[s.sheetBtnLabel, danger && s.sheetBtnLabelDanger]}>{label}</Text>
    </Pressable>
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 42,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 14,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: Brand.border,
  },
  sheetTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  sheetSubtitle: {
    ...Typography.body,
    color: Brand.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sheetThumb: {
    width: 52,
    height: 52,
    borderRadius: 16,
  },
  sheetThumbPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Brand.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetHeaderName: {
    flex: 1,
    ...Typography.body,
    color: Brand.text,
    fontWeight: '700',
  },
  sheetActions: {
    backgroundColor: Brand.card,
    borderRadius: Radii.xl,
    overflow: 'hidden',
  },
  sheetBorder: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.border,
  },
  sheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  sheetBtnPressed: {
    backgroundColor: Brand.bg,
  },
  sheetIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBtnLabel: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '600',
  },
  sheetBtnLabelDanger: {
    color: Brand.danger,
  },
  sheetCancelBtn: {
    marginTop: 10,
    borderRadius: Radii.xl,
    backgroundColor: Brand.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  sheetCancelText: {
    ...Typography.body,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
});
