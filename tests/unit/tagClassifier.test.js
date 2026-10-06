const test = require('node:test');
const assert = require('node:assert');
const { classifyTag, classifyContainerTags, CLASSIFICATION_TIERS } = require('../../src/backend/services/tagClassifier');

test('Tag Classifier - Removable Templates (cvt_*)', () => {
  const metaTag = {
    tagId: '101',
    name: 'Meta Pixel - PageView',
    type: 'cvt_facebook_pixel',
    parameter: [{ key: 'pixelId', value: '123456789' }]
  };
  const classifiedMeta = classifyTag(metaTag);
  assert.strictEqual(classifiedMeta.tier, CLASSIFICATION_TIERS.REMOVABLE);
  assert.strictEqual(classifiedMeta.vendor, 'Meta / Facebook');
  assert.strictEqual(classifiedMeta.isRemovable, true);

  const criteoTag = {
    tagId: '102',
    name: 'Criteo OneTag',
    type: 'cvt_criteo_one_tag',
    parameter: [{ key: 'account_id', value: '98765' }]
  };
  const classifiedCriteo = classifyTag(criteoTag);
  assert.strictEqual(classifiedCriteo.tier, CLASSIFICATION_TIERS.REMOVABLE);
  assert.strictEqual(classifiedCriteo.vendor, 'Criteo');

  const tiktokTag = {
    tagId: '103',
    name: 'TikTok Pixel',
    type: 'cvt_tiktok',
    parameter: [{ key: 'pixelCode', value: 'TT-123' }]
  };
  const classifiedTiktok = classifyTag(tiktokTag);
  assert.strictEqual(classifiedTiktok.tier, CLASSIFICATION_TIERS.REMOVABLE);
  assert.strictEqual(classifiedTiktok.vendor, 'TikTok');
});

test('Tag Classifier - Custom HTML with Vendor Domains', () => {
  const htmlMeta = {
    tagId: '201',
    name: 'Custom HTML - Facebook Pixel',
    type: 'html',
    parameter: [{
      key: 'html',
      value: '<script src="https://connect.facebook.net/en_US/fbevents.js"></script>'
    }]
  };
  const classified = classifyTag(htmlMeta);
  assert.strictEqual(classified.tier, CLASSIFICATION_TIERS.REMOVABLE);
  assert.strictEqual(classified.vendor, 'Meta / Facebook');

  const htmlCriteo = {
    tagId: '202',
    name: 'Custom HTML - Criteo Loader',
    type: 'html',
    parameter: [{
      key: 'html',
      value: '<script src="//static.criteo.net/js/ld/ld.js"></script>'
    }]
  };
  const classifiedCriteo = classifyTag(htmlCriteo);
  assert.strictEqual(classifiedCriteo.tier, CLASSIFICATION_TIERS.REMOVABLE);
  assert.strictEqual(classifiedCriteo.vendor, 'Criteo');
});

test('Tag Classifier - Stays Client-Side, Lighter Payload (Google Tag / Ads / GA4)', () => {
  const ga4Config = { tagId: '301', name: 'GA4 Configuration', type: 'gaawc' };
  const ga4Event = { tagId: '302', name: 'GA4 Purchase Event', type: 'gaawe' };
  const gTag = { tagId: '303', name: 'Google Tag', type: 'googtag' };
  const gAdsConv = { tagId: '304', name: 'Google Ads Purchase', type: 'awct' };
  const floodlight = { tagId: '305', name: 'Floodlight Sales', type: 'fls' };
  const convLinker = { tagId: '306', name: 'Conversion Linker', type: 'gclidw' };

  [ga4Config, ga4Event, gTag, gAdsConv, floodlight, convLinker].forEach(tag => {
    const res = classifyTag(tag);
    assert.strictEqual(res.tier, CLASSIFICATION_TIERS.LIGHTER_PAYLOAD, `${tag.type} should be in lighter payload tier`);
    assert.strictEqual(res.isRemovable, false);
  });
});

test('Tag Classifier - Obsolete Universal Analytics (Delete Class)', () => {
  const uaTag = { tagId: '401', name: 'UA Pageview', type: 'ua' };
  const legacyGa = { tagId: '402', name: 'Classic GA', type: 'ga' };

  [uaTag, legacyGa].forEach(tag => {
    const res = classifyTag(tag);
    assert.strictEqual(res.tier, CLASSIFICATION_TIERS.OBSOLETE);
    assert.strictEqual(res.isRemovable, false);
  });
});

test('Tag Classifier - DOM-Dependent and Unclassified (Needs Review)', () => {
  const chatTag = {
    tagId: '501',
    name: 'Intercom Chat Widget',
    type: 'html',
    parameter: [{ key: 'html', value: '<script>window.Intercom("boot")</script>' }]
  };
  const resChat = classifyTag(chatTag);
  assert.strictEqual(resChat.tier, CLASSIFICATION_TIERS.CANNOT_MOVE);

  const plainHtml = {
    tagId: '502',
    name: 'Custom Header Modification',
    type: 'html',
    parameter: [{ key: 'html', value: '<script>document.getElementById("btn").click();</script>' }]
  };
  const resHtml = classifyTag(plainHtml);
  assert.strictEqual(resHtml.tier, CLASSIFICATION_TIERS.CANNOT_MOVE);
});
