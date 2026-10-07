import React from 'react';
import { Smartphone, Monitor, AlertCircle } from 'lucide-react';
import { PageSpeedStrategyResult } from '../../types/report.types';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { PerformanceScoreCard } from './PerformanceScoreCard';
import { TagClassificationTable } from './TagClassificationTable';
import { WorkloadReductionTable } from './WorkloadReductionTable';
import { LabMetricsTable } from './LabMetricsTable';
import { CoreWebVitalsTable } from './CoreWebVitalsTable';
import { VarianceNotice } from './VarianceNotice';
import { GlossarySection } from './GlossarySection';

interface StrategyReportSectionProps {
  result: PageSpeedStrategyResult;
}

export const StrategyReportSection: React.FC<StrategyReportSectionProps> = ({ result }) => {
  const isMobile = result?.strategy === 'mobile';
  const estimation = result?.finalGtmMigrationResult;

  const tables = estimation?.tables || (estimation as any)?.estimatedImpact?.tables || (result as any)?.performanceReport?.tables;
  const scoreData = estimation?.performanceScore || (estimation as any)?.estimatedImpact?.performanceScore || (result as any)?.performanceReport?.performanceScore;
  const warnings = estimation?.warnings || (estimation as any)?.estimatedImpact?.warnings || (result as any)?.performanceReport?.warnings;
  const varianceNotice = estimation?.varianceNotice || (estimation as any)?.estimatedImpact?.varianceNotice || (result as any)?.performanceReport?.varianceNotice;

  return (
    <ErrorBoundary fallbackTitle={`Error rendering ${result?.strategy || 'strategy'} report`}>
      <section className="bg-gradient-to-b from-slate-50 to-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm mb-12">
        <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-200">
          <div className="p-2 rounded-xl bg-blue-100/70 text-blue-700">
            {isMobile ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          </div>
          <h2 className="text-xl font-bold text-slate-900 capitalize">
            {result?.strategy || 'Performance'} Performance Projection
          </h2>
        </div>

        {result?.error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{result.error}</span>
          </div>
        ) : estimation ? (
          <div className="space-y-6">
            {scoreData && <PerformanceScoreCard scoreData={scoreData} />}
            {tables?.tagClassification && <TagClassificationTable rows={tables.tagClassification} />}
            {tables?.workloadReduction && <WorkloadReductionTable rows={tables.workloadReduction} />}
            {tables?.labMetrics && <LabMetricsTable rows={tables.labMetrics} />}
            {tables?.cwvMetrics && <CoreWebVitalsTable rows={tables.cwvMetrics} />}
            <VarianceNotice notice={varianceNotice} warnings={warnings} />
            <GlossarySection />
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">No estimation details available for this strategy.</p>
        )}
      </section>
    </ErrorBoundary>
  );
};


