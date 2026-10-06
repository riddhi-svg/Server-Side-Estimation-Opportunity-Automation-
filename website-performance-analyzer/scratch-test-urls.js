const { runPageSpeedTest, generateFinalGtmMigrationResult } = require('./pagespeed-test');

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
      console.log(`\n\n=== URL: ${url} | Strategy: ${strategy} ===\n`);
      try {
        const result = await runPageSpeedTest(url, strategy);
        const finalObj = generateFinalGtmMigrationResult(result, mockGtmTagsResult);
        console.log(JSON.stringify(finalObj.estimatedImpact, null, 2));
      } catch (err) {
        console.error(`Failed to test ${url} (${strategy}):`, err);
      }
    }
  }
}

run();
