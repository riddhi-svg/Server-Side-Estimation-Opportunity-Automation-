import { GtmTagsResult } from '../types/gtm.types';
import { AnalyzeResponse } from '../types/report.types';

export function buildCompactGtmPayload(gtmResult: GtmTagsResult | null): any {
  if (!gtmResult) return null;
  const compact: any = {
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
        isRemovable: t.isRemovable
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
