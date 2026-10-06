import React from 'react';
import { Play, AlertTriangle, Loader2 } from 'lucide-react';

interface FormActionsProps {
  onSubmit: () => void;
  loading: boolean;
  disabled: boolean;
  error: string | null;
}

export const FormActions: React.FC<FormActionsProps> = ({
  onSubmit,
  loading,
  disabled,
  error
}) => {
  return (
    <div className="mb-8">
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || loading}
        className="w-full h-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl text-base font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating Report...
          </>
        ) : (
          <>
            <Play className="w-5 h-5 fill-current" />
            Generate Speed & Performance Report
          </>
        )}
      </button>

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-in fade-in duration-200">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Error Generating Report</span>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};
