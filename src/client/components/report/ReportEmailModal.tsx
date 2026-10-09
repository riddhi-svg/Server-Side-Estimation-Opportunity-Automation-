import React, { useState } from 'react';
import { Mail, X, Loader2, Send } from 'lucide-react';

interface ReportEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (to: string, cc: string) => Promise<void>;
  isSending: boolean;
  error: string | null;
  defaultTo?: string;
}

export const ReportEmailModal: React.FC<ReportEmailModalProps> = ({
  isOpen,
  onClose,
  onSend,
  isSending,
  error,
  defaultTo = 'jimit@tatvic.com'
}) => {
  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || isSending) return;
    onSend(to.trim(), cc.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          disabled={isSending}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Email Report</h3>
            <p className="text-xs text-slate-500">Send estimation report via Gmail API</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              To (Recipient Email) <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={isSending}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
              placeholder="e.g. jimit@tatvic.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cc (Optional)
            </label>
            <input
              type="text"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              disabled={isSending}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
              placeholder="e.g. colleague@tatvic.com, manager@tatvic.com"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || !to.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 transition cursor-pointer"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending...</span>
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
      </div>
    </div>
  );
};
