export type ObservabilityTone = 'positive' | 'warning' | 'critical' | 'neutral';
export type ObservabilityServiceStatus = 'healthy' | 'warning' | 'critical' | 'unknown';
export type ObservabilityClassification = 'approved' | 'alert' | 'rejected' | 'unknown';
export type ObservabilitySource = 'fallback' | 'hybrid' | 'backend';
export type ObservabilityJudgeStatus = 'pending' | 'completed' | 'failed' | 'unknown';

export type ObservabilityMetric = {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: ObservabilityTone;
};

export type ObservabilityService = {
  id: string;
  label: string;
  status: ObservabilityServiceStatus;
  summary: string;
  detail: string;
};

export type ObservabilityEndpointRow = {
  id: string;
  label: string;
  avgLatency: string;
  p95Latency: string;
  volume: string;
  errors: string;
};

export type ObservabilityQualityCriterion = {
  id: string;
  label: string;
  value: string;
  classification: ObservabilityClassification;
};

export type ObservabilityInsight = {
  id: string;
  title: string;
  description: string;
  tone: ObservabilityTone;
};

export type ObservabilityTimelineEvent = {
  id: string;
  timestampLabel: string;
  title: string;
  description: string;
  tone: ObservabilityTone;
};

export type ObservabilityJudgeEvaluation = {
  id: string;
  createdAt: string;
  createdAtLabel: string;
  updatedAtLabel: string;
  feature: string;
  status: ObservabilityJudgeStatus;
  statusLabel: string;
  decision: ObservabilityClassification;
  decisionLabel: string;
  tone: ObservabilityTone;
  score: string;
  summary: string;
  pipeline: string;
  handler: string;
  requestId: string;
  conversationId: string;
  messageId: string;
  userId: string;
  sourceModel: string;
  judgeModel: string;
  sourceDuration: string;
  judgeDuration: string;
  improvements: string[];
  rejectionReasons: string[];
  error: string | null;
};

export type DeveloperObservabilitySnapshot = {
  generatedAt: string;
  generatedAtLabel: string;
  source: ObservabilitySource;
  services: ObservabilityService[];
  performanceMetrics: ObservabilityMetric[];
  volumeMetrics: ObservabilityMetric[];
  llmMetrics: ObservabilityMetric[];
  judgeMetrics: ObservabilityMetric[];
  qualityMetrics: ObservabilityMetric[];
  qualityCriteria: ObservabilityQualityCriterion[];
  insights: ObservabilityInsight[];
  topEndpoints: ObservabilityEndpointRow[];
  errorEndpoints: ObservabilityEndpointRow[];
  timeline: ObservabilityTimelineEvent[];
  judgeEvaluations: ObservabilityJudgeEvaluation[];
};

export type DeveloperObservabilitySnapshotOverrides = Partial<
  Omit<DeveloperObservabilitySnapshot, 'generatedAt' | 'generatedAtLabel' | 'source'>
> & {
  generatedAt?: string;
  generatedAtLabel?: string;
  source?: ObservabilitySource;
};
