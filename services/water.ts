import { apiGetJson, apiPost } from './api';

export type WaterEvent = {
  id: string | null;
  deltaMl: number;
  createdAt: string | null;
};

export type WaterStatus = {
  id: string | null;
  date: string;
  goalMl: number;
  consumedMl: number;
  remainingMl: number;
  progressPercent: number;
  goalReached: boolean;
  goalInherited: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  events: WaterEvent[];
};

export type WaterHistory = {
  startDate: string | null;
  endDate: string | null;
  days: WaterStatus[];
};

type WaterResponse = {
  water: WaterStatus | null;
};

type WaterHistoryResponse = {
  waterHistory: WaterHistory;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function parseWaterEvent(value: unknown): WaterEvent | null {
  if (!isRecord(value)) return null;

  const deltaMl = asNumber(value.deltaMl);
  if (deltaMl === null) return null;

  return {
    id: typeof value.id === 'string' ? value.id : null,
    deltaMl,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : null,
  };
}

function parseWater(value: unknown): WaterStatus | null {
  if (!isRecord(value)) return null;

  const goalMl = asNumber(value.goalMl);
  const consumedMl = asNumber(value.consumedMl);
  const remainingMl = asNumber(value.remainingMl);
  const progressPercent = asNumber(value.progressPercent);

  if (
    typeof value.date !== 'string' ||
    goalMl === null ||
    consumedMl === null ||
    remainingMl === null ||
    progressPercent === null ||
    typeof value.goalReached !== 'boolean'
  ) {
    return null;
  }

  const events = Array.isArray(value.events)
    ? value.events.map(parseWaterEvent).filter((item): item is WaterEvent => item !== null)
    : [];

  return {
    id: typeof value.id === 'string' ? value.id : null,
    date: value.date,
    goalMl,
    consumedMl,
    remainingMl,
    progressPercent,
    goalReached: value.goalReached,
    goalInherited: Boolean(value.goalInherited),
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : null,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null,
    events,
  };
}

function parseWaterResponse(payload: unknown): WaterStatus | null {
  if (!isRecord(payload)) return null;

  if ('water' in payload) {
    return parseWater(payload.water);
  }

  return parseWater(payload);
}

function parseWaterHistory(payload: unknown): WaterHistory {
  const root = isRecord(payload) && 'waterHistory' in payload ? payload.waterHistory : payload;

  if (!isRecord(root)) {
    return {
      startDate: null,
      endDate: null,
      days: [],
    };
  }

  return {
    startDate: typeof root.startDate === 'string' ? root.startDate : null,
    endDate: typeof root.endDate === 'string' ? root.endDate : null,
    days: Array.isArray(root.days)
      ? root.days.map(parseWater).filter((item): item is WaterStatus => item !== null)
      : [],
  };
}

export async function getWaterStatus(date?: string): Promise<WaterStatus | null> {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  const data = await apiGetJson<WaterResponse>(`/water${query}`);
  return parseWaterResponse(data);
}

export async function getWaterHistory(startDate: string, endDate: string): Promise<WaterHistory> {
  const data = await apiGetJson<WaterHistoryResponse>(
    `/water/history?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
  );
  return parseWaterHistory(data);
}

export async function saveWaterStatus(params: {
  date?: string;
  goalMl?: number;
  deltaMl?: number;
}): Promise<WaterStatus> {
  const data = await apiPost<WaterResponse | WaterStatus>('/water', params);
  const water = parseWaterResponse(data);

  if (!water) {
    throw new Error('Resposta invalida do endpoint /water');
  }

  return water;
}
