/**
 * Table HTML Renderers for Report View
 */

export const formatNum = (val) => val !== null && val !== undefined && typeof val === 'number'
  ? val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  : (val !== null && val !== undefined ? val : '—');

export const formatReduction = (curr, est, unit = '') => {
  if (typeof curr !== 'number' || typeof est !== 'number') return '—';
  const delta = Number((curr - est).toFixed(2));
  if (delta <= 0) return '0%';
  const pct = Number(((delta / curr) * 100).toFixed(1));
  return `${formatNum(delta)} ${unit} (${pct}%)`;
};

export function renderTiersTableHtml(tiers = {}) {
  return `
    <tr style="border-bottom: 1px solid #bbf7d0;">
      <td style="padding: 0.75rem 1rem; font-weight: 600;">Tier 1: Removable Client Library</td>
      <td style="padding: 0.75rem 1rem; color: #15803d;">Full browser CPU & data savings (Meta, TikTok, Criteo, etc.)</td>
      <td style="padding: 0.75rem 1rem; text-align: right; font-weight: 600;">${tiers.removable || 0}</td>
    </tr>
    <tr style="border-bottom: 1px solid #bbf7d0;">
      <td style="padding: 0.75rem 1rem; font-weight: 600;">Tier 2: Stays Client-Side, Lighter Payload</td>
      <td style="padding: 0.75rem 1rem; color: #15803d;">Library remains in browser; outbound requests/payload lightened (GA4, Google Ads, Floodlight)</td>
      <td style="padding: 0.75rem 1rem; text-align: right; font-weight: 600;">${tiers.lighterPayload || 0}</td>
    </tr>
    <tr style="border-bottom: 1px solid #bbf7d0;">
      <td style="padding: 0.75rem 1rem; font-weight: 600;">Tier 3: Cannot Move / Needs Review</td>
      <td style="padding: 0.75rem 1rem; color: #15803d;">DOM-dependent widgets (Chat, A/B Testing, Heatmaps, Consent) or unclassified scripts</td>
      <td style="padding: 0.75rem 1rem; text-align: right; font-weight: 600;">${tiers.cannotMove || 0}</td>
    </tr>
    <tr>
      <td style="padding: 0.75rem 1rem; font-weight: 600; color: #991b1b;">Delete Class: Obsolete Legacy Tags</td>
      <td style="padding: 0.75rem 1rem; color: #991b1b;">Universal Analytics / Classic GA tags to remove from container</td>
      <td style="padding: 0.75rem 1rem; text-align: right; font-weight: 600; color: #991b1b;">${tiers.obsolete || 0}</td>
    </tr>
  `;
}

export function renderWorkloadTableHtml(current, estimated) {
  return `
    <tr style="border-bottom: 1px solid #bbf7d0;">
      <td style="padding: 0.75rem 1rem;">Data Downloaded by Browser</td>
      <td style="padding: 0.75rem 1rem; text-align: right;">${formatNum(current.gtmTransferSize)} KB</td>
      <td style="padding: 0.75rem 1rem; text-align: right;">${formatNum(estimated.gtmTransferSize)} KB</td>
      <td style="padding: 0.75rem 1rem; text-align: right; font-weight: 600; color: #15803d;">${formatReduction(current.gtmTransferSize, estimated.gtmTransferSize, 'KB')}</td>
    </tr>
    <tr style="border-bottom: 1px solid #bbf7d0;">
      <td style="padding: 0.75rem 1rem;">Browser Processing Time (Main Thread)</td>
      <td style="padding: 0.75rem 1rem; text-align: right;">${formatNum(current.gtmMainThreadTime)} ms</td>
      <td style="padding: 0.75rem 1rem; text-align: right;">${formatNum(estimated.gtmMainThreadTime)} ms</td>
      <td style="padding: 0.75rem 1rem; text-align: right; font-weight: 600; color: #15803d;">${formatReduction(current.gtmMainThreadTime, estimated.gtmMainThreadTime, 'ms')}</td>
    </tr>
    <tr>
      <td style="padding: 0.75rem 1rem;">JavaScript Loading & Bootup Time</td>
      <td style="padding: 0.75rem 1rem; text-align: right;">${formatNum(current.gtmBootupTime)} ms</td>
      <td style="padding: 0.75rem 1rem; text-align: right;">${formatNum(estimated.gtmBootupTime)} ms</td>
      <td style="padding: 0.75rem 1rem; text-align: right; font-weight: 600; color: #15803d;">${formatReduction(current.gtmBootupTime, estimated.gtmBootupTime, 'ms')}</td>
    </tr>
  `;
}

export function renderMetricRowsHtml(metricsList) {
  return metricsList.map(m => {
    const hasEst = typeof m.est === 'number';
    const rangeStr = m.ranges ? `[${formatNum(m.ranges.optimistic)} – ${formatNum(m.ranges.conservative)}]` : '—';
    return `
      <tr style="border-bottom: 1px solid #bbf7d0;">
        <td style="padding: 0.75rem 1rem; font-weight: 500;">
          ${m.name}
          ${m.isField ? '<span style="font-size: 0.7rem; background: #e0e7ff; color: #3730a3; padding: 0.15rem 0.45rem; border-radius: 9999px; margin-left: 0.4rem;">CrUX Field Metric</span>' : ''}
        </td>
        <td style="padding: 0.75rem 1rem; text-align: right;">${formatNum(m.curr)}${m.unit ? ' ' + m.unit : ''}</td>
        <td style="padding: 0.75rem 1rem; text-align: right; font-weight: 600;">${hasEst ? `${formatNum(m.est)}${m.unit ? ' ' + m.unit : ''}` : '—'}</td>
        <td style="padding: 0.75rem 1rem; text-align: right; font-size: 0.85rem; color: #15803d;">${rangeStr}</td>
        <td style="padding: 0.75rem 1rem; text-align: right; font-weight: 600; color: #15803d;">${formatReduction(m.curr, m.est, m.unit)}</td>
      </tr>
    `;
  }).join('');
}
