const { runPageSpeedTest } = require('../src/backend/pagespeed-test');

async function validate() {
  const TARGET_URL = 'https://www.royalenfield.com/in/en/home/';
  console.log('Running test for', TARGET_URL);
  const pageSpeedResult = await runPageSpeedTest(TARGET_URL, 'mobile');
  
  const mockGtmTagsResult = {
    summary: {
      totalTags: 350,
      migrationSummary: { 'Potentially Server-Side': 219, 'Client-Side Only / Keep Client-Side': 100, 'Needs Review': 31 },
      tagsByCategory: { 'Google Analytics / GA4': 100, 'Meta / Facebook': 50, 'Google Ads': 50, 'Floodlight': 19, 'Other': 131 }
    },
    tags: {
      'Google Analytics / GA4': Array(100).fill({ migrationClassification: 'Potentially Server-Side' }),
      'Meta / Facebook': Array(50).fill({ migrationClassification: 'Potentially Server-Side' }),
      'Google Ads': Array(50).fill({ migrationClassification: 'Potentially Server-Side' }),
      'Floodlight': Array(19).fill({ migrationClassification: 'Potentially Server-Side' }),
      'Other': Array(131).fill({ migrationClassification: 'Client-Side Only / Keep Client-Side' })
    }
  };

  const migratableVendors = new Set(['Analytics', 'Google Tag', 'Google Ads', 'Meta / Facebook', 'Criteo']);
  
  const thirdPartyInventory = pageSpeedResult.performanceReport?.thirdPartyInventory || [];
  const vendorStats = {};

  thirdPartyInventory.forEach(item => {
    const isGtm = item.attributionStatus === 'GTM_CORE' || item.attributionStatus === 'GTM_TRIGGERED_THIRD_PARTY';
    const isMigratable = isGtm && migratableVendors.has(item.vendor);

    let tbt = 0;
    if (item.evidence) {
      item.evidence.forEach(ev => {
        if (ev.type === 'long-task' && ev.durationMs > 50) {
          tbt += (ev.durationMs - 50);
        }
      });
    }

    if (!vendorStats[item.vendor]) {
      vendorStats[item.vendor] = { isMigratable, transferSize: 0, mainThreadTime: 0, bootupTime: 0, tbt: 0, count: 0, resources: [] };
    }
    
    // Some vendors might have both migratable and non-migratable resources depending on attributionStatus
    // We'll track per resource instead
    vendorStats[item.vendor].transferSize += (item.transferSize || 0);
    vendorStats[item.vendor].mainThreadTime += (item.mainThreadTimeMs || 0);
    vendorStats[item.vendor].bootupTime += (item.bootupTimeMs || 0);
    vendorStats[item.vendor].tbt += tbt;
    vendorStats[item.vendor].count += 1;
    vendorStats[item.vendor].resources.push({
      url: item.url,
      attributionStatus: item.attributionStatus,
      isMigratable
    });
  });

  console.log(JSON.stringify(vendorStats, null, 2));

  // Also print the estimated impact
  const { calculateMigrationEstimation } = require('../src/backend/pagespeed-test'); // Wait, calculateMigrationEstimation is not exported
}

validate().catch(console.error);
