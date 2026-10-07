import React from 'react';
import { Layers } from 'lucide-react';
import { MigrationOpportunityRow } from '../../types/estimation.types';

interface TagClassificationTableProps {
  rows?: MigrationOpportunityRow[];
}

export const TagClassificationTable: React.FC<TagClassificationTableProps> = ({ rows }) => {
  if (!rows || !Array.isArray(rows) || rows.length === 0) return null;

  return (
    <div className="bg-white border border-emerald-200 rounded-2xl p-6 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600" />
          GTM Container Tag Classification
        </h3>
        <span className="text-xs text-slate-400">3-Tier Model + Obsolete</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-2.5 px-3">Classification Tier</th>
              <th className="py-2.5 px-3">Impact / Action</th>
              <th className="py-2.5 px-3 text-right">Tags Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {rows.map((row, idx) => {
              const tier = row?.tier || 'Unclassified';
              const dotColor = tier.includes('Removable')
                ? 'bg-emerald-500'
                : tier.includes('Lighter')
                ? 'bg-blue-500'
                : tier.includes('Delete')
                ? 'bg-rose-500'
                : 'bg-amber-500';

              return (
                <tr key={idx} className="hover:bg-slate-50/50 transition">
                  <td className="py-2.5 px-3 font-medium">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                      <span>{tier}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{row?.description || '—'}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">{row?.count ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

