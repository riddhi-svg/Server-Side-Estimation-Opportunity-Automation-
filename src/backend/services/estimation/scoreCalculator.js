/**
 * Score Calculator Main Orchestrator
 */

const { normalizeLighthouseReport } = require('../lighthouseAdapter');
const { attributeWorkload } = require('./attributionEngine');
const { normalizeTagClassification } = require('../tagClassifier');
const {
  DEFAULT_HEURISTICS,
  estimateFcpAndLcp,
  estimateTbt,
  estimateSpeedIndex,
  estimateInp
} = require('./metricEstimators');
const { projectPerformanceScore } = require('./scoreProjector');
const { aggregateMultiRuns } = require('./multiRunAggregator');
const { formatEstimationPayload } = require('./estimationFormatter');

function calculateMigrationEstimation(lhrOrPsiResult, gtmTagsResult = {}, userOptions = {}) {
  const normalizedLhr = normalizeLighthouseReport(lhrOrPsiResult);
  const formFactor = normalizedLhr.formFactor || 'mobile';
  const lighthouseVersion = normalizedLhr.lighthouseVersion;

  const tagClassification = normalizeTagClassification(gtmTagsResult);


  const workload = attributeWorkload(normalizedLhr, tagClassification, userOptions);
  const attributable = workload.totalRemovable;
  const rawMetrics = normalizedLhr.rawMetrics;
  const currentScore = normalizedLhr.performanceScore;

  const { deltaFcp, estimatedFcp, deltaLcp, estimatedLcp } = estimateFcpAndLcp(
    rawMetrics,
    normalizedLhr.renderBlocking,
    workload.attributedScripts
  );
  const { deltaTbt, estimatedTbt } = estimateTbt(rawMetrics, attributable.tbtImpactMs);
  const { deltaSi, estimatedSi } = estimateSpeedIndex(
    rawMetrics,
    estimatedFcp,
    deltaFcp,
    attributable.mainThreadTimeMs,
    userOptions
  );
  const inpProjection = estimateInp(
    normalizedLhr.cruxInp,
    attributable.mainThreadTimeMs,
    workload.totalPageMainThreadTimeMs,
    workload.confidence,
    userOptions
  );

  const estimatedMetrics = {
    fcp: estimatedFcp,
    si: estimatedSi,
    lcp: estimatedLcp,
    tbt: estimatedTbt,
    cls: rawMetrics.cls
  };

  const scoreProj = projectPerformanceScore(
    rawMetrics,
    estimatedMetrics,
    formFactor,
    normalizedLhr.scoringOptionsMap,
    currentScore,
    lighthouseVersion
  );

  const heuristicsApplied = [
    { name: 'inputDelayShare', value: userOptions.inputDelayShare ?? DEFAULT_HEURISTICS.inputDelayShare, type: 'unsourced heuristic' },
    { name: 'speedIndexAlpha', value: userOptions.speedIndexAlpha ?? DEFAULT_HEURISTICS.speedIndexAlpha, type: 'uncalibrated heuristic' },
    { name: 'gtmAllocationFraction', value: 'proportional share', type: 'allocation heuristic' }
  ];

  return formatEstimationPayload({
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
  });
}

function calculateMultiRunEstimation(reportsList = [], gtmTagsResult = {}, userOptions = {}) {
  if (!Array.isArray(reportsList) || reportsList.length === 0) {
    throw new Error('Multi-run calculation requires at least one report.');
  }
  if (reportsList.length === 1) {
    return calculateMigrationEstimation(reportsList[0], gtmTagsResult, userOptions);
  }
  const estimations = reportsList.map(rep => calculateMigrationEstimation(rep, gtmTagsResult, userOptions));
  return aggregateMultiRuns(estimations);
}

module.exports = {
  DEFAULT_HEURISTICS,
  calculateMigrationEstimation,
  calculateMultiRunEstimation
};
