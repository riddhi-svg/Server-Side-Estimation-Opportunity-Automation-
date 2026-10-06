/**
 * Workload Aggregator
 * Aggregates transfer sizes, main thread times, bootup times, and GTM allocation heuristics.
 */

const { normalizeUrl, attributeScriptUrl } = require('./scriptAttributor');

function aggregateWorkload(normalizedLhr, gtmTagClassification = {}, options = {}) {
  const removableVendors = gtmTagClassification.removableVendors || [];
  const totalTags = gtmTagClassification.totalTags || 0;
  const removableTagsCount = gtmTagClassification.summary?.removable || 0;

  const defaultAllocation = totalTags > 0 ? Math.min(1.0, removableTagsCount / totalTags) : 0;
  const gtmAllocationFraction = typeof options.gtmAllocationFraction === 'number'
    ? options.gtmAllocationFraction
    : defaultAllocation;

  let directRemovableTransferSize = 0;
  let directRemovableMainThreadTime = 0;
  let directRemovableBootupTime = 0;
  let directRemovableTbtImpact = 0;

  let gtmCoreTransferSize = 0;
  let gtmCoreMainThreadTime = 0;
  let gtmCoreBootupTime = 0;
  let gtmCoreTbtImpact = 0;

  let totalPageMainThreadTime = 0;
  const attributedScripts = [];

  if (normalizedLhr.mainThreadWork?.length > 0) {
    totalPageMainThreadTime = normalizedLhr.mainThreadWork.reduce((sum, item) => sum + (item.timeSpentMs || 0), 0);
  }

  const bootupMap = new Map();
  normalizedLhr.bootup?.forEach(b => {
    bootupMap.set(normalizeUrl(b.url), b);
  });

  const processedUrls = new Set();

  normalizedLhr.thirdParties?.forEach(tp => {
    tp.subItems?.forEach(sub => {
      const norm = normalizeUrl(sub.url);
      if (processedUrls.has(norm)) return;
      processedUrls.add(norm);

      const attr = attributeScriptUrl(sub.url, tp.entity, removableVendors);
      const bootupData = bootupMap.get(norm);

      const transferSize = sub.transferSize || 0;
      const mainThreadTime = sub.mainThreadTimeMs || (bootupData?.totalCpuTimeMs || 0);
      const bootupTime = bootupData?.totalCpuTimeMs || mainThreadTime;
      const tbtImpact = bootupData?.tbtImpactMs || (mainThreadTime > 50 ? mainThreadTime - 50 : 0);

      if (attr.isGtmCore) {
        gtmCoreTransferSize += transferSize;
        gtmCoreMainThreadTime += mainThreadTime;
        gtmCoreBootupTime += bootupTime;
        gtmCoreTbtImpact += tbtImpact;
      } else if (attr.isRemovable) {
        directRemovableTransferSize += transferSize;
        directRemovableMainThreadTime += mainThreadTime;
        directRemovableBootupTime += bootupTime;
        directRemovableTbtImpact += tbtImpact;
      }

      attributedScripts.push({
        url: sub.url,
        vendor: attr.vendor,
        tier: attr.tier,
        isRemovable: attr.isRemovable,
        isGtmCore: attr.isGtmCore,
        transferSize,
        mainThreadTime,
        bootupTime,
        tbtImpact,
        confidence: attr.confidence
      });
    });
  });

  normalizedLhr.bootup?.forEach(b => {
    const norm = normalizeUrl(b.url);
    if (!processedUrls.has(norm)) {
      processedUrls.add(norm);
      const attr = attributeScriptUrl(b.url, '', removableVendors);
      const mainThreadTime = b.totalCpuTimeMs || 0;
      const tbtImpact = b.tbtImpactMs || (mainThreadTime > 50 ? mainThreadTime - 50 : 0);

      if (attr.isGtmCore) {
        gtmCoreMainThreadTime += mainThreadTime;
        gtmCoreBootupTime += b.totalCpuTimeMs;
        gtmCoreTbtImpact += tbtImpact;
      } else if (attr.isRemovable) {
        directRemovableMainThreadTime += mainThreadTime;
        directRemovableBootupTime += b.totalCpuTimeMs;
        directRemovableTbtImpact += tbtImpact;
      }

      attributedScripts.push({
        url: b.url,
        vendor: attr.vendor,
        tier: attr.tier,
        isRemovable: attr.isRemovable,
        isGtmCore: attr.isGtmCore,
        transferSize: 0,
        mainThreadTime,
        bootupTime: b.totalCpuTimeMs,
        tbtImpact,
        confidence: attr.confidence
      });
    }
  });

  if (totalPageMainThreadTime <= 0) {
    totalPageMainThreadTime = attributedScripts.reduce((sum, s) => sum + s.mainThreadTime, 0);
  }

  const gtmAllocatedMainThreadTime = gtmCoreMainThreadTime * gtmAllocationFraction;
  const gtmAllocatedBootupTime = gtmCoreBootupTime * gtmAllocationFraction;
  const gtmAllocatedTbtImpact = gtmCoreTbtImpact * gtmAllocationFraction;
  const gtmAllocatedTransferSize = gtmCoreTransferSize * gtmAllocationFraction * 0.20;

  const totalRemovableTransferSize = directRemovableTransferSize + gtmAllocatedTransferSize;
  const totalRemovableMainThreadTime = directRemovableMainThreadTime + gtmAllocatedMainThreadTime;
  const totalRemovableBootupTime = directRemovableBootupTime + gtmAllocatedBootupTime;
  const totalRemovableTbtImpact = directRemovableTbtImpact + gtmAllocatedTbtImpact;

  let overallConfidence = 'medium';
  if (directRemovableMainThreadTime > 0 && directRemovableMainThreadTime >= 0.70 * totalRemovableMainThreadTime) {
    overallConfidence = 'high';
  } else if (gtmAllocatedMainThreadTime > 0.70 * totalRemovableMainThreadTime && totalRemovableMainThreadTime > 0) {
    overallConfidence = 'low';
  } else if (totalRemovableMainThreadTime === 0) {
    overallConfidence = 'high';
  }

  return {
    directRemovable: {
      transferSize: directRemovableTransferSize,
      mainThreadTimeMs: directRemovableMainThreadTime,
      bootupTimeMs: directRemovableBootupTime,
      tbtImpactMs: directRemovableTbtImpact
    },
    gtmCore: {
      transferSize: gtmCoreTransferSize,
      mainThreadTimeMs: gtmCoreMainThreadTime,
      bootupTimeMs: gtmCoreBootupTime,
      tbtImpactMs: gtmCoreTbtImpact
    },
    gtmAllocated: {
      allocationFraction: gtmAllocationFraction,
      transferSize: gtmAllocatedTransferSize,
      mainThreadTimeMs: gtmAllocatedMainThreadTime,
      bootupTimeMs: gtmAllocatedBootupTime,
      tbtImpactMs: gtmAllocatedTbtImpact
    },
    totalRemovable: {
      transferSize: totalRemovableTransferSize,
      mainThreadTimeMs: totalRemovableMainThreadTime,
      bootupTimeMs: totalRemovableBootupTime,
      tbtImpactMs: totalRemovableTbtImpact
    },
    totalPageMainThreadTimeMs: totalPageMainThreadTime,
    confidence: overallConfidence,
    attributedScripts
  };
}

module.exports = { aggregateWorkload };
