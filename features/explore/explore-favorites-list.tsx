import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import { ExploreMacroChip } from '@/features/explore/explore-macro-chip';
import type { Favorite } from '@/types/nutrition';

type Props = {
  favorites: Favorite[];
  totalFavorites: number;
  loading: boolean;
  showForm: boolean;
  error: string | null;
  onPressFavorite: (favorite: Favorite) => void;
};

export function ExploreFavoritesList({
  favorites,
  totalFavorites,
  loading,
  showForm,
  error,
  onPressFavorite,
}: Props) {
  if (loading) {
    return <Text style={s.hint}>Carregando pratos...</Text>;
  }

  return (
    <>
      {!loading && totalFavorites === 0 && !showForm ? (
        <View style={s.emptyState}>
          <Text style={s.emptyTitle}>Nenhum prato cadastrado</Text>
          <Text style={s.emptyHint}>
            Use o botão Novo prato para montar sua primeira receita favorita.
          </Text>
        </View>
      ) : null}

      {error ? (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}

      {totalFavorites > 0 ? (
        <>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Pratos salvos</Text>
            <Text style={s.sectionCount}>
              {favorites.length}/{totalFavorites}
            </Text>
          </View>

          <View style={s.list}>
            {favorites.map((favorite) => (
              <Pressable key={favorite.id} style={({ pressed }) => [s.card, pressed && s.cardPressed]} onPress={() => onPressFavorite(favorite)}>
                {favorite.imageUrl ? (
                  <Image source={{ uri: favorite.imageUrl }} style={s.cardThumb} />
                ) : (
                  <View style={s.cardThumbPlaceholder}>
                    <Ionicons name="restaurant-outline" size={20} color={Brand.textSecondary} />
                  </View>
                )}

                <View style={s.cardContent}>
                  <View style={s.cardTop}>
                    <Text style={s.cardFoods} numberOfLines={2}>
                      {favorite.foods}
                    </Text>
                    <View style={s.cardCalBadge}>
                      <Text style={s.cardCal}>{favorite.nutrition.calories} kcal</Text>
                    </View>
                  </View>

                  <Text style={s.cardHint}>Toque para usar, editar ou apagar.</Text>

                  <View style={s.cardMacros}>
                    <ExploreMacroChip label="prot" value={favorite.nutrition.protein} color={Brand.macroProtein} bg={Brand.macroProteinBg} />
                    <ExploreMacroChip label="carb" value={favorite.nutrition.carbs} color={Brand.macroCarb} bg={Brand.macroCarbBg} />
                    <ExploreMacroChip label="gord" value={favorite.nutrition.fat} color={Brand.macroFat} bg={Brand.macroFatBg} />
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </>
  );
}

const THUMB_SIZE = 72;

const s = StyleSheet.create({
  hint: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  emptyState: {
    borderRadius: Radii.xl,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 20,
    gap: 8,
    ...Shadows.card,
  },
  emptyTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  emptyHint: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  errorBox: {
    borderRadius: Radii.lg,
    backgroundColor: Brand.fatBg,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: {
    ...Typography.body,
    color: Brand.danger,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  sectionCount: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: Radii.xl,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 14,
    ...Shadows.card,
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  cardThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 22,
  },
  cardThumbPlaceholder: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 22,
    backgroundColor: Brand.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  cardFoods: {
    flex: 1,
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
    lineHeight: 25,
  },
  cardCalBadge: {
    borderRadius: Radii.pill,
    backgroundColor: Brand.surfaceSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cardCal: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '800',
  },
  cardHint: {
    ...Typography.helper,
    color: Brand.textSecondary,
  },
  cardMacros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
