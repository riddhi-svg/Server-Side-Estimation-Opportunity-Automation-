import React, { useState } from 'react';
import { Sparkles, X, CheckCircle2, AlertCircle, Loader2, LogIn } from 'lucide-react';

interface GtmUrlInputCardProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  onApplyUrl: (url: string) => Promise<void>;
  disabled?: boolean;
}

export const GtmUrlInputCard: React.FC<GtmUrlInputCardProps> = ({
  isAuthenticated,
  onLogin,
  onApplyUrl,
  disabled = false
}) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle'; message: string }>({
    type: 'idle',
    message: ''
  });

  const handleApply = async (targetUrl = url) => {
    const cleanUrl = targetUrl.trim();
    if (!cleanUrl) return;

    if (!isAuthenticated) {
      setStatus({
        type: 'error',
        message: 'Google login is required to fetch GTM configuration from this URL.'
      });
      return;
    }

    setLoading(true);
    setStatus({ type: 'idle', message: '' });
    try {
      await onApplyUrl(cleanUrl);
      setStatus({ type: 'success', message: '✓ Successfully resolved and configured GTM container from URL.' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Failed to resolve GTM URL.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted) {
      setUrl(pasted);
      setTimeout(() => handleApply(pasted), 100);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Paste GTM Tag Manager URL
        </label>
        <span className="text-[11px] text-slate-400">Auto-detects account, container & workspace</span>
      </div>

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
            onPaste={handlePaste}
            disabled={disabled || loading}
            placeholder="https://tagmanager.google.com/#/container/accounts/6005185171/containers/53757711/workspaces/191"
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
          onClick={() => handleApply()}
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
          className={`mt-2.5 p-2.5 rounded-lg text-xs flex items-center justify-between gap-2 ${
            status.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {status.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{status.message}</span>
          </div>
          {!isAuthenticated && status.type === 'error' && (
            <button
              type="button"
              onClick={onLogin}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold transition shrink-0"
            >
              <LogIn className="w-3 h-3" />
              Login Now
            </button>
          )}
        </div>
      )}
    </div>
  );
};
