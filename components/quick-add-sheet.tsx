/**
 * Sheet de lançamento rápido
 *
 * Modal que lista os favoritos/templates salvos com foto.
 * O usuário toca em um item → escolhe o tipo de refeição → pronto, salvo.
 */

import { Brand } from '@/constants/theme';
import type { Favorite, MealType } from '@/types/nutrition';
import { MEAL_TYPE_LABELS } from '@/types/nutrition';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type Props = {
  visible: boolean;
  favorites: Favorite[];
  onSelect: (fav: Favorite, mealType: MealType, time?: string) => void;
  onClose: () => void;
};

const TYPES: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner', 'supper'];
const TYPE_ICON_CONFIG: Record<MealType, { name: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  breakfast: { name: 'sunny-outline', color: '#F57C00', bg: '#FFF3E0' },
  lunch: { name: 'restaurant-outline', color: '#4CAF50', bg: '#E8F5E9' },
  snack: { name: 'cafe-outline', color: '#F9A825', bg: '#FFF8E1' },
  dinner: { name: 'moon-outline', color: '#7E57C2', bg: '#EDE7F6' },
  supper: { name: 'bed-outline', color: '#5C6BC0', bg: '#E8EAF6' },
};
const THUMB = 44;

export function QuickAddSheet({ visible, favorites, onSelect, onClose }: Props) {
  const [selectedFav, setSelectedFav] = useState<Favorite | null>(null);

  function handlePick(fav: Favorite) {
    setSelectedFav(fav);
  }

  function handleSelectType(type: MealType) {
    if (!selectedFav) return;
    const fav = selectedFav;
    setSelectedFav(null);
    onSelect(fav, type);
  }

  function handleClose() {
    setSelectedFav(null);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}>
      <Pressable style={s.backdrop} onPress={handleClose}>
        <View />
      </Pressable>

      <View style={s.sheet}>
        {/* Handle */}
        <View style={s.handleWrap}>
          <View style={s.handle} />
        </View>

        <Text style={s.title}>Lançar rápido</Text>
        <Text style={s.subtitle}>Toque em um prato para registrar agora</Text>

        <ScrollView
          style={s.list}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}>
          {favorites.length === 0 && (
            <View style={s.empty}>
              <Text style={s.emptyText}>Nenhum prato salvo ainda</Text>
              <Text style={s.emptyHint}>
                Vá em Meus Pratos para cadastrar seus alimentos frequentes.
              </Text>
            </View>
          )}

          {favorites.map((fav) => (
            <Pressable
              key={fav.id}
              style={({ pressed }) => [s.item, pressed && s.itemPressed]}
              onPress={() => handlePick(fav)}>
              {/* Thumbnail */}
              {fav.imageUrl ? (
                <Image source={{ uri: fav.imageUrl }} style={s.itemThumb} />
              ) : (
                <View style={s.itemThumbPlaceholder}>
                  <Text style={s.itemThumbLetter}>{fav.foods?.charAt(0)?.toUpperCase() || 'P'}</Text>
                </View>
              )}
              <View style={s.itemContent}>
                <View style={s.itemTop}>
                  <Text style={s.itemFoods} numberOfLines={1}>
                    {fav.foods}
                  </Text>
                  <Text style={s.itemCal}>{fav.nutrition.calories}</Text>
                </View>
                <View style={s.itemMacros}>
                  <View style={[s.macroPill, { backgroundColor: '#EBF5FB' }]}>
                    <Text style={[s.macroPillLabel, { color: '#5DADE2' }]}>prot</Text>
                    <Text style={[s.macroPillValue, { color: '#5DADE2' }]}>{fav.nutrition.protein}</Text>
                  </View>
                  <View style={[s.macroPill, { backgroundColor: '#FEF5E7' }]}>
                    <Text style={[s.macroPillLabel, { color: Brand.orange }]}>carb</Text>
                    <Text style={[s.macroPillValue, { color: Brand.orange }]}>{fav.nutrition.carbs}</Text>
                  </View>
                  <View style={[s.macroPill, { backgroundColor: '#FDEDEC' }]}>
                    <Text style={[s.macroPillLabel, { color: '#E74C3C' }]}>gord</Text>
                    <Text style={[s.macroPillValue, { color: '#E74C3C' }]}>{fav.nutrition.fat}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable style={s.closeBtn} onPress={handleClose}>
          <Text style={s.closeBtnText}>Fechar</Text>
        </Pressable>
      </View>

      {/* ── Modal de tipo de refeição ── */}
      <Modal
        visible={!!selectedFav}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedFav(null)}>
        <Pressable style={s.typeOverlay} onPress={() => setSelectedFav(null)}>
          <Pressable style={s.typeSheet} onPress={(e) => e.stopPropagation()}>
            <View style={s.handleWrap}>
              <View style={s.handle} />
            </View>
            <Text style={s.typeTitle}>Adicionar em qual refeição?</Text>
            {selectedFav && (
              <Text style={s.typeSubtitle} numberOfLines={2}>{selectedFav.foods}</Text>
            )}

            <View style={s.typeActions}>
              {TYPES.map((type, idx) => (
                <View key={type}>
                  {idx > 0 && <View style={s.typeBorder} />}
                  <Pressable
                    style={({ pressed }) => [s.typeBtn, pressed && s.typeBtnPressed]}
                    onPress={() => handleSelectType(type)}>
                    <View style={[s.typeIconWrap, { backgroundColor: TYPE_ICON_CONFIG[type].bg }]}>
                      <Ionicons name={TYPE_ICON_CONFIG[type].name} size={18} color={TYPE_ICON_CONFIG[type].color} />
                    </View>
                    <Text style={s.typeBtnLabel}>{MEAL_TYPE_LABELS[type]}</Text>
                  </Pressable>
                </View>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [s.typeCancelBtn, pressed && s.typeBtnPressed]}
              onPress={() => setSelectedFav(null)}>
              <Text style={s.typeCancelText}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: Brand.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 32,
    maxHeight: '75%',
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Brand.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Brand.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: Brand.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: 8,
    paddingBottom: 16,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.text,
  },
  emptyHint: {
    fontSize: 13,
    color: Brand.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.card,
    borderRadius: 14,
    overflow: 'hidden',
    paddingLeft: 12,
    paddingVertical: 10,
  },
  itemPressed: {
    opacity: 0.7,
  },
  itemThumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: 10,
  },
  itemThumbPlaceholder: {
    width: THUMB,
    height: THUMB,
    borderRadius: 10,
    backgroundColor: Brand.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemThumbLetter: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Brand.green,
  },
  itemContent: {
    flex: 1,
    paddingVertical: 2,
    paddingHorizontal: 12,
    gap: 4,
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemFoods: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Brand.text,
    marginRight: 12,
  },
  itemCal: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.greenDark,
  },
  itemMacros: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  macroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  macroPillLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  macroPillValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: Brand.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Brand.border,
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.textSecondary,
  },

  // Meal type selector modal
  typeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  typeSheet: {
    backgroundColor: Brand.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 48,
    paddingHorizontal: 20,
  },
  typeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  typeSubtitle: {
    fontSize: 13,
    color: Brand.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  typeActions: {
    backgroundColor: Brand.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    gap: 14,
  },
  typeBtnPressed: {
    backgroundColor: Brand.bg,
  },
  typeBorder: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.border,
  },
  typeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Brand.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconText: {
    fontSize: 16,
  },
  typeBtnLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Brand.text,
  },
  typeCancelBtn: {
    marginTop: 10,
    backgroundColor: Brand.card,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  typeCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Brand.textSecondary,
  },
});
