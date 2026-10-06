import React from 'react';
import { Info } from 'lucide-react';

interface VarianceNoticeProps {
  notice?: {
    noticeText?: string;
    modelAssumptions?: string[];
    confidenceFactors?: string[];
  };
  warnings?: string[];
}

export const VarianceNotice: React.FC<VarianceNoticeProps> = ({ notice, warnings }) => {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-600 space-y-3">
      <div className="flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1.5 flex-1">
          <span className="font-semibold text-slate-800 block">
            Estimation Methodology & Variance Notice
          </span>
          <p className="leading-relaxed">
            {notice?.noticeText ||
              'Projections are based on deterministic log-normal curve shifts and empirical GTM execution overhead reduction. Actual real-world scores will vary due to network variability, CDN performance, server response times, and client device capabilities.'}
          </p>
        </div>
      </div>

      {notice?.modelAssumptions && notice.modelAssumptions.length > 0 && (
        <div className="pt-2 border-t border-slate-200/60">
          <span className="font-semibold text-slate-700 block mb-1">Model Assumptions:</span>
          <ul className="list-disc list-inside space-y-0.5 text-slate-500">
            {notice.modelAssumptions.map((assump, i) => (
              <li key={i}>{assump}</li>
            ))}
          </ul>
        </div>
      )}

      {warnings && warnings.length > 0 && (
        <div className="pt-2 border-t border-rose-200 bg-rose-50/50 p-2.5 rounded-lg text-rose-800">
          <span className="font-semibold block mb-1">Warnings:</span>
          <ul className="list-disc list-inside space-y-0.5">
            {warnings.map((warn, i) => (
              <li key={i}>{warn}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
