import { Animated } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

import type { NutritionCorrection } from '@/types/nutrition';
import type { NutritionReviewDraft, NutritionReviewQuantityUnit } from '@/types/review';

export function sourceLabel(source: 'photo' | 'audio' | 'pdf'): string {
  if (source === 'photo') return 'Foto';
  if (source === 'audio') return 'Audio';
  return 'PDF';
}

export function screenCopy(kind: 'nutrition' | 'plan') {
  if (kind === 'nutrition') {
    return {
      title: 'Revise sua refeicao',
      subtitle: 'Confira os itens identificados antes de salvar.',
    };
  }

  return {
    title: 'Revisao do plano',
    subtitle: 'Organizamos o conteudo extraido para voce revisar e ajustar se quiser.',
  };
}

function guessMimeTypeFromUri(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg';
}

export async function resolveFavoriteImagePayload(
  sessionPayload: string | null,
  previewUri: string | null,
): Promise<string | null> {
  const payload = `${sessionPayload ?? ''}`.trim();
  if (payload.length > 0) {
    return payload;
  }

  const uri = `${previewUri ?? ''}`.trim();
  if (uri.length === 0) {
    return null;
  }

  if (uri.startsWith('data:')) {
    return uri;
  }

  if (/^https?:\/\//i.test(uri)) {
    return uri;
  }

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (!base64) {
    return null;
  }

  return `data:${guessMimeTypeFromUri(uri)};base64,${base64}`;
}

export function resolveNutritionTitle(
  dishName: string | null | undefined,
  items: NutritionReviewDraft['items'],
  corrections: NutritionCorrection[],
): string {
  const explicitDishName = `${dishName ?? ''}`.trim();
  if (explicitDishName.length > 0) return explicitDishName;

  const corrected = corrections.find((entry) => entry.corrected.trim().length > 0)?.corrected?.trim();
  if (corrected) return corrected;

  const itemName = items.find((item) => item.name.trim().length > 0)?.name?.trim();
  if (itemName) return itemName;

  return 'meu prato';
}

export function buildQuantityLabel(
  quantityValue: string,
  quantityUnit: NutritionReviewQuantityUnit,
): string | null {
  const value = `${quantityValue}`.trim();
  if (!value) return null;
  return `${value}${quantityUnit}`;
}

export function buildRevealStyle(progress: Animated.Value) {
  return {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  };
}
