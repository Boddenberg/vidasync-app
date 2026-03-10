import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppButton } from '@/components/app-button';
import { Brand } from '@/constants/theme';
import {
  clearNutritionReviewSession,
  getNutritionReviewSession,
} from '@/services/nutrition-review-session';

/*
 * Tela de revisao para resultados com precisa_revisao=true.
 *
 * Nesta etapa mostramos warnings e itens sinalizados para o usuario
 * validar antes de seguir com o fluxo final de refeicao.
 */
export default function NutritionReviewScreen() {
  const router = useRouter();
  const session = getNutritionReviewSession();

  const warnings = useMemo(() => session?.result.warnings ?? [], [session]);

  function handleClose() {
    clearNutritionReviewSession();
    router.back();
  }

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Revisao nutricional</Text>
        <Text style={s.subtitle}>
          Encontramos pontos que precisam de confirmacao antes do uso final.
        </Text>

        {!session ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>Nenhum dado de revisao disponivel.</Text>
          </View>
        ) : (
          <>
            <View style={s.summaryCard}>
              <Text style={s.summaryDishName}>{session.result.detectedDishName}</Text>
              <Text style={s.summaryCalories}>{session.result.nutrition.calories}</Text>
              <Text style={s.summaryMacro}>Proteina: {session.result.nutrition.protein}</Text>
              <Text style={s.summaryMacro}>Carboidratos: {session.result.nutrition.carbs}</Text>
              <Text style={s.summaryMacro}>Lipidios: {session.result.nutrition.fat}</Text>
              {session.result.traceId ? (
                <Text style={s.traceText}>trace_id: {session.result.traceId}</Text>
              ) : null}
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

            <View style={s.ingredientsCard}>
              <Text style={s.sectionTitle}>Itens detectados</Text>
              {session.result.ingredients.map((ingredient, index) => (
                <View key={`${ingredient.name}-${index}`} style={s.ingredientRow}>
                  <Text style={s.ingredientName}>{ingredient.name}</Text>
                  <Text style={s.ingredientMacro}>
                    {ingredient.nutrition.calories} | {ingredient.nutrition.protein} | {ingredient.nutrition.carbs} | {ingredient.nutrition.fat}
                  </Text>
                  {ingredient.precisaRevisao ? (
                    <Text style={s.reviewBadge}>Precisa revisao</Text>
                  ) : null}
                  {ingredient.warnings.length > 0 ? (
                    <Text style={s.ingredientWarning}>{ingredient.warnings.join(' | ')}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <View style={s.footer}>
        <AppButton title="Voltar" onPress={handleClose} />
      </View>
    </View>
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
    paddingBottom: 110,
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
  emptyBox: {
    backgroundColor: Brand.card,
    borderRadius: 14,
    padding: 14,
  },
  emptyText: {
    color: Brand.textSecondary,
    fontSize: 13,
  },
  summaryCard: {
    backgroundColor: Brand.card,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  summaryCalories: {
    fontSize: 22,
    fontWeight: '700',
    color: Brand.greenDark,
  },
  summaryDishName: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.text,
  },
  summaryMacro: {
    fontSize: 13,
    color: Brand.text,
  },
  traceText: {
    marginTop: 4,
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
  ingredientsCard: {
    backgroundColor: Brand.card,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  ingredientRow: {
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
    paddingBottom: 8,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.text,
  },
  ingredientMacro: {
    fontSize: 12,
    color: Brand.textSecondary,
  },
  reviewBadge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    color: '#8A6D3B',
    backgroundColor: '#FFF3D1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ingredientWarning: {
    fontSize: 11,
    color: Brand.danger,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Brand.bg,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
  },
});
