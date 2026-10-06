const puppeteer = require('puppeteer');

const urlToTest = 'https://www.royalenfield.com/in/en/home/';
const strategies = ['mobile', 'desktop'];

async function run() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.evaluateOnNewDocument(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const urlStr = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
      
      if (urlStr.includes('/api/auth/status')) {
        return { ok: true, json: async () => ({ user: { name: 'E2E Tester' } }) };
      }
      
      if (urlStr.includes('/api/gtm/')) {
        return {
          ok: true,
          json: async () => ({
            summary: { totalTags: 39, migrationSummary: { 'Potentially Server-Side': 18, 'Client-Side Only / Keep Client-Side': 12, 'Needs Review': 9 }, tagsByCategory: { 'Google Analytics / GA4': 10, 'Google Ads': 8, 'Meta / Facebook': 10, 'Other': 11 } },
            tags: {
              'Google Analytics / GA4': [{ migrationClassification: 'Potentially Server-Side', name: 'GA4 Base', category: 'Google Analytics / GA4', type: 'ga4' }],
              'Meta / Facebook': [{ migrationClassification: 'Potentially Server-Side', name: 'FB Pixel', category: 'Meta / Facebook', type: 'facebook' }],
              'Google Ads': [{ migrationClassification: 'Potentially Server-Side', name: 'GAds', category: 'Google Ads', type: 'google_ads' }]
            }
          })
        };
      }
      
      // DO NOT intercept /api/analyze so it runs end-to-end
      return originalFetch(...args);
    };
  });
  
  for (let i = 0; i < strategies.length; i++) {
    const strategy = strategies[i];
    console.log(`\n=== E2E Test for ${urlToTest} | ${strategy} ===`);
    
    await page.goto('http://localhost:3000');
    
    // Fill the form and bypass UI locks
    await page.evaluate((testUrl, testStrategy) => {
      document.getElementById('url-input').value = testUrl;
      document.getElementById('strategy-input').value = testStrategy;
      
      ['gtm-account-select', 'gtm-container-select', 'gtm-workspace-select'].forEach(id => {
        const el = document.getElementById(id);
        el.innerHTML = '<option value="mock">mock</option>';
        el.value = 'mock';
        el.disabled = false;
      });
      
      window.selectAccount = document.getElementById('gtm-account-select');
      window.selectContainer = document.getElementById('gtm-container-select');
      window.selectWorkspace = document.getElementById('gtm-workspace-select');
      document.getElementById('submit-btn').disabled = false;
    }, urlToTest, strategy);
    
    // Set up response listener to capture the backend JSON
    let backendResponse = null;
    const responseHandler = async (res) => {
      if (res.url().includes('/api/analyze') && res.request().method() === 'POST') {
        try {
          backendResponse = await res.json();
        } catch(e) {}
      }
    };
    page.on('response', responseHandler);
    
    await new Promise(r => setTimeout(r, 1000));
    await page.click('#submit-btn');
    console.log('Submitted form. Waiting for API response (could take up to 60s)...');
    
    try {
      await page.waitForSelector('.pagespeed-score-estimation, #error-message:not(.hidden), .error-message:not(.hidden)', { timeout: 120000 });
      
      const uiData = await page.evaluate(() => {
        const globalErr = document.querySelector('#error-message:not(.hidden)');
        if (globalErr) return { error: globalErr.innerText };
        
        const sectionErr = document.querySelector('.error-message:not(.hidden)');
        if (sectionErr) return { error: sectionErr.innerText };
        
        const scoreBox = document.querySelector('.pagespeed-score-estimation');
        const cwvBox = document.querySelector('.cwv-score-estimation');
        const oppBody = document.querySelector('.migration-opportunity-body');
        const gtmBody = document.querySelector('.gtm-workload-body');
        
        return {
          scoreEstimationText: scoreBox ? scoreBox.innerText.trim() : 'Missing score box',
          cwvText: cwvBox ? cwvBox.innerText.trim() : 'Missing CWV box',
          oppText: oppBody ? oppBody.innerText.trim() : 'Missing Opp table',
          gtmText: gtmBody ? gtmBody.innerText.trim() : 'Missing GTM table'
        };
      });
      
      page.off('response', responseHandler);

      console.log('--- BACKEND JSON ---');
      if (backendResponse && backendResponse.results && backendResponse.results.length > 0) {
         const resObj = backendResponse.results[0].finalGtmMigrationResult.estimatedImpact;
         console.log(`Current Score: ${resObj.current.performanceScore}`);
         console.log(`Reconstructed Score: ${resObj.change.performanceScore.reconstructedScore}`);
         console.log(`Reconstruction Difference: ${Math.abs(resObj.current.performanceScore - resObj.change.performanceScore.reconstructedScore)}`);
         console.log(`Current TBT: ${resObj.current.tbt}`);
         console.log(`Estimated TBT: ${resObj.estimated.tbt}`);
         console.log(`Estimated Score: ${resObj.estimated.performanceScore}`);
         console.log(`Score Improvement: ${resObj.change.performanceScore.points}`);
      } else {
         console.log('No backend response captured or missing results array.');
      }
      
      console.log('--- UI RENDER DATA ---');
      console.log(JSON.stringify(uiData, null, 2));
      
    } catch (err) {
      console.log(`UI Test Failed: ${err.message}`);
    }
    
    if (i < strategies.length - 1) {
      console.log('Waiting 15 seconds before next request to avoid rate limits...');
      await new Promise(r => setTimeout(r, 15000));
    }
  }
  
  await browser.close();
}

run().catch(console.error);
