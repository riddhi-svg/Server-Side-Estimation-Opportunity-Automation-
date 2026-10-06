const { runPageSpeedTest, generateFinalGtmMigrationResult } = require('../src/backend/pagespeed-test');

const urls = [
  'https://www.royalenfield.com/in/en/home/',
  'https://example.com/',
  'https://www.google.com/'
];

const mockGtmTagsResult = {
  summary: { totalTags: 39, migrationSummary: { 'Potentially Server-Side': 18, 'Client-Side Only / Keep Client-Side': 12, 'Needs Review': 9 }, tagsByCategory: { 'Google Analytics / GA4': 10, 'Google Ads': 8, 'Meta / Facebook': 10, 'Other': 11 } },
  tags: {
    'Google Analytics / GA4': [{ migrationClassification: 'Potentially Server-Side' }],
    'Meta / Facebook': [{ migrationClassification: 'Potentially Server-Side' }],
    'Google Ads': [{ migrationClassification: 'Potentially Server-Side' }]
  }
};

async function run() {
  for (const url of urls) {
    for (const strategy of ['mobile', 'desktop']) {
      try {
        const result = await runPageSpeedTest(url, strategy);
        const finalObj = generateFinalGtmMigrationResult(result, mockGtmTagsResult);
        
        const mScores = result.metricScores;
        const actualScore = result.performanceScore.value;
        const currentTbt = result.otherMetrics.tbt;
        
        let reconstructedRounded = null;
        let diff = null;
        
        if (mScores && mScores.fcp !== null && mScores.si !== null && mScores.lcp !== null && mScores.cls !== null && mScores.tbt !== null) {
          const reconstructed = (mScores.fcp * 0.10) + (mScores.si * 0.10) + (mScores.lcp * 0.25) + (mScores.cls * 0.25) + (mScores.tbt * 0.30);
          reconstructedRounded = Math.round(reconstructed * 100);
          diff = reconstructedRounded - actualScore;
        }

        console.log(`URL: ${url} | ${strategy}`);
        console.log(`Actual Score: ${actualScore}`);
        console.log(`Reconstructed Score: ${reconstructedRounded}`);
        console.log(`Difference: ${diff}`);
        console.log(`Validation Status: ${finalObj.estimatedImpact.change.performanceScore.status}`);
        console.log(`Estimated Score: ${finalObj.estimatedImpact.estimated.performanceScore}`);
        console.log(`Current TBT: ${currentTbt} ms`);
        console.log(`Estimated TBT: ${finalObj.estimatedImpact.estimated.tbt} ms`);
        console.log('---');
      } catch (err) {
        console.error(`Failed to test ${url} (${strategy}):`, err.message);
      }
    }
  }
}

run();
