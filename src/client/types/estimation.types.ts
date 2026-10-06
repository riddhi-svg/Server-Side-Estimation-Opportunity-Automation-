export interface MetricValue {
  current: number;
  likely: number;
  conservative: number;
  optimistic: number;
  deltaLikely: number;
  deltaPercent: number;
  unit: string;
  isLabScoreComponent: boolean;
  heuristicLabel?: string;
}

export interface WorkloadItem {
  metric: string;
  current: string;
  estimated: string;
  reduction: string;
  reductionPercentage: string;
}

export interface MigrationOpportunityRow {
  tier: string;
  count: number;
  description: string;
  savingsTier: string;
  colorClass: string;
}

export interface PerformanceScoreEstimation {
  current: number;
  estimated: number;
  deltaPoints: number;
  status: string;
  confidence: {
    level: string;
    score: number;
    reasons: string[];
  };
  baselineValidation: {
    isValid: boolean;
    computedScore: number;
    reportedScore: number;
    discrepancy: number;
  };
}

export interface FinalGtmMigrationResult {
  performanceScore: PerformanceScoreEstimation;
  metrics: {
    lab: {
      fcp: MetricValue;
      speedIndex: MetricValue;
      lcp: MetricValue;
      tbt: MetricValue;
      cls: MetricValue;
    };
    coreWebVitals: {
      lcp: MetricValue;
      inp: MetricValue | null;
      cls: MetricValue;
    };
  };
  tables: {
    tagClassification: MigrationOpportunityRow[];
    workloadReduction: WorkloadItem[];
    labMetrics: any[];
    cwvMetrics: any[];
  };
  varianceNotice: {
    noticeText: string;
    modelAssumptions: string[];
    confidenceFactors: string[];
  };
  warnings: string[];
}
