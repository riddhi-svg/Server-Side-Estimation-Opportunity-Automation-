import { ParsedGtmUrl } from '../types/gtm.types';

export function parseGtmUrl(urlStr: string): ParsedGtmUrl | null {
  if (!urlStr || typeof urlStr !== 'string') return null;
  const str = urlStr.trim();

  const accountMatch = str.match(/accounts\/(\d+)/i);
  const containerMatch = str.match(/containers\/(\d+)/i);
  const workspaceMatch = str.match(/workspaces\/(\d+)/i);

  if (!accountMatch && !containerMatch) return null;

  return {
    accountId: accountMatch ? accountMatch[1] : null,
    containerId: containerMatch ? containerMatch[1] : null,
    workspaceId: workspaceMatch ? workspaceMatch[1] : null
  };
}
