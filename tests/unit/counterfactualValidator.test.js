const test = require('node:test');
const assert = require('node:assert');
const { validateCounterfactualRun, generateCalibrationReport } = require('../../src/backend/services/counterfactualValidator');

test('Counterfactual Validator - Calibration Report and Tuning Recommendations', () => {
  const empiricalDelta = { performanceScore: 6, fcp: 0, si: 350, lcp: 0, tbt: 250, cls: 0 };
  const projectedDelta = { performanceScore: 5, fcp: 0, si: 300, lcp: 0, tbt: 220, cls: 0 };

  const report = generateCalibrationReport(empiricalDelta, projectedDelta);
  assert.strictEqual(report.accuracyRating, 'Excellent');
  assert.strictEqual(report.performanceScoreErrorPoints, 1);
  assert.strictEqual(report.metricErrors.si.absoluteError, 50);
  assert.strictEqual(report.metricErrors.tbt.absoluteError, 30);
});

test('Counterfactual Validator - Multi-Run Validation Workflow', () => {
  const baseRun = {
    lighthouseVersion: '12.0.0',
    configSettings: { formFactor: 'mobile' },
    categories: { performance: { score: 0.60 } },
    audits: {
      'first-contentful-paint': { numericValue: 2000 },
      'speed-index': { numericValue: 4000 },
      'largest-contentful-paint': { numericValue: 3000 },
      'total-blocking-time': { numericValue: 500 },
      'cumulative-layout-shift': { numericValue: 0.1 },
      'bootup-time': {
        details: { items: [{ url: 'https://connect.facebook.net/fbevents.js', total: 300, tbtImpact: 200 }] }
      },
      'third-party-summary': {
        details: {
          items: [{
            entity: 'Meta',
            transferSize: 50000,
            blockingTime: 200,
            subItems: { items: [{ url: 'https://connect.facebook.net/fbevents.js', transferSize: 50000, mainThreadTime: 300 }] }
          }]
        }
      }
    }
  };

  const blockedRun = {
    lighthouseVersion: '12.0.0',
    configSettings: { formFactor: 'mobile' },
    categories: { performance: { score: 0.68 } },
    audits: {
      'first-contentful-paint': { numericValue: 2000 },
      'speed-index': { numericValue: 3850 },
      'largest-contentful-paint': { numericValue: 3000 },
      'total-blocking-time': { numericValue: 300 },
      'cumulative-layout-shift': { numericValue: 0.1 }
    }
  };

  const mockTags = {
    summary: { removable: 1, lighterPayload: 0, cannotMove: 0, obsolete: 0 },
    totalTags: 1,
    removableVendors: ['Meta / Facebook'],
    tagsByTier: {
      REMOVABLE_CLIENT_LIBRARY: [{ name: 'Meta Pixel', vendor: 'Meta / Facebook', tier: 'REMOVABLE_CLIENT_LIBRARY' }]
    }
  };

  const result = validateCounterfactualRun([baseRun], [blockedRun], mockTags);
  assert.strictEqual(result.baselineRuns, 1);
  assert.strictEqual(result.blockedRuns, 1);
  assert.strictEqual(result.empiricalMeasured.measuredDelta.tbt, 200);
  assert.ok(result.calibration.accuracyRating);
});
