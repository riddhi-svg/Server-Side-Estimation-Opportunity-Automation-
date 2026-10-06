import React from 'react';
import { ArrowRight, ShieldCheck, TrendingUp } from 'lucide-react';
import { PerformanceScoreEstimation } from '../../types/estimation.types';
import { getScoreColor, getConfidenceBadgeColor } from '../../utils/scoreColors';

interface PerformanceScoreCardProps {
  scoreData: PerformanceScoreEstimation;
}

export const PerformanceScoreCard: React.FC<PerformanceScoreCardProps> = ({ scoreData }) => {
  const currentTheme = getScoreColor(scoreData.current);
  const estimatedTheme = getScoreColor(scoreData.estimated);

  return (
    <div className="bg-white border border-emerald-200 rounded-2xl p-6 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">PageSpeed Performance Score</h3>
          <p className="text-xs text-slate-500">Official Lighthouse v10–v13 Log-Normal Weighted Projection</p>
        </div>

        {scoreData.confidence && (
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getConfidenceBadgeColor(
                scoreData.confidence.level
              )}`}
            >
              <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
              {scoreData.confidence.level} Confidence
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-4 bg-slate-50/50 rounded-xl border border-slate-100">
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Current Score</span>
          <div
            className={`w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 ${currentTheme.border} ${currentTheme.bg}`}
          >
            <span className={`text-3xl font-extrabold ${currentTheme.text}`}>{scoreData.current}</span>
            <span className="text-[10px] font-bold text-slate-500">{currentTheme.category}</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <ArrowRight className="w-8 h-8 text-slate-300 hidden md:block" />
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 shadow-sm">
            <TrendingUp className="w-3.5 h-3.5" />
            +{scoreData.deltaPoints} points improvement
          </span>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">Estimated Score</span>
          <div
            className={`w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 ${estimatedTheme.border} ${estimatedTheme.bg} shadow-md shadow-emerald-500/10`}
          >
            <span className={`text-3xl font-extrabold ${estimatedTheme.text}`}>{scoreData.estimated}</span>
            <span className="text-[10px] font-bold text-emerald-700">{estimatedTheme.category}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
