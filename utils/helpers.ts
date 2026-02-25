/**
 * Funções utilitárias compartilhadas entre telas e componentes.
 *
 * Centraliza lógica que antes era duplicada em vários arquivos.
 */

// ─── Tipos de ingrediente ────────────────────────────────

export type WeightUnit = 'g' | 'ml' | 'un';

export type Ingredient = {
  name: string;
  weight: string;
  unit: WeightUnit;
};

// ─── Formatação ──────────────────────────────────────────

/** Formata um ingrediente: "100g de arroz" */
export function formatIngredient(ing: Ingredient): string {
  if (!ing.weight) return ing.name;
  return `${ing.weight}${ing.unit} de ${ing.name}`;
}

/**
 * Converte uma string de alimentos de volta em ingredientes individuais.
 *
 * Suporta formatos:
 *   - "100g de arroz, 200ml de leite"
 *   - "100g arroz, 200ml leite"
 *   - "arroz, leite"  (sem peso)
 */
export function parseFoodsToIngredients(foods: string): Ingredient[] {
  if (!foods) return [];
  const parts = foods.split(',').map((p) => p.trim()).filter(Boolean);
  return parts.map((part) => {
    // "100g de arroz branco"
    const m1 = part.match(/^(\d+[.,]?\d*)\s*(g|ml|un)\s+de\s+(.+)$/i);
    if (m1) {
      return { weight: m1[1], unit: m1[2].toLowerCase() as WeightUnit, name: m1[3].trim() };
    }
    // "100g arroz branco" (sem "de")
    const m2 = part.match(/^(\d+[.,]?\d*)\s*(g|ml|un)\s+(.+)$/i);
    if (m2) {
      return { weight: m2[1], unit: m2[2].toLowerCase() as WeightUnit, name: m2[3].trim() };
    }
    // Fallback: sem peso
    return { name: part, weight: '', unit: 'g' as WeightUnit };
  });
}

// ─── Números ─────────────────────────────────────────────

/** Extrai o primeiro número de uma string como "145 kcal" → 145 */
export function extractNum(str: string): number {
  const m = str.match(/[\d.,]+/);
  if (!m) return 0;
  return parseFloat(m[0].replace(',', '.')) || 0;
}

// ─── Data e horário ──────────────────────────────────────

/** Data de hoje no formato YYYY-MM-DD */
export function todayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Horário atual no formato HH:mm */
export function nowTimeStr(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Converte Date para YYYY-MM-DD */
export function toDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Calcula startDate e endDate para um mês inteiro */
export function monthRange(year: number, month: number): { startDate: string; endDate: string } {
  const mm = String(month + 1).padStart(2, '0');
  const lastDay = new Date(year, month + 1, 0).getDate();
  return {
    startDate: `${year}-${mm}-01`,
    endDate: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
  };
}

// ─── DishName + Foods encoding ────────────────────────────

const DISH_SEPARATOR = ' — ';

/**
 * Monta a string `foods` combinando nome do prato (opcional) + ingredientes.
 *
 * Exemplos:
 *   buildFoodsString("Marmita fitness", "100g de arroz, 200ml de leite")
 *   → "Marmita fitness — 100g de arroz, 200ml de leite"
 *
 *   buildFoodsString("", "100g de arroz, 200ml de leite")
 *   → "100g de arroz, 200ml de leite"
 */
export function buildFoodsString(dishName: string | undefined, ingredientsStr: string): string {
  const name = dishName?.trim();
  if (name) return `${name}${DISH_SEPARATOR}${ingredientsStr}`;
  return ingredientsStr;
}

/**
 * Decompõe a string `foods` em dishName e ingredientes brutos.
 *
 * Inverso de buildFoodsString.
 */
export function splitFoodsAndDishName(foods: string): { dishName: string; ingredientsRaw: string } {
  const idx = foods.indexOf(DISH_SEPARATOR);
  if (idx >= 0) {
    return {
      dishName: foods.substring(0, idx).trim(),
      ingredientsRaw: foods.substring(idx + DISH_SEPARATOR.length).trim(),
    };
  }
  return { dishName: '', ingredientsRaw: foods };
}

// ─── Nomes de meses/dias ─────────────────────────────────

export const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const MONTHS_SHORT = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

export const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
