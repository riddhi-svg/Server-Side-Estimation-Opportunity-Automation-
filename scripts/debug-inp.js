const fs = require('fs');

async function debugUrl(url, strategy) {
  console.log(`\n=================== ${strategy.toUpperCase()} ===================`);
  try {
    const API_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
    const API_KEY = process.env.GOOGLE_PAGESPEED_API_KEY || ''; // Usually in .env
    
    // We can extract the API key from pagespeed-test.js if needed, or just require dotenv
    require('dotenv').config();
    const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
    
    const response = await fetch(`${API_URL}?url=${encodeURIComponent(url)}&strategy=${strategy}&key=${apiKey}&category=performance`);
    const data = await response.json();
    
    const audits = data.lighthouseResult.audits;
    
    console.log("--- INP Audit Details ---");
    const inpAudit = audits['interaction-to-next-paint'];
    if (inpAudit && inpAudit.details && inpAudit.details.items) {
      console.log(JSON.stringify(inpAudit.details.items, null, 2));
    } else {
      console.log("No INP details found.");
    }

    console.log("\n--- Long Tasks near INP ---");
    const longTasksAudit = audits['long-tasks'];
    if (longTasksAudit && longTasksAudit.details && longTasksAudit.details.items) {
      console.log(JSON.stringify(longTasksAudit.details.items.slice(0, 5), null, 2));
    } else {
      console.log("No long-tasks details found.");
    }
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
