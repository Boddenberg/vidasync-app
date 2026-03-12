import { apiGetJson, apiPost } from './api';

export type WaterStatus = {
  id: string;
  date: string;
  goalMl: number;
  consumedMl: number;
  remainingMl: number;
  progressPercent: number;
  goalReached: boolean;
  createdAt: string;
  updatedAt: string;
};

type WaterResponse = {
  water: WaterStatus | null;
};

function isWaterStatus(value: unknown): value is WaterStatus {
  if (!value || typeof value !== 'object') return false;
  const water = value as Partial<WaterStatus>;
  return (
    typeof water.id === 'string' &&
    typeof water.date === 'string' &&
    typeof water.goalMl === 'number' &&
    typeof water.consumedMl === 'number' &&
    typeof water.remainingMl === 'number' &&
    typeof water.progressPercent === 'number' &&
    typeof water.goalReached === 'boolean' &&
    typeof water.createdAt === 'string' &&
    typeof water.updatedAt === 'string'
  );
}

function parseWater(payload: unknown): WaterStatus | null {
  if (!payload || typeof payload !== 'object') return null;

  if ('water' in payload) {
    const nested = (payload as WaterResponse).water;
    return isWaterStatus(nested) ? nested : null;
  }

  return isWaterStatus(payload) ? payload : null;
}

export async function getWaterStatus(date?: string): Promise<WaterStatus | null> {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  const data = await apiGetJson<WaterResponse>(`/water${query}`);
  return parseWater(data);
}

export async function saveWaterStatus(params: {
  date?: string;
  goalMl?: number;
  deltaMl?: number;
}): Promise<WaterStatus> {
  const data = await apiPost<WaterResponse | WaterStatus>('/water', params);
  const water = parseWater(data);
  if (!water) {
    throw new Error('Resposta invalida do endpoint /water');
  }
  return water;
}
