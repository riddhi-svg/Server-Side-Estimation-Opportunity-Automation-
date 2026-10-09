import { GtmTagsResult } from '../types/gtm.types';
import { AnalyzeResponse } from '../types/report.types';

export function buildCompactGtmPayload(gtmResult: GtmTagsResult | null): any {
  if (!gtmResult) return null;
  const compact: any = {
    totalTags: gtmResult.totalTags ?? gtmResult.summary?.totalTags ?? 0,
    removableVendors: gtmResult.removableVendors || gtmResult.summary?.removableVendors || [],
    summary: gtmResult.summary,
    tags: {},
    tagsByTier: gtmResult.tagsByTier || {}
  };

  if (gtmResult.tags) {
    for (const cat in gtmResult.tags) {
      compact.tags[cat] = gtmResult.tags[cat].map((t) => ({
        id: t.id || t.tagId,
        name: t.name,
        category: t.category,
        type: t.type,
        tier: t.tier,
        savingsTier: t.savingsTier,
        isRemovable: t.isRemovable,
        originalData: t.originalData || t
      }));
    }
  }

  return compact;
}


export async function runAnalysis(
  url: string,
  strategy: 'mobile' | 'desktop' | 'both',
  gtmResult: GtmTagsResult | null
): Promise<AnalyzeResponse> {
  const compactGtm = buildCompactGtmPayload(gtmResult);

  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, strategy, gtmTagsResult: compactGtm })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to generate performance analysis report.');
  }

  return data;
}

export async function dispatchReportEmail(
  url: string,
  strategy: string,
  finalResult: any,
  toEmail = 'jimit@tatvic.com',
  ccEmail = ''
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const res = await fetch('/api/analyze/email-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, strategy, finalResult, to: toEmail, cc: ccEmail })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to dispatch report email.');
  }

  return data;
}

