require('dotenv').config();

async function checkRawPsi() {
  const API_KEY = process.env.PAGESPEED_API_KEY;
  const targetUrl = 'https://www.royalenfield.com/in/en/home/';
  const API_URL = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&key=${API_KEY}&strategy=mobile&category=performance`;
  
  const response = await fetch(API_URL);
  const data = await response.json();
  
  console.log("--- CrUX INP ---");
  console.log(JSON.stringify(data.loadingExperience?.metrics?.INTERACTION_TO_NEXT_PAINT, null, 2));
  
  console.log("--- Lighthouse INP ---");
  const lhInp = data.lighthouseResult?.audits['interaction-to-next-paint'];
  console.log(lhInp ? JSON.stringify({
    numericValue: lhInp.numericValue,
    displayValue: lhInp.displayValue
  }, null, 2) : 'No Lighthouse INP');
  
  console.log("--- Lighthouse TTI ---");
  const tti = data.lighthouseResult?.audits['interactive'];
  console.log(tti ? JSON.stringify({
    numericValue: tti.numericValue,
    displayValue: tti.displayValue
  }, null, 2) : 'No TTI');
  
  console.log("--- Third Party Summary Sample ---");
  const thirdParty = data.lighthouseResult?.audits['third-party-summary'];
  if (thirdParty && thirdParty.details && thirdParty.details.items) {
      console.log(JSON.stringify(thirdParty.details.items.slice(0, 3), null, 2));
  } else {
      console.log('No third-party-summary');
  }
}

checkRawPsi().catch(console.error);
