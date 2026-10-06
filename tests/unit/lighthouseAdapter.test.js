const test = require('node:test');
const assert = require('node:assert');
const { normalizeLighthouseReport } = require('../../src/backend/services/lighthouseAdapter');

test('Lighthouse Adapter - LH 12 Report Shape Normalization', () => {
  const lh12Payload = {
    lighthouseVersion: '12.2.0',
    configSettings: { formFactor: 'mobile' },
    categories: { performance: { score: 0.75 } },
    audits: {
      'first-contentful-paint': { numericValue: 2000, scoringOptions: { p10: 1800, median: 3000 } },
      'speed-index': { numericValue: 4000, scoringOptions: { p10: 3387, median: 5800 } },
      'largest-contentful-paint': { numericValue: 3000, scoringOptions: { p10: 2500, median: 4000 } },
      'total-blocking-time': { numericValue: 350, scoringOptions: { p10: 200, median: 600 } },
      'cumulative-layout-shift': { numericValue: 0.05, scoringOptions: { p10: 0.1, median: 0.25 } },
      'render-blocking-resources': {
        details: {
          items: [{ url: 'https://example.com/pixel.js', wastedMs: 150, totalBytes: 25000 }]
        }
      },
      'third-party-summary': {
        details: {
          items: [
            {
              entity: 'Google Tag Manager',
              transferSize: 50000,
              blockingTime: 120,
              subItems: { items: [{ url: 'https://www.googletagmanager.com/gtm.js', transferSize: 50000, blockingTime: 120 }] }
            }
          ]
        }
      },
      'bootup-time': {
        details: {
          items: [{ url: 'https://www.googletagmanager.com/gtm.js', total: 200, scripting: 180 }]
        }
      },
      'long-tasks': {
        details: {
          items: [{ url: 'https://www.googletagmanager.com/gtm.js', duration: 90, startTime: 1200 }]
        }
      },
      'mainthread-work-breakdown': {
        details: {
          items: [{ groupLabel: 'Script Evaluation', duration: 400 }]
        }
      }
    }
  };

  const norm = normalizeLighthouseReport(lh12Payload);
  assert.strictEqual(norm.lighthouseVersion, '12.2.0');
  assert.strictEqual(norm.formFactor, 'mobile');
  assert.strictEqual(norm.performanceScore, 75);
  assert.strictEqual(norm.renderBlocking.length, 1);
  assert.strictEqual(norm.renderBlocking[0].wastedMs, 150);
  assert.strictEqual(norm.thirdParties.length, 1);
  assert.strictEqual(norm.thirdParties[0].entity, 'Google Tag Manager');
  assert.strictEqual(norm.bootup.length, 1);
  assert.strictEqual(norm.longTasks.length, 1);
  assert.strictEqual(norm.warnings.length, 0);
});

test('Lighthouse Adapter - LH 13 Report Shape Normalization', () => {
  const lh13Payload = {
    lighthouseVersion: '13.0.0',
    configSettings: { formFactor: 'desktop' },
    categories: { performance: { score: 0.90 } },
    audits: {
      'first-contentful-paint': { numericValue: 1000 },
      'speed-index': { numericValue: 1500 },
      'largest-contentful-paint': { numericValue: 1400 },
      'total-blocking-time': { numericValue: 50 },
      'cumulative-layout-shift': { numericValue: 0.01 },
      'render-blocking-insight': {
        details: {
          items: [{ url: 'https://connect.facebook.net/en_US/fbevents.js', wastedMs: 80, totalBytes: 40000 }]
        }
      },
      'third-parties-insight': {
        details: {
          items: [
            {
              entity: { text: 'Meta' },
              transferSize: 40000,
              mainThreadTime: 100,
              subItems: { items: [{ url: 'https://connect.facebook.net/en_US/fbevents.js', transferSize: 40000, mainThreadTime: 100 }] }
            }
          ]
        }
      },
      'bootup-time': {
        details: {
          items: [{ url: 'https://connect.facebook.net/en_US/fbevents.js', total: 100, scripting: 80 }]
        }
      },
      'long-tasks': {
        details: {
          items: [{ url: 'https://connect.facebook.net/en_US/fbevents.js', duration: 70, startTime: 900 }]
        }
      },
      'mainthread-work-breakdown': {
        details: {
          items: [{ groupLabel: 'Script Evaluation', duration: 250 }]
        }
      }
    }
  };

  const norm = normalizeLighthouseReport(lh13Payload);
  assert.strictEqual(norm.lighthouseVersion, '13.0.0');
  assert.strictEqual(norm.formFactor, 'desktop');
  assert.strictEqual(norm.performanceScore, 90);
  assert.strictEqual(norm.renderBlocking.length, 1);
  assert.strictEqual(norm.renderBlocking[0].url, 'https://connect.facebook.net/en_US/fbevents.js');
  assert.strictEqual(norm.thirdParties.length, 1);
  assert.strictEqual(norm.thirdParties[0].entity, 'Meta');
  assert.strictEqual(norm.warnings.length, 0);
});

test('Lighthouse Adapter - Graceful Degradation on Missing Audits', () => {
  const minimalPayload = {
    lighthouseVersion: '13.0.0',
    categories: { performance: { score: 0.50 } },
    audits: {
      'first-contentful-paint': { numericValue: 2500 }
    }
  };

  const norm = normalizeLighthouseReport(minimalPayload);
  assert.strictEqual(norm.performanceScore, 50);
  assert.ok(norm.warnings.length > 0, 'Should contain warnings for missing audits');
  assert.doesNotThrow(() => normalizeLighthouseReport(null));
});
