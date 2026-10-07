/**
 * Migration Estimator Service
 * Combines Tag Classification, Workload Attribution, and Score Calculation into final report.
 */

const { calculateMigrationEstimation } = require('./scoreCalculator');
const { CLASSIFICATION_TIERS, normalizeTagClassification } = require('../tagClassifier');

function generateFinalGtmMigrationResult(pageSpeedResult, gtmTagsResult = {}, userOptions = {}) {
  const tagClassification = normalizeTagClassification(gtmTagsResult);


  const migrationOpportunities = [];

  const removableTags = tagClassification.tagsByTier?.[CLASSIFICATION_TIERS.REMOVABLE] || [];
  removableTags.forEach(tag => {
    migrationOpportunities.push({
      tagName: tag.name,
      vendor: tag.vendor,
      tier: tag.tier,
      savingsPotential: 'High (Full Client Removal)',
      migrationAction: 'Remove client pixel/script from web container and forward events to sGTM server container.'
    });
  });

  const lighterTags = tagClassification.tagsByTier?.[CLASSIFICATION_TIERS.LIGHTER_PAYLOAD] || [];
  lighterTags.forEach(tag => {
    migrationOpportunities.push({
      tagName: tag.name,
      vendor: tag.vendor,
      tier: tag.tier,
      savingsPotential: 'Low (Lighter Payload)',
      migrationAction: 'Point web tag transport URL to Server-Side GTM endpoint.'
    });
  });

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
    ...estimatedImpact,
    tagClassificationSummary: tagClassification.summary,
    migrationOpportunities,
    estimatedImpact
  };
}

module.exports = { generateFinalGtmMigrationResult };
