import { FinalGtmMigrationResult } from './estimation.types';

export interface PageSpeedStrategyResult {
  strategy: 'mobile' | 'desktop';
  score?: number;
  url?: string;
  metrics?: Record<string, any>;
  performanceReport?: any;
  finalGtmMigrationResult?: FinalGtmMigrationResult;
  error?: string;
}

export interface AnalyzeResponse {
  results: PageSpeedStrategyResult[];
}
