/**
 * GTM Tag Classification Service Orchestrator
 */

const { CLASSIFICATION_TIERS, matchTagTier } = require('./classification/tagMatcher');

function classifyTag(tag) {
  return matchTagTier(tag);
}

function classifyContainerTags(tagsList = []) {
  const tags = Array.isArray(tagsList) ? tagsList : [];
  const classifiedTags = tags.map(classifyTag);

  const summary = {
    removable: 0,
    lighterPayload: 0,
    cannotMove: 0,
    obsolete: 0
  };

  const tagsByTier = {
    [CLASSIFICATION_TIERS.REMOVABLE]: [],
    [CLASSIFICATION_TIERS.LIGHTER_PAYLOAD]: [],
    [CLASSIFICATION_TIERS.CANNOT_MOVE]: [],
    [CLASSIFICATION_TIERS.OBSOLETE]: []
  };

  const removableVendorSet = new Set();

  classifiedTags.forEach(tag => {
    if (tag.tier === CLASSIFICATION_TIERS.REMOVABLE) {
      summary.removable++;
      removableVendorSet.add(tag.vendor);
    } else if (tag.tier === CLASSIFICATION_TIERS.LIGHTER_PAYLOAD) {
      summary.lighterPayload++;
    } else if (tag.tier === CLASSIFICATION_TIERS.OBSOLETE) {
      summary.obsolete++;
    } else {
      summary.cannotMove++;
    }

    if (tagsByTier[tag.tier]) {
      tagsByTier[tag.tier].push(tag);
    }
  });

  return {
    totalTags: tags.length,
    summary,
    removableVendors: Array.from(removableVendorSet),
    classifiedTags,
    tagsByTier
  };
}

module.exports = {
  CLASSIFICATION_TIERS,
  classifyTag,
  classifyContainerTags
};
