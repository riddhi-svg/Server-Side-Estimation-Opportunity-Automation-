import { useState, useCallback } from 'react';
import { PageSpeedStrategyResult } from '../types/report.types';
import { GtmTagsResult } from '../types/gtm.types';
import { fetchContainerTags } from '../services/gtmService';
import { runAnalysis } from '../services/analyzeService';

export function useAnalysisRunner() {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PageSpeedStrategyResult[] | null>(null);
  const [analyzedUrl, setAnalyzedUrl] = useState<string>('');
  const [cachedTags, setCachedTags] = useState<GtmTagsResult | null>(null);

  const resetTagsCache = useCallback(() => {
    setCachedTags(null);
  }, []);

  const executeAnalysis = useCallback(async (
    url: string,
    strategy: 'mobile' | 'desktop' | 'both',
    accountId: string,
    containerId: string,
    workspaceId: string
  ) => {
    setError(null);
    setResults(null);
    setLoading(true);
    setAnalyzedUrl(url);

    try {
      let gtmData = cachedTags;
      if (!gtmData) {
        setLoadingStep('Fetching GTM container tags and classifying...');
        gtmData = await fetchContainerTags(accountId, containerId, workspaceId);
        setCachedTags(gtmData);
      }

      setLoadingStep('Running PageSpeed Insights performance test...');
      const response = await runAnalysis(url, strategy, gtmData);

      setLoadingStep('Synthesizing server-side performance projections...');
      setResults(response.results);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  }, [cachedTags]);

  return {
    loading,
    loadingStep,
    error,
    results,
    analyzedUrl,
    executeAnalysis,
    resetTagsCache,
    clearResults: () => setResults(null)
  };
}
