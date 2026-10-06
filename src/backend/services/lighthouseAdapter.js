/**
 * Lighthouse Version-Aware Adapter Layer
 */

const { extractAuditData } = require('./adapter/auditExtractor');

function normalizeLighthouseReport(lhrOrPsiResult) {
  const warnings = [];

  if (!lhrOrPsiResult) {
    return {
      lighthouseVersion: 'unknown',
      formFactor: 'mobile',
      warnings: ['No Lighthouse report or PSI result payload provided.'],
      performanceScore: null,
      rawMetrics: {},
      scoringOptionsMap: {},
      renderBlocking: [],
      thirdParties: [],
      bootup: [],
      longTasks: [],
      mainThreadWork: [],
      cruxInp: null,
      lcpDetails: null,
      clsDetails: null
    };
  }

  const lhr = lhrOrPsiResult.lighthouseResult || lhrOrPsiResult;
  const audits = lhr.audits || {};
  const configSettings = lhr.configSettings || {};
  const formFactor = (configSettings.formFactor || lhrOrPsiResult.strategy || 'mobile').toLowerCase() === 'desktop' ? 'desktop' : 'mobile';
  const lighthouseVersion = lhr.lighthouseVersion || 'unknown';

  const perfCategory = lhr.categories?.performance;
  const rawScore = perfCategory?.score !== undefined && perfCategory?.score !== null
    ? Math.round(perfCategory.score * 100)
    : null;

  const rawMetrics = {
    fcp: audits['first-contentful-paint']?.numericValue ?? null,
    si: audits['speed-index']?.numericValue ?? null,
    lcp: audits['largest-contentful-paint']?.numericValue ?? null,
    tbt: audits['total-blocking-time']?.numericValue ?? null,
    cls: audits['cumulative-layout-shift']?.numericValue ?? null,
    ttfb: audits['server-response-time']?.numericValue ?? audits['time-to-first-byte']?.numericValue ?? null
  };

  const scoringOptionsMap = {};
  const metricAuditKeys = {
    fcp: 'first-contentful-paint',
    si: 'speed-index',
    lcp: 'largest-contentful-paint',
    tbt: 'total-blocking-time',
    cls: 'cumulative-layout-shift'
  };

  for (const [metricKey, auditKey] of Object.entries(metricAuditKeys)) {
    const audit = audits[auditKey];
    if (audit?.scoringOptions && typeof audit.scoringOptions.p10 === 'number' && typeof audit.scoringOptions.median === 'number') {
      scoringOptionsMap[metricKey] = {
        p10: audit.scoringOptions.p10,
        median: audit.scoringOptions.median
      };
    }
  }

  const auditData = extractAuditData(audits, warnings);

  let cruxInp = null;
  const loadingExp = lhrOrPsiResult.loadingExperience;
  const originExp = lhrOrPsiResult.originLoadingExperience;

  if (loadingExp?.metrics?.INTERACTION_TO_NEXT_PAINT?.percentile !== undefined) {
    cruxInp = { value: loadingExp.metrics.INTERACTION_TO_NEXT_PAINT.percentile, unit: 'ms', source: 'CrUX (URL-level field data)' };
  } else if (originExp?.metrics?.INTERACTION_TO_NEXT_PAINT?.percentile !== undefined) {
    cruxInp = { value: originExp.metrics.INTERACTION_TO_NEXT_PAINT.percentile, unit: 'ms', source: 'CrUX (Origin-level field data)' };
  }

  const lcpAudit = audits['largest-contentful-paint-element'];
  const lcpDetails = lcpAudit ? { score: lcpAudit.score ?? null, displayValue: lcpAudit.displayValue || null, items: lcpAudit.details?.items || [] } : null;

  const clsAudit = audits['layout-shifts'] || audits['layout-shift-elements'] || audits['cumulative-layout-shift'];
  const clsDetails = clsAudit ? { score: clsAudit.score ?? null, displayValue: clsAudit.displayValue || null, items: clsAudit.details?.items || [] } : null;

  return {
    lighthouseVersion,
    formFactor,
    warnings,
    performanceScore: rawScore,
    rawMetrics,
    scoringOptionsMap,
    renderBlocking: auditData.renderBlocking,
    thirdParties: auditData.thirdParties,
    bootup: auditData.bootup,
    longTasks: auditData.longTasks,
    mainThreadWork: auditData.mainThreadWork,
    cruxInp,
    lcpDetails,
    clsDetails
  };
}

module.exports = { normalizeLighthouseReport };
