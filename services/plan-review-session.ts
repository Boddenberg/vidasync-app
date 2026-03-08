import type { PlanPdfAnalysisResult } from '@/types/plan';

export type PlanReviewSession = {
  source: 'pdf';
  createdAt: string;
  result: PlanPdfAnalysisResult;
};

let currentSession: PlanReviewSession | null = null;

/*
 * Sessao temporaria para revisao de plano alimentar.
 *
 * Mantem os dados fora da URL e facilita evolucao para estado global.
 */
export function setPlanReviewSession(session: PlanReviewSession): void {
  currentSession = session;
}

export function getPlanReviewSession(): PlanReviewSession | null {
  return currentSession;
}

export function clearPlanReviewSession(): void {
  currentSession = null;
}
