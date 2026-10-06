/**
 * Main Frontend Application Entry Point
 */

import { SearchableSelect } from './searchable-select.js';
import { initAuthUI } from './modules/auth-ui.js';
import { initAnalysisForm } from './modules/analysis-form.js';
import { 
  fetchAndPopulateAccounts, 
  fetchAndPopulateContainers, 
  fetchAndPopulateWorkspaces, 
  handleApplyGtmUrl 
} from './modules/gtm-cascade.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('analyze-form');
  const urlInput = document.getElementById('url-input');
  const strategyInput = document.getElementById('strategy-input');
  const submitBtn = document.getElementById('submit-btn');
  const errorMsg = document.getElementById('error-message');
  const loadingDiv = document.getElementById('loading');
  const resultsDiv = document.getElementById('results');
  const urlContainer = document.getElementById('analyzed-url-container');

  const topAuthBtn = document.getElementById('top-auth-btn');
  const topAuthStatusContainer = document.getElementById('top-auth-status-container');
  const topAuthStatus = document.getElementById('top-auth-status');
  const logoutBtn = document.getElementById('logout-btn');
  const gtmAuthMessage = document.getElementById('gtm-auth-message');

  const gtmUrlInput = document.getElementById('gtm-url-input');
  const gtmUrlApplyBtn = document.getElementById('gtm-url-apply-btn');
  const gtmUrlClearBtn = document.getElementById('gtm-url-clear-btn');
  const gtmUrlFeedback = document.getElementById('gtm-url-feedback');

  // Searchable Select Instances
  const accountSelect = new SearchableSelect({
    containerId: 'gtm-account-container',
    placeholder: 'Select Account',
    emptyMessage: 'No matching accounts found',
    onSelect: async (item) => {
      analysisForm.resetGtmCache();
      containerSelect.reset('Select Container');
      workspaceSelect.reset('Select Workspace');
      analysisForm.validateForm();
      if (item) await fetchAndPopulateContainers(item.id, containerSelect, analysisForm.showError);
    }
  });

  const containerSelect = new SearchableSelect({
    containerId: 'gtm-container-container',
    placeholder: 'Select Container',
    emptyMessage: 'No matching containers found',
    onSelect: async (item) => {
      const accountId = accountSelect.getValue();
      analysisForm.resetGtmCache();
      workspaceSelect.reset('Select Workspace');
      analysisForm.validateForm();
      if (item && accountId) {
        await fetchAndPopulateWorkspaces(accountId, item.id, workspaceSelect, analysisForm.showError);
      }
    }
  });

  const workspaceSelect = new SearchableSelect({
    containerId: 'gtm-workspace-container',
    placeholder: 'Select Workspace',
    emptyMessage: 'No matching workspaces found',
    onSelect: () => {
      analysisForm.resetGtmCache();
      analysisForm.validateForm();
    }
  });

  // Auth UI Controller
  const authUI = initAuthUI({
    topAuthBtn,
    topAuthStatusContainer,
    topAuthStatus,
    logoutBtn,
    gtmAuthMessage,
    onError: (msg) => analysisForm.showError(msg),
    onAuthStateChange: async ({ isAuthenticated }) => {
      if (isAuthenticated) {
        await fetchAndPopulateAccounts(accountSelect, analysisForm.showError);
      } else {
        accountSelect.reset('Select Account');
        containerSelect.reset('Select Container');
        workspaceSelect.reset('Select Workspace');
        analysisForm.resetGtmCache();
      }
      analysisForm.validateForm();
    }
  });

  // Analysis Form Controller
  const analysisForm = initAnalysisForm({
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
    getIsAuthenticated: () => authUI.getIsAuthenticated()
  });

  // GTM Quick URL Input Events
  if (gtmUrlApplyBtn) {
    gtmUrlApplyBtn.addEventListener('click', () => {
      handleApplyGtmUrl({
        urlStr: gtmUrlInput.value.trim(),
        accountSelect,
        containerSelect,
        workspaceSelect,
        feedbackEl: gtmUrlFeedback,
        applyBtn: gtmUrlApplyBtn,
        onSuccess: () => analysisForm.validateForm()
      });
    });
  }

  if (gtmUrlInput) {
    gtmUrlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        gtmUrlApplyBtn?.click();
      }
    });

    gtmUrlInput.addEventListener('input', (e) => {
      const hasVal = Boolean(e.target.value.trim());
      gtmUrlClearBtn?.classList.toggle('hidden', !hasVal);
      if (!hasVal) gtmUrlFeedback?.classList.add('hidden');
    });

    gtmUrlInput.addEventListener('paste', () => {
      setTimeout(() => gtmUrlApplyBtn?.click(), 100);
    });
  }

  if (gtmUrlClearBtn) {
    gtmUrlClearBtn.addEventListener('click', () => {
      gtmUrlInput.value = '';
      gtmUrlClearBtn.classList.add('hidden');
      gtmUrlFeedback?.classList.add('hidden');
    });
  }

  // Initial account fetch
  fetchAndPopulateAccounts(accountSelect);
});
