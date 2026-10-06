require('dotenv').config();

const express = require('express');
const { runPageSpeedTest, generateFinalGtmMigrationResult } = require('./pagespeed-test');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/analyze', async (req, res) => {
  const { url, strategy = 'mobile', gtmTagsResult } = req.body;
  console.log('--- Debug: POST /api/analyze ---');
  console.log('gtmTagsResult exists?', Boolean(gtmTagsResult));
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Basic URL validation
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
        if (gtmTagsResult) {
          val.finalGtmMigrationResult = generateFinalGtmMigrationResult(val, gtmTagsResult);
          console.log('Mobile result.finalGtmMigrationResult exists:', Boolean(val.finalGtmMigrationResult));
        }
        response.results.push(val);
      } else {
        response.results.push({ strategy: 'mobile', error: mobileResult.reason.message || 'Error' });
      }
      
      if (desktopResult.status === 'fulfilled') {
        const val = desktopResult.value;
        if (gtmTagsResult) {
          val.finalGtmMigrationResult = generateFinalGtmMigrationResult(val, gtmTagsResult);
          console.log('Desktop result.finalGtmMigrationResult exists:', Boolean(val.finalGtmMigrationResult));
        }
        response.results.push(val);
      } else {
        response.results.push({ strategy: 'desktop', error: desktopResult.reason.message || 'Error' });
      }
      
      res.json(response);
    } else {
      const result = await runPageSpeedTest(url, strategy);
      if (gtmTagsResult) {
        result.finalGtmMigrationResult = generateFinalGtmMigrationResult(result, gtmTagsResult);
        console.log('Result.finalGtmMigrationResult exists:', Boolean(result.finalGtmMigrationResult));
      }
      res.json({ results: [result] });
    }
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch PageSpeed insights' });
  }
});

// OAuth 2.0 routes for Google Tag Manager
let globalGtmAccessToken = null;
app.get('/api/auth/google', (req, res) => {
  const clientId = process.env.GTM_CLIENT_ID;
  if (!clientId) {
    return res.status(500).send('OAuth is not configured: Missing GTM_CLIENT_ID');
  }

  const redirectUri = `http://localhost:${PORT}/api/auth/google/callback`;
  const scope = 'https://www.googleapis.com/auth/tagmanager.readonly';
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
  
  res.redirect(authUrl);
});

app.get('/api/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Missing authorization code');
  }

  const clientId = process.env.GTM_CLIENT_ID;
  const clientSecret = process.env.GTM_CLIENT_SECRET;
  const redirectUri = `http://localhost:${PORT}/api/auth/google/callback`;

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to exchange token:', data.error_description || data.error || 'Unknown error');
      return res.status(500).send('Failed to exchange authorization code for tokens');
    }

    // Success - we have the tokens in `data`, but we do not log or expose them.
    // data.access_token, data.refresh_token
    globalGtmAccessToken = data.access_token;
    
    res.send(`
      <html>
        <body>
          <h2>Authentication Successful!</h2>
          <p>You have successfully authenticated with Google. You can safely close this window.</p>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('Error during token exchange:', error.message);
    res.status(500).send('An error occurred during authentication');
  }
});

app.get('/api/gtm/accounts', async (req, res) => {
  console.log('Diagnostic: Access token available?', !!globalGtmAccessToken);
  if (!globalGtmAccessToken) {
    return res.status(401).json({ error: 'Not authenticated. Please visit /api/auth/google first.' });
  }

  try {
    const apiUrl = 'https://tagmanager.googleapis.com/tagmanager/v2/accounts';
    console.log('Diagnostic: Requesting URL:', apiUrl);
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${globalGtmAccessToken}`
      }
    });

    const data = await response.json();
    console.log('Diagnostic: HTTP Status Code:', response.status);

    if (!response.ok) {
      console.log('Diagnostic: Complete Google API Error Details:', JSON.stringify(data, null, 2));
      console.error('GTM API Error:', data.error?.message || 'Unknown error');
      return res.status(response.status).json({ error: 'Failed to fetch GTM accounts' });
    }

    // Return the GTM accounts list
    res.json(data);
  } catch (error) {
    console.error('Error fetching GTM accounts:', error.message);
    res.status(500).json({ error: 'An error occurred while fetching GTM accounts' });
  }
});

app.get('/api/gtm/accounts/:accountId/containers', async (req, res) => {
  const accountId = req.params.accountId;
  
  if (!globalGtmAccessToken) {
    return res.status(401).json({ error: 'Not authenticated. Please visit /api/auth/google first.' });
  }

  try {
    const apiUrl = `https://tagmanager.googleapis.com/tagmanager/v2/accounts/${accountId}/containers`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${globalGtmAccessToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('GTM API Error (Containers):', data.error?.message || 'Unknown error');
      return res.status(response.status).json({ error: 'Failed to fetch GTM containers' });
    }

    // Return the GTM containers list
    res.json(data);
  } catch (error) {
    console.error('Error fetching GTM containers:', error.message);
    res.status(500).json({ error: 'An error occurred while fetching GTM containers' });
  }
});

