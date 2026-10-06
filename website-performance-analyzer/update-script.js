const fs = require('fs');
let content = fs.readFileSync('public/script.js', 'utf8');

const startStr = '  function displayResults(data, requestedUrl) {';
const endStr = "  // --- New GTM & Auth Flow Logic ---";

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `  function displayResults(data, requestedUrl) {
    resUrl.textContent = requestedUrl;
    urlContainer.classList.remove('hidden');

    data.results.forEach(result => {
      const clone = template.content.cloneNode(true);
      
      const title = clone.querySelector('.strategy-title');
      if (title) title.textContent = result.strategy.charAt(0).toUpperCase() + result.strategy.slice(1) + ' Analysis';

      if (result.error) {
        const errEl = clone.querySelector('.error-message');
        if (errEl) {
          errEl.textContent = result.error;
          errEl.classList.remove('hidden');
        }
        resultsDiv.appendChild(clone);
        return;
      }

      const fResult = result.finalGtmMigrationResult;
      const estimatedImpact = fResult ? fResult.estimatedImpact : null;

      if (estimatedImpact) {
        const formatNum = (val) => val !== null && val !== undefined && typeof val === 'number' ? val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : val;
        
        const finalResultSection = clone.querySelector('.final-result-section');
        
        const oppBody = finalResultSection.querySelector('.migration-opportunity-body');
        if (oppBody) {
          oppBody.innerHTML = \`
            <tr style="border-bottom: 1px solid #bbf7d0;">
              <td style="padding: 0.75rem 1rem;">Total GTM Tags</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">\${estimatedImpact.migrationOpportunity.totalTags}</td>
            </tr>
            <tr style="border-bottom: 1px solid #bbf7d0;">
              <td style="padding: 0.75rem 1rem;">Tags That Can Be Migrated to Server-Side</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">\${estimatedImpact.migrationOpportunity.migratableTags}</td>
            </tr>
            <tr>
              <td style="padding: 0.75rem 1rem;">Migration Coverage</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">\${estimatedImpact.migrationOpportunity.coverage}%</td>
            </tr>
          \`;
        }

        const gtmBody = finalResultSection.querySelector('.gtm-workload-body');
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
            <tr>
              <td style="padding: 0.75rem 1rem;">JavaScript Loading & Setup Time</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">\${formatNum(estimatedImpact.current.gtmBootupTime)} ms</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">\${formatNum(estimatedImpact.estimated.gtmBootupTime)} ms</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">\${formatNum(Math.abs(estimatedImpact.change.gtmBootupTime.absolute))} ms</td>
            </tr>
          \`;
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
          cwvDisplayContainer.innerHTML = \`
            <div style="font-size: 1.25rem; font-weight: 600; color: #15803d; margin: 1rem 0;">
              Not directly predictable
            </div>
          \`;
        }

        finalResultSection.classList.remove('hidden');
      }

      resultsDiv.appendChild(clone);
    });

    resultsDiv.classList.remove('hidden');
  }

`;
  
  content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync('public/script.js', content, 'utf8');
  console.log("Updated script.js successfully");
} else {
  console.log("Could not find start or end strings.");
}
