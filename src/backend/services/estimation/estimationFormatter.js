/**
 * Formats estimation result payloads.
 */

const buildRange = (curr, likelyEst, factor = 0.5) => {
  if (typeof curr !== 'number' || typeof likelyEst !== 'number') {
    return { conservative: curr, likely: curr, optimistic: curr };
  }
  const delta = Math.max(0, curr - likelyEst);
  return {
    conservative: Number((curr - delta * factor).toFixed(2)),
    likely: Number(likelyEst.toFixed(2)),
    optimistic: Number((curr - delta * (1 + (1 - factor))).toFixed(2))
  };
};

const calcPct = (curr, est) => {
  if (typeof curr !== 'number' || typeof est !== 'number' || curr === 0) return 0;
  return Number((((curr - est) / curr) * 100).toFixed(2));
};

function formatEstimationPayload(params) {
  const {
    normalizedLhr,
    tagClassification,
    workload,
    rawMetrics,
    currentScore,
    estimatedFcp,
    estimatedSi,
    estimatedLcp,
    estimatedTbt,
    inpProjection,
    scoreProj,
    heuristicsApplied
  } = params;

  const attributable = workload.totalRemovable;

  return {
    formFactor: normalizedLhr.formFactor || 'mobile',
    lighthouseVersion: normalizedLhr.lighthouseVersion,
    confidence: workload.confidence,
    heuristicsApplied,
    warnings: [...normalizedLhr.warnings, ...(scoreProj.warning ? [scoreProj.warning] : [])],
    tagInventory: {
      totalTags: tagClassification.totalTags || 0,
      tiers: tagClassification.summary || { removable: 0, lighterPayload: 0, cannotMove: 0, obsolete: 0 },
      removableVendors: tagClassification.removableVendors || []
    },
    workloadSavings: {
      transferSizeKb: { current: Number((workload.gtmCore.transferSize / 1024).toFixed(2)), likelySavings: Number((attributable.transferSize / 1024).toFixed(2)) },
      mainThreadTimeMs: { current: Number(workload.gtmCore.mainThreadTimeMs.toFixed(2)), likelySavings: Number(attributable.mainThreadTimeMs.toFixed(2)) },
      bootupTimeMs: { current: Number(workload.gtmCore.bootupTimeMs.toFixed(2)), likelySavings: Number(attributable.bootupTimeMs.toFixed(2)) }
    },
    metrics: {
      coreWebVitals: {
        lcp: { name: 'Largest Contentful Paint', isLab: true, unit: 'ms', current: rawMetrics.lcp, estimated: estimatedLcp, ranges: buildRange(rawMetrics.lcp, estimatedLcp), pctChange: calcPct(rawMetrics.lcp, estimatedLcp) },
        cls: { name: 'Cumulative Layout Shift', isLab: true, unit: '', current: rawMetrics.cls, estimated: rawMetrics.cls, ranges: buildRange(rawMetrics.cls, rawMetrics.cls), pctChange: 0 },
        inp: inpProjection
      },
      labMetrics: {
        tbt: { name: 'Total Blocking Time', unit: 'ms', current: rawMetrics.tbt, estimated: estimatedTbt, ranges: buildRange(rawMetrics.tbt, estimatedTbt), pctChange: calcPct(rawMetrics.tbt, estimatedTbt) },
        speedIndex: { name: 'Speed Index', unit: 'ms', current: rawMetrics.si, estimated: estimatedSi, ranges: buildRange(rawMetrics.si, estimatedSi), pctChange: calcPct(rawMetrics.si, estimatedSi) },
        fcp: { name: 'First Contentful Paint', unit: 'ms', current: rawMetrics.fcp, estimated: estimatedFcp, ranges: buildRange(rawMetrics.fcp, estimatedFcp), pctChange: calcPct(rawMetrics.fcp, estimatedFcp) },
        ttfb: { name: 'Time to First Byte', unit: 'ms', current: rawMetrics.ttfb, estimated: rawMetrics.ttfb, ranges: null, pctChange: 0 }
      }
    },
    performanceScore: {
      current: currentScore,
      projected: scoreProj.projectedScore,
      deltaPoints: scoreProj.deltaScore,
      status: scoreProj.status,
      method: scoreProj.method,
      baselineValidation: scoreProj.baselineValidation
    },
    current: {
      performanceScore: currentScore,
      gtmTransferSize: Number((workload.gtmCore.transferSize / 1024).toFixed(2)),
      gtmMainThreadTime: Number(workload.gtmCore.mainThreadTimeMs.toFixed(2)),
      gtmBootupTime: Number(workload.gtmCore.bootupTimeMs.toFixed(2)),
      tbt: rawMetrics.tbt,
      speedIndex: rawMetrics.si,
      lcp: rawMetrics.lcp,
      cls: rawMetrics.cls,
      inp: normalizedLhr.cruxInp?.value ?? null,
      ttfb: rawMetrics.ttfb,
      fcp: rawMetrics.fcp
    },
    estimated: {
      performanceScore: scoreProj.projectedScore,
      gtmTransferSize: Number(Math.max(0, (workload.gtmCore.transferSize - attributable.transferSize) / 1024).toFixed(2)),
      gtmMainThreadTime: Number(Math.max(0, workload.gtmCore.mainThreadTimeMs - attributable.mainThreadTimeMs).toFixed(2)),
      gtmBootupTime: Number(Math.max(0, workload.gtmCore.bootupTimeMs - attributable.bootupTimeMs).toFixed(2)),
      tbt: estimatedTbt,
      speedIndex: estimatedSi,
      lcp: estimatedLcp,
      cls: rawMetrics.cls,
      inp: inpProjection?.likely ?? null,
      ttfb: rawMetrics.ttfb,
      fcp: estimatedFcp
    },
    change: {
      gtmTransferSize: { absolute: Number((attributable.transferSize / 1024).toFixed(2)), percentage: calcPct(workload.gtmCore.transferSize, workload.gtmCore.transferSize - attributable.transferSize) },
      gtmMainThreadTime: { absolute: Number(attributable.mainThreadTimeMs.toFixed(2)), percentage: calcPct(workload.gtmCore.mainThreadTimeMs, workload.gtmCore.mainThreadTimeMs - attributable.mainThreadTimeMs) },
      gtmBootupTime: { absolute: Number(attributable.bootupTimeMs.toFixed(2)), percentage: calcPct(workload.gtmCore.bootupTimeMs, workload.gtmCore.bootupTimeMs - attributable.bootupTimeMs) },
      tbt: { absolute: typeof rawMetrics.tbt === 'number' && typeof estimatedTbt === 'number' ? Number((rawMetrics.tbt - estimatedTbt).toFixed(2)) : null, percentage: calcPct(rawMetrics.tbt, estimatedTbt) },
      speedIndex: { absolute: typeof rawMetrics.si === 'number' && typeof estimatedSi === 'number' ? Number((rawMetrics.si - estimatedSi).toFixed(2)) : null, percentage: calcPct(rawMetrics.si, estimatedSi) },
      inp: { absolute: typeof rawMetrics.inp === 'number' && inpProjection?.likely ? Number((rawMetrics.inp - inpProjection.likely).toFixed(2)) : null, percentage: typeof rawMetrics.inp === 'number' && inpProjection?.likely ? calcPct(rawMetrics.inp, inpProjection.likely) : null },
      lcp: { absolute: typeof rawMetrics.lcp === 'number' && typeof estimatedLcp === 'number' ? Number((rawMetrics.lcp - estimatedLcp).toFixed(2)) : null, percentage: calcPct(rawMetrics.lcp, estimatedLcp) },
      cls: { absolute: 0, percentage: 0 },
      fcp: { absolute: typeof rawMetrics.fcp === 'number' && typeof estimatedFcp === 'number' ? Number((rawMetrics.fcp - estimatedFcp).toFixed(2)) : null, percentage: calcPct(rawMetrics.fcp, estimatedFcp) },
      ttfb: { absolute: 0, percentage: 0 },
      performanceScore: { points: scoreProj.deltaScore ?? '—', status: scoreProj.status, method: scoreProj.method, estimatedValue: scoreProj.projectedScore, currentValue: currentScore }
    },
    migrationOpportunity: {
      totalTags: tagClassification.totalTags || 0,
      migratableTags: tagClassification.summary?.removable || 0,
      coverage: tagClassification.totalTags > 0 ? Number(((tagClassification.summary.removable / tagClassification.totalTags) * 100).toFixed(2)) : 0
    },
    methodology: {
      confidence: workload.confidence,
      varianceNotice: 'Lighthouse lab audits exhibit inherent run-to-run variance. Model outputs are modeled projections.',
      heuristics: heuristicsApplied
    }
  };
}

module.exports = { formatEstimationPayload };
