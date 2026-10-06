/**
 * Scoring Calculation Utilities
 */

const { LIGHTHOUSE_WEIGHTS, LIGHTHOUSE_SCORING_CURVES } = require('./scoringCurves');

function erf(x) {
  const a = 0.147;
  const theSqrt = Math.sqrt(1 - Math.exp(-x * x * (4 / Math.PI + a * x * x) / (1 + a * x * x)));
  const sign = x < 0 ? -1 : 1;
  return sign * theSqrt;
}

function getLogNormalScore(optionsOrValue, valueOrMedian, p10) {
  let medianVal, p10Val, value;

  if (typeof optionsOrValue === 'object' && optionsOrValue !== null) {
    medianVal = optionsOrValue.median;
    p10Val = optionsOrValue.p10;
    value = valueOrMedian;
  } else {
    value = optionsOrValue;
    medianVal = valueOrMedian;
    p10Val = p10;
  }

  if (value === undefined || value === null || isNaN(value)) return 0;
  if (value <= 0) return 1;
  if (!medianVal || !p10Val || medianVal <= 0 || p10Val <= 0) return 0;

  const location = Math.log(medianVal);
  const logRatio = Math.log(p10Val) - location;
  const shape = Math.abs(logRatio / (Math.SQRT2 * -0.9061938024368232));
  const standardizedX = (Math.log(value) - location) / (Math.SQRT2 * shape);
  const score = 0.5 * (1 - erf(standardizedX));

  return Math.min(1, Math.max(0, score));
}

function getMetricScoringOptions(formFactor, metricKey, auditScoringOptions) {
  const normFormFactor = (formFactor || 'mobile').toLowerCase() === 'desktop' ? 'desktop' : 'mobile';
  const normMetric = metricKey.toLowerCase();

  if (auditScoringOptions && typeof auditScoringOptions.p10 === 'number' && typeof auditScoringOptions.median === 'number') {
    return { p10: auditScoringOptions.p10, median: auditScoringOptions.median };
  }

  const curves = LIGHTHOUSE_SCORING_CURVES[normFormFactor] || LIGHTHOUSE_SCORING_CURVES.mobile;
  return curves[normMetric] || curves.fcp;
}

function reconstructBaselinePerformanceScore(rawMetrics, formFactor, auditScoringOptionsMap = {}) {
  const metrics = ['fcp', 'si', 'lcp', 'tbt', 'cls'];
  const rawScores = {};
  let totalScore = 0;
  let isComplete = true;

  for (const m of metrics) {
    const val = rawMetrics[m];
    if (val === undefined || val === null || isNaN(val)) {
      isComplete = false;
      rawScores[m] = null;
      continue;
    }
    const options = getMetricScoringOptions(formFactor, m, auditScoringOptionsMap[m]);
    const score = getLogNormalScore(options, val);
    rawScores[m] = Number(score.toFixed(4));
    totalScore += score * LIGHTHOUSE_WEIGHTS[m];
  }

  const reconstructedScore = isComplete ? Math.round(totalScore * 100) : null;
  return { reconstructedScore, rawScores, isComplete };
}

function validateBaselineScore(reportedScore, reconstructedScore, lighthouseVersion = 'unknown', maxDiff = 2) {
  if (reportedScore === null || reportedScore === undefined || reconstructedScore === null || reconstructedScore === undefined) {
    return {
      isValid: false,
      diff: null,
      warning: `Baseline score reconstruction failed: missing reported score (${reportedScore}) or reconstructed score (${reconstructedScore}).`
    };
  }

  const diff = Math.abs(reconstructedScore - reportedScore);
  if (diff > maxDiff) {
    return {
      isValid: false,
      diff,
      warning: `baselineMismatch: Reconstructed baseline score (${reconstructedScore}) differs from reported score (${reportedScore}) by ${diff} points (threshold: ${maxDiff}). Lighthouse version: ${lighthouseVersion}.`
    };
  }

  return {
    isValid: true,
    diff,
    warning: null
  };
}

module.exports = {
  LIGHTHOUSE_WEIGHTS,
  LIGHTHOUSE_SCORING_CURVES,
  erf,
  getLogNormalScore,
  getMetricScoringOptions,
  reconstructBaselinePerformanceScore,
  validateBaselineScore
};
