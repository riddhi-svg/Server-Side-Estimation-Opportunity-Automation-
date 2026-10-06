const fs = require('fs');
let content = fs.readFileSync('pagespeed-test.js', 'utf8');

const startStr = '  let estimatedLcp = \'Not estimated yet\';';
const endStr = '  const calcChange = (current, estimated) => {';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `  const migratableImpacts = { LCP: 0, INP: 0, CLS: 0, FCP: 0, TTFB: 0, SpeedIndex: 0 };
  const affectedMetrics = pageSpeedResult.performanceReport?.affectedMetrics || [];
  
  const affectedSet = new Set();
  
  affectedMetrics.forEach(am => {
    if (am.contributors) {
      am.contributors.forEach(c => {
        let isMigratable = false;
        if ((c.gtmRelationship === 'GTM_CORE' || c.gtmRelationship === 'GTM_TRIGGERED_THIRD_PARTY') && migratableVendors.has(c.vendor)) {
          isMigratable = true;
        }
        if (isMigratable && c.evidence) {
          c.evidence.forEach(ev => {
            if (ev.type === 'long-task' && am.metric === 'INP') {
              migratableImpacts.INP += ev.durationMs;
              affectedSet.add('INP');
            } else if (ev.type === 'render-blocking' && (am.metric === 'LCP' || am.metric === 'FCP')) {
              migratableImpacts[am.metric] += ev.wastedMs;
              affectedSet.add(am.metric);
            } else if (ev.type === 'bootup-time' && am.metric === 'SpeedIndex') {
              migratableImpacts.SpeedIndex += ev.totalCpuTimeMs;
              affectedSet.add('SpeedIndex');
            }
          });
        }
      });
    }
  });

  const getEstimated = (metricName, current) => {
    if (!affectedSet.has(metricName) || current === 'Not available' || current === null) {
      return null;
    }
    return Math.max(0, current - migratableImpacts[metricName]);
  };

  let estimatedLcp = getEstimated('LCP', lcp);
  let estimatedInp = getEstimated('INP', inp);
  let estimatedCls = getEstimated('CLS', cls);
  let estimatedFcp = getEstimated('FCP', fcp);
  let estimatedSpeedIndex = getEstimated('SpeedIndex', speedIndex);
  let estimatedTtfb = getEstimated('TTFB', ttfb);

  let lcpAbsChange = estimatedLcp !== null ? lcp - estimatedLcp : null;
  let lcpPctChange = estimatedLcp !== null && lcp !== 0 ? Number(((lcpAbsChange / lcp) * 100).toFixed(2)) : null;

  let inpAbsChange = estimatedInp !== null ? inp - estimatedInp : null;
  let inpPctChange = estimatedInp !== null && inp !== 0 ? Number(((inpAbsChange / inp) * 100).toFixed(2)) : null;

  let clsAbsChange = estimatedCls !== null ? cls - estimatedCls : null;
  let clsPctChange = estimatedCls !== null && cls !== 0 ? Number(((clsAbsChange / cls) * 100).toFixed(2)) : null;

  let fcpAbsChange = estimatedFcp !== null ? fcp - estimatedFcp : null;
  let fcpPctChange = estimatedFcp !== null && fcp !== 0 ? Number(((fcpAbsChange / fcp) * 100).toFixed(2)) : null;
  
  let speedIndexAbsChange = estimatedSpeedIndex !== null ? speedIndex - estimatedSpeedIndex : null;
  let speedIndexPctChange = estimatedSpeedIndex !== null && speedIndex !== 0 ? Number(((speedIndexAbsChange / speedIndex) * 100).toFixed(2)) : null;
  
  let ttfbAbsChange = estimatedTtfb !== null ? ttfb - estimatedTtfb : null;
  let ttfbPctChange = estimatedTtfb !== null && ttfb !== 0 ? Number(((ttfbAbsChange / ttfb) * 100).toFixed(2)) : null;

`;
  
  content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync('pagespeed-test.js', content, 'utf8');
  console.log("Updated pagespeed-test.js middle block successfully");
} else {
  console.log("Could not find start or end strings in pagespeed-test.js.");
}
