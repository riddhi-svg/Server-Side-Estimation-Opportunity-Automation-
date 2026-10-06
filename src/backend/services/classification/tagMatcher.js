/**
 * Single Tag Matcher
 * Matches individual tag objects against tier rules.
 */

const vendorConfig = require('../../config/vendorPatterns.json');

const CLASSIFICATION_TIERS = {
  REMOVABLE: 'REMOVABLE_CLIENT_LIBRARY',
  LIGHTER_PAYLOAD: 'STAYS_CLIENT_SIDE_LIGHTER_PAYLOAD',
  CANNOT_MOVE: 'CANNOT_MOVE_NEEDS_REVIEW',
  OBSOLETE: 'OBSOLETE_DELETE'
};

function matchTagTier(tag) {
  const type = (tag.type || '').toLowerCase();
  const name = tag.name || 'Untitled Tag';
  const nameLow = name.toLowerCase();

  // 1. Obsolete
  const obsoleteMatch = vendorConfig.obsoleteVendors.find(v => v.type.toLowerCase() === type);
  if (obsoleteMatch) {
    return {
      tagId: tag.tagId,
      name,
      type: tag.type,
      tier: CLASSIFICATION_TIERS.OBSOLETE,
      category: obsoleteMatch.name,
      vendor: 'Legacy Google Analytics',
      savingsTier: 'OBSOLETE_DELETE',
      notes: obsoleteMatch.notes,
      isRemovable: false
    };
  }

  // 2. Lighter Payload (Google Tag / Ads / GA4 / Floodlight)
  const lighterMatch = vendorConfig.lighterPayloadVendors.find(v => v.type.toLowerCase() === type);
  if (lighterMatch) {
    let category = 'Google Marketing Platform';
    if (type.startsWith('gaaw') || type === 'googtag') category = 'Google Analytics 4 / Google Tag';
    else if (type === 'awct' || type === 'sp') category = 'Google Ads';
    else if (type.startsWith('fl')) category = 'Floodlight';
    else if (type === 'gclidw') category = 'Conversion Linker';

    return {
      tagId: tag.tagId,
      name,
      type: tag.type,
      tier: CLASSIFICATION_TIERS.LIGHTER_PAYLOAD,
      category,
      vendor: 'Google',
      savingsTier: 'STAYS_CLIENT_SIDE_LIGHTER_PAYLOAD',
      notes: lighterMatch.notes,
      isRemovable: false
    };
  }

  // 3. Removable Vendor Matching
  const htmlParam = tag.parameter?.find(p => p.key === 'html')?.value || '';
  const paramValues = tag.parameter?.map(p => `${p.key}=${p.value}`).join(' ') || '';
  const fullTagText = `${nameLow} ${type} ${htmlParam.toLowerCase()} ${paramValues.toLowerCase()}`;

  for (const vendor of vendorConfig.removableVendors) {
    const matchesTemplate = vendor.templatePatterns.some(p => type.includes(p) || (type.startsWith('cvt_') && fullTagText.includes(p)));
    const matchesDomain = vendor.domainPatterns.some(d => fullTagText.includes(d));
    const matchesParamKey = vendor.parameterKeys.some(pk => tag.parameter?.some(p => p.key?.toLowerCase() === pk.toLowerCase()));

    if (matchesTemplate || matchesDomain || matchesParamKey) {
      return {
        tagId: tag.tagId,
        name,
        type: tag.type,
        tier: CLASSIFICATION_TIERS.REMOVABLE,
        category: vendor.name,
        vendor: vendor.name,
        savingsTier: 'REMOVABLE_CLIENT_LIBRARY',
        notes: `Vendor library (${vendor.name}) can be completely removed from browser and moved to sGTM server container.`,
        isRemovable: true
      };
    }
  }

  // 4. Cannot Move / Needs Review
  const isDomDependent = vendorConfig.cannotMoveKeywords.some(kw => fullTagText.includes(kw));
  return {
    tagId: tag.tagId,
    name,
    type: tag.type,
    tier: CLASSIFICATION_TIERS.CANNOT_MOVE,
    category: type === 'html' ? 'Custom HTML' : (type === 'img' ? 'Custom Image' : 'Custom / Unclassified Tag'),
    vendor: 'Unclassified / Custom',
    savingsTier: 'CANNOT_MOVE_NEEDS_REVIEW',
    notes: isDomDependent
      ? 'Tag appears to interact with client-side DOM (Chat, A/B testing, heatmaps, consent) and cannot move.'
      : 'Custom tag requires manual review to determine if client-side DOM dependencies exist.',
    isRemovable: false
  };
}

module.exports = {
  CLASSIFICATION_TIERS,
  matchTagTier
};
