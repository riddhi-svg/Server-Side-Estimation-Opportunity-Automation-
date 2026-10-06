const { runPageSpeedTest, generateFinalGtmMigrationResult } = require('./pagespeed-test.js');

async function debugUrl(url, strategy) {
  console.log(`\n=================== ${strategy.toUpperCase()} ===================`);
  console.log(`Analyzing ${url}...`);
  try {
    const pageSpeedResult = await runPageSpeedTest(url, strategy);
    const affectedMetrics = pageSpeedResult.performanceReport.affectedMetrics || [];
    
    // LCP
    console.log(`\n--- LCP ---`);
    console.log(`Current LCP value: ${pageSpeedResult.coreWebVitals?.lcp?.value || 'N/A'}`);
    const lcpAffected = affectedMetrics.find(m => m.metric === 'LCP');
    console.log(`affectedMetrics contains LCP: ${!!lcpAffected}`);
    if (lcpAffected) {
      console.log(`All LCP contributors:`, JSON.stringify(lcpAffected.contributors, null, 2));
    }

    // INP
    console.log(`\n--- INP ---`);
    console.log(`Current INP value: ${pageSpeedResult.coreWebVitals?.inp?.value || 'N/A'}`);
    const inpAffected = affectedMetrics.find(m => m.metric === 'INP');
    console.log(`affectedMetrics contains INP: ${!!inpAffected}`);
    if (inpAffected) {
      console.log(`All INP contributors:`, JSON.stringify(inpAffected.contributors, null, 2));
    }

    // CLS
    console.log(`\n--- CLS ---`);
    console.log(`Current CLS value: ${pageSpeedResult.coreWebVitals?.cls?.value || 'N/A'}`);
    const clsAffected = affectedMetrics.find(m => m.metric === 'CLS');
    console.log(`affectedMetrics contains CLS: ${!!clsAffected}`);
    if (clsAffected) {
      console.log(`All CLS contributors:`, JSON.stringify(clsAffected.contributors, null, 2));
    }
    
    console.log(`\nCLS Details explicitly parsed:`);
    console.log(JSON.stringify(pageSpeedResult.clsDetails || 'None', null, 2));
    console.log(`LCP Details explicitly parsed:`);
    console.log(JSON.stringify(pageSpeedResult.lcpDetails || 'None', null, 2));

  } catch (err) {
    console.error(err);
  }
}

async function run() {
  const url = 'https://www.royalenfield.com/in/en/home/';
  await debugUrl(url, 'mobile');
  await debugUrl(url, 'desktop');
}

run();
