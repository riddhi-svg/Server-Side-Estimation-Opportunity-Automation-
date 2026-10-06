import React from 'react';
import { Layers, LogIn } from 'lucide-react';
import { SelectItem } from '../../types/gtm.types';
import { SearchableSelect } from '../common/SearchableSelect';
import { GtmUrlInputCard } from './GtmUrlInputCard';

interface GtmDropdownsCardProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  accounts: SelectItem[];
  containers: SelectItem[];
  workspaces: SelectItem[];
  selectedAccount: SelectItem | null;
  selectedContainer: SelectItem | null;
  selectedWorkspace: SelectItem | null;
  loadingAccounts: boolean;
  loadingContainers: boolean;
  loadingWorkspaces: boolean;
  onSelectAccount: (item: SelectItem | null) => void;
  onSelectContainer: (item: SelectItem | null) => void;
  onSelectWorkspace: (item: SelectItem | null) => void;
  onApplyGtmUrl: (url: string) => Promise<void>;
  disabled?: boolean;
}

export const GtmDropdownsCard: React.FC<GtmDropdownsCardProps> = ({
  isAuthenticated,
  onLogin,
  accounts,
  containers,
  workspaces,
  selectedAccount,
  selectedContainer,
  selectedWorkspace,
  loadingAccounts,
  loadingContainers,
  loadingWorkspaces,
  onSelectAccount,
  onSelectContainer,
  onSelectWorkspace,
  onApplyGtmUrl,
  disabled = false
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          GTM Container Configuration
        </h2>
        <span className="text-xs text-slate-400">Google Tag Manager API</span>
      </div>

      {!isAuthenticated ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
          <p className="text-sm text-slate-600 mb-3">
            Login with your Google Account to access and analyze your GTM containers.
          </p>
          <button
            type="button"
            onClick={onLogin}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <LogIn className="w-4 h-4" />
            Connect Google Tag Manager
          </button>
        </div>
      ) : (
        <div>
          <GtmUrlInputCard onApplyUrl={onApplyGtmUrl} disabled={disabled} />

          <div className="relative flex py-2 items-center mb-3">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Option 2: Manual Selection
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">GTM Account</label>
              <SearchableSelect
                items={accounts}
                value={selectedAccount}
                onChange={onSelectAccount}
                placeholder="Select Account"
                disabled={disabled}
                loading={loadingAccounts}
                loadingMessage="Loading accounts..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">GTM Container</label>
              <SearchableSelect
                items={containers}
                value={selectedContainer}
                onChange={onSelectContainer}
                placeholder="Select Container"
                disabled={disabled || !selectedAccount}
                loading={loadingContainers}
                loadingMessage="Loading containers..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">GTM Workspace</label>
              <SearchableSelect
                items={workspaces}
                value={selectedWorkspace}
                onChange={onSelectWorkspace}
                placeholder="Select Workspace"
                disabled={disabled || !selectedContainer}
                loading={loadingWorkspaces}
                loadingMessage="Loading workspaces..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
