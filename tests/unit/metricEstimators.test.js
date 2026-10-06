const test = require('node:test');
const assert = require('node:assert');
const { calculateMigrationEstimation } = require('../../src/backend/services/estimation/scoreCalculator');
const { CLASSIFICATION_TIERS } = require('../../src/backend/services/tagClassifier');

function createMockReport(audits, loadingExperience = null) {
  return {
    lighthouseVersion: '12.0.0',
    configSettings: { formFactor: 'mobile' },
    categories: { performance: { score: 0.50 } },
    ...(loadingExperience ? { loadingExperience } : {}),
    audits
  };
}

function createMockTags(vendorName, tagName) {
  return {
    summary: { removable: 1, lighterPayload: 0, cannotMove: 0, obsolete: 0 },
    totalTags: 1,
    removableVendors: [vendorName],
    tagsByTier: {
      [CLASSIFICATION_TIERS.REMOVABLE]: [{ name: tagName, vendor: vendorName, tier: CLASSIFICATION_TIERS.REMOVABLE }]
    }
  };
}

test('Metric Estimators - TBT Clamping and Attributable Deduction', () => {
  const mockReport = createMockReport({
    'first-contentful-paint': { numericValue: 3000 },
    'speed-index': { numericValue: 5800 },
    'largest-contentful-paint': { numericValue: 4000 },
    'total-blocking-time': { numericValue: 600 },
    'cumulative-layout-shift': { numericValue: 0.25 },
    'bootup-time': { details: { items: [{ url: 'https://connect.facebook.net/en_US/fbevents.js', total: 400, tbtImpact: 350 }] } },
    'third-party-summary': { details: { items: [{ entity: 'Meta', transferSize: 60000, blockingTime: 350, subItems: { items: [{ url: 'https://connect.facebook.net/en_US/fbevents.js', transferSize: 60000, blockingTime: 350 }] } }] } },
    'mainthread-work-breakdown': { details: { items: [{ groupLabel: 'Script Evaluation', duration: 1000 }] } }
  });

  const result = calculateMigrationEstimation(mockReport, createMockTags('Meta / Facebook', 'Meta Pixel'));
  assert.strictEqual(result.current.tbt, 600);
  assert.strictEqual(result.estimated.tbt, 250);
  assert.strictEqual(result.change.tbt.absolute, 350);
  assert.ok(result.estimated.tbt >= 0);
});

test('Metric Estimators - LCP and FCP Flooring and Cap Rules', () => {
  const mockReport = createMockReport({
    'first-contentful-paint': { numericValue: 2500 },
    'speed-index': { numericValue: 4000 },
    'largest-contentful-paint': { numericValue: 3200 },
    'total-blocking-time': { numericValue: 400 },
    'cumulative-layout-shift': { numericValue: 0.1 },
    'render-blocking-resources': { details: { items: [{ url: 'https://static.criteo.net/js/ld/ld.js', wastedMs: 500, totalBytes: 20000 }] } },
    'bootup-time': { details: { items: [{ url: 'https://static.criteo.net/js/ld/ld.js', total: 200, tbtImpact: 100 }] } },
    'third-party-summary': { details: { items: [{ entity: 'Criteo', transferSize: 20000, blockingTime: 100, subItems: { items: [{ url: 'https://static.criteo.net/js/ld/ld.js', transferSize: 20000, blockingTime: 100 }] } }] } }
  });

  const result = calculateMigrationEstimation(mockReport, createMockTags('Criteo', 'Criteo Tag'));
  assert.strictEqual(result.estimated.fcp, 2000);
  assert.strictEqual(result.estimated.lcp, 2700);
  assert.ok(result.estimated.lcp >= result.estimated.fcp);
  assert.strictEqual(result.change.lcp.absolute, result.change.fcp.absolute);
});

test('Metric Estimators - Speed Index Cap Rule and Alpha Factor', () => {
  const mockReport = createMockReport({
    'first-contentful-paint': { numericValue: 2000 },
    'speed-index': { numericValue: 3000 },
    'largest-contentful-paint': { numericValue: 2500 },
    'total-blocking-time': { numericValue: 200 },
    'cumulative-layout-shift': { numericValue: 0.05 },
    'bootup-time': { details: { items: [{ url: 'https://connect.facebook.net/fbevents.js', total: 600, tbtImpact: 200 }] } },
    'third-party-summary': { details: { items: [{ entity: 'Meta', transferSize: 50000, blockingTime: 200, subItems: { items: [{ url: 'https://connect.facebook.net/fbevents.js', transferSize: 50000, mainThreadTime: 600 }] } }] } }
  });

  const result = calculateMigrationEstimation(mockReport, createMockTags('Meta / Facebook', 'Meta Pixel'), { speedIndexAlpha: 0.50 });
  assert.strictEqual(result.estimated.speedIndex, 2700);
  assert.strictEqual(result.change.speedIndex.absolute, 300);
  assert.ok(result.estimated.speedIndex >= result.estimated.fcp);
});

test('Metric Estimators - INP Proportional Heuristic, Ranges, and Lab Score Isolation', () => {
  const mockReport = createMockReport(
    {
      'first-contentful-paint': { numericValue: 2000 },
      'speed-index': { numericValue: 4000 },
      'largest-contentful-paint': { numericValue: 3000 },
      'total-blocking-time': { numericValue: 300 },
      'cumulative-layout-shift': { numericValue: 0.1 },
      'mainthread-work-breakdown': { details: { items: [{ groupLabel: 'Script Evaluation', duration: 1000 }] } },
      'bootup-time': { details: { items: [{ url: 'https://connect.facebook.net/fbevents.js', total: 400, tbtImpact: 200 }] } },
      'third-party-summary': { details: { items: [{ entity: 'Meta', transferSize: 50000, blockingTime: 200, subItems: { items: [{ url: 'https://connect.facebook.net/fbevents.js', transferSize: 50000, mainThreadTime: 400 }] } }] } }
    },
    { metrics: { INTERACTION_TO_NEXT_PAINT: { percentile: 400 } } }
  );

  const result = calculateMigrationEstimation(mockReport, createMockTags('Meta / Facebook', 'Meta Pixel'));
  const inp = result.metrics.coreWebVitals.inp;
  assert.ok(inp !== null);
  assert.strictEqual(inp.current, 400);
  assert.strictEqual(inp.isLabScoreComponent, false);
  assert.ok(inp.likely < 400);
  assert.ok(inp.likely >= 50);
  assert.ok(inp.conservative >= inp.likely);
  assert.ok(inp.likely >= inp.optimistic);
});
