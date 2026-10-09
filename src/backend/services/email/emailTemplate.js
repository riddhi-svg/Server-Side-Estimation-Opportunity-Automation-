function formatScoreBadge(score) {
  if (score >= 90) return { bg: '#dcfce7', color: '#15803d', label: 'Good' };
  if (score >= 50) return { bg: '#fef3c7', color: '#b45309', label: 'Needs Improvement' };
  return { bg: '#fee2e2', color: '#b91c1c', label: 'Poor' };
}

function renderEmailTemplate({ url, strategy, finalResult, timestamp = new Date().toISOString() }) {
  const scoreData = finalResult?.performanceScore ||
                    finalResult?.estimatedImpact?.performanceScore ||
                    finalResult?.performanceReport?.performanceScore || {};

  const currentScore = Math.round(Number(scoreData.current ?? finalResult?.current?.performanceScore ?? 0));
  const estScore = Math.round(Number(scoreData.projected ?? scoreData.estimated ?? finalResult?.estimated?.performanceScore ?? currentScore));
  const scoreGain = Math.round(Number(scoreData.deltaPoints ?? (estScore - currentScore)));
  const confidence = scoreData.confidence?.level || 'HIGH';

  const currentBadge = formatScoreBadge(currentScore);
  const estBadge = formatScoreBadge(estScore);

  const tables = finalResult?.tables || finalResult?.estimatedImpact?.tables || finalResult?.performanceReport?.tables || {};
  const tagRows = tables.tagClassification || [];
  const workloadRows = tables.workloadReduction || [];
  const labRows = tables.labMetrics || [];
  const cwvRows = tables.cwvMetrics || [];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>sGTM Speed & Performance Estimation Report</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px; color: #ffffff;">
      <span style="display: inline-block; background: #3b82f6; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px;">sGTM Opportunity Report</span>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; line-height: 1.3;">Server-Side GTM Performance Estimation</h1>
      <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px; word-break: break-all;"><strong>Target:</strong> ${url}</p>
      <p style="margin: 4px 0 0; color: #cbd5e1; font-size: 12px;">Strategy: <span style="text-transform: capitalize; font-weight: 600;">${strategy}</span> | Confidence: <span style="font-weight: 600; color: #38bdf8;">${confidence}</span> | Generated: ${new Date(timestamp).toLocaleString()}</p>
    </div>

    <!-- Score Overview Banner -->
    <div style="padding: 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="width: 40%; padding: 16px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Current Score</div>
            <div style="font-size: 40px; font-weight: 800; color: #0f172a; margin: 4px 0;">${currentScore}</div>
            <span style="display: inline-block; background: ${currentBadge.bg}; color: ${currentBadge.color}; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px;">${currentBadge.label}</span>
          </td>
          <td align="center" style="width: 20%; padding: 12px;">
            <div style="color: #10b981; font-size: 13px; font-weight: 700;">+${scoreGain} pts</div>
            <div style="color: #94a3b8; font-size: 20px; font-weight: bold;">➔</div>
            <div style="color: #64748b; font-size: 11px;">Potential Gain</div>
          </td>
          <td align="center" style="width: 40%; padding: 16px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Estimated Score</div>
            <div style="font-size: 40px; font-weight: 800; color: #10b981; margin: 4px 0;">${estScore}</div>
            <span style="display: inline-block; background: ${estBadge.bg}; color: ${estBadge.color}; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px;">${estBadge.label}</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Tag Classification -->
    ${tagRows.length > 0 ? `
    <div style="padding: 24px; border-bottom: 1px solid #e2e8f0;">
      <h3 style="margin: 0 0 14px; font-size: 16px; color: #0f172a; font-weight: 700;">GTM Container Tag Classification</h3>
      <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; font-size: 13px;">
        <tr style="background: #f1f5f9; text-align: left; color: #475569; font-weight: 600;">
          <th style="border-radius: 6px 0 0 6px;">Classification Tier</th>
          <th>Action</th>
          <th align="right" style="border-radius: 0 6px 6px 0;">Tags</th>
        </tr>
        ${tagRows.map(r => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="font-weight: 600; color: #1e293b;">${r.tier}</td>
          <td style="color: #64748b;">${r.action}</td>
          <td align="right" style="font-weight: 700; color: #0f172a;">${r.count}</td>
        </tr>`).join('')}
      </table>
    </div>` : ''}

    <!-- Workload Reduction -->
    ${workloadRows.length > 0 ? `
    <div style="padding: 24px; border-bottom: 1px solid #e2e8f0;">
      <h3 style="margin: 0 0 14px; font-size: 16px; color: #0f172a; font-weight: 700;">Attributed Browser Workload Reduction</h3>
      <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; font-size: 13px;">
        <tr style="background: #f1f5f9; text-align: left; color: #475569; font-weight: 600;">
          <th style="border-radius: 6px 0 0 6px;">Workload Metric</th>
          <th align="right">Current</th>
          <th align="right">Estimated</th>
          <th align="right" style="border-radius: 0 6px 6px 0;">Potential Reduction</th>
        </tr>
        ${workloadRows.map(r => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="font-weight: 600; color: #1e293b;">${r.metric}</td>
          <td align="right" style="color: #64748b;">${r.current}</td>
          <td align="right" style="color: #0f172a; font-weight: 600;">${r.estimated}</td>
          <td align="right" style="color: #10b981; font-weight: 700;">${r.reduction}</td>
        </tr>`).join('')}
      </table>
    </div>` : ''}

    <!-- Lab Metrics -->
    ${labRows.length > 0 ? `
    <div style="padding: 24px; border-bottom: 1px solid #e2e8f0;">
      <h3 style="margin: 0 0 14px; font-size: 16px; color: #0f172a; font-weight: 700;">Lighthouse Lab Performance Metrics</h3>
      <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; font-size: 13px;">
        <tr style="background: #f1f5f9; text-align: left; color: #475569; font-weight: 600;">
          <th style="border-radius: 6px 0 0 6px;">Metric</th>
          <th align="right">Current</th>
          <th align="right">Estimated</th>
          <th align="right" style="border-radius: 0 6px 6px 0;">Improvement</th>
        </tr>
        ${labRows.map(r => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="font-weight: 600; color: #1e293b;">${r.metric}</td>
          <td align="right" style="color: #64748b;">${r.current}</td>
          <td align="right" style="color: #0f172a; font-weight: 600;">${r.estimated}</td>
          <td align="right" style="color: #2563eb; font-weight: 700;">${r.improvement}</td>
        </tr>`).join('')}
      </table>
    </div>` : ''}

    <!-- Core Web Vitals (Google Ranking Metrics) -->
    ${cwvRows.length > 0 ? `
    <div style="padding: 24px; border-bottom: 1px solid #e2e8f0;">
      <h3 style="margin: 0 0 14px; font-size: 16px; color: #0f172a; font-weight: 700;">Core Web Vitals (Google Ranking Metrics)</h3>
      <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; font-size: 13px;">
        <tr style="background: #f1f5f9; text-align: left; color: #475569; font-weight: 600;">
          <th style="border-radius: 6px 0 0 6px;">Core Web Vital</th>
          <th align="right">Current</th>
          <th align="right">Estimated</th>
          <th align="right" style="border-radius: 0 6px 6px 0;">Improvement</th>
        </tr>
        ${cwvRows.map(r => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="font-weight: 600; color: #1e293b;">${r.metric}</td>
          <td align="right" style="color: #64748b;">${r.current}</td>
          <td align="right" style="color: #0f172a; font-weight: 600;">${r.estimated}</td>
          <td align="right" style="color: #2563eb; font-weight: 700;">${r.improvement}</td>
        </tr>`).join('')}
      </table>
    </div>` : ''}

    <!-- Footer -->
    <div style="padding: 20px 24px; background: #f8fafc; text-align: center; color: #94a3b8; font-size: 12px;">
      <p style="margin: 0;">Automated by <strong>Server-Side GTM Speed & Performance Estimation Platform</strong></p>
      <p style="margin: 4px 0 0;">Tatvic Strategy & Performance Team</p>
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = { renderEmailTemplate };
