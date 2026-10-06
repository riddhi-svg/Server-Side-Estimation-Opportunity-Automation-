
const express = require('express');
const router = express.Router();
const { runPageSpeedTest } = require('../services/pagespeedService');
const { generateFinalGtmMigrationResult } = require('../services/estimation/migrationEstimator');

router.post('/analyze', async (req, res) => {
  const { url, strategy = 'mobile', gtmTagsResult } = req.body;
  console.log('--- Debug: POST /api/analyze ---');
  console.log('gtmTagsResult exists?', Boolean(gtmTagsResult));
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    new URL(url);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid URL provided' });
  }

  try {
    if (strategy === 'both') {
      const [mobileResult, desktopResult] = await Promise.allSettled([
        runPageSpeedTest(url, 'mobile'),
        runPageSpeedTest(url, 'desktop')
      ]);
      
      const response = { results: [] };
      if (mobileResult.status === 'fulfilled') {
        const val = mobileResult.value;
        if (gtmTagsResult) val.finalGtmMigrationResult = generateFinalGtmMigrationResult(val, gtmTagsResult);
        response.results.push(val);
      } else {
        response.results.push({ strategy: 'mobile', error: mobileResult.reason.message || 'Error' });
      }
      
      if (desktopResult.status === 'fulfilled') {
        const val = desktopResult.value;
        if (gtmTagsResult) val.finalGtmMigrationResult = generateFinalGtmMigrationResult(val, gtmTagsResult);
        response.results.push(val);
      } else {
        response.results.push({ strategy: 'desktop', error: desktopResult.reason.message || 'Error' });
      }
      res.json(response);
    } else {
      const result = await runPageSpeedTest(url, strategy);
      if (gtmTagsResult) result.finalGtmMigrationResult = generateFinalGtmMigrationResult(result, gtmTagsResult);
      res.json({ results: [result] });
    }
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch PageSpeed insights' });
  }
});

module.exports = router;
