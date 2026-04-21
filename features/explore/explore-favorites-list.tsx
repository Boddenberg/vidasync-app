import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import { getFavoriteDisplayText } from '@/features/explore/explore-favorite-display';
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
    return (
      <View style={s.loadingBox}>
        <View style={s.loadingPulse} />
        <Text style={s.hint}>Carregando pratos...</Text>
      </View>
    );
  }

  return (
    <>
      {!loading && totalFavorites === 0 && !showForm ? (
        <View style={s.emptyState}>
          <View style={s.emptyIconWrap}>
            <Ionicons name="bookmark-outline" size={24} color={Brand.greenDark} />
          </View>
          <Text style={s.emptyTitle}>Sua coleção está vazia</Text>
          <Text style={s.emptyHint}>
            Toque em <Text style={s.emptyHintStrong}>Novo prato</Text> acima para salvar sua primeira receita.
          </Text>
        </View>
      ) : null}

      {error ? (
        <View style={s.errorBox}>
          <Ionicons name="alert-circle" size={16} color={Brand.danger} />
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}

      {totalFavorites > 0 ? (
        <>
          <View style={s.sectionHeader}>
            <View style={s.sectionHeaderLeft}>
              <Text style={s.sectionTitle}>Salvos</Text>
              <View style={s.sectionBadge}>
                <Text style={s.sectionBadgeText}>{favorites.length}</Text>
              </View>
            </View>
            {favorites.length !== totalFavorites ? (
              <Text style={s.sectionFiltered}>filtrando {totalFavorites}</Text>
            ) : null}
          </View>

          <View style={s.list}>
            {favorites.map((favorite) => {
              const { title, subtitle } = getFavoriteDisplayText(favorite.foods);

              return (
                <Pressable
                  key={favorite.id}
                  style={({ pressed }) => [s.card, pressed && s.cardPressed]}
                  onPress={() => onPressFavorite(favorite)}>
                  <View style={s.cardThumbWrap}>
                    {favorite.imageUrl ? (
                      <Image source={{ uri: favorite.imageUrl }} style={s.cardThumb} />
                    ) : (
                      <View style={s.cardThumbPlaceholder}>
                        <Ionicons name="restaurant" size={22} color={Brand.greenDark} />
                      </View>
                    )}
                    <View style={s.cardThumbGlow} pointerEvents="none" />
                  </View>

                  <View style={s.cardContent}>
                    <View style={s.cardHeaderRow}>
                      <Text style={s.cardTitle} numberOfLines={1}>
                        {title}
                      </Text>
                      <View style={s.cardCalBadge}>
                        <Text style={s.cardCalValue}>{favorite.nutrition.calories}</Text>
                        <Text style={s.cardCalUnit}>kcal</Text>
                      </View>
                    </View>

                    {subtitle ? (
                      <Text style={s.cardSubtitle} numberOfLines={1}>
                        {subtitle}
                      </Text>
                    ) : null}

                    <View style={s.cardMacros}>
                      <ExploreMacroChip
                        label="prot"
                        value={favorite.nutrition.protein}
                        color={Brand.macroProtein}
                        bg={Brand.macroProteinBg}
                        compact
                      />
                      <ExploreMacroChip
                        label="carb"
                        value={favorite.nutrition.carbs}
                        color={Brand.macroCarb}
                        bg={Brand.macroCarbBg}
                        compact
                      />
                      <ExploreMacroChip
                        label="gord"
                        value={favorite.nutrition.fat}
                        color={Brand.macroFat}
                        bg={Brand.macroFatBg}
                        compact
                      />
                    </View>
                  </View>

                  <Ionicons name="chevron-forward" size={18} color={Brand.textMuted} style={s.cardChevron} />
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}
    </>
  );
}

const THUMB_SIZE = 64;

const s = StyleSheet.create({
  hint: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  loadingPulse: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Brand.greenSoft,
    borderWidth: 2,
    borderColor: Brand.fresh,
  },
  emptyState: {
    alignItems: 'center',
    borderRadius: Radii.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    paddingHorizontal: 22,
    paddingVertical: 26,
    gap: 10,
    ...Shadows.card,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Brand.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    ...Typography.subtitle,
    fontSize: 17,
    color: Brand.text,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyHint: {
    ...Typography.body,
    fontSize: 13,
    color: Brand.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyHintStrong: {
    color: Brand.greenDark,
    fontWeight: '800',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radii.lg,
    backgroundColor: Brand.fatBg,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: {
    ...Typography.body,
    fontSize: 13,
    color: Brand.danger,
    flex: 1,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    ...Typography.subtitle,
    fontSize: 17,
    color: Brand.text,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionBadge: {
    minWidth: 24,
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 11,
    backgroundColor: Brand.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBadgeText: {
    ...Typography.caption,
    fontSize: 11,
    color: Brand.greenDark,
    fontWeight: '800',
  },
  sectionFiltered: {
    ...Typography.caption,
    color: Brand.textMuted,
    fontWeight: '700',
  },
  list: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: Radii.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.07)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    ...Shadows.card,
  },
  cardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
    backgroundColor: Brand.surfaceAlt,
  },
  cardThumbWrap: {
    position: 'relative',
  },
  cardThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 18,
  },
  cardThumbPlaceholder: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 18,
    backgroundColor: Brand.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
  },
  cardThumbGlow: {
    position: 'absolute',
    bottom: -4,
    left: 6,
    right: 6,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(31,167,80,0.18)',
    opacity: 0.6,
    transform: [{ scaleY: 0.5 }],
  },
  cardContent: {
    flex: 1,
    gap: 5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    ...Typography.body,
    fontSize: 15,
    color: Brand.text,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    ...Typography.caption,
    fontSize: 11,
    color: Brand.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  cardCalBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    borderRadius: 999,
    backgroundColor: Brand.surfaceSoft,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  cardCalValue: {
    ...Typography.caption,
    fontSize: 12,
    color: Brand.greenDeeper,
    fontWeight: '900',
  },
  cardCalUnit: {
    ...Typography.caption,
    fontSize: 9,
    color: Brand.greenDark,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cardMacros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  cardChevron: {
    marginLeft: -2,
  },
});
