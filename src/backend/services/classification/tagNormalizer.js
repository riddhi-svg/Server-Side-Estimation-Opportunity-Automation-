/**
 * Normalizes GTM tag classification results from API, raw tags, or nested summaries.
 */

const { CLASSIFICATION_TIERS, matchTagTier } = require('./tagMatcher');

function normalizeTagClassification(gtmTagsResult = {}) {
  if (!gtmTagsResult) {
    return {
      totalTags: 0,
      summary: { removable: 0, lighterPayload: 0, cannotMove: 0, obsolete: 0 },
      removableVendors: [],
      tagsByTier: {
        [CLASSIFICATION_TIERS.REMOVABLE]: [],
        [CLASSIFICATION_TIERS.LIGHTER_PAYLOAD]: [],
        [CLASSIFICATION_TIERS.CANNOT_MOVE]: [],
        [CLASSIFICATION_TIERS.OBSOLETE]: []
      },
      classifiedTags: []
    };
  }

  if (typeof gtmTagsResult.summary?.removable === 'number' && gtmTagsResult.tagsByTier) {
    const s = gtmTagsResult.summary;
    const computedTotal = (s.removable || 0) + (s.lighterPayload || 0) + (s.cannotMove || 0) + (s.obsolete || 0);
    return {
      totalTags: gtmTagsResult.totalTags ?? s.totalTags ?? computedTotal,
      summary: {
        removable: s.removable || 0,
        lighterPayload: s.lighterPayload || 0,
        cannotMove: s.cannotMove || 0,
        obsolete: s.obsolete || 0
      },
      removableVendors: gtmTagsResult.removableVendors || s.removableVendors || [],
      tagsByTier: gtmTagsResult.tagsByTier,
      classifiedTags: gtmTagsResult.classifiedTags || []
    };
  }

  if (gtmTagsResult.summary?.tiers) {
    const t = gtmTagsResult.summary.tiers;
    const computedTotal = (t.removable || 0) + (t.lighterPayload || 0) + (t.cannotMove || 0) + (t.obsolete || 0);
    return {
      totalTags: gtmTagsResult.totalTags ?? gtmTagsResult.summary.totalTags ?? computedTotal,
      summary: {
        removable: t.removable || 0,
        lighterPayload: t.lighterPayload || 0,
        cannotMove: t.cannotMove || 0,
        obsolete: t.obsolete || 0
      },
      removableVendors: gtmTagsResult.removableVendors || gtmTagsResult.summary.removableVendors || [],
      tagsByTier: gtmTagsResult.tagsByTier || {},
      classifiedTags: gtmTagsResult.classifiedTags || []
    };
  }

  const tagsList = Array.isArray(gtmTagsResult.tags)
    ? gtmTagsResult.tags
    : (Array.isArray(gtmTagsResult) ? gtmTagsResult : null);

  if (tagsList) {
    const classified = tagsList.map(matchTagTier);
    const summary = { removable: 0, lighterPayload: 0, cannotMove: 0, obsolete: 0 };
    const tagsByTier = {
      [CLASSIFICATION_TIERS.REMOVABLE]: [],
      [CLASSIFICATION_TIERS.LIGHTER_PAYLOAD]: [],
      [CLASSIFICATION_TIERS.CANNOT_MOVE]: [],
      [CLASSIFICATION_TIERS.OBSOLETE]: []
    };
    const vendors = new Set();
    classified.forEach(t => {
      if (t.tier === CLASSIFICATION_TIERS.REMOVABLE) {
        summary.removable++;
        vendors.add(t.vendor);
      } else if (t.tier === CLASSIFICATION_TIERS.LIGHTER_PAYLOAD) {
        summary.lighterPayload++;
      } else if (t.tier === CLASSIFICATION_TIERS.OBSOLETE) {
        summary.obsolete++;
      } else {
        summary.cannotMove++;
      }
      if (tagsByTier[t.tier]) tagsByTier[t.tier].push(t);
    });
    return {
      totalTags: tagsList.length,
      summary,
      removableVendors: Array.from(vendors),
      tagsByTier,
      classifiedTags: classified
    };
  }

  if (gtmTagsResult.tags && typeof gtmTagsResult.tags === 'object') {
    const flattened = [];
    Object.values(gtmTagsResult.tags).forEach(group => {
      if (Array.isArray(group)) {
        group.forEach(item => flattened.push(item.originalData || item));
      }
    });
    return normalizeTagClassification({ tags: flattened });
  }

  return {
    totalTags: 0,
    summary: { removable: 0, lighterPayload: 0, cannotMove: 0, obsolete: 0 },
    removableVendors: [],
    tagsByTier: {
      [CLASSIFICATION_TIERS.REMOVABLE]: [],
      [CLASSIFICATION_TIERS.LIGHTER_PAYLOAD]: [],
      [CLASSIFICATION_TIERS.CANNOT_MOVE]: [],
      [CLASSIFICATION_TIERS.OBSOLETE]: []
    },
    classifiedTags: []
  };
}

module.exports = { normalizeTagClassification };
