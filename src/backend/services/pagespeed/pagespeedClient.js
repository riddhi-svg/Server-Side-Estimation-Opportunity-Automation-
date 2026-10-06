/**
 * Google PageSpeed Insights API Client
 */

require('dotenv').config();

const API_KEY = process.env.PAGESPEED_API_KEY;

async function fetchPageSpeedData(targetUrl, strategy = 'mobile') {
  if (!targetUrl) {
    throw new Error('No URL provided.');
  }

  const category = 'performance';
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&key=${API_KEY}&strategy=${strategy}&category=${category}`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    let errorMsg = `API request failed with status: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (errorBody.error?.message) {
        errorMsg = errorBody.error.message;
      }
    } catch { }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  if (!data.lighthouseResult || !data.lighthouseResult.audits) {
    throw new Error('No Lighthouse results found in the API response.');
  }

  return data;
}

module.exports = { fetchPageSpeedData };
