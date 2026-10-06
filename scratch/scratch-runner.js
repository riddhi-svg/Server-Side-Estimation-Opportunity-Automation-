const { runPageSpeedTest, generateFinalGtmMigrationResult } = require('../src/backend/pagespeed-test');

const mockGtmTagsResult = {
  summary: {
    totalTags: 39,
    migrationSummary: {
      'Potentially Server-Side': 18,
      'Client-Side Only / Keep Client-Side': 12,
      'Needs Review': 9
    },
    tagsByCategory: {
      'Google Analytics / GA4': 10,
      'Google Ads': 8,
      'Meta / Facebook': 10,
      'Other': 11
    }
  },
  tags: {
    'Google Analytics / GA4': [
      { name: 'GA4 Base', type: 'gaawe', category: 'Google Analytics / GA4', migrationClassification: 'Potentially Server-Side' }
    ],
    'Google Ads': [
      { name: 'Google Ads Conversion', type: 'awct', category: 'Google Ads', migrationClassification: 'Potentially Server-Side' }
    ]
  }
};

(async () => {
  try {
    console.log('Running PageSpeed Test for Royal Enfield...');
    const resultObj = await runPageSpeedTest('https://www.royalenfield.com/in/en/home/', 'mobile');
    
    console.log('\n--- Generating Final GTM Migration Result ---');
    const finalResult = generateFinalGtmMigrationResult(resultObj, mockGtmTagsResult);
    
    console.log(JSON.stringify(finalResult, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
})();
