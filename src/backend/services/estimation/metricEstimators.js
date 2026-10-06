/**
 * Metric Estimators
 * Calculates specific post-migration metrics for FCP, LCP, TBT, Speed Index, and INP.
 */

const DEFAULT_HEURISTICS = {
  inputDelayShare: 0.70,
  speedIndexAlpha: 0.50
};

function estimateFcpAndLcp(rawMetrics, renderBlocking, attributedScripts) {
  const currentFcp = rawMetrics.fcp;
  const currentLcp = rawMetrics.lcp;

  let wastedRenderBlockingMs = 0;
  renderBlocking?.forEach(rb => {
    const isRemovable = attributedScripts.some(s => s.url === rb.url && s.isRemovable);
    if (isRemovable) {
      wastedRenderBlockingMs += rb.wastedMs;
    }
  });

  const deltaFcp = typeof currentFcp === 'number' && currentFcp > 0
    ? Math.min(currentFcp, wastedRenderBlockingMs)
    : 0;

  const estimatedFcp = typeof currentFcp === 'number'
    ? Math.max(0, currentFcp - deltaFcp)
    : null;

  const deltaLcp = deltaFcp;
  const estimatedLcp = (typeof currentLcp === 'number' && typeof estimatedFcp === 'number')
    ? Math.max(estimatedFcp, currentLcp - deltaLcp)
    : (typeof currentLcp === 'number' ? Math.max(0, currentLcp - deltaLcp) : null);

  return {
    deltaFcp,
    estimatedFcp,
    deltaLcp,
    estimatedLcp
  };
}

function estimateTbt(rawMetrics, attributableTbtImpact) {
  const currentTbt = rawMetrics.tbt;
  const deltaTbt = typeof currentTbt === 'number'
    ? Math.min(currentTbt, attributableTbtImpact || 0)
    : 0;

  const estimatedTbt = typeof currentTbt === 'number'
    ? Math.max(0, currentTbt - deltaTbt)
    : null;

  return { deltaTbt, estimatedTbt };
}

function estimateSpeedIndex(rawMetrics, estimatedFcp, deltaFcp, attributableMainThread, userOptions = {}) {
  const currentSi = rawMetrics.si;
  const alpha = userOptions.speedIndexAlpha ?? DEFAULT_HEURISTICS.speedIndexAlpha;
  const cpuSiRelief = (attributableMainThread || 0) * alpha;

  let deltaSi = 0;
  let estimatedSi = currentSi;

  if (typeof currentSi === 'number' && typeof estimatedFcp === 'number') {
    const maxPossibleDelta = Math.max(0, currentSi - estimatedFcp);
    deltaSi = Math.min(maxPossibleDelta, (deltaFcp || 0) + cpuSiRelief);
    estimatedSi = Math.max(estimatedFcp, currentSi - deltaSi);
  } else if (typeof currentSi === 'number') {
    deltaSi = cpuSiRelief;
    estimatedSi = Math.max(200, currentSi - deltaSi);
  }

  return { deltaSi, estimatedSi, alpha };
}

function estimateInp(cruxInp, attributableMainThread, totalPageMainThread, confidence, userOptions = {}) {
  const currentInp = cruxInp?.value ?? null;
  if (typeof currentInp !== 'number' || currentInp <= 0) {
    return null;
  }

  const inputDelayShare = userOptions.inputDelayShare ?? DEFAULT_HEURISTICS.inputDelayShare;
  const totalThread = totalPageMainThread || 1;
  const rhoRelief = Math.min(1.0, (attributableMainThread || 0) / totalThread);
  const coverage = confidence === 'high' ? 1.0 : (confidence === 'medium' ? 0.75 : 0.50);

  const deltaInpLikely = currentInp * inputDelayShare * rhoRelief * coverage;
  const deltaInpConservative = deltaInpLikely * 0.50;
  const deltaInpOptimistic = Math.min(currentInp - 50, deltaInpLikely * 1.25);

  return {
    current: currentInp,
    conservative: Math.max(50, Math.round(currentInp - deltaInpConservative)),
    likely: Math.max(50, Math.round(currentInp - deltaInpLikely)),
    optimistic: Math.max(50, Math.round(currentInp - deltaInpOptimistic)),
    unit: 'ms',
    source: cruxInp?.source || 'CrUX',
    isLabScoreComponent: false,
    notes: 'INP is a real-user field metric (CrUX p75). It does not affect the lab Lighthouse performance score.'
  };
}

module.exports = {
  DEFAULT_HEURISTICS,
  estimateFcpAndLcp,
  estimateTbt,
  estimateSpeedIndex,
  estimateInp
};
