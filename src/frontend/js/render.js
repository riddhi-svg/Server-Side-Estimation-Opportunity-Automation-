/**
 * Main Frontend Renderer
 */

import {
  renderTiersTableHtml,
  renderWorkloadTableHtml,
  renderMetricRowsHtml
} from './render/table-renderer.js';

export const formatS = (val) => val !== null ? `${(val / 1000).toFixed(2)} s` : 'N/A';
export const formatMs = (val) => val !== null ? `${Math.round(val).toLocaleString('en-US')} ms` : 'N/A';
export const formatCls = (val) => val !== null ? `${val.toFixed(3)}` : 'N/A';

export function displayResults(data, requestedUrl) {
  const urlContainer = document.getElementById('analyzed-url-container');
  const resUrl = document.getElementById('res-url');
  const resultsDiv = document.getElementById('results');
  const template = document.getElementById('result-template');

  if (!urlContainer || !resUrl || !resultsDiv || !template) return;

  resUrl.textContent = requestedUrl;
  urlContainer.classList.remove('hidden');
  resultsDiv.innerHTML = '';

  data.results.forEach(result => {
    const clone = template.content.cloneNode(true);
    const title = clone.querySelector('.strategy-title');
    if (title) title.textContent = result.strategy.charAt(0).toUpperCase() + result.strategy.slice(1) + ' Performance Report';

    if (result.error) {
      const errEl = clone.querySelector('.error-message');
      if (errEl) {
        errEl.textContent = result.error;
        errEl.classList.remove('hidden');
      }
      resultsDiv.appendChild(clone);
      return;
    }

    const estimatedImpact = result.finalGtmMigrationResult?.estimatedImpact;
    if (estimatedImpact) {
      const finalResultSection = clone.querySelector('.final-result-section');

      // 1. Confidence Badge
      const confContainer = finalResultSection.querySelector('.confidence-badge-container');
      if (confContainer) {
        const conf = estimatedImpact.confidence || 'medium';
        const confColors = {
          high: { bg: '#dcfce7', text: '#15803d', border: '#86efac', label: 'High Confidence' },
          medium: { bg: '#fef9c3', text: '#854d0e', border: '#fde047', label: 'Medium Confidence' },
          low: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', label: 'Low Confidence (Heuristic Allocation)' }
        };
        const c = confColors[conf] || confColors.medium;
        confContainer.innerHTML = `
          <span style="background: ${c.bg}; color: ${c.text}; border: 1px solid ${c.border}; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.82rem; font-weight: 600;">${c.label}</span>
          <span style="font-size: 0.8rem; color: #166534; text-transform: capitalize;">${estimatedImpact.formFactor || result.strategy} Mode</span>
        `;
      }

      // 2. Performance Score
      const scoreDisplayContainer = finalResultSection.querySelector('.pagespeed-score-estimation');
      if (scoreDisplayContainer) {
        const perf = estimatedImpact.performanceScore || {};
        if (perf.status === 'Estimated' && typeof perf.current === 'number' && typeof perf.projected === 'number') {
          scoreDisplayContainer.innerHTML = `
            <div style="font-size: 3rem; font-weight: 700; color: #166534; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 1rem;">
              <span>${perf.current}</span><span style="color: #22c55e;">&rarr;</span><span>${perf.projected}</span>
            </div>
            <div style="font-size: 1.1rem; font-weight: 600; color: #15803d; background: #dcfce7; display: inline-block; padding: 0.5rem 1.5rem; border-radius: 9999px;">
              +${perf.deltaPoints} points projected improvement
            </div>
            <div style="margin-top: 0.75rem; font-size: 0.8rem; color: #4ade80;">Recalculated via official Lighthouse v10-v13 Log-Normal scoring curves</div>
          `;
        } else if (perf.status === 'baselineMismatch') {
          scoreDisplayContainer.innerHTML = `
            <div style="font-size: 1.1rem; font-weight: 600; color: #991b1b; background: #fee2e2; border: 1px solid #fca5a5; padding: 0.75rem 1.25rem; border-radius: 0.5rem; display: inline-block; margin: 0.5rem 0;">⚠️ Baseline Score Verification Mismatch</div>
            <div style="font-size: 0.85rem; color: #7f1d1d; margin-top: 0.5rem; max-width: 650px; margin-left: auto; margin-right: auto; line-height: 1.4;">Recomputed baseline (${perf.baselineValidation?.reconstructedScore}) differed by ${perf.baselineValidation?.diff} points from reported score (${perf.current}). Projection halted to ensure mathematical validity.</div>
          `;
        } else {
          scoreDisplayContainer.innerHTML = `<div style="font-size: 1.25rem; font-weight: 600; color: #15803d; margin: 1rem 0;">${perf.status || 'Not Estimated'}</div>`;
        }
      }

      // 3. Tables Rendering
      const oppBody = finalResultSection.querySelector('.migration-opportunity-body');
      if (oppBody) oppBody.innerHTML = renderTiersTableHtml(estimatedImpact.tagInventory?.tiers);

      const gtmBody = finalResultSection.querySelector('.gtm-workload-body');
      if (gtmBody) gtmBody.innerHTML = renderWorkloadTableHtml(estimatedImpact.current, estimatedImpact.estimated);

      const labBody = finalResultSection.querySelector('.lab-metrics-body');
      if (labBody) {
        labBody.innerHTML = renderMetricRowsHtml([
          { name: 'Total Blocking Time (TBT)', curr: estimatedImpact.current.tbt, est: estimatedImpact.estimated.tbt, ranges: estimatedImpact.metrics?.labMetrics?.tbt?.ranges, unit: 'ms' },
          { name: 'Speed Index', curr: estimatedImpact.current.speedIndex, est: estimatedImpact.estimated.speedIndex, ranges: estimatedImpact.metrics?.labMetrics?.speedIndex?.ranges, unit: 'ms' },
          { name: 'First Contentful Paint (FCP)', curr: estimatedImpact.current.fcp, est: estimatedImpact.estimated.fcp, ranges: estimatedImpact.metrics?.labMetrics?.fcp?.ranges, unit: 'ms' },
          { name: 'Time to First Byte (TTFB)', curr: estimatedImpact.current.ttfb, est: estimatedImpact.estimated.ttfb, ranges: null, unit: 'ms' }
        ]);
      }

      const cwvBody = finalResultSection.querySelector('.cwv-score-estimation');
      if (cwvBody) {
        cwvBody.innerHTML = renderMetricRowsHtml([
          { name: 'Largest Contentful Paint (LCP)', curr: estimatedImpact.current.lcp, est: estimatedImpact.estimated.lcp, ranges: estimatedImpact.metrics?.coreWebVitals?.lcp?.ranges, unit: 'ms' },
          { name: 'Interaction to Next Paint (INP)', curr: estimatedImpact.current.inp, est: estimatedImpact.estimated.inp, ranges: estimatedImpact.metrics?.coreWebVitals?.inp ? { conservative: estimatedImpact.metrics.coreWebVitals.inp.conservative, optimistic: estimatedImpact.metrics.coreWebVitals.inp.optimistic } : null, unit: 'ms', isField: true },
          { name: 'Cumulative Layout Shift (CLS)', curr: estimatedImpact.current.cls, est: estimatedImpact.estimated.cls, ranges: null, unit: '' }
        ]);
      }

      const varianceNotice = finalResultSection.querySelector('.variance-notice-container');
      if (varianceNotice) {
        varianceNotice.innerHTML = `
          <div style="font-weight: 600; margin-bottom: 0.35rem; color: #166534;">Estimation Model & Variance Notice:</div>
          <div style="margin-bottom: 0.5rem;">${estimatedImpact.methodology?.varianceNotice || 'Lighthouse lab audits exhibit inherent run-to-run variance. Model outputs are modeled projections.'}</div>
          <ul style="margin: 0; padding-left: 1.25rem; font-size: 0.8rem; color: #15803d;">
            <li><strong>Core Web Vitals</strong>: LCP, INP, and CLS are official ranking metrics. INP is derived from real-user CrUX data and is evaluated independently of the lab Lighthouse Performance Score.</li>
            <li><strong>sGTM Realization</strong>: Performance gains occur when client vendor libraries are genuinely removed from the browser. Google tags continue loading client-side with reduced network payloads.</li>
            <li><strong>Architecture</strong>: Server-side GTM routes events through a cloud server container (Google Cloud / AWS), adding a server processing step before third-party vendor APIs.</li>
          </ul>
        `;
      }

      finalResultSection.classList.remove('hidden');
    }

    resultsDiv.appendChild(clone);
  });

  resultsDiv.classList.remove('hidden');
}

export function setStatusBadge(el, status) {
  if (!el || !status) { if (el) el.style.display = 'none'; return; }
  el.style.display = 'inline-block';
  el.textContent = status;
  el.className = `status-badge status-${status.replace(/\s+/g, '')}`;
}
