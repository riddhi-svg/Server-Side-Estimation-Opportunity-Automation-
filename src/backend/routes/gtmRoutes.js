/**
 * GTM Routes
 */

const express = require('express');
const router = express.Router();
const { getGtmToken } = require('./authRoutes');
const { classifyContainerTags } = require('../services/tagClassifier');
const { fetchGtmResource } = require('../services/gtm/gtmApiClient');

const withToken = async (req, res, next) => {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ') && !authHeader.includes('null') && !authHeader.includes('undefined')) {
    token = authHeader.substring(7);
  } else {
    token = await getGtmToken();
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated. Missing GTM access token.', code: 'UNAUTHORIZED' });
  }
  req.gtmToken = token;
  next();
};

router.use(withToken);

const handleGtmRequest = (getPath) => async (req, res) => {
  try {
    const data = await fetchGtmResource(getPath(req), req.gtmToken);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message, code: error.code || 'API_ERROR' });
  }
};

router.get('/accounts', handleGtmRequest(() => '/accounts'));
router.get('/accounts/:accountId', handleGtmRequest((req) => `/accounts/${req.params.accountId}`));
router.get('/accounts/:accountId/containers', handleGtmRequest((req) => `/accounts/${req.params.accountId}/containers`));
router.get('/accounts/:accountId/containers/:containerId', handleGtmRequest((req) => `/accounts/${req.params.accountId}/containers/${req.params.containerId}`));
router.get('/accounts/:accountId/containers/:containerId/workspaces', handleGtmRequest((req) => `/accounts/${req.params.accountId}/containers/${req.params.containerId}/workspaces`));
router.get('/accounts/:accountId/containers/:containerId/workspaces/:workspaceId', handleGtmRequest((req) => `/accounts/${req.params.accountId}/containers/${req.params.containerId}/workspaces/${req.params.workspaceId}`));

router.get('/accounts/:accountId/containers/:containerId/workspaces/:workspaceId/tags', async (req, res) => {
  try {
    const data = await fetchGtmResource(
      `/accounts/${req.params.accountId}/containers/${req.params.containerId}/workspaces/${req.params.workspaceId}/tags`,
      req.gtmToken
    );

    const tags = data.tag || [];
    const classificationResult = classifyContainerTags(tags);

    const categorizedTags = {};
    classificationResult.classifiedTags.forEach(t => {
      if (!categorizedTags[t.category]) categorizedTags[t.category] = [];
      categorizedTags[t.category].push({
        id: t.tagId,
        name: t.name,
        type: t.type,
        category: t.category,
        tier: t.tier,
        savingsTier: t.savingsTier,
        isRemovable: t.isRemovable,
        notes: t.notes,
        originalData: t
      });
    });

    const tagsByCategory = {};
    classificationResult.classifiedTags.forEach(t => {
      tagsByCategory[t.category] = (tagsByCategory[t.category] || 0) + 1;
    });

    res.json({
      summary: {
        totalTags: classificationResult.totalTags,
        tiers: classificationResult.summary,
        removableVendors: classificationResult.removableVendors,
        tagsByCategory
      },
      tags: categorizedTags,
      tagsByTier: classificationResult.tagsByTier
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message, code: error.code || 'API_ERROR' });
  }
});

module.exports = router;
