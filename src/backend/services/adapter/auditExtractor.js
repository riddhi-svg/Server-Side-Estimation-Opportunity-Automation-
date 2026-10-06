/**
 * Lighthouse Audit Data Extractor
 * Normalizes LH 10-12 and LH 13+ specific audit details.
 */

function extractAuditData(audits, warnings) {
  // 1. Render-Blocking Resources / Insights
  const renderBlocking = [];
  const rbAudit = audits['render-blocking-insight'] || audits['render-blocking-resources'];
  if (rbAudit?.details?.items) {
    rbAudit.details.items.forEach(item => {
      renderBlocking.push({
        url: item.url || '',
        wastedMs: item.wastedMs || item.metricSavings?.FCP || 0,
        totalBytes: item.totalBytes || 0
      });
    });
  } else if (!audits['render-blocking-insight'] && !audits['render-blocking-resources']) {
    warnings.push('Render-blocking audit missing (both render-blocking-insight and render-blocking-resources absent).');
  }

  // 2. Third-Party Summary / Insights
  const thirdParties = [];
  const tpAudit = audits['third-parties-insight'] || audits['third-party-summary'];
  if (tpAudit?.details?.items) {
    tpAudit.details.items.forEach(item => {
      const entityName = typeof item.entity === 'object' ? (item.entity?.text || 'Unknown') : (item.entity || 'Unknown');
      const subItems = [];
      item.subItems?.items?.forEach(sub => {
        subItems.push({
          url: sub.url || '',
          transferSize: sub.transferSize || 0,
          mainThreadTimeMs: sub.mainThreadTime || sub.blockingTime || 0,
          blockingTimeMs: sub.blockingTime || sub.mainThreadTime || 0
        });
      });
      thirdParties.push({
        entity: entityName,
        transferSize: item.transferSize || 0,
        mainThreadTimeMs: item.mainThreadTime || item.blockingTime || 0,
        blockingTimeMs: item.blockingTime || 0,
        subItems
      });
    });
  } else if (!audits['third-parties-insight'] && !audits['third-party-summary']) {
    warnings.push('Third-party audit missing (both third-parties-insight and third-party-summary absent).');
  }

  // 3. Bootup Time
  const bootup = [];
  const bootupAudit = audits['bootup-time'];
  if (bootupAudit?.details?.items) {
    bootupAudit.details.items.forEach(item => {
      bootup.push({
        url: item.url || '',
        totalCpuTimeMs: item.total || 0,
        scriptParseCompileTimeMs: item.scripting || item.scriptParseCompile || 0,
        tbtImpactMs: item.metricSavings?.TBT || item.tbtImpact || (item.total > 50 ? item.total - 50 : 0)
      });
    });
  } else {
    warnings.push('Bootup-time audit missing.');
  }

  // 4. Long Tasks
  const longTasks = [];
  const longTasksAudit = audits['long-tasks'];
  if (longTasksAudit?.details?.items) {
    longTasksAudit.details.items.forEach(item => {
      longTasks.push({
        url: item.url || '',
        durationMs: item.duration || 0,
        startTimeMs: item.startTime || 0,
        selfTbtImpact: item.duration > 50 ? item.duration - 50 : 0
      });
    });
  } else {
    warnings.push('Long-tasks audit missing.');
  }

  // 5. Main Thread Breakdown
  const mainThreadWork = [];
  const mainThreadAudit = audits['mainthread-work-breakdown'];
  if (mainThreadAudit?.details?.items) {
    mainThreadAudit.details.items.forEach(item => {
      mainThreadWork.push({
        category: item.groupLabel || item.group || 'Unknown',
        timeSpentMs: item.duration || 0
      });
    });
  } else {
    warnings.push('Mainthread-work-breakdown audit missing.');
  }

  return {
    renderBlocking,
    thirdParties,
    bootup,
    longTasks,
    mainThreadWork
  };
}

module.exports = { extractAuditData };
