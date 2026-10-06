/**
 * GTM Cascading Dropdowns & Deep URL Auto-resolution
 */

import { gtmFetch } from '../firebase-config.js';
import { parseGtmUrl, showGtmUrlFeedback } from './gtm-url-parser.js';

export async function fetchAndPopulateAccounts(accountSelect, onError) {
  try {
    accountSelect.setLoading('Loading accounts...');
    const response = await gtmFetch('/api/gtm/accounts');
    if (!response) {
      accountSelect.reset('Select Account');
      return false;
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load GTM accounts.');

    const accounts = (data.account || []).map(acc => ({
      value: acc.accountId,
      id: acc.accountId,
      name: acc.name
    }));

    if (accounts.length > 0) {
      accountSelect.setItems(accounts);
      accountSelect.setDisabled(false);
      return true;
    } else {
      accountSelect.reset('No accounts found');
      return false;
    }
  } catch (error) {
    accountSelect.reset('Select Account');
    if (onError) onError(error.message);
    return false;
  }
}

export async function fetchAndPopulateContainers(accountId, containerSelect, onError) {
  if (!accountId) return;
  try {
    containerSelect.setLoading('Loading containers...');
    const response = await gtmFetch(`/api/gtm/accounts/${accountId}/containers`);
    if (!response) return;
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load GTM containers.');

    const containers = (data.container || []).map(cont => ({
      value: cont.containerId,
      id: cont.containerId,
      name: cont.name,
      publicId: cont.publicId
    }));

    containerSelect.setItems(containers, true);
    containerSelect.setDisabled(false);
    return containers;
  } catch (error) {
    containerSelect.reset('Select Container');
    if (onError) onError(error.message);
  }
}

export async function fetchAndPopulateWorkspaces(accountId, containerId, workspaceSelect, onError) {
  if (!accountId || !containerId) return;
  try {
    workspaceSelect.setLoading('Loading workspaces...');
    const response = await gtmFetch(`/api/gtm/accounts/${accountId}/containers/${containerId}/workspaces`);
    if (!response) return;
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load GTM workspaces.');

    const workspaces = (data.workspace || []).map(ws => ({
      value: ws.workspaceId,
      id: ws.workspaceId,
      name: ws.name
    }));

    workspaceSelect.setItems(workspaces);
    workspaceSelect.setDisabled(false);

    if (workspaces.length === 1) {
      workspaceSelect.select(workspaces[0]);
    } else if (workspaces.length > 1) {
      const defaultWs = workspaces.find(w => w.name && w.name.toLowerCase().includes('default'));
      if (defaultWs) workspaceSelect.select(defaultWs);
    }
    return workspaces;
  } catch (error) {
    workspaceSelect.reset('Select Workspace');
    if (onError) onError(error.message);
  }
}

export async function handleApplyGtmUrl({
  urlStr,
  accountSelect,
  containerSelect,
  workspaceSelect,
  feedbackEl,
  applyBtn,
  onSuccess
}) {
  if (!urlStr) {
    showGtmUrlFeedback(feedbackEl, 'Please paste a valid GTM URL.', 'error');
    return;
  }
  const parsed = parseGtmUrl(urlStr);
  if (!parsed || (!parsed.accountId && !parsed.containerId)) {
    showGtmUrlFeedback(feedbackEl, 'Could not detect Account or Container ID in the URL.', 'error');
    return;
  }

  showGtmUrlFeedback(feedbackEl, '⏳ Fetching GTM details from URL...', 'loading');
  if (applyBtn) applyBtn.disabled = true;

  try {
    let selectedAcc = accountSelect.items.find(a => String(a.id) === String(parsed.accountId));
    if (!selectedAcc && parsed.accountId) {
      const accRes = await gtmFetch(`/api/gtm/accounts/${parsed.accountId}`);
      if (accRes?.ok) {
        const accData = await accRes.json();
        selectedAcc = { value: accData.accountId, id: accData.accountId, name: accData.name };
        accountSelect.setItems([selectedAcc, ...accountSelect.items]);
      }
    }
    if (selectedAcc) accountSelect.select(selectedAcc, false);
    const accId = selectedAcc ? selectedAcc.id : accountSelect.getValue();

    const containers = await fetchAndPopulateContainers(accId, containerSelect);
    let selectedCont = containers?.find(c => c.id === parsed.containerId || c.publicId === parsed.containerId) || containers?.[0];
    if (selectedCont) containerSelect.select(selectedCont, false);

    const contId = selectedCont?.id || containerSelect.getValue();
    const workspaces = await fetchAndPopulateWorkspaces(accId, contId, workspaceSelect);
    let selectedWs = workspaces?.find(w => w.id === parsed.workspaceId) || workspaces?.find(w => w.name.toLowerCase().includes('default')) || workspaces?.[0];
    if (selectedWs) workspaceSelect.select(selectedWs, false);

    showGtmUrlFeedback(feedbackEl, `✓ Configured: ${selectedAcc?.name || accId} • ${selectedCont?.name || contId} • ${selectedWs?.name || 'Workspace'}`, 'success');
    if (onSuccess) onSuccess();
  } catch (err) {
    showGtmUrlFeedback(feedbackEl, `Failed to configure: ${err.message}`, 'error');
  } finally {
    if (applyBtn) applyBtn.disabled = false;
  }
}
