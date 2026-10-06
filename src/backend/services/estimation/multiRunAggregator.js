/**
 * Multi-Run Aggregator
 * Computes median baseline and projected metrics across N PageSpeed/Lighthouse runs.
 */

function getMedian(arr) {
  const valid = arr.filter(v => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
  if (valid.length === 0) return null;
  const mid = Math.floor(valid.length / 2);
  return valid.length % 2 !== 0 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2;
}

function getStdDev(arr, mean) {
  const valid = arr.filter(v => typeof v === 'number' && !isNaN(v));
  if (valid.length <= 1 || mean === null) return 0;
  const variance = valid.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / valid.length;
  return Number(Math.sqrt(variance).toFixed(2));
}

function aggregateMultiRuns(estimations) {
  const metricKeys = ['performanceScore', 'fcp', 'si', 'lcp', 'tbt', 'cls'];
  const baselineStats = {};
  const projectedStats = {};

  metricKeys.forEach(k => {
    const baselineVals = estimations.map(e => k === 'performanceScore' ? e.current.performanceScore : e.current[k]);
    const projectedVals = estimations.map(e => k === 'performanceScore' ? e.estimated.performanceScore : e.estimated[k]);

    const baseMed = getMedian(baselineVals);
    const projMed = getMedian(projectedVals);

    baselineStats[k] = {
      median: baseMed,
      stdDev: getStdDev(baselineVals, baseMed),
      min: Math.min(...baselineVals.filter(v => typeof v === 'number')),
      max: Math.max(...baselineVals.filter(v => typeof v === 'number'))
    };

    projectedStats[k] = {
      median: projMed,
      stdDev: getStdDev(projectedVals, projMed),
      min: Math.min(...projectedVals.filter(v => typeof v === 'number')),
      max: Math.max(...projectedVals.filter(v => typeof v === 'number'))
    };
  });

  const medianScore = baselineStats.performanceScore.median;
  const closestRun = estimations.reduce((prev, curr) => {
    const prevDiff = Math.abs((prev.current.performanceScore || 0) - medianScore);
    const currDiff = Math.abs((curr.current.performanceScore || 0) - medianScore);
    return currDiff < prevDiff ? curr : prev;
  }, estimations[0]);

  return {
    ...closestRun,
    multiRun: {
      totalRuns: estimations.length,
      baselineStats,
      projectedStats
    }
  };
}

module.exports = {
  getMedian,
  getStdDev,
  aggregateMultiRuns
};
