export type ProgressPanoramaPeriodDays = 7 | 15 | 30;

export type ProgressPanoramaMetric = 'water' | 'calories' | 'meals';

export type ProgressPanoramaQuery = {
  periodDays: ProgressPanoramaPeriodDays;
  endDate?: string;
  timezone?: string;
};

export type ProgressPanoramaSummary = {
  averageWaterMlPerDay: number;
  averageCaloriesKcalPerDay: number;
  daysWithRecords: number;
};

export type ProgressPanoramaDay = {
  date: string;
  waterMl: number;
  caloriesKcal: number;
  mealsCount: number;
  hasAnyRecord: boolean;
};

export type ProgressPanoramaInsight = {
  kind: 'consistency_peak' | 'no_records' | 'summary_only';
  peakMetric: ProgressPanoramaMetric | null;
  peakDate: string | null;
  peakValue: number | null;
  message?: string | null;
};

export type ProgressPanorama = {
  periodDays: ProgressPanoramaPeriodDays;
  timezone: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  summary: ProgressPanoramaSummary;
  days: ProgressPanoramaDay[];
  insight?: ProgressPanoramaInsight | null;
};

export type ProgressPanoramaResponse = {
  panorama: ProgressPanorama;
};

export type ProgressPanoramaGateway = {
  getPanorama(query: ProgressPanoramaQuery): Promise<ProgressPanorama>;
};
