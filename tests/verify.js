const { generateFinalGtmMigrationResult } = require('../src/backend/services/estimation/migrationEstimator');

const pageSpeedResult = {
  strategy: 'mobile',
  performanceReport: {
    gtmPerformanceBaseline: {
      gtmResourceCount: 1,
      gtmTransferSize: 100,
      gtmMainThreadTimeMs: 10,
      gtmBootupTimeMs: 5
    }
  }
};

const gtmTagsResult = {
  summary: { totalTags: 350 },
  tags: {}
};

const final = generateFinalGtmMigrationResult(pageSpeedResult, gtmTagsResult);
console.log('Final generated successfully:', Boolean(final));
