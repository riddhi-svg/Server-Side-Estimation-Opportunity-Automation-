const fs = require('fs');

const data = fs.readFileSync('scratch-test-output-final-mobile.txt', 'utf8');

// The file contains a JSON block for "--- Third-Party & GTM Analysis ---"
const jsonStart = data.indexOf('{\n  "entities"');
const jsonEnd = data.indexOf('----------------------------------\n', jsonStart);
const thirdPartyStr = data.substring(jsonStart, jsonEnd).trim();
const thirdPartyAnalysis = JSON.parse(thirdPartyStr);

const migratableVendors = new Set(['Analytics', 'Google Tag', 'Google Ads', 'Meta / Facebook', 'Criteo']);
const vendorStats = {};

thirdPartyAnalysis.entities.forEach(item => {
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
    vendorStats[item.vendor] = { isMigratable, transferSize: 0, mainThreadTime: 0, bootupTime: 0, tbt: 0, count: 0 };
  }
  
  vendorStats[item.vendor].transferSize += (item.transferSize || 0);
  vendorStats[item.vendor].mainThreadTime += (item.mainThreadTimeMs || 0);
  vendorStats[item.vendor].bootupTime += (item.bootupTimeMs || 0);
  vendorStats[item.vendor].tbt += tbt;
  vendorStats[item.vendor].count += 1;
});

console.log("VENDOR STATS (from previous trace):");
console.log(JSON.stringify(vendorStats, null, 2));

// Calculate totals
let migratableTransferSize = 0;
let migratableMainThreadTime = 0;
let migratableBootupTime = 0;
let migratableTbt = 0;

Object.entries(vendorStats).forEach(([vendor, stats]) => {
  if (stats.isMigratable) {
    migratableTransferSize += stats.transferSize;
    migratableMainThreadTime += stats.mainThreadTime;
    migratableBootupTime += stats.bootupTime;
    migratableTbt += stats.tbt;
  }
});

console.log("\nTOTAL MIGRATABLE:");
console.log("Transfer Size:", (migratableTransferSize/1024).toFixed(2), "KB");
console.log("Main Thread:", migratableMainThreadTime.toFixed(2), "ms");
console.log("Bootup:", migratableBootupTime.toFixed(2), "ms");
console.log("TBT:", migratableTbt.toFixed(2), "ms");
