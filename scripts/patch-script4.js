const fs = require('fs');
let content = fs.readFileSync('public/script.js', 'utf8');

const startStr = '        const gtmBody = finalResultSection.querySelector(\'.gtm-workload-body\');';
const endStr = '        finalResultSection.classList.remove(\'hidden\');';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `        const gtmBody = finalResultSection.querySelector('.gtm-workload-body');
        if (gtmBody) {
          gtmBody.innerHTML = \`
            <tr style="border-bottom: 1px solid #bbf7d0;">
              <td style="padding: 0.75rem 1rem;">Data Downloaded by Browser</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">\${formatNum(estimatedImpact.current.gtmTransferSize)} KB</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">\${formatNum(estimatedImpact.estimated.gtmTransferSize)} KB</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">\${formatNum(Math.abs(estimatedImpact.change.gtmTransferSize.absolute))} KB</td>
            </tr>
            <tr style="border-bottom: 1px solid #bbf7d0;">
              <td style="padding: 0.75rem 1rem;">Browser Processing Time</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">\${formatNum(estimatedImpact.current.gtmMainThreadTime)} ms</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">\${formatNum(estimatedImpact.estimated.gtmMainThreadTime)} ms</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">\${formatNum(Math.abs(estimatedImpact.change.gtmMainThreadTime.absolute))} ms</td>
            </tr>
            <tr style="border-bottom: 1px solid #bbf7d0;">
              <td style="padding: 0.75rem 1rem;">JavaScript Loading & Setup Time</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">\${formatNum(estimatedImpact.current.gtmBootupTime)} ms</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">\${formatNum(estimatedImpact.estimated.gtmBootupTime)} ms</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">\${formatNum(Math.abs(estimatedImpact.change.gtmBootupTime.absolute))} ms</td>
            </tr>
          \`;
          
          if (estimatedImpact.estimated.tbt !== 'Not directly predictable' && estimatedImpact.estimated.tbt !== null) {
            gtmBody.innerHTML += \`
              <tr>
                <td style="padding: 0.75rem 1rem;">Total Blocking Time (TBT)</td>
                <td style="padding: 0.75rem 1rem; text-align: right;">\${formatNum(estimatedImpact.current.tbt)} ms</td>
                <td style="padding: 0.75rem 1rem; text-align: right;">\${formatNum(estimatedImpact.estimated.tbt)} ms</td>
                <td style="padding: 0.75rem 1rem; text-align: right;">\${formatChange(estimatedImpact.change.tbt.absolute, estimatedImpact.change.tbt.percentage, ' ms')}</td>
              </tr>
            \`;
          }
        }

        const scoreDisplayContainer = finalResultSection.querySelector('.pagespeed-score-estimation');
        if (scoreDisplayContainer) {
          const perfChange = estimatedImpact.change.performanceScore;
          if (perfChange && perfChange.status === 'Estimated') {
             scoreDisplayContainer.innerHTML = \`
               <div style="font-size: 3rem; font-weight: 700; color: #166534; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 1rem;">
                 <span>\${perfChange.currentValue}</span>
                 <span style="color: #22c55e;">&rarr;</span>
                 <span>\${perfChange.estimatedValue}</span>
               </div>
               <div style="font-size: 1.1rem; font-weight: 600; color: #15803d; background: #dcfce7; display: inline-block; padding: 0.5rem 1.5rem; border-radius: 9999px;">
                 +\${perfChange.points} points potential improvement
               </div>
             \`;
          } else {
             const statusTxt = perfChange ? perfChange.status : 'Not directly predictable';
             scoreDisplayContainer.innerHTML = \`
               <div style="font-size: 1.25rem; font-weight: 600; color: #15803d; margin: 1rem 0;">
                 \${statusTxt}
               </div>
             \`;
          }
        }

        const cwvDisplayContainer = finalResultSection.querySelector('.cwv-score-estimation');
        if (cwvDisplayContainer) {
          const vitals = ['LCP', 'INP', 'CLS'];
          const metricsDict = {
            'LCP': { current: estimatedImpact.current.lcp, estimated: estimatedImpact.estimated.lcp, change: estimatedImpact.change.lcp, unit: 'ms' },
            'INP': { current: estimatedImpact.current.inp, estimated: estimatedImpact.estimated.inp, change: estimatedImpact.change.inp, unit: 'ms' },
            'CLS': { current: estimatedImpact.current.cls, estimated: estimatedImpact.estimated.cls, change: estimatedImpact.change.cls, unit: '' }
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
          
          const cwvContainerElement = finalResultSection.querySelector('.cwv-section-container');
          if (rowsHtml === '') {
            if (cwvContainerElement) cwvContainerElement.style.display = 'none';
          } else {
            cwvDisplayContainer.innerHTML = rowsHtml;
            if (cwvContainerElement) cwvContainerElement.style.display = 'block';
          }
        }

`;
  
  content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync('public/script.js', content, 'utf8');
  console.log("Updated script.js successfully");
} else {
  console.log("Could not find start or end strings in script.js.");
}
