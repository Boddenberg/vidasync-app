# APIs sugeridas para Progresso (backend)

A tela de Progresso hoje consome 100% de dados locais via `services/progress-panorama.ts`
(que por sua vez usa `services/meals.ts` e `services/water.ts`). Abaixo estão endpoints
opcionais que, se implementados, permitirão:

- Descarregar cálculos pesados do dispositivo.
- Calcular insights em múltiplos dias/semanas sem baixar todos os registros.
- Compartilhar o progresso (relatórios, exports, desafios, etc.).

Todos os endpoints devem herdar o auth padrão do app (Authorization Bearer ou cookie).

## 1. `GET /progress/snapshot?range=7|15|30|90`

**Objetivo:** retornar o dataset consolidado já usado por `PanoramaDataset`.

**Query params:**
- `range` (obrigatório): período em dias (7, 15, 30 ou 90).
- `endDate` (opcional, default hoje): data final no formato `YYYY-MM-DD`.

**Response 200:**
```json
{
  "endDate": "2026-04-21",
  "totalDays": 30,
  "days": [
    {
      "date": "2026-03-23",
      "waterMl": 2100,
      "waterGoalMl": 2500,
      "waterGoalReached": false,
      "calories": 1812,
      "protein": 98,
      "carbs": 210,
      "fat": 58,
      "mealsCount": 3,
      "hasAnyRecord": true
    }
  ]
}
```

## 2. `GET /progress/insights?range=30`

**Objetivo:** devolver os cálculos derivados já agregados no servidor (`streak`, `score`,
`macroAverages`, `hydrationHitRate`, `trend`, `bestDay`).

**Response 200:**
```json
{
  "range": 30,
  "streak": { "current": 9, "best": 18, "lastActiveDate": "2026-04-21" },
  "score": { "overall": 78, "consistency": 82, "calories": 86, "hydration": 71 },
  "trend": "improving",
  "macroAverages": {
    "protein": 112, "carbs": 218, "fat": 62, "calories": 1945, "waterMl": 2280
  },
  "macroDistribution": { "proteinPct": 0.24, "carbsPct": 0.53, "fatPct": 0.23 },
  "hydrationHitRate": { "hits": 18, "totalWithGoal": 28, "rate": 0.64 },
  "bestDay": { "date": "2026-04-12", "calories": 2210, "mealsCount": 5 },
  "activeDays": 26,
  "totalDays": 30
}
```

## 3. `GET /progress/heatmap?months=3`

**Objetivo:** devolver células já normalizadas para o mapa de atividade (estilo GitHub).
Isso permite manter a UI mesmo quando o volume de meses cresce (ex.: 12 meses).

**Response 200:**
```json
{
  "startDate": "2026-01-21",
  "endDate": "2026-04-21",
  "cells": [
    { "date": "2026-01-21", "intensity": 0.72, "score": 72, "hasRecord": true }
  ]
}
```

## 4. `GET /progress/weekly-breakdown?weeks=12`

**Objetivo:** agregados semanais (segunda a domingo) para gráficos comparativos.

**Response 200:**
```json
{
  "weeks": [
    {
      "weekStart": "2026-04-14",
      "daysActive": 6,
      "daysTotal": 7,
      "avgCalories": 1988,
      "avgWaterMl": 2390,
      "calorieTotal": 11930,
      "streakEvents": 0
    }
  ]
}
```

## 5. `POST /progress/goals` (opcional)

**Objetivo:** permitir que o usuário ajuste metas de calorias/macros/hidratação a partir
da tela de progresso. Hoje usamos o valor padrão (2000 kcal) na UI — com esta API a meta
pode ser personalizada.

**Body:**
```json
{
  "caloriesGoal": 2200,
  "proteinGoalG": 150,
  "waterGoalMl": 2500
}
```

## 6. `GET /progress/achievements` (futuro)

**Objetivo:** retornar conquistas desbloqueadas (ex.: "5 dias na meta", "30 dias seguidos").
Útil para gamificação futura.

**Response 200:**
```json
{
  "achievements": [
    {
      "id": "streak-7",
      "title": "Uma semana firme",
      "description": "7 dias consecutivos com registros.",
      "unlockedAt": "2026-04-19T10:00:00Z",
      "icon": "flame"
    }
  ]
}
```

---

## Observações

- Enquanto as APIs não existem, o app calcula tudo localmente — o código em
  `features/progress/progress-insights.ts` reflete exatamente a lógica esperada no
  servidor. Ao migrar, mantenha a paridade de fórmulas para evitar "números diferentes
  entre app e painel web".
- Para performance no mobile, o ideal é que `/progress/insights` seja **cacheável por dia**
  (ex.: resultado do dia anterior + delta de hoje).
- Todos os valores monetários são em **mililitros**, gramas e kcal — mantenha o padrão.
