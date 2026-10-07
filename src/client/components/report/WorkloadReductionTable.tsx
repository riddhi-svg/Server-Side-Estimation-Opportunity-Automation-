import React from 'react';
import { Cpu } from 'lucide-react';
import { WorkloadItem } from '../../types/estimation.types';
import { cleanMetricDisplay } from '../../utils/formatters';

interface WorkloadReductionTableProps {
  rows?: WorkloadItem[];
}

export const WorkloadReductionTable: React.FC<WorkloadReductionTableProps> = ({ rows }) => {
  if (!rows || !Array.isArray(rows) || rows.length === 0) return null;

  return (
    <div className="bg-white border border-emerald-200 rounded-2xl p-6 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-600" />
          Attributed Browser Workload Reduction
        </h3>
        <span className="text-xs text-slate-400">Main-Thread & Network Savings</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-2.5 px-3">Workload Metric</th>
              <th className="py-2.5 px-3 text-right">Current</th>
              <th className="py-2.5 px-3 text-right">Estimated</th>
              <th className="py-2.5 px-3 text-right">Potential Reduction</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition">
                <td className="py-2.5 px-3 font-medium text-slate-900">{row?.metric || 'Metric'}</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-600">{cleanMetricDisplay(row?.current)}</td>
                <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900">{cleanMetricDisplay(row?.estimated)}</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                  {cleanMetricDisplay(row?.reduction)}
                  {row?.reductionPercentage && (
                    <span className="ml-1 text-[11px] font-normal text-emerald-600">
                      ({cleanMetricDisplay(row.reductionPercentage)})
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


