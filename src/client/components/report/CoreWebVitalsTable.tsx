import React from 'react';
import { Activity } from 'lucide-react';

interface CoreWebVitalsTableProps {
  rows: any[];
}

export const CoreWebVitalsTable: React.FC<CoreWebVitalsTableProps> = ({ rows }) => {
  if (!rows || rows.length === 0) return null;

  return (
    <div className="bg-white border border-emerald-200 rounded-2xl p-6 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-600" />
          Core Web Vitals (LCP, INP, CLS)
        </h3>
        <span className="text-xs text-slate-400">Google Ranking Metrics</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-2.5 px-3">Core Web Vital</th>
              <th className="py-2.5 px-3 text-right">Current</th>
              <th className="py-2.5 px-3 text-right">Estimated</th>
              <th className="py-2.5 px-3 text-right">Projection Range</th>
              <th className="py-2.5 px-3 text-right">Improvement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition">
                <td className="py-2.5 px-3 font-medium text-slate-900">
                  {row.metric}
                  {row.heuristic && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 font-normal">
                      {row.heuristic}
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-600">{row.current}</td>
                <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900">{row.estimated}</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-500">{row.range || '—'}</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">{row.improvement}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
