
require('dotenv').config();

const targetUrl = 'https://www.royalenfield.com';
const API_KEY = process.env.PAGESPEED_API_KEY;
const API_URL = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&strategy=mobile&key=${API_KEY}`;

async function check() {
  const res = await fetch(API_URL);
  const data = await res.json();
  const audits = data.lighthouseResult.audits;
  
  console.log("interaction-to-next-paint in audits:", !!audits['interaction-to-next-paint']);
  if (audits['interaction-to-next-paint']) {
     console.log("INP numericValue:", audits['interaction-to-next-paint'].numericValue);
  }
  
  console.log("CrUX loadingExperience:", !!data.loadingExperience);
  if (data.loadingExperience && data.loadingExperience.metrics) {
      console.log("CrUX metrics keys:", Object.keys(data.loadingExperience.metrics));
      if (data.loadingExperience.metrics.INTERACTION_TO_NEXT_PAINT_SCORE) {
          console.log("CrUX INP:", data.loadingExperience.metrics.INTERACTION_TO_NEXT_PAINT_SCORE.percentile);
      }
  }
}
check();
