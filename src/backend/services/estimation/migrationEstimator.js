/**
 * Migration Estimator Service
 * Combines Tag Classification, Workload Attribution, and Score Calculation into final report.
 */

const { calculateMigrationEstimation } = require('./scoreCalculator');
const { classifyContainerTags, CLASSIFICATION_TIERS } = require('../tagClassifier');

function generateFinalGtmMigrationResult(pageSpeedResult, gtmTagsResult = {}, userOptions = {}) {
  // Normalize tag classification if not already classified
  let tagClassification;
  if (gtmTagsResult.tagsByTier && gtmTagsResult.summary) {
    tagClassification = gtmTagsResult;
  } else if (Array.isArray(gtmTagsResult.tags)) {
    tagClassification = classifyContainerTags(gtmTagsResult.tags);
  } else if (gtmTagsResult.tags && typeof gtmTagsResult.tags === 'object') {
    const flattened = [];
    Object.values(gtmTagsResult.tags).forEach(group => {
      if (Array.isArray(group)) flattened.push(...group);
    });
    tagClassification = classifyContainerTags(flattened);
  } else {
    tagClassification = classifyContainerTags([]);
  }

  const migrationOpportunities = [];

  // 1. Removable Client Libraries (Full Savings)
  const removableTags = tagClassification.tagsByTier?.[CLASSIFICATION_TIERS.REMOVABLE] || [];
  removableTags.forEach(tag => {
    migrationOpportunities.push({
      tagName: tag.name,
      vendor: tag.vendor,
      tier: tag.tier,
      savingsPotential: 'High (Full Client Removal)',
      migrationAction: 'Remove client pixel/script from web container and forward events to sGTM server container (e.g. via Conversions API or server-side template).'
    });
  });

  // 2. Stays Client-Side, Lighter Payload (Low Savings)
  const lighterTags = tagClassification.tagsByTier?.[CLASSIFICATION_TIERS.LIGHTER_PAYLOAD] || [];
  lighterTags.forEach(tag => {
    migrationOpportunities.push({
      tagName: tag.name,
      vendor: tag.vendor,
      tier: tag.tier,
      savingsPotential: 'Low (Lighter Payload)',
      migrationAction: 'Point web tag transport URL to Server-Side GTM endpoint. Web tag library still runs in browser to capture context.'
    });
  });

  // 3. Obsolete Delete Class
  const obsoleteTags = tagClassification.tagsByTier?.[CLASSIFICATION_TIERS.OBSOLETE] || [];
  obsoleteTags.forEach(tag => {
    migrationOpportunities.push({
      tagName: tag.name,
      vendor: tag.vendor,
      tier: tag.tier,
      savingsPotential: 'Delete Obsolete Tag',
      migrationAction: 'Delete obsolete legacy tracking tag from container.'
    });
  });

  const estimatedImpact = calculateMigrationEstimation(pageSpeedResult, tagClassification, userOptions);

  return {
    tagClassificationSummary: tagClassification.summary,
    migrationOpportunities,
    estimatedImpact
  };
}

module.exports = { generateFinalGtmMigrationResult };
