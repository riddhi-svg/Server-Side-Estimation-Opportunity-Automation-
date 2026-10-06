/**
 * Analysis Form Controller & Runner
 */

import { gtmFetch } from '../firebase-config.js';
import { displayResults } from '../render.js';

export function initAnalysisForm({
  form,
  urlInput,
  strategyInput,
  submitBtn,
  errorMsg,
  loadingDiv,
  resultsDiv,
  urlContainer,
  accountSelect,
  containerSelect,
  workspaceSelect,
  getIsAuthenticated
}) {
  let currentGtmTagsResult = null;

  function resetGtmCache() {
    currentGtmTagsResult = null;
  }

  function showError(msg) {
    if (!errorMsg) return;
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
  }

  function hideError() {
    if (!errorMsg) return;
    errorMsg.classList.add('hidden');
    errorMsg.textContent = '';
  }

  function validateForm() {
    const isUrlFilled = urlInput.value.trim().length > 0;
    const isGtmConfigured = Boolean(accountSelect.getValue() && containerSelect.getValue() && workspaceSelect.getValue());
    submitBtn.disabled = !(getIsAuthenticated() && isUrlFilled && isGtmConfigured);
  }

  urlInput.addEventListener('input', validateForm);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();
    const strategy = strategyInput.value;

    if (!url) return showError('Please enter a website URL.');
    try {
      new URL(url);
    } catch {
      return showError('Please enter a valid website URL (e.g., https://example.com).');
    }

    const accountId = accountSelect.getValue();
    const containerId = containerSelect.getValue();
    const workspaceId = workspaceSelect.getValue();

    if (!accountId || !containerId || !workspaceId) {
      return showError('Please select a GTM Account, Container and Workspace.');
    }
    if (!getIsAuthenticated()) {
      return showError('Google authentication is required before generating the report.');
    }

    hideError();
    resultsDiv.classList.add('hidden');
    urlContainer?.classList.add('hidden');
    resultsDiv.innerHTML = '';
    loadingDiv.classList.remove('hidden');

    setFormDisabled(true);

    try {
      if (!currentGtmTagsResult) {
        setLoadingText('Fetching GTM configuration...');
        const gtmRes = await gtmFetch(`/api/gtm/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/tags`);
        if (!gtmRes) return;
        const gtmData = await gtmRes.json();
        if (!gtmRes.ok) throw new Error("We couldn't retrieve the GTM configuration. Please try again.");
        currentGtmTagsResult = gtmData;
      }

      setLoadingText('Analyzing website performance...');
      const compactGtm = buildCompactGtmPayload(currentGtmTagsResult);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, strategy, gtmTagsResult: compactGtm })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate report. Please try again.');

      setLoadingText('Combining GTM and PageSpeed results...');
      displayResults(data, url);

      submitBtn.textContent = 'Report Generated';
      setTimeout(() => {
        resultsDiv.scrollIntoView({ behavior: 'smooth' });
        submitBtn.textContent = 'Generate Report';
      }, 500);

    } catch (err) {
      showError(err.message);
      submitBtn.textContent = 'Generate Report';
    } finally {
      loadingDiv.classList.add('hidden');
      setFormDisabled(false);
      validateForm();
    }
  });

  function setFormDisabled(disabled) {
    submitBtn.disabled = disabled;
    if (disabled) submitBtn.textContent = 'Generating Report...';
    urlInput.disabled = disabled;
    strategyInput.disabled = disabled;
    accountSelect.setDisabled(disabled);
    containerSelect.setDisabled(disabled);
    workspaceSelect.setDisabled(disabled);
  }

  function setLoadingText(text) {
    const p = loadingDiv.querySelector('p');
    if (p) p.textContent = text;
  }

  function buildCompactGtmPayload(gtmResult) {
    if (!gtmResult) return null;
    const compact = { summary: gtmResult.summary, tags: {} };
    if (gtmResult.tags) {
      for (const cat in gtmResult.tags) {
        compact.tags[cat] = gtmResult.tags[cat]
          .filter(t => t.migrationClassification === 'Potentially Server-Side')
          .map(t => ({
            name: t.name,
            category: t.category,
            type: t.type,
            migrationClassification: t.migrationClassification
          }));
      }
    }
    return compact;
  }

  return { validateForm, showError, hideError, resetGtmCache };
}
