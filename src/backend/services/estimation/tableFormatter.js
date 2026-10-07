/**
 * Table Formatter for estimation tables and metric strings.
 */

const fmt2 = (val) => {
  if (val === null || val === undefined || isNaN(Number(val))) return '—';
  return Number(Number(val).toFixed(2));
};

const fmtMs = (val) => {
  if (val === null || val === undefined || isNaN(Number(val))) return '—';
  return `${Number(Number(val).toFixed(2))} ms`;
};

const fmtCls = (val) => {
  if (val === null || val === undefined || isNaN(Number(val))) return '—';
  return Number(Number(val).toFixed(2)).toString();
};

const fmtRange = (curr, est, isCls = false) => {
  if (curr === null || curr === undefined || isNaN(Number(curr))) return '—';
  if (est === null || est === undefined || isNaN(Number(est))) return '—';
  const c = Number(curr);
  const e = Number(est);
  if (isCls) return fmtCls(e);
  if (Math.abs(c - e) < 0.01) return fmtMs(e);
  const mid = c - (c - e) * 0.5;
  return `${Number(mid.toFixed(2))} - ${Number(e.toFixed(2))} ms`;
};

const fmtImp = (curr, est, isCls = false) => {
  if (curr === null || curr === undefined || isNaN(Number(curr))) return '—';
  if (est === null || est === undefined || isNaN(Number(est))) return '—';
  const delta = Number(curr) - Number(est);
  if (Math.abs(delta) < 0.01) return isCls ? '0' : '0 ms';
  return isCls ? `-${Number(delta.toFixed(2))}` : `-${Number(delta.toFixed(2))} ms`;
};

const buildRange = (curr, likelyEst, factor = 0.5) => {
  if (typeof curr !== 'number' || typeof likelyEst !== 'number') {
    return { conservative: curr, likely: curr, optimistic: curr };
  }
  const delta = Math.max(0, curr - likelyEst);
  return {
    conservative: fmt2(curr - delta * factor),
    likely: fmt2(likelyEst),
    optimistic: fmt2(curr - delta * (1 + (1 - factor)))
  };
};

const calcPct = (curr, est) => {
  if (typeof curr !== 'number' || typeof est !== 'number' || curr === 0) return 0;
  return fmt2(((curr - est) / curr) * 100);
};

