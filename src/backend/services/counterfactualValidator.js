/**
 * Counterfactual Validation Service (Item 12)
 *
 * Runs counterfactual validation by comparing baseline Lighthouse runs against
 * runs where migratable vendor URL patterns are blocked.
 * Compares empirical measured deltas against the estimation model's projections.
 * Outputs a calibration report to tune model parameters (alpha, input-delay share, gtmAllocation).
 */

const { calculateMigrationEstimation, calculateMultiRunEstimation } = require('./estimation/scoreCalculator');

/**
 * Calculates calibration metrics between empirical measured deltas and model projected deltas.
 *
 * @param {object} empiricalDelta - Measured deltas { fcp, si, lcp, tbt, cls, performanceScore }
 * @param {object} projectedDelta - Model projected deltas { fcp, si, lcp, tbt, cls, performanceScore }
 * @return {object} Calibration report with error per metric
 */
function generateCalibrationReport(empiricalDelta, projectedDelta) {
  const metricKeys = ['performanceScore', 'fcp', 'si', 'lcp', 'tbt', 'cls'];
  const metricErrors = {};

  let totalScoreError = 0;
  let evaluatedMetricsCount = 0;

  metricKeys.forEach(k => {
    const measured = empiricalDelta[k] ?? 0;
    const projected = projectedDelta[k] ?? 0;
    const absError = Number(Math.abs(projected - measured).toFixed(2));
    const pctError = measured !== 0 ? Number(((absError / Math.abs(measured)) * 100).toFixed(2)) : 0;

    metricErrors[k] = {
      measuredDelta: measured,
      projectedDelta: projected,
      absoluteError: absError,
      percentageError: pctError
    };

    if (k === 'performanceScore') {
      totalScoreError = absError;
    }
    evaluatedMetricsCount++;
  });

  // Tuning recommendations based on calibration errors
  const tuningRecommendations = [];
  if (metricErrors.si?.projectedDelta > metricErrors.si?.measuredDelta + 200) {
    tuningRecommendations.push({
      parameter: 'speedIndexAlpha',
      observation: 'Model overestimated Speed Index relief compared to blocked-run benchmark.',
      action: 'Consider lowering speedIndexAlpha from 0.50 to ~0.35.'
    });
  } else if (metricErrors.si?.projectedDelta < metricErrors.si?.measuredDelta - 200) {
    tuningRecommendations.push({
      parameter: 'speedIndexAlpha',
      observation: 'Model underestimated Speed Index relief.',
      action: 'Consider increasing speedIndexAlpha from 0.50 to ~0.65.'
    });
  }

  if (metricErrors.tbt?.absoluteError > 100) {
    tuningRecommendations.push({
      parameter: 'gtmAllocationFraction',
      observation: `TBT projection discrepancy of ${metricErrors.tbt.absoluteError}ms detected.`,
      action: 'Adjust GTM core allocation heuristic or inspect container for unisolated inline tags.'
    });
  }

  return {
    accuracyRating: totalScoreError <= 3 ? 'Excellent' : (totalScoreError <= 7 ? 'Good' : 'Needs Calibration'),
    performanceScoreErrorPoints: totalScoreError,
    metricErrors,
    tuningRecommendations
  };
}

/**
 * Validates model projection against baseline and blocked report sets.
 *
 * @param {Array<object>} baselineReports - Array of N >= 1 baseline reports
 * @param {Array<object>} blockedReports - Array of N >= 1 reports with migratable URLs blocked
 * @param {object} gtmTagClassification - GTM tag classification
 * @param {object} [modelOptions] - Model options
 * @return {object} Complete validation result
 */
function validateCounterfactualRun(baselineReports = [], blockedReports = [], gtmTagClassification = {}, modelOptions = {}) {
  if (!baselineReports.length || !blockedReports.length) {
    throw new Error('Counterfactual validation requires at least 1 baseline report and 1 blocked report.');
  }

  // 1. Calculate baseline multi-run and model projection
  const baselineMulti = calculateMultiRunEstimation(baselineReports, gtmTagClassification, modelOptions);

  // 2. Calculate empirical blocked multi-run
  const blockedMulti = calculateMultiRunEstimation(blockedReports, { tags: [] }, modelOptions);

  // 3. Compute Empirical Measured Delta (Baseline - Blocked)
  const baseStats = baselineMulti.multiRun ? baselineMulti.multiRun.baselineStats : {
    performanceScore: { median: baselineMulti.current.performanceScore },
    fcp: { median: baselineMulti.current.fcp },
    si: { median: baselineMulti.current.speedIndex },
    lcp: { median: baselineMulti.current.lcp },
    tbt: { median: baselineMulti.current.tbt },
    cls: { median: baselineMulti.current.cls }
  };

  const blockedStats = blockedMulti.multiRun ? blockedMulti.multiRun.baselineStats : {
    performanceScore: { median: blockedMulti.current.performanceScore },
    fcp: { median: blockedMulti.current.fcp },
    si: { median: blockedMulti.current.speedIndex },
    lcp: { median: blockedMulti.current.lcp },
    tbt: { median: blockedMulti.current.tbt },
    cls: { median: blockedMulti.current.cls }
  };

  const empiricalDelta = {
    performanceScore: Math.max(0, (blockedStats.performanceScore.median || 0) - (baseStats.performanceScore.median || 0)),
    fcp: Math.max(0, (baseStats.fcp.median || 0) - (blockedStats.fcp.median || 0)),
    si: Math.max(0, (baseStats.si.median || 0) - (blockedStats.si.median || 0)),
    lcp: Math.max(0, (baseStats.lcp.median || 0) - (blockedStats.lcp.median || 0)),
    tbt: Math.max(0, (baseStats.tbt.median || 0) - (blockedStats.tbt.median || 0)),
    cls: Math.max(0, (baseStats.cls.median || 0) - (blockedStats.cls.median || 0))
  };

  // 4. Extract Model Projected Delta
  const projectedDelta = {
    performanceScore: baselineMulti.change.performanceScore.points !== '—' ? baselineMulti.change.performanceScore.points : 0,
    fcp: baselineMulti.change.fcp.absolute || 0,
    si: baselineMulti.change.speedIndex.absolute || 0,
    lcp: baselineMulti.change.lcp.absolute || 0,
    tbt: baselineMulti.change.tbt.absolute || 0,
    cls: baselineMulti.change.cls.absolute || 0
  };

  // 5. Generate Calibration Report
  const calibration = generateCalibrationReport(empiricalDelta, projectedDelta);

  return {
    baselineRuns: baselineReports.length,
    blockedRuns: blockedReports.length,
    empiricalMeasured: {
      baselineMedians: {
        score: baseStats.performanceScore.median,
        fcp: baseStats.fcp.median,
        si: baseStats.si.median,
        lcp: baseStats.lcp.median,
        tbt: baseStats.tbt.median,
        cls: baseStats.cls.median
      },
      blockedMedians: {
        score: blockedStats.performanceScore.median,
        fcp: blockedStats.fcp.median,
        si: blockedStats.si.median,
        lcp: blockedStats.lcp.median,
        tbt: blockedStats.tbt.median,
        cls: blockedStats.cls.median
      },
      measuredDelta: empiricalDelta
    },
    modelProjected: {
      projectedScore: baselineMulti.estimated.performanceScore,
      projectedDelta: projectedDelta
    },
    calibration
  };
}

module.exports = {
  generateCalibrationReport,
  validateCounterfactualRun
};
