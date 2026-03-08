import type { NutritionAnalysisResult } from '@/types/nutrition';

export type NutritionReviewSession = {
  source: 'photo' | 'text';
  createdAt: string;
  result: NutritionAnalysisResult;
};

let currentSession: NutritionReviewSession | null = null;

/*
 * Sessao temporaria em memoria para fluxo de revisao.
 *
 * Mantem o payload de revisao entre telas sem serializar dados grandes
 * na URL. Quando tivermos persistencia/sincronizacao, esta camada pode
 * migrar para store global sem alterar os componentes de UI.
 */
export function setNutritionReviewSession(session: NutritionReviewSession): void {
  currentSession = session;
}

export function getNutritionReviewSession(): NutritionReviewSession | null {
  return currentSession;
}

export function clearNutritionReviewSession(): void {
  currentSession = null;
}
