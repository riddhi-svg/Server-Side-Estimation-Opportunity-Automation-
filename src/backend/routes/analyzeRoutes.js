const express = require('express');
const router = express.Router();
const { runPageSpeedTest } = require('../services/pagespeedService');
const { generateFinalGtmMigrationResult } = require('../services/estimation/migrationEstimator');
const { sendReportEmail } = require('../services/emailService');

router.post('/analyze', async (req, res) => {
  const {
    url,
    strategy = 'mobile',
    gtmTagsResult,
    sendEmail,
    recipientEmail,
    toEmail,
    to,
    ccEmail,
    cc
  } = req.body;
  const targetTo = to || toEmail || recipientEmail || 'jimit@tatvic.com';
  const targetCc = cc || ccEmail || '';
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    new URL(url);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid URL provided' });
  }

  try {
    let response;
    if (strategy === 'both') {
      const [mobileResult, desktopResult] = await Promise.allSettled([
        runPageSpeedTest(url, 'mobile'),
        runPageSpeedTest(url, 'desktop')
      ]);
      
      response = { results: [] };
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
    } else {
      const result = await runPageSpeedTest(url, strategy);
      if (gtmTagsResult) result.finalGtmMigrationResult = generateFinalGtmMigrationResult(result, gtmTagsResult);
      response = { results: [result] };
    }

    if (sendEmail) {
      try {
        const targetResult = response.results.find(r => r.finalGtmMigrationResult);
        if (targetResult) {
          const emailRes = await sendReportEmail({
            to: targetTo,
            cc: targetCc,
            url,
            strategy: targetResult.strategy || strategy,
            finalResult: targetResult.finalGtmMigrationResult
          });
          response.emailStatus = { sent: true, messageId: emailRes.id, recipient: targetTo, cc: targetCc };
        }
      } catch (emailErr) {
        console.error('[AnalyzeRoutes] Background email dispatch failed:', emailErr.message);
        response.emailStatus = { sent: false, error: emailErr.message };
      }
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch PageSpeed insights' });
  }
});

// Dedicated endpoint to dispatch report email on demand
router.post('/analyze/email-report', async (req, res) => {
  const { url, strategy = 'mobile', finalResult, recipientEmail, toEmail, to, ccEmail, cc } = req.body;
  const targetTo = to || toEmail || recipientEmail || 'jimit@tatvic.com';
  const targetCc = cc || ccEmail || '';

  if (!url || !finalResult) {
    return res.status(400).json({ error: 'url and finalResult are required' });
  }

  try {
    const result = await sendReportEmail({
      to: targetTo,
      cc: targetCc,
      url,
      strategy,
      finalResult
    });
    res.json({ success: true, messageId: result.id, recipient: targetTo, cc: targetCc });
  } catch (err) {
    console.error('[AnalyzeRoutes] Failed to send report email:', err);
    res.status(500).json({ error: err.message || 'Failed to send report email' });
  }
});

module.exports = router;
