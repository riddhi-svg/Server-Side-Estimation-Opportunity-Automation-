import React, { useState } from 'react';
import { Link2, Sparkles, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface GtmUrlInputCardProps {
  onApplyUrl: (url: string) => Promise<void>;
  disabled?: boolean;
}

export const GtmUrlInputCard: React.FC<GtmUrlInputCardProps> = ({
  onApplyUrl,
  disabled = false
}) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle'; message: string }>({
    type: 'idle',
    message: ''
  });

  const handleApply = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setStatus({ type: 'idle', message: '' });
    try {
      await onApplyUrl(url.trim());
      setStatus({ type: 'success', message: 'Configured successfully from GTM URL!' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Failed to resolve GTM URL.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
        Option 1: Quick Auto-Fill from GTM URL
      </label>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={url}
            onChange={e => {
              setUrl(e.target.value);
              if (status.type !== 'idle') setStatus({ type: 'idle', message: '' });
            }}
            onKeyDown={e => e.key === 'Enter' && handleApply()}
            disabled={disabled || loading}
            placeholder="https://tagmanager.google.com/#/container/accounts/123/containers/456/workspaces/789"
            className="w-full h-10 px-3 pr-8 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 transition"
          />
          {url && (
            <button
              type="button"
              onClick={() => {
                setUrl('');
                setStatus({ type: 'idle', message: '' });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleApply}
          disabled={disabled || loading || !url.trim()}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          Fetch & Configure
        </button>
      </div>

      {status.type !== 'idle' && (
        <div
          className={`mt-2 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
            status.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{status.message}</span>
        </div>
      )}
    </div>
  );
};
