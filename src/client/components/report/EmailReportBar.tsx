import React, { useState } from 'react';
import { Mail, Send, Check, Loader2, AlertCircle } from 'lucide-react';
import { dispatchReportEmail } from '../../services/analyzeService';

interface EmailReportBarProps {
  url: string;
  strategy: string;
  finalResult: any;
  defaultTo?: string;
}

export const EmailReportBar: React.FC<EmailReportBarProps> = ({
  url,
  strategy,
  finalResult,
  defaultTo = 'jimit@tatvic.com'
}) => {
  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !finalResult || !to.trim() || isSending) return;

    setIsSending(true);
    setError(null);
    try {
      await dispatchReportEmail(url, strategy, finalResult, to.trim(), cc.trim());
      setSentTo(to.trim());
      setTimeout(() => setSentTo(null), 6000);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch report email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs transition mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
          <Mail className="w-4 h-4" />
        </div>
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Email Performance Report
        </span>
      </div>

      <form onSubmit={handleSend} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        <div className="sm:col-span-5">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            To (Recipient) <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            required
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={isSending}
            placeholder="jimit@tatvic.com"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <div className="sm:col-span-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Cc (Optional)
          </label>
          <input
            type="text"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            disabled={isSending}
            placeholder="e.g. colleague@tatvic.com"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={isSending || !to.trim() || !url}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 transition cursor-pointer"
          >
            {isSending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : sentTo ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Sent!</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Report</span>
              </>
            )}
          </button>
        </div>
      </form>

      {sentTo && (
        <div className="mt-2 text-xs text-emerald-700 font-medium flex items-center gap-1.5">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Report successfully delivered to <strong>{sentTo}</strong>{cc.trim() ? ` (CC: ${cc.trim()})` : ''}</span>
        </div>
      )}

      {error && (
        <div className="mt-2 text-xs text-rose-600 font-medium flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
