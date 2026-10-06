const { runPageSpeedTest, generateFinalGtmMigrationResult } = require('../src/backend/pagespeed-test');

async function run() {
  const url = 'https://www.royalenfield.com/in/en/home/';
  const strategy = 'mobile';
  const gtmTagsResult = {
    summary: { totalTags: 350, migrationSummary: { 'Potentially Server-Side': 219 }, tagsByCategory: {} },
    tags: {}
  };
  
  const result = await runPageSpeedTest(url, strategy);
  result.finalGtmMigrationResult = generateFinalGtmMigrationResult(result, gtmTagsResult);
  console.log('Exists?', Boolean(result.finalGtmMigrationResult));
  console.log('Keys:', Object.keys(result));
}

run().catch(console.error);
