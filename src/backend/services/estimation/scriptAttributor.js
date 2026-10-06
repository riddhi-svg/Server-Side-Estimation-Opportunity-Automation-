/**
 * Script URL Attributor
 * Maps individual script URLs to known vendor definitions and classification tiers.
 */

const vendorConfig = require('../../config/vendorPatterns.json');
const { CLASSIFICATION_TIERS } = require('../tagClassifier');

function normalizeUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}${u.pathname}`;
  } catch {
    return url.split('?')[0].split('#')[0];
  }
}

function attributeScriptUrl(rawUrl, entityName = '', containerRemovableVendors = []) {
  if (!rawUrl) {
    return {
      vendor: entityName || 'Unknown',
      tier: CLASSIFICATION_TIERS.CANNOT_MOVE,
      isRemovable: false,
      isGtmCore: false,
      confidence: 'low'
    };
  }

  const url = rawUrl.toLowerCase();
  const entity = (entityName || '').toLowerCase();

  // 1. GTM Core
  if (url.includes('googletagmanager.com/gtm.js')) {
    return {
      vendor: 'Google Tag Manager',
      tier: 'GTM_CORE',
      isRemovable: false,
      isGtmCore: true,
      confidence: 'medium'
    };
  }

  // 2. Google Tag (GA4 / Ads) - Stays Client-Side
  if (url.includes('googletagmanager.com/gtag/js') || url.includes('google-analytics.com/analytics.js') || url.includes('google-analytics.com/g/collect')) {
    return {
      vendor: 'Google Tag (GA4 / Ads)',
      tier: CLASSIFICATION_TIERS.LIGHTER_PAYLOAD,
      isRemovable: false,
      isGtmCore: false,
      confidence: 'high'
    };
  }

  // 3. Removable Vendor Library matching
  for (const v of vendorConfig.removableVendors) {
    const matchesDomain = v.domainPatterns.some(d => url.includes(d.toLowerCase()));
    const matchesEntity = v.name.toLowerCase().includes(entity) || entity.includes(v.name.toLowerCase());
    const isPresentInGtm = containerRemovableVendors.length === 0 || containerRemovableVendors.some(cv =>
      cv.toLowerCase().includes(v.name.toLowerCase()) || v.name.toLowerCase().includes(cv.toLowerCase())
    );

    if (matchesDomain || (matchesEntity && isPresentInGtm)) {
      return {
        vendor: v.name,
        tier: CLASSIFICATION_TIERS.REMOVABLE,
        isRemovable: true,
        isGtmCore: false,
        confidence: 'high'
      };
    }
  }

  return {
    vendor: entityName || 'Other / Third-Party',
    tier: CLASSIFICATION_TIERS.CANNOT_MOVE,
    isRemovable: false,
    isGtmCore: false,
    confidence: 'low'
  };
}

module.exports = {
  normalizeUrl,
  attributeScriptUrl
};
