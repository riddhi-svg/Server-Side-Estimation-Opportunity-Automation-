import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  label?: string;
  sublabel?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  label = 'Analyzing performance...',
  sublabel
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
        <Loader2 className="w-5 h-5 text-blue-600 absolute animate-pulse" />
      </div>
      <p className="text-sm font-semibold text-slate-700 mt-2">{label}</p>
      {sublabel && <p className="text-xs text-slate-400">{sublabel}</p>}
    </div>
  );
};
