import { gtmFetch } from './firebase';
import { SelectItem, GtmTagsResult } from '../types/gtm.types';

export async function fetchAccounts(): Promise<SelectItem[]> {
  const res = await gtmFetch('/api/gtm/accounts');
  if (!res || !res.ok) {
    const errorData = res ? await res.json().catch(() => ({})) : {};
    throw new Error(errorData.error || 'Failed to load GTM accounts.');
  }
  const data = await res.json();
  return (data.account || []).map((acc: any) => ({
    id: acc.accountId,
    name: acc.name,
    value: acc.accountId
  }));
}

export async function fetchAccountById(accountId: string): Promise<SelectItem | null> {
  const res = await gtmFetch(`/api/gtm/accounts/${accountId}`);
  if (!res || !res.ok) return null;
  const acc = await res.json();
  return {
    id: acc.accountId,
    name: acc.name,
    value: acc.accountId
  };
}

export async function fetchContainers(accountId: string): Promise<SelectItem[]> {
  if (!accountId) return [];
  const res = await gtmFetch(`/api/gtm/accounts/${accountId}/containers`);
  if (!res || !res.ok) {
    const errorData = res ? await res.json().catch(() => ({})) : {};
    throw new Error(errorData.error || 'Failed to load containers.');
  }
  const data = await res.json();
  return (data.container || []).map((cont: any) => ({
    id: cont.containerId,
    name: cont.name,
    publicId: cont.publicId,
    value: cont.containerId
  }));
}

export async function fetchWorkspaces(accountId: string, containerId: string): Promise<SelectItem[]> {
  if (!accountId || !containerId) return [];
  const res = await gtmFetch(`/api/gtm/accounts/${accountId}/containers/${containerId}/workspaces`);
  if (!res || !res.ok) {
    const errorData = res ? await res.json().catch(() => ({})) : {};
    throw new Error(errorData.error || 'Failed to load workspaces.');
  }
  const data = await res.json();
  return (data.workspace || []).map((ws: any) => ({
    id: ws.workspaceId,
    name: ws.name,
    value: ws.workspaceId
  }));
}

export async function fetchContainerTags(
  accountId: string,
  containerId: string,
  workspaceId: string
): Promise<GtmTagsResult> {
  const res = await gtmFetch(`/api/gtm/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/tags`);
  if (!res || !res.ok) {
    const errorData = res ? await res.json().catch(() => ({})) : {};
    throw new Error(errorData.error || 'Failed to load GTM tags.');
  }
  return res.json();
}
