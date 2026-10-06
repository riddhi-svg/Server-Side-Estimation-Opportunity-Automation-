const puppeteer = require('puppeteer');

const urls = [
  'https://www.royalenfield.com/in/en/home/',
  'https://example.com/',
  'https://www.google.com/'
];

async function run() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.evaluateOnNewDocument(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const urlStr = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
      if (urlStr.includes('/api/auth/status')) {
        return { ok: true, json: async () => ({ user: { name: 'Test User' } }) };
      }
      if (urlStr.includes('/api/gtm/')) {
        return {
          ok: true,
          json: async () => ({
            summary: { totalTags: 39, migrationSummary: { 'Potentially Server-Side': 18, 'Client-Side Only / Keep Client-Side': 12, 'Needs Review': 9 }, tagsByCategory: { 'Google Analytics / GA4': 10, 'Google Ads': 8, 'Meta / Facebook': 10, 'Other': 11 } },
            tags: {
              'Google Analytics / GA4': [{ migrationClassification: 'Potentially Server-Side' }],
              'Meta / Facebook': [{ migrationClassification: 'Potentially Server-Side' }],
              'Google Ads': [{ migrationClassification: 'Potentially Server-Side' }]
            }
          })
        };
      }
      if (urlStr.includes('/api/analyze')) {
        const reqBody = JSON.parse(args[1].body);
        let currentVal = 50;
        let estVal = 60;
        if (reqBody.url.includes('royalenfield') && reqBody.strategy === 'mobile') { currentVal = 27; estVal = 27; }
        if (reqBody.url.includes('royalenfield') && reqBody.strategy === 'desktop') { currentVal = 39; estVal = 46; }
        if (reqBody.url.includes('example.com') && reqBody.strategy === 'mobile') { currentVal = 100; estVal = 100; }
        if (reqBody.url.includes('example.com') && reqBody.strategy === 'desktop') { currentVal = 100; estVal = 100; }
        if (reqBody.url.includes('google.com') && reqBody.strategy === 'mobile') { currentVal = 87; estVal = 87; }
        if (reqBody.url.includes('google.com') && reqBody.strategy === 'desktop') { currentVal = 75; estVal = 84; }
        
        return {
          ok: true,
          json: async () => ({
            results: [{
              strategy: reqBody.strategy,
              performanceReport: {
                pageSpeedScore: currentVal,
                metrics: { FCP: {value: 1000}, SpeedIndex: {value: 1000}, LCP: {value: 1000}, CLS: {value: 0.1}, TBT: {value: 100}, INP: {value: 100}, TTFB: {value: 100} }
              },
              finalGtmMigrationResult: {
                estimatedImpact: {
                  migrationOpportunity: { totalTags: 10, migratableTags: 5, coverage: 50 },
                  current: { gtmTransferSize: 100, gtmMainThreadTime: 100, gtmBootupTime: 100, tbt: 1000 },
                  estimated: { gtmTransferSize: 50, gtmMainThreadTime: 50, gtmBootupTime: 50, tbt: 500, fcp: 1000, speedIndex: 1000, lcp: 1000, cls: 0.1, inp: 100, ttfb: 100, performanceScore: estVal },
                  change: {
                    gtmTransferSize: { absolute: 50, percentage: 50 },
                    gtmMainThreadTime: { absolute: 50, percentage: 50 },
                    gtmBootupTime: { absolute: 50, percentage: 50 },
                    tbt: { absolute: 500, percentage: 50 },
                    performanceScore: {
                      points: estVal - currentVal,
                      status: 'Estimated',
                      method: 'Lighthouse 13.5.0 weighted scoring model',
                      estimatedValue: estVal,
                      currentValue: currentVal
                    }
                  }
                },
                performanceImpact: { gtmCoreResourceCount: 1, gtmCoreTransferSize: 1024, gtmCoreMainThreadTimeMs: 10, gtmCoreBootupTimeMs: 10 },
                gtmMigration: { tagCategoryBreakdown: { 'Google Analytics': 1 } },
                migrationOpportunities: []
              }
            }]
          })
        };
      }
      return originalFetch(...args);
    };
  });
  
  // Go to the local app
  await page.goto('http://localhost:3000');
  
  for (const url of urls) {
    for (const strategy of ['mobile', 'desktop']) {
      console.log(`\n=== Testing UI for ${url} | ${strategy} ===`);

      // Fill in the form
      await page.evaluate((testUrl, testStrategy) => {
        document.getElementById('url-input').value = testUrl;
        document.getElementById('strategy-input').value = testStrategy;
        
        // Mock the GTM inputs that the script expects
        ['gtm-account-select', 'gtm-container-select', 'gtm-workspace-select'].forEach(id => {
          const el = document.getElementById(id);
          el.innerHTML = '<option value="mock">mock</option>';
          el.value = 'mock';
          el.disabled = false;
        });
        
        // Ensure globals are set since script.js refers to them directly
        window.selectAccount = document.getElementById('gtm-account-select');
        window.selectContainer = document.getElementById('gtm-container-select');
        window.selectWorkspace = document.getElementById('gtm-workspace-select');
        
        // Ensure button is enabled
        document.getElementById('submit-btn').disabled = false;
      }, url, strategy);

      await new Promise(r => setTimeout(r, 500));
      
      // Click submit
      await page.click('#submit-btn');

      // Wait for results to show
      try {
        await page.waitForSelector('.pagespeed-score-estimation, #error-message:not(.hidden), .error-message:not(.hidden)', { timeout: 10000 });
        
        const uiText = await page.evaluate(() => {
          const globalErr = document.querySelector('#error-message:not(.hidden)');
          if (globalErr) return 'GLOBAL ERROR DISPLAYED: ' + globalErr.innerText;
          
          const errNode = document.querySelector('.error-message:not(.hidden)');
          if (errNode) return 'ERROR DISPLAYED: ' + errNode.innerText;
          
          const container = document.querySelector('.pagespeed-score-estimation');
          return container ? container.innerText : 'Container not found';
        });
        
        console.log(`UI Rendered Content:\n${uiText}`);
      } catch (err) {
        console.log(`Error waiting for results: ${err.message}`);
      }
      
      // Reload page for the next test to clear state
      await page.goto('http://localhost:3000');
    }
  }
  
  await browser.close();
}

run().catch(console.error);
