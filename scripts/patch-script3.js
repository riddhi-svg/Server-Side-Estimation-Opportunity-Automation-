const fs = require('fs');
let content = fs.readFileSync('public/script.js', 'utf8');

const startStr = '        const cwvDisplayContainer = finalResultSection.querySelector(\'.cwv-score-estimation\');';
const endStr = '        finalResultSection.classList.remove(\'hidden\');';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `        const cwvDisplayContainer = finalResultSection.querySelector('.cwv-score-estimation');
        if (cwvDisplayContainer) {
          const vitals = ['LCP', 'INP', 'CLS', 'FCP', 'SpeedIndex', 'TTFB', 'TBT'];
          const metricsDict = {
            'LCP': { current: estimatedImpact.current.lcp, estimated: estimatedImpact.estimated.lcp, change: estimatedImpact.change.lcp, unit: 'ms' },
            'INP': { current: estimatedImpact.current.inp, estimated: estimatedImpact.estimated.inp, change: estimatedImpact.change.inp, unit: 'ms' },
            'CLS': { current: estimatedImpact.current.cls, estimated: estimatedImpact.estimated.cls, change: estimatedImpact.change.cls, unit: '' },
            'FCP': { current: estimatedImpact.current.fcp, estimated: estimatedImpact.estimated.fcp, change: estimatedImpact.change.fcp, unit: 'ms' },
            'SpeedIndex': { current: estimatedImpact.current.speedIndex, estimated: estimatedImpact.estimated.speedIndex, change: estimatedImpact.change.speedIndex, unit: 'ms' },
            'TTFB': { current: estimatedImpact.current.ttfb, estimated: estimatedImpact.estimated.ttfb, change: estimatedImpact.change.ttfb, unit: 'ms' },
            'TBT': { current: estimatedImpact.current.tbt, estimated: estimatedImpact.estimated.tbt, change: estimatedImpact.change.tbt, unit: 'ms' }
          };
          
          let rowsHtml = '';
          vitals.forEach(v => {
            const m = metricsDict[v];
            if (m.estimated !== null && m.estimated !== undefined && m.estimated !== 'Not directly predictable' && m.estimated !== 'Not estimated yet') {
              rowsHtml += \`
                <tr style="border-bottom: 1px solid #bbf7d0;">
                  <td style="padding: 0.75rem 1rem;">\${v}</td>
                  <td style="padding: 0.75rem 1rem; text-align: right;">\${formatNum(m.current)}\${m.unit ? ' ' + m.unit : ''}</td>
                  <td style="padding: 0.75rem 1rem; text-align: right;">\${formatNum(m.estimated)}\${m.unit ? ' ' + m.unit : ''}</td>
                  <td style="padding: 0.75rem 1rem; text-align: right;">\${formatChange(m.change.absolute, m.change.percentage, m.unit ? ' ' + m.unit : '')}</td>
                </tr>
              \`;
            }
          });
          
          if (rowsHtml === '') {
            cwvDisplayContainer.innerHTML = '<tr><td colspan="4" style="padding: 1rem; text-align: center;">No Web Vitals impact detected from migratable GTM workload.</td></tr>';
          } else {
            cwvDisplayContainer.innerHTML = rowsHtml;
          }
        }

`;
  
  content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync('public/script.js', content, 'utf8');
  console.log("Updated script.js cwv table successfully");
} else {
  console.log("Could not find start or end strings in script.js.");
}
