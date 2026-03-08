import type { ReviewSession } from '@/types/review';

let currentSession: ReviewSession | null = null;

/*
 * Sessao unica de revisao assistida para foto, audio e PDF.
 *
 * O objetivo e manter a tela de revisao desacoplada das telas de captura
 * sem serializar payloads grandes na URL.
 */
export function setReviewSession(session: ReviewSession): void {
  currentSession = session;
}

export function getReviewSession(): ReviewSession | null {
  return currentSession;
}

export function clearReviewSession(): void {
  currentSession = null;
}

