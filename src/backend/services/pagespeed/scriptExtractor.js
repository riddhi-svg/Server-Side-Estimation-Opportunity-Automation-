/**
 * Extracts third-party scripts, bootup times, and mainthread work breakdown from Lighthouse audits.
 */

function normalizeUrl(url) {
  if (!url) return '';
  let norm = url.replace(/%20/g, '').replace(/ /g, '');
  if (norm.endsWith('/')) norm = norm.slice(0, -1);
  return norm;
}

function extractScriptInventory(audits, targetUrl) {
  let targetDomain = '';
  try {
    targetDomain = new URL(targetUrl).hostname.replace(/^www\./, '');
  } catch { }

  const scriptMap = new Map();

  const addScriptInfo = (url, evidenceObj, entityInfo = null, transferSize = null) => {
    if (!url || url.startsWith('chrome-extension://')) return;
    const norm = normalizeUrl(url);

    let hostname = '';
    try {
      hostname = new URL(norm).hostname;
    } catch { return; }

    const isThirdParty = !hostname.replace(/^www\./, '').includes(targetDomain);

    if (!scriptMap.has(norm)) {
      scriptMap.set(norm, {
        url: norm,
        originalUrl: url,
        hostname,
        isThirdParty,
        vendor: typeof entityInfo === 'object' ? (entityInfo?.text || 'Unknown') : (entityInfo || 'Unknown'),
        transferSize: transferSize || 0,
        mainThreadTimeMs: null,
        bootupTimeMs: null,
        evidence: []
      });
    }

    const entry = scriptMap.get(norm);
    if (entityInfo && entry.vendor === 'Unknown') {
      entry.vendor = typeof entityInfo === 'object' ? (entityInfo?.text || 'Unknown') : entityInfo;
    }
    if (transferSize !== null && entry.transferSize === 0) {
      entry.transferSize = transferSize;
    }
    if (evidenceObj) {
      const existing = entry.evidence.find(e => e.type === evidenceObj.type);
      if (!existing) {
        entry.evidence.push(evidenceObj);
      } else {
        if (evidenceObj.durationMs) existing.durationMs = (existing.durationMs || 0) + evidenceObj.durationMs;
        if (evidenceObj.totalCpuTimeMs) existing.totalCpuTimeMs = (existing.totalCpuTimeMs || 0) + evidenceObj.totalCpuTimeMs;
        if (evidenceObj.wastedMs) existing.wastedMs = (existing.wastedMs || 0) + evidenceObj.wastedMs;
      }
    }
  };

  // 1. Network Requests
  audits['network-requests']?.details?.items?.forEach(item => {
    if (item.resourceType === 'Script' || item.mimeType === 'application/javascript' || item.url.includes('.js') || item.url.includes('gtm') || item.url.includes('gtag')) {
      addScriptInfo(item.url, null, item.entity, item.transferSize);
    }
  });

  // 2. Third-Party Summary & Insights
  const tpAudit = audits['third-parties-insight'] || audits['third-party-summary'];
  tpAudit?.details?.items?.forEach(item => {
    const vendor = typeof item.entity === 'object' ? (item.entity?.text || 'Unknown') : (item.entity || 'Unknown');
    item.subItems?.items?.forEach(sub => {
      addScriptInfo(sub.url, { type: 'third-party', mainThreadTimeMs: sub.mainThreadTime || sub.blockingTime || 0 }, vendor, sub.transferSize);
      const entry = scriptMap.get(normalizeUrl(sub.url));
      if (entry) entry.mainThreadTimeMs = sub.mainThreadTime || sub.blockingTime || 0;
    });
  });

  // 3. Bootup Time
  const bootupTimes = [];
  audits['bootup-time']?.details?.items?.forEach(item => {
    bootupTimes.push({
      url: item.url,
      totalCpuTime: item.total || 0,
      scriptParseCompileTime: item.scripting || item.scriptParseCompile || 0
    });
    if (item.total > 0) {
      addScriptInfo(item.url, { type: 'bootup-time', totalCpuTimeMs: item.total });
      const entry = scriptMap.get(normalizeUrl(item.url));
      if (entry) entry.bootupTimeMs = item.total;
    }
  });

  // 4. Main Thread Breakdown
  const mainthreadBreakdown = audits['mainthread-work-breakdown']?.details?.items?.map(item => ({
    category: item.groupLabel || item.group || 'Unknown',
    timeSpentMs: item.duration || 0
  })) || [];

  // 5. Long Tasks
  audits['long-tasks']?.details?.items?.forEach(item => {
    addScriptInfo(item.url, { type: 'long-task', durationMs: item.duration });
  });

  // 6. Render Blocking Resources
  const rbAudit = audits['render-blocking-insight'] || audits['render-blocking-resources'];
  rbAudit?.details?.items?.forEach(item => {
    addScriptInfo(item.url, { type: 'render-blocking', wastedMs: item.wastedMs || item.metricSavings?.FCP || 0 });
  });

  const allScripts = Array.from(scriptMap.values()).filter(s => s.isThirdParty);

  // Baseline GTM calculation
  const gtmBaseline = {
    gtmTransferSize: 0,
    gtmMainThreadTimeMs: 0,
    gtmBootupTimeMs: 0,
    gtmResourceCount: 0,
    gtmResources: []
  };

  const inventory = allScripts.map(script => {
    let attributionStatus = 'DIRECT_THIRD_PARTY';
    const uLow = script.url.toLowerCase();

    if (uLow.includes('googletagmanager.com/gtm.js') || uLow.includes('googletagmanager.com/gtag/js')) {
      attributionStatus = 'GTM_CORE';
      gtmBaseline.gtmResourceCount++;
      gtmBaseline.gtmTransferSize += script.transferSize || 0;
      gtmBaseline.gtmMainThreadTimeMs += script.mainThreadTimeMs || 0;
      gtmBaseline.gtmBootupTimeMs += script.bootupTimeMs || 0;
      gtmBaseline.gtmResources.push({
        url: script.url,
        transferSize: script.transferSize,
        mainThreadTimeMs: script.mainThreadTimeMs,
        bootupTimeMs: script.bootupTimeMs
      });
    }

    return {
      vendor: script.vendor,
      url: script.originalUrl,
      hostname: script.hostname,
      isThirdParty: script.isThirdParty,
      attributionStatus,
      transferSize: script.transferSize,
      mainThreadTimeMs: script.mainThreadTimeMs,
      bootupTimeMs: script.bootupTimeMs,
      evidence: script.evidence
    };
  });

  return {
    entities: inventory,
    bootupTimes,
    mainthreadBreakdown,
    gtmPerformanceBaseline: gtmBaseline
  };
}

module.exports = {
  normalizeUrl,
  extractScriptInventory
};