app.get('/api/gtm/accounts/:accountId/containers/:containerId/workspaces', async (req, res) => {
  const { accountId, containerId } = req.params;
  
  if (!globalGtmAccessToken) {
    return res.status(401).json({ error: 'Not authenticated. Please visit /api/auth/google first.' });
  }

  try {
    const apiUrl = `https://tagmanager.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}/workspaces`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${globalGtmAccessToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('GTM API Error (Workspaces):', data.error?.message || 'Unknown error');
      return res.status(response.status).json({ error: 'Failed to fetch GTM workspaces' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching GTM workspaces:', error.message);
    res.status(500).json({ error: 'An error occurred while fetching GTM workspaces' });
  }
});

function categorizeTag(tag) {
  const type = tag.type;
  
  if (['awremc', 'awupde'].includes(type)) return 'Other';
  
  // Google Ads types (Conversion tracking, Conversion Linker)
  if (['awct', 'sp'].includes(type)) return 'Google Ads';
  
  // Google Analytics types (Universal Analytics, GA4 Configuration, GA4 Event, Classic)
  if (['ua', 'gaawe', 'gaawc', 'gas', 'gawc'].includes(type)) return 'Google Analytics / GA4';
  
  // Floodlight (Counter, Sales)
  if (['flc', 'fls'].includes(type)) return 'Floodlight';
  
  // Check for custom templates containing facebook/meta/criteo
  const typeLower = type.toLowerCase();
  if (typeLower.includes('facebook') || typeLower.includes('meta')) return 'Meta / Facebook';
  if (typeLower.includes('criteo')) return 'Criteo';

  // Analyze Custom HTML tags
  if (type === 'html') {
    let htmlContent = '';
    if (tag.parameter) {
      const htmlParam = tag.parameter.find(p => p.type === 'template' && p.key === 'html');
      if (htmlParam && htmlParam.value) {
        htmlContent = htmlParam.value.toLowerCase();
      }
    }
    
    if (htmlContent.includes('fbq(') || htmlContent.includes('facebook.net') || htmlContent.includes('facebook.com')) {
      return 'Meta / Facebook';
    }
    if (htmlContent.includes('criteo')) {
      return 'Criteo';
    }
    return 'Custom HTML';
  }
  
  return 'Other';
}

function classifyMigration(tag, category) {
  const type = tag.type;
  const typeLower = type.toLowerCase();
  
  if (typeLower.includes('hotjar') || typeLower.includes('clarity') || typeLower.includes('optimize')) {
    return 'Client-Side Only / Keep Client-Side';
  }
  
  // Conversion Linker typically stays client-side
  if (['sp'].includes(type)) { 
    return 'Client-Side Only / Keep Client-Side';
  }
  
  // High potential for server-side
  if (['gaawe', 'gaawc', 'ua', 'awct', 'flc', 'fls'].includes(type)) {
    return 'Potentially Server-Side';
  }
  
  if (type === 'html') {
    let htmlContent = '';
    if (tag.parameter) {
      const htmlParam = tag.parameter.find(p => p.type === 'template' && p.key === 'html');
      if (htmlParam && htmlParam.value) {
        htmlContent = htmlParam.value.toLowerCase();
      }
    }
    
    // UX tools in Custom HTML
    if (htmlContent.includes('hotjar') || htmlContent.includes('clarity') || htmlContent.includes('vwo') || htmlContent.includes('optimizely')) {
      return 'Client-Side Only / Keep Client-Side';
    }
    
    // Tracking pixels can often be migrated using CAPI/Server-side endpoints but need review
    if (category === 'Meta / Facebook' || category === 'Criteo') {
      return 'Needs Review';
    }
    
    return 'Needs Review'; 
  }
  
  if (['Google Analytics / GA4', 'Floodlight'].includes(category)) {
    return 'Potentially Server-Side';
  }
  
  return 'Needs Review';
}

app.get('/api/gtm/accounts/:accountId/containers/:containerId/workspaces/:workspaceId/tags', async (req, res) => {
  const { accountId, containerId, workspaceId } = req.params;
  
  if (!globalGtmAccessToken) {
    return res.status(401).json({ error: 'Not authenticated. Please visit /api/auth/google first.' });
  }

  try {
    const apiUrl = `https://tagmanager.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/tags`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${globalGtmAccessToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('GTM API Error (Tags):', data.error?.message || 'Unknown error');
      return res.status(response.status).json({ error: 'Failed to fetch GTM tags' });
    }

    const tags = data.tag || [];
    const totalTags = tags.length;
    
    const tagsByCategory = {};
    const categorizedTags = {};
    const migrationSummary = {
      'Potentially Server-Side': 0,
      'Client-Side Only / Keep Client-Side': 0,
      'Needs Review': 0
    };
    const vendorMigrationCounts = {};
    
    tags.forEach(tag => {
      const category = categorizeTag(tag);
      const migrationClass = classifyMigration(tag, category);
      
      if (!tagsByCategory[category]) {
        tagsByCategory[category] = 0;
        categorizedTags[category] = [];
      }
      
      tagsByCategory[category]++;
      migrationSummary[migrationClass]++;
      
      if (!vendorMigrationCounts[category]) {
        vendorMigrationCounts[category] = {
          'Potentially Server-Side': 0,
          'Client-Side Only / Keep Client-Side': 0,
          'Needs Review': 0
        };
      }
      vendorMigrationCounts[category][migrationClass]++;
      
      categorizedTags[category].push({
        name: tag.name,
        type: tag.type,
        category: category,
        migrationClassification: migrationClass,
        originalData: tag
      });
    });

    res.json({
      summary: {
        totalTags,
        migrationSummary,
        tagsByCategory,
        vendorMigrationCounts
      },
      tags: categorizedTags
    });
  } catch (error) {
    console.error('Error fetching GTM tags:', error.message);
    res.status(500).json({ error: 'An error occurred while fetching GTM tags' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
