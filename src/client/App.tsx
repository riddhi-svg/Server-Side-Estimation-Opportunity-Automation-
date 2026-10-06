import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useGtmHierarchy } from './hooks/useGtmHierarchy';
import { useAnalysisRunner } from './hooks/useAnalysisRunner';
import { Header } from './components/common/Header';
import { WebsiteInputCard } from './components/form/WebsiteInputCard';
import { GtmDropdownsCard } from './components/form/GtmDropdownsCard';
import { FormActions } from './components/form/FormActions';
import { Spinner } from './components/common/Spinner';
import { StrategyReportSection } from './components/report/StrategyReportSection';

export const App: React.FC = () => {
  const { isAuthenticated, user, login, logout } = useAuth();
  const [url, setUrl] = useState('');
  const [strategy, setStrategy] = useState<'mobile' | 'desktop' | 'both'>('mobile');

  const {
    accounts,
    containers,
    workspaces,
    selectedAccount,
    selectedContainer,
    selectedWorkspace,
    loadingAccounts,
    loadingContainers,
    loadingWorkspaces,
    selectAccount,
    selectContainer,
    selectWorkspace,
    applyGtmUrl
  } = useGtmHierarchy(isAuthenticated);

  const {
    loading,
    loadingStep,
    error,
    results,
    executeAnalysis,
    resetTagsCache
  } = useAnalysisRunner();

  const handleAccountChange = (acc: any) => {
    resetTagsCache();
    selectAccount(acc);
  };

  const handleContainerChange = (cont: any) => {
    resetTagsCache();
    selectContainer(cont);
  };

  const handleWorkspaceChange = (ws: any) => {
    resetTagsCache();
    selectWorkspace(ws);
  };

  const handleSubmit = async () => {
    if (!url || !selectedAccount || !selectedContainer || !selectedWorkspace) return;
    await executeAnalysis(url, strategy, selectedAccount.id, selectedContainer.id, selectedWorkspace.id);
  };

  const isFormValid = Boolean(
    isAuthenticated &&
    url.trim().length > 0 &&
    selectedAccount &&
    selectedContainer &&
    selectedWorkspace
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 font-sans">
      <Header
        isAuthenticated={isAuthenticated}
        user={user}
        onLogin={login}
        onLogout={logout}
      />

      <main>
        <WebsiteInputCard
          url={url}
          setUrl={setUrl}
          strategy={strategy}
          setStrategy={setStrategy}
          disabled={loading}
        />

        <GtmDropdownsCard
          isAuthenticated={isAuthenticated}
          onLogin={login}
          accounts={accounts}
          containers={containers}
          workspaces={workspaces}
          selectedAccount={selectedAccount}
          selectedContainer={selectedContainer}
          selectedWorkspace={selectedWorkspace}
          loadingAccounts={loadingAccounts}
          loadingContainers={loadingContainers}
          loadingWorkspaces={loadingWorkspaces}
          onSelectAccount={handleAccountChange}
          onSelectContainer={handleContainerChange}
          onSelectWorkspace={handleWorkspaceChange}
          onApplyGtmUrl={applyGtmUrl}
          disabled={loading}
        />

        <FormActions
          onSubmit={handleSubmit}
          loading={loading}
          disabled={!isFormValid}
          error={error}
        />

        {loading && <Spinner label={loadingStep} />}

        {results && results.length > 0 && (
          <div className="mt-12 space-y-8 animate-in fade-in duration-300">
            {results.map((res, idx) => (
              <StrategyReportSection key={idx} result={res} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
