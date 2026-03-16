import { Brand } from '@/constants/theme';
import type { NetworkInspectorLog } from '@/services/network-inspector';

export type ToolView = 'search' | 'photo' | 'audio' | 'plan';
export type Unit = 'g' | 'ml' | 'un';
export type DiagnosticsMode = 'logs' | null;

export const TOOL_ORDER: ToolView[] = ['search', 'photo', 'audio', 'plan'];
export const UNITS: Unit[] = ['g', 'ml', 'un'];
export const FOOD_CATEGORIES = [
  { id: 'frutas', label: 'Frutas', icon: 'nutrition-outline', tint: '#EAF8EE', query: 'banana' },
  { id: 'carnes', label: 'Carnes', icon: 'barbell-outline', tint: '#FFF0EB', query: 'frango grelhado' },
  { id: 'laticinios', label: 'Laticínios', icon: 'cafe-outline', tint: '#EEF4FF', query: 'iogurte natural' },
  { id: 'vegetais', label: 'Vegetais', icon: 'leaf-outline', tint: '#EAF7EA', query: 'brócolis cozido' },
  { id: 'graos', label: 'Grãos', icon: 'flower-outline', tint: '#FFF6E1', query: 'arroz integral' },
  { id: 'snacks', label: 'Snacks', icon: 'fast-food-outline', tint: '#F8EFE4', query: 'mix de castanhas' },
] as const;

export function prettyText(value: string | null): string {
  if (!value) return '-';
  const text = value.trim();
  if (!text) return '-';
  try {
    const parsed = JSON.parse(text);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return value;
  }
}

export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString();
}

export function statusColor(log: NetworkInspectorLog): string {
  if (log.error) return Brand.danger;
  if (log.statusCode == null) return Brand.textSecondary;
  if (log.statusCode >= 500) return Brand.danger;
  if (log.statusCode >= 400) return '#D97706';
  return Brand.greenDark;
}

export function normalizeToolParam(raw: string | string[] | undefined): ToolView | null {
  const tool = Array.isArray(raw) ? raw[0] : raw;
  if (!tool) return null;
  return TOOL_ORDER.includes(tool as ToolView) ? (tool as ToolView) : null;
}

export function normalizeModeParam(raw: string | string[] | undefined): DiagnosticsMode {
  const mode = Array.isArray(raw) ? raw[0] : raw;
  return mode === 'logs' ? 'logs' : null;
}
