const fs = require('fs');
let txt = fs.readFileSync('pagespeed-output.txt', 'utf8');
const jsonStart = txt.indexOf('{');
if (jsonStart !== -1) {
  txt = txt.substring(jsonStart);
  const data = JSON.parse(txt);
  const score = data.lighthouseResult.categories.performance.score;
  const audits = data.lighthouseResult.audits;
  console.log('Score:', score);
  console.log('FCP:', audits['first-contentful-paint'].numericValue);
  console.log('SI:', audits['speed-index'].numericValue);
  console.log('LCP:', audits['largest-contentful-paint'].numericValue);
  console.log('CLS:', audits['cumulative-layout-shift'].numericValue);
  console.log('TBT:', audits['total-blocking-time'].numericValue);
}
