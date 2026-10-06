const http = require('http');

const payload = JSON.stringify({
  url: 'https://www.royalenfield.com/in/en/home/',
  strategy: 'mobile',
  gtmTagsResult: {
    summary: {
      totalTags: 39,
      migrationSummary: {
        'Potentially Server-Side': 18,
        'Client-Side Only / Keep Client-Side': 12,
        'Needs Review': 9
      },
      tagsByCategory: {
        'Google Analytics / GA4': 10,
        'Google Ads': 8,
        'Meta / Facebook': 10,
        'Other': 11
      }
    },
    tags: {
      'Google Analytics / GA4': [
        { name: 'GA4 Base', type: 'gaawe', category: 'Google Analytics / GA4', migrationClassification: 'Potentially Server-Side' }
      ]
    }
  }
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/analyze',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.results && result.results[0] && result.results[0].finalGtmMigrationResult) {
        console.log(JSON.stringify(result.results[0].finalGtmMigrationResult, null, 2));
      } else {
        console.log('No finalGtmMigrationResult found in response:', data);
      }
    } catch(e) {
      console.log('Error parsing response:', e);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', e => console.error('Problem with request:', e));
req.write(payload);
req.end();
