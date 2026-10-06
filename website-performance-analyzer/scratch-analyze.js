const fs = require('fs');
const audits = JSON.parse(fs.readFileSync('scratch-audits-dump.json', 'utf8'));

console.log("Has third-party-summary:", !!audits['third-party-summary']);
console.log("Has third-parties-insight:", !!audits['third-parties-insight']);

if (audits['network-requests'] && audits['network-requests'].details) {
  const items = audits['network-requests'].details.items;
  console.log("Network requests count:", items.length);
  // Show a few network requests to see properties
  console.log("Sample network request:", items.find(i => i.url.includes('gtag')));
}

if (audits['third-parties-insight']) {
  // wait, is this the same format? Let's just log it
  // console.log("third-parties-insight keys:", Object.keys(audits['third-parties-insight']));
}

if (audits['bootup-time'] && audits['bootup-time'].details) {
    console.log("Bootup items count:", audits['bootup-time'].details.items.length);
}
