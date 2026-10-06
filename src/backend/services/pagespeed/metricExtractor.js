/**
 * Extracts raw metrics, scores, opportunities, and CWV statuses from Lighthouse results.
 */

const getScoreStatus = (score) => {
  if (score === null) return null;
  if (score >= 90) return 'Good';
  if (score >= 50) return 'Needs Improvement';
  return 'Poor';
};

const getLcpStatus = (val) => {
  if (val === null) return null;
  if (val <= 2500) return 'Good';
  if (val <= 4000) return 'Needs Improvement';
  return 'Poor';
};

const getInpStatus = (val) => {
  if (val === null) return null;
  if (val <= 200) return 'Good';
  if (val <= 500) return 'Needs Improvement';
  return 'Poor';
};

const getClsStatus = (val) => {
  if (val === null) return null;
  if (val <= 0.1) return 'Good';
  if (val <= 0.25) return 'Needs Improvement';
  return 'Poor';
};

function extractPerformanceMetrics(lighthouseResult, loadingExperience) {
  const { categories, audits } = lighthouseResult;

  const getRaw = (id) => audits[id]?.numericValue ?? null;
  const getScore = (id) => audits[id]?.score ?? null;

  const rawScore = categories?.performance?.score !== undefined
    ? Math.round(categories.performance.score * 100)
    : null;

  const rawLcp = getRaw('largest-contentful-paint');
  const rawCls = getRaw('cumulative-layout-shift');
  const rawFcp = getRaw('first-contentful-paint');
  const rawTtfb = getRaw('server-response-time');
  const rawTbt = getRaw('total-blocking-time');
  const rawSpeedIndex = getRaw('speed-index');

  let rawInp = null;
  if (loadingExperience?.metrics?.INTERACTION_TO_NEXT_PAINT?.percentile !== undefined) {
    rawInp = loadingExperience.metrics.INTERACTION_TO_NEXT_PAINT.percentile;
  } else if (audits['interaction-to-next-paint']?.numericValue !== undefined) {
    rawInp = audits['interaction-to-next-paint'].numericValue;
  }

  const metricScores = {
    fcp: getScore('first-contentful-paint'),
    si: getScore('speed-index'),
    lcp: getScore('largest-contentful-paint'),
    cls: getScore('cumulative-layout-shift'),
    tbt: getScore('total-blocking-time')
  };

  const opps = Object.values(audits)
    .filter(a => a.details?.type === 'opportunity' && a.score !== null && a.score < 1)
    .sort((a, b) => a.score - b.score)
    .map(opp => ({ title: opp.title, savings: opp.displayValue || 'N/A' }));

  return {
    performanceScore: { value: rawScore, status: getScoreStatus(rawScore) },
    coreWebVitals: {
      lcp: { value: rawLcp, status: getLcpStatus(rawLcp) },
      inp: { value: rawInp, status: getInpStatus(rawInp) },
      cls: { value: rawCls, status: getClsStatus(rawCls) }
    },
    otherMetrics: {
      fcp: rawFcp,
      ttfb: rawTtfb,
      tbt: rawTbt,
      speedIndex: rawSpeedIndex
    },
    metricScores,
    opportunities: opps
  };
}

module.exports = {
  getScoreStatus,
  getLcpStatus,
  getInpStatus,
  getClsStatus,
  extractPerformanceMetrics
};
