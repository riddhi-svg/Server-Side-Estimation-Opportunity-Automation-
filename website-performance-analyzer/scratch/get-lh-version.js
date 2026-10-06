require('dotenv').config();

const API_KEY = process.env.PAGESPEED_API_KEY;
const targetUrl = 'https://example.com';
const API_URL = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&key=${API_KEY}&strategy=mobile&category=performance`;

fetch(API_URL)
  .then(res => res.json())
  .then(data => {
    console.log("Lighthouse Version:", data.lighthouseResult.lighthouseVersion);
    const auditRefs = data.lighthouseResult.categories.performance.auditRefs;
    console.log("Metrics Weights:");
    auditRefs.filter(a => a.weight > 0).forEach(a => {
      console.log(`- ${a.id}: weight ${a.weight}`);
    });
  })
  .catch(console.error);
