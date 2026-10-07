/**
 * Formats estimation result payloads.
 */

const { fmt2, buildRange, calcPct, buildTables } = require('./tableFormatter');

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
  const tiers = tagClassification.summary || { removable: 0, lighterPayload: 0, cannotMove: 0, obsolete: 0 };
  const totalTags = tagClassification.totalTags || 0;

  const { tables, workloadMetrics } = buildTables({
    tiers,
    workload,
    attributable,
    rawMetrics,
    estimatedFcp,
    estimatedSi,
    estimatedLcp,
    estimatedTbt,
    inpProjection,
    normalizedLhr
  });

  const {
    currentTransferKb,
    estimatedTransferKb,
    reductionTransferKb,
    currentCpuMs,
    estimatedCpuMs,
    reductionCpuMs,
    currentBootupMs,
    estimatedBootupMs,
    reductionBootupMs
  } = workloadMetrics;

  const confLevel = typeof workload.confidence === 'string'
    ? workload.confidence.toUpperCase()
    : (workload.confidence?.level || 'MEDIUM').toUpperCase();

  const confidenceObj = {
    level: confLevel,
    score: confLevel === 'HIGH' ? 0.9 : confLevel === 'LOW' ? 0.4 : 0.7,
    reasons: Array.isArray(workload.confidence?.reasons)
      ? workload.confidence.reasons
      : (Array.isArray(workload.confidenceReasons) ? workload.confidenceReasons : [])
  };

  return {
    formFactor: normalizedLhr.formFactor || 'mobile',
    lighthouseVersion: normalizedLhr.lighthouseVersion,
    confidence: confidenceObj,
    heuristicsApplied,
    warnings: [...normalizedLhr.warnings, ...(scoreProj.warning ? [scoreProj.warning] : [])],
    tagInventory: { totalTags, tiers, removableVendors: tagClassification.removableVendors || [] },
    workloadSavings: {
      transferSizeKb: { current: currentTransferKb, likelySavings: reductionTransferKb },
      mainThreadTimeMs: { current: currentCpuMs, likelySavings: reductionCpuMs },
      bootupTimeMs: { current: currentBootupMs, likelySavings: reductionBootupMs }
    },
    metrics: {
      coreWebVitals: {
        lcp: { name: 'Largest Contentful Paint', isLab: true, unit: 'ms', current: fmt2(rawMetrics.lcp), estimated: fmt2(estimatedLcp), ranges: buildRange(rawMetrics.lcp, estimatedLcp), pctChange: calcPct(rawMetrics.lcp, estimatedLcp) },
        cls: { name: 'Cumulative Layout Shift', isLab: true, unit: '', current: fmt2(rawMetrics.cls), estimated: fmt2(rawMetrics.cls), ranges: buildRange(rawMetrics.cls, rawMetrics.cls), pctChange: 0 },
        inp: inpProjection
      },
      labMetrics: {
        tbt: { name: 'Total Blocking Time', unit: 'ms', current: fmt2(rawMetrics.tbt), estimated: fmt2(estimatedTbt), ranges: buildRange(rawMetrics.tbt, estimatedTbt), pctChange: calcPct(rawMetrics.tbt, estimatedTbt) },
        speedIndex: { name: 'Speed Index', unit: 'ms', current: fmt2(rawMetrics.si), estimated: fmt2(estimatedSi), ranges: buildRange(rawMetrics.si, estimatedSi), pctChange: calcPct(rawMetrics.si, estimatedSi) },
        fcp: { name: 'First Contentful Paint', unit: 'ms', current: fmt2(rawMetrics.fcp), estimated: fmt2(estimatedFcp), ranges: buildRange(rawMetrics.fcp, estimatedFcp), pctChange: calcPct(rawMetrics.fcp, estimatedFcp) },
        ttfb: { name: 'Time to First Byte', unit: 'ms', current: fmt2(rawMetrics.ttfb), estimated: fmt2(rawMetrics.ttfb), ranges: null, pctChange: 0 }
      }
    },
    tables,
    performanceScore: {
      current: currentScore,
      projected: scoreProj.projectedScore,
      estimated: scoreProj.projectedScore,
      deltaPoints: scoreProj.deltaScore,
      status: scoreProj.status,
      method: scoreProj.method,
      confidence: confidenceObj,
      baselineValidation: scoreProj.baselineValidation
    },
    current: {
      performanceScore: currentScore,
      gtmTransferSize: currentTransferKb,
      gtmMainThreadTime: currentCpuMs,
      gtmBootupTime: currentBootupMs,
      tbt: fmt2(rawMetrics.tbt),
      speedIndex: fmt2(rawMetrics.si),
      lcp: fmt2(rawMetrics.lcp),
      cls: fmt2(rawMetrics.cls),
      inp: normalizedLhr.cruxInp?.value != null ? fmt2(normalizedLhr.cruxInp.value) : null,
      ttfb: fmt2(rawMetrics.ttfb),
      fcp: fmt2(rawMetrics.fcp)
    },
    estimated: {
      performanceScore: scoreProj.projectedScore,
      gtmTransferSize: estimatedTransferKb,
      gtmMainThreadTime: estimatedCpuMs,
      gtmBootupTime: estimatedBootupMs,
      tbt: fmt2(estimatedTbt),
      speedIndex: fmt2(estimatedSi),
      lcp: fmt2(estimatedLcp),
      cls: fmt2(rawMetrics.cls),
      inp: inpProjection?.likely != null ? fmt2(inpProjection.likely) : null,
      ttfb: fmt2(rawMetrics.ttfb),
      fcp: fmt2(estimatedFcp)
    },
    change: {
      gtmTransferSize: { absolute: reductionTransferKb, percentage: currentTransferKb > 0 ? fmt2((reductionTransferKb / currentTransferKb) * 100) : 0 },
      gtmMainThreadTime: { absolute: reductionCpuMs, percentage: currentCpuMs > 0 ? fmt2((reductionCpuMs / currentCpuMs) * 100) : 0 },
      gtmBootupTime: { absolute: reductionBootupMs, percentage: currentBootupMs > 0 ? fmt2((reductionBootupMs / currentBootupMs) * 100) : 0 },
      tbt: { absolute: typeof rawMetrics.tbt === 'number' && typeof estimatedTbt === 'number' ? fmt2(rawMetrics.tbt - estimatedTbt) : null, percentage: calcPct(rawMetrics.tbt, estimatedTbt) },
      speedIndex: { absolute: typeof rawMetrics.si === 'number' && typeof estimatedSi === 'number' ? fmt2(rawMetrics.si - estimatedSi) : null, percentage: calcPct(rawMetrics.si, estimatedSi) },
      inp: { absolute: typeof rawMetrics.inp === 'number' && inpProjection?.likely ? fmt2(rawMetrics.inp - inpProjection.likely) : null, percentage: typeof rawMetrics.inp === 'number' && inpProjection?.likely ? calcPct(rawMetrics.inp, inpProjection.likely) : null },
      lcp: { absolute: typeof rawMetrics.lcp === 'number' && typeof estimatedLcp === 'number' ? fmt2(rawMetrics.lcp - estimatedLcp) : null, percentage: calcPct(rawMetrics.lcp, estimatedLcp) },
      cls: { absolute: 0, percentage: 0 },
      fcp: { absolute: typeof rawMetrics.fcp === 'number' && typeof estimatedFcp === 'number' ? fmt2(rawMetrics.fcp - estimatedFcp) : null, percentage: calcPct(rawMetrics.fcp, estimatedFcp) },
      ttfb: { absolute: 0, percentage: 0 },
      performanceScore: { points: scoreProj.deltaScore ?? '—', status: scoreProj.status, method: scoreProj.method, estimatedValue: scoreProj.projectedScore, currentValue: currentScore }
    },
    migrationOpportunity: {
      totalTags,
      migratableTags: tiers.removable,
      coverage: totalTags > 0 ? fmt2((tiers.removable / totalTags) * 100) : 0
    },
    varianceNotice: {
      noticeText: 'Lighthouse lab audits exhibit inherent run-to-run variance. Model outputs are modeled projections.',
      modelAssumptions: [
        'Deterministic log-normal scoring curves matching Lighthouse v10–v13 source of truth.',
        'Speed Index alpha factor set to 0.50 (heuristic).',
        'INP estimation is proportional to main-thread execution relief (heuristic).'
      ],
      confidenceFactors: confidenceObj.reasons
    },
    methodology: {
      confidence: confidenceObj,
      varianceNotice: 'Lighthouse lab audits exhibit inherent run-to-run variance. Model outputs are modeled projections.',
      heuristics: heuristicsApplied
    }
  };
}

module.exports = { formatEstimationPayload };
