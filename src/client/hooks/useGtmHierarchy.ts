import { useState, useEffect, useCallback } from 'react';
import { SelectItem } from '../types/gtm.types';
import { 
  fetchAccounts, 
  fetchContainers, 
  fetchWorkspaces, 
  fetchAccountById 
} from '../services/gtmService';
import { parseGtmUrl } from '../utils/gtmUrlParser';

export function useGtmHierarchy(isAuthenticated: boolean) {
  const [accounts, setAccounts] = useState<SelectItem[]>([]);
  const [containers, setContainers] = useState<SelectItem[]>([]);
  const [workspaces, setWorkspaces] = useState<SelectItem[]>([]);

  const [selectedAccount, setSelectedAccount] = useState<SelectItem | null>(null);
  const [selectedContainer, setSelectedContainer] = useState<SelectItem | null>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState<SelectItem | null>(null);

  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingContainers, setLoadingContainers] = useState(false);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingAccounts(true);
    setError(null);
    try {
      const accs = await fetchAccounts();
      setAccounts(accs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingAccounts(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) loadAccounts();
    else {
      setAccounts([]);
      setContainers([]);
      setWorkspaces([]);
      setSelectedAccount(null);
      setSelectedContainer(null);
      setSelectedWorkspace(null);
    }
  }, [isAuthenticated, loadAccounts]);

  const selectAccount = useCallback(async (item: SelectItem | null) => {
    setSelectedAccount(item);
    setSelectedContainer(null);
    setSelectedWorkspace(null);
    setContainers([]);
    setWorkspaces([]);

    if (item) {
      setLoadingContainers(true);
      try {
        const conts = await fetchContainers(item.id);
        setContainers(conts);
        if (conts.length === 1) selectContainer(conts[0], item.id);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingContainers(false);
      }
    }
  }, []);

  const selectContainer = useCallback(async (item: SelectItem | null, accountIdOverride?: string) => {
    setSelectedContainer(item);
    setSelectedWorkspace(null);
    setWorkspaces([]);

    const accId = accountIdOverride || selectedAccount?.id;
    if (item && accId) {
      setLoadingWorkspaces(true);
      try {
        const wss = await fetchWorkspaces(accId, item.id);
        setWorkspaces(wss);
        if (wss.length === 1) setSelectedWorkspace(wss[0]);
        else if (wss.length > 1) {
          const defaultWs = wss.find(w => w.name?.toLowerCase().includes('default'));
          if (defaultWs) setSelectedWorkspace(defaultWs);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingWorkspaces(false);
      }
    }
  }, [selectedAccount]);

  const selectWorkspace = useCallback((item: SelectItem | null) => {
    setSelectedWorkspace(item);
  }, []);

  const applyGtmUrl = useCallback(async (urlStr: string) => {
    const parsed = parseGtmUrl(urlStr);
    if (!parsed || (!parsed.accountId && !parsed.containerId)) {
      throw new Error('Could not detect GTM Account or Container ID from the provided URL.');
    }

    let accItem = accounts.find(a => a.id === parsed.accountId);
    if (!accItem && parsed.accountId) {
      accItem = await fetchAccountById(parsed.accountId);
      if (accItem) setAccounts(prev => [accItem!, ...prev.filter(a => a.id !== accItem!.id)]);
    }

    if (accItem) setSelectedAccount(accItem);
    const targetAccId = accItem ? accItem.id : parsed.accountId;
    if (!targetAccId) throw new Error('Account ID could not be resolved.');

    const conts = await fetchContainers(targetAccId);
    setContainers(conts);
    const contItem = conts.find(c => c.id === parsed.containerId || c.publicId === parsed.containerId) || conts[0];
    if (contItem) setSelectedContainer(contItem);

    if (contItem) {
      const wss = await fetchWorkspaces(targetAccId, contItem.id);
      setWorkspaces(wss);
      const wsItem = wss.find(w => w.id === parsed.workspaceId) || wss.find(w => w.name?.toLowerCase().includes('default')) || wss[0];
      if (wsItem) setSelectedWorkspace(wsItem);
    }
  }, [accounts]);

  return {
    accounts,
    containers,
    workspaces,
    selectedAccount,
    selectedContainer,
    selectedWorkspace,
    loadingAccounts,
    loadingContainers,
    loadingWorkspaces,
    error,
    selectAccount,
    selectContainer,
    selectWorkspace,
    applyGtmUrl,
    loadAccounts
  };
}
