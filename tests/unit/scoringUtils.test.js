const test = require('node:test');
const assert = require('node:assert');
const {
  getLogNormalScore,
  getMetricScoringOptions,
  reconstructBaselinePerformanceScore,
  validateBaselineScore,
  LIGHTHOUSE_SCORING_CURVES
} = require('../../src/backend/utils/scoringUtils');

test('Scoring Utils - Mobile Curve p10 and Median Exact Checks', () => {
  const curves = LIGHTHOUSE_SCORING_CURVES.mobile;

  // At median, score must be ~0.50 (within 0.01)
  assert.ok(Math.abs(getLogNormalScore(curves.fcp, 3000) - 0.50) < 0.01, 'Mobile FCP at median 3000ms should be ~0.50');
  assert.ok(Math.abs(getLogNormalScore(curves.si, 5800) - 0.50) < 0.01, 'Mobile SI at median 5800ms should be ~0.50');
  assert.ok(Math.abs(getLogNormalScore(curves.lcp, 4000) - 0.50) < 0.01, 'Mobile LCP at median 4000ms should be ~0.50');
  assert.ok(Math.abs(getLogNormalScore(curves.tbt, 600) - 0.50) < 0.01, 'Mobile TBT at median 600ms should be ~0.50');
  assert.ok(Math.abs(getLogNormalScore(curves.cls, 0.25) - 0.50) < 0.01, 'Mobile CLS at median 0.25 should be ~0.50');

  // At p10, score must be ~0.90 (within 0.01)
  assert.ok(Math.abs(getLogNormalScore(curves.fcp, 1800) - 0.90) < 0.01, 'Mobile FCP at p10 1800ms should be ~0.90');
  assert.ok(Math.abs(getLogNormalScore(curves.si, 3387) - 0.90) < 0.01, 'Mobile SI at p10 3387ms should be ~0.90');
  assert.ok(Math.abs(getLogNormalScore(curves.lcp, 2500) - 0.90) < 0.01, 'Mobile LCP at p10 2500ms should be ~0.90');
  assert.ok(Math.abs(getLogNormalScore(curves.tbt, 200) - 0.90) < 0.01, 'Mobile TBT at p10 200ms should be ~0.90');
  assert.ok(Math.abs(getLogNormalScore(curves.cls, 0.10) - 0.90) < 0.01, 'Mobile CLS at p10 0.10 should be ~0.90');
});

test('Scoring Utils - Desktop Curve p10 and Median Exact Checks', () => {
  const curves = LIGHTHOUSE_SCORING_CURVES.desktop;

  // At median, score must be ~0.50
  assert.ok(Math.abs(getLogNormalScore(curves.fcp, 1600) - 0.50) < 0.01, 'Desktop FCP at median 1600ms should be ~0.50');
  assert.ok(Math.abs(getLogNormalScore(curves.si, 2300) - 0.50) < 0.01, 'Desktop SI at median 2300ms should be ~0.50');
  assert.ok(Math.abs(getLogNormalScore(curves.lcp, 2400) - 0.50) < 0.01, 'Desktop LCP at median 2400ms should be ~0.50');
  assert.ok(Math.abs(getLogNormalScore(curves.tbt, 350) - 0.50) < 0.01, 'Desktop TBT at median 350ms should be ~0.50');
  assert.ok(Math.abs(getLogNormalScore(curves.cls, 0.25) - 0.50) < 0.01, 'Desktop CLS at median 0.25 should be ~0.50');

  // At p10, score must be ~0.90
  assert.ok(Math.abs(getLogNormalScore(curves.fcp, 934) - 0.90) < 0.01, 'Desktop FCP at p10 934ms should be ~0.90');
  assert.ok(Math.abs(getLogNormalScore(curves.si, 1311) - 0.90) < 0.01, 'Desktop SI at p10 1311ms should be ~0.90');
  assert.ok(Math.abs(getLogNormalScore(curves.lcp, 1200) - 0.90) < 0.01, 'Desktop LCP at p10 1200ms should be ~0.90');
  assert.ok(Math.abs(getLogNormalScore(curves.tbt, 150) - 0.90) < 0.01, 'Desktop TBT at p10 150ms should be ~0.90');
  assert.ok(Math.abs(getLogNormalScore(curves.cls, 0.10) - 0.90) < 0.01, 'Desktop CLS at p10 0.10 should be ~0.90');
});

test('Scoring Utils - Baseline Score Reconstruction and Gate', () => {
  // If all metrics are at median (0.50 each), weighted score is 50
  const rawMetricsAtMedian = { fcp: 3000, si: 5800, lcp: 4000, tbt: 600, cls: 0.25 };
  const res = reconstructBaselinePerformanceScore(rawMetricsAtMedian, 'mobile');
  assert.strictEqual(res.reconstructedScore, 50, 'Score of all metrics at median must be 50');

  // Gate validation - match within 2 points
  const validCheck = validateBaselineScore(51, res.reconstructedScore, '12.0.0', 2);
  assert.strictEqual(validCheck.isValid, true);
  assert.strictEqual(validCheck.warning, null);

  // Gate validation - mismatch > 2 points fails with clear baselineMismatch warning
  const invalidCheck = validateBaselineScore(60, res.reconstructedScore, '12.2.0', 2);
  assert.strictEqual(invalidCheck.isValid, false);
  assert.ok(invalidCheck.warning.includes('baselineMismatch'));
  assert.ok(invalidCheck.warning.includes('12.2.0'));
});
