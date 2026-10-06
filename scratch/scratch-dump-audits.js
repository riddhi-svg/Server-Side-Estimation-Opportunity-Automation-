require('dotenv').config();
const fs = require('fs');

const API_KEY = process.env.PAGESPEED_API_KEY;
const targetUrl = 'https://www.royalenfield.com/in/en/home/';

async function dump() {
  const url = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&key=${API_KEY}&strategy=mobile&category=performance`;
  const res = await fetch(url);
  const data = await res.json();
  const audits = data.lighthouseResult ? data.lighthouseResult.audits : {};
  const auditKeys = Object.keys(audits);
  console.log("Audit keys available:");
  console.log(auditKeys);
  fs.writeFileSync('scratch-audits-dump.json', JSON.stringify(audits, null, 2));
  console.log('Dumped audits to scratch-audits-dump.json');
}

dump().catch(console.error);
