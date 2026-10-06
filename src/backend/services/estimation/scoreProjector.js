/**
 * Score Projector
 * Computes baseline score validation gate and recomputed 5-metric Lighthouse performance score.
 */

const {
  reconstructBaselinePerformanceScore,
  validateBaselineScore
} = require('../../utils/scoringUtils');

function projectPerformanceScore(rawMetrics, estimatedMetrics, formFactor, scoringOptionsMap, currentScore, lighthouseVersion) {
  const baselineReconstruction = reconstructBaselinePerformanceScore(
    rawMetrics,
    formFactor,
    scoringOptionsMap
  );

  const baselineGate = validateBaselineScore(
    currentScore,
    baselineReconstruction.reconstructedScore,
    lighthouseVersion,
    2
  );

  if (!baselineGate.isValid) {
    return {
      status: 'baselineMismatch',
      projectedScore: currentScore,
      deltaScore: 0,
      warning: baselineGate.warning,
      baselineValidation: {
        isValid: false,
        reconstructedScore: baselineReconstruction.reconstructedScore,
        diff: baselineGate.diff
      },
      method: 'Skipped projection due to baseline reconstruction divergence (> 2 points).'
    };
  }

  const projectedRawMetrics = {
    fcp: estimatedMetrics.fcp ?? rawMetrics.fcp,
    si: estimatedMetrics.si ?? rawMetrics.si,
    lcp: estimatedMetrics.lcp ?? rawMetrics.lcp,
    tbt: estimatedMetrics.tbt ?? rawMetrics.tbt,
    cls: estimatedMetrics.cls ?? rawMetrics.cls
  };

  const recomputed = reconstructBaselinePerformanceScore(
    projectedRawMetrics,
    formFactor,
    scoringOptionsMap
  );

  if (recomputed.isComplete && typeof currentScore === 'number') {
    const projScore = Math.min(100, Math.max(currentScore, recomputed.reconstructedScore));
    return {
      status: 'Estimated',
      projectedScore: projScore,
      deltaScore: Math.max(0, projScore - currentScore),
      baselineValidation: {
        isValid: true,
        reconstructedScore: baselineReconstruction.reconstructedScore,
        diff: baselineGate.diff
      },
      method: 'Lighthouse v10-v13 Log-Normal CDF Recomputation across all 5 lab metrics'
    };
  }

  return {
    status: 'Incomplete Inputs',
    projectedScore: currentScore,
    deltaScore: 0,
    baselineValidation: {
      isValid: true,
      reconstructedScore: baselineReconstruction.reconstructedScore,
      diff: baselineGate.diff
    },
    method: 'Missing one or more required metric values for log-normal recomputation.'
  };
}

module.exports = { projectPerformanceScore };
