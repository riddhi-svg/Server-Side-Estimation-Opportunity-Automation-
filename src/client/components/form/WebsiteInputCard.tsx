import React from 'react';
import { Globe, Smartphone, Monitor } from 'lucide-react';

interface WebsiteInputCardProps {
  url: string;
  setUrl: (val: string) => void;
  strategy: 'mobile' | 'desktop' | 'both';
  setStrategy: (val: 'mobile' | 'desktop' | 'both') => void;
  disabled?: boolean;
}

export const WebsiteInputCard: React.FC<WebsiteInputCardProps> = ({
  url,
  setUrl,
  strategy,
  setStrategy,
  disabled = false
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
      <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Globe className="w-4 h-4 text-blue-600" />
        Website Target & Form Factor
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            disabled={disabled}
            placeholder="https://example.com"
            required
            className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setStrategy('mobile')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              strategy === 'mobile'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Mobile
          </button>
          <button
            type="button"
            onClick={() => setStrategy('desktop')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              strategy === 'desktop'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Desktop
          </button>
          <button
            type="button"
            onClick={() => setStrategy('both')}
            className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-semibold transition ${
              strategy === 'both'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Both
          </button>
        </div>
      </div>
    </div>
  );
};
