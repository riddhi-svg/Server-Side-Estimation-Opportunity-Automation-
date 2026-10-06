const test = require('node:test');
const assert = require('node:assert');
const { calculateMigrationEstimation, calculateMultiRunEstimation } = require('../../src/backend/services/estimation/scoreCalculator');

test('Score Calculator - Baseline Reconstruction Gate (Mismatch Blocks Projection)', () => {
  const mockMismatchedReport = {
    lighthouseVersion: '12.2.0',
    configSettings: { formFactor: 'mobile' },
    categories: { performance: { score: 0.95 } },
    audits: {
      'first-contentful-paint': { numericValue: 3000 },
      'speed-index': { numericValue: 5800 },
      'largest-contentful-paint': { numericValue: 4000 },
      'total-blocking-time': { numericValue: 600 },
      'cumulative-layout-shift': { numericValue: 0.25 }
    }
  };

  const result = calculateMigrationEstimation(mockMismatchedReport, { tags: [] });

  assert.strictEqual(result.performanceScore.status, 'baselineMismatch');
  assert.strictEqual(result.performanceScore.baselineValidation.isValid, false);
  assert.ok(result.warnings.some(w => w.includes('baselineMismatch')));
  assert.strictEqual(result.performanceScore.deltaPoints, 0);
});

test('Score Calculator - Multi-Run Aggregation and Variance', () => {
  const run1 = {
    lighthouseVersion: '12.0.0',
    configSettings: { formFactor: 'mobile' },
    categories: { performance: { score: 0.50 } },
    audits: {
      'first-contentful-paint': { numericValue: 3000 },
      'speed-index': { numericValue: 5800 },
      'largest-contentful-paint': { numericValue: 4000 },
      'total-blocking-time': { numericValue: 600 },
      'cumulative-layout-shift': { numericValue: 0.25 }
    }
  };
  const run2 = {
    lighthouseVersion: '12.0.0',
    configSettings: { formFactor: 'mobile' },
    categories: { performance: { score: 0.52 } },
    audits: {
      'first-contentful-paint': { numericValue: 2900 },
      'speed-index': { numericValue: 5700 },
      'largest-contentful-paint': { numericValue: 3900 },
      'total-blocking-time': { numericValue: 580 },
      'cumulative-layout-shift': { numericValue: 0.25 }
    }
  };
  const run3 = {
    lighthouseVersion: '12.0.0',
    configSettings: { formFactor: 'mobile' },
    categories: { performance: { score: 0.48 } },
    audits: {
      'first-contentful-paint': { numericValue: 3100 },
      'speed-index': { numericValue: 5900 },
      'largest-contentful-paint': { numericValue: 4100 },
      'total-blocking-time': { numericValue: 620 },
      'cumulative-layout-shift': { numericValue: 0.25 }
    }
  };

  const multiResult = calculateMultiRunEstimation([run1, run2, run3], { tags: [] });
  assert.strictEqual(multiResult.multiRun.totalRuns, 3);
  assert.strictEqual(multiResult.multiRun.baselineStats.performanceScore.median, 50);
  assert.ok(typeof multiResult.multiRun.baselineStats.performanceScore.stdDev === 'number');
});
