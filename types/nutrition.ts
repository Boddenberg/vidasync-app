/**
 * Tipos relacionados a Nutrição, Refeições e Favoritos
 *
 * Aqui ficam as "formas" dos dados que vêm do backend.
 * Sempre que o backend mudar a resposta, é SÓ AQUI que ajusta.
 */

// ─── Nutrição ────────────────────────────────────────────

/** Dados nutricionais de um alimento */
export type NutritionData = {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
};

/** Resposta da rota POST /nutrition/calories */
export type NutritionResponse = {
  nutrition: NutritionData;
  error: string | null;
};

/*
 * Estruturas de revisao da analise nutricional.
 *
 * O BFF pode sinalizar que o resultado precisa de confirmacao humana.
 * Essas estruturas isolam o contrato para a UI de revisao sem acoplar
 * a tela aos nomes crus vindos da API.
 */
export type NutritionCorrection = {
  original: string;
  corrected: string;
};

export type NutritionIngredientAnalysis = {
  name: string;
  nutrition: NutritionData;
  cached: boolean;
  precisaRevisao: boolean;
  warnings: string[];
  traceId: string | null;
};

export type NutritionAnalysisResult = {
  nutrition: NutritionData;
  ingredients: NutritionIngredientAnalysis[];
  detectedDishName: string;
  corrections: NutritionCorrection[];
  invalidItems: string[];
  precisaRevisao: boolean;
  warnings: string[];
  traceId: string | null;
  error: string | null;
};

// ─── Refeições ───────────────────────────────────────────

/** Tipos de refeição possíveis */
export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'supper';

/** Labels amigáveis para cada tipo de refeição */
export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Café da manhã',
  lunch: 'Almoço',
  snack: 'Lanche',
  dinner: 'Jantar',
  supper: 'Ceia',
};

/** Uma refeição registrada */
export type Meal = {
  id: string;
  foods: string;
  mealType: MealType;
  date: string;
  time: string;
  nutrition: NutritionData;
  imageUrl: string | null;
  createdAt: string;
};

/** Resposta da rota GET /meals?date= */
export type MealsListResponse = {
  meals: Meal[];
};

/** Resposta da rota GET /meals/summary?date= */
export type SummaryResponse = {
  date: string;
  totalMeals: number;
  meals: Meal[];
  totals: NutritionData;
};

/** Resposta das rotas POST/PUT /meals */
export type MealResponse = {
  meal: Meal;
};

/** Resposta de DELETE */
export type DeleteResponse = {
  success: boolean;
};

// ─── Favoritos ───────────────────────────────────────────

/** Um item favorito */
export type Favorite = {
  id: string;
  foods: string;
  nutrition: NutritionData;
  imageUrl: string | null;
};

/** Resposta da rota GET /favorites */
export type FavoritesListResponse = {
  favorites: Favorite[];
};

/** Resposta da rota POST /favorites */
export type FavoriteResponse = {
  favorite: Favorite;
};

// ─── Autenticação ────────────────────────────────────────

/** Dados do usuário exibidos no app (sem token) */
export type AuthUser = {
  userId: string;
  username: string;
  profileImageUrl: string | null;
  isDeveloper: boolean;
};

/** Resposta de signup e login (inclui accessToken do Supabase) */
export type AuthResponse = AuthUser & {
  accessToken?: string;
};

/** Resposta do endpoint PUT /auth/profile/username */
export type ProfileIdentityResponse = Pick<AuthUser, 'userId' | 'username' | 'profileImageUrl'> & {
  isDeveloper?: boolean;
  accessToken?: string;
};

/** Resposta do endpoint PUT /auth/profile/password */
export type PasswordUpdateResponse = {
  success: boolean;
};
