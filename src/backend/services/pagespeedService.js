/**
 * PageSpeed Service Orchestrator
 */

const { fetchPageSpeedData } = require('./pagespeed/pagespeedClient');
const { extractPerformanceMetrics } = require('./pagespeed/metricExtractor');
const { extractScriptInventory } = require('./pagespeed/scriptExtractor');

async function runPageSpeedTest(targetUrl, strategy = 'mobile') {
  const data = await fetchPageSpeedData(targetUrl, strategy);
  const { lighthouseResult, loadingExperience, originLoadingExperience } = data;
  const audits = lighthouseResult.audits || {};

  const metricsData = extractPerformanceMetrics(lighthouseResult, loadingExperience);
  const scriptData = extractScriptInventory(audits, targetUrl);

  const lcpAudit = audits['largest-contentful-paint-element'];
  const lcpDetails = lcpAudit ? {
    score: lcpAudit.score ?? null,
    displayValue: lcpAudit.displayValue || null,
    items: lcpAudit.details?.items || []
  } : null;

  const clsAudit = audits['layout-shifts'] || audits['layout-shift-elements'] || audits['cumulative-layout-shift'];
  const clsDetails = clsAudit ? {
    score: clsAudit.score ?? null,
    displayValue: clsAudit.displayValue || null,
    items: clsAudit.details?.items || []
  } : null;

  const performanceReport = {
    platform: strategy,
    pageSpeedScore: metricsData.performanceScore.value,
    metrics: metricsData.otherMetrics,
    gtmPerformanceBaseline: scriptData.gtmPerformanceBaseline,
    thirdPartyInventory: scriptData.entities,
    affectedMetrics: []
  };

  return {
    url: targetUrl,
    strategy,
    lighthouseResult,
    loadingExperience,
    originLoadingExperience,
    performanceScore: metricsData.performanceScore,
    coreWebVitals: metricsData.coreWebVitals,
    otherMetrics: metricsData.otherMetrics,
    metricScores: metricsData.metricScores,
    opportunities: metricsData.opportunities,
    thirdPartyAnalysis: {
      entities: scriptData.entities,
      bootupTimes: scriptData.bootupTimes,
      mainthreadBreakdown: scriptData.mainthreadBreakdown
    },
    performanceReport,
    lcpDetails,
    clsDetails
  };
}

module.exports = { runPageSpeedTest };