function buildTables(params) {
  const {
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
  } = params;

  const tagClassification = [
    { tier: 'Removable Client Libraries (Full Savings)', count: tiers.removable, description: 'Move to sGTM (CAPI / Server template)', savingsTier: 'High', colorClass: 'emerald' },
    { tier: 'Stays Client-Side (Lighter Payload)', count: tiers.lighterPayload, description: 'Consolidate transport to sGTM', savingsTier: 'Low', colorClass: 'blue' },
    { tier: 'DOM / Interactive (Cannot Move)', count: tiers.cannotMove, description: 'Must run on client browser', savingsTier: 'None', colorClass: 'amber' },
    { tier: 'Obsolete Legacy Tags (Delete Class)', count: tiers.obsolete, description: 'Delete obsolete tags from container', savingsTier: 'Delete', colorClass: 'rose' }
  ];

  const currentTransferKb = fmt2((workload.gtmCore.transferSize + attributable.transferSize) / 1024);
  const estimatedTransferKb = fmt2(workload.gtmCore.transferSize / 1024);
  const reductionTransferKb = fmt2(attributable.transferSize / 1024);

  const currentCpuMs = fmt2(workload.gtmCore.mainThreadTimeMs + attributable.mainThreadTimeMs);
  const estimatedCpuMs = fmt2(workload.gtmCore.mainThreadTimeMs);
  const reductionCpuMs = fmt2(attributable.mainThreadTimeMs);

  const currentBootupMs = fmt2(workload.gtmCore.bootupTimeMs + attributable.bootupTimeMs);
  const estimatedBootupMs = fmt2(workload.gtmCore.bootupTimeMs);
  const reductionBootupMs = fmt2(attributable.bootupTimeMs);

  const workloadReduction = [
    { metric: 'Data Downloaded by Browser', current: `${currentTransferKb} KB`, estimated: `${estimatedTransferKb} KB`, reduction: `${reductionTransferKb} KB`, reductionPercentage: currentTransferKb > 0 ? `${((reductionTransferKb / currentTransferKb) * 100).toFixed(1)}%` : '0%' },
    { metric: 'Browser Processing Time', current: `${currentCpuMs} ms`, estimated: `${estimatedCpuMs} ms`, reduction: `${reductionCpuMs} ms`, reductionPercentage: currentCpuMs > 0 ? `${((reductionCpuMs / currentCpuMs) * 100).toFixed(1)}%` : '0%' },
    { metric: 'JavaScript Loading & Setup Time', current: `${currentBootupMs} ms`, estimated: `${estimatedBootupMs} ms`, reduction: `${reductionBootupMs} ms`, reductionPercentage: currentBootupMs > 0 ? `${((reductionBootupMs / currentBootupMs) * 100).toFixed(1)}%` : '0%' }
  ];

  const labMetrics = [
    { metric: 'First Contentful Paint (FCP)', current: fmtMs(rawMetrics.fcp), estimated: fmtMs(estimatedFcp), range: fmtRange(rawMetrics.fcp, estimatedFcp), improvement: fmtImp(rawMetrics.fcp, estimatedFcp) },
    { metric: 'Speed Index (SI)', current: fmtMs(rawMetrics.si), estimated: fmtMs(estimatedSi), range: fmtRange(rawMetrics.si, estimatedSi), improvement: fmtImp(rawMetrics.si, estimatedSi), heuristic: 'Heuristic' },
    { metric: 'Largest Contentful Paint (LCP)', current: fmtMs(rawMetrics.lcp), estimated: fmtMs(estimatedLcp), range: fmtRange(rawMetrics.lcp, estimatedLcp), improvement: fmtImp(rawMetrics.lcp, estimatedLcp) },
    { metric: 'Total Blocking Time (TBT)', current: fmtMs(rawMetrics.tbt), estimated: fmtMs(estimatedTbt), range: fmtRange(rawMetrics.tbt, estimatedTbt), improvement: fmtImp(rawMetrics.tbt, estimatedTbt) },
    { metric: 'Cumulative Layout Shift (CLS)', current: fmtCls(rawMetrics.cls), estimated: fmtCls(rawMetrics.cls), range: fmtCls(rawMetrics.cls), improvement: '0' }
  ];

  const cwvMetrics = [
    { metric: 'Largest Contentful Paint (LCP)', current: fmtMs(rawMetrics.lcp), estimated: fmtMs(estimatedLcp), range: fmtRange(rawMetrics.lcp, estimatedLcp), improvement: fmtImp(rawMetrics.lcp, estimatedLcp) },
    { metric: 'Interaction to Next Paint (INP)', current: normalizedLhr.cruxInp ? `${Number(Number(normalizedLhr.cruxInp.value).toFixed(2))} ms` : '—', estimated: inpProjection?.likely ? `${Number(Number(inpProjection.likely).toFixed(2))} ms` : '—', range: inpProjection ? `${inpProjection.conservative} - ${inpProjection.optimistic} ms` : '—', improvement: inpProjection && normalizedLhr.cruxInp ? fmtImp(normalizedLhr.cruxInp.value, inpProjection.likely) : '—', heuristic: 'Heuristic' },
    { metric: 'Cumulative Layout Shift (CLS)', current: fmtCls(rawMetrics.cls), estimated: fmtCls(rawMetrics.cls), range: fmtCls(rawMetrics.cls), improvement: '0' }
  ];

  return {
    tables: { tagClassification, workloadReduction, labMetrics, cwvMetrics },
    workloadMetrics: {
      currentTransferKb,
      estimatedTransferKb,
      reductionTransferKb,
      currentCpuMs,
      estimatedCpuMs,
      reductionCpuMs,
      currentBootupMs,
      estimatedBootupMs,
      reductionBootupMs
    }
  };
}

module.exports = {
  fmt2,
  fmtMs,
  fmtCls,
  fmtRange,
  fmtImp,
  buildRange,
  calcPct,
  buildTables
};
