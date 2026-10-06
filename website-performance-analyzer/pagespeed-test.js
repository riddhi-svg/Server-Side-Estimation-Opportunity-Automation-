require('dotenv').config();

const API_KEY = process.env.PAGESPEED_API_KEY;

async function runPageSpeedTest(targetUrl, strategy = 'mobile') {
  if (!targetUrl) {
    throw new Error('No URL provided.');
  }

  const CATEGORY = 'performance';
  const API_URL = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&key=${API_KEY}&strategy=${strategy}&category=${CATEGORY}`;

  console.log(`Starting PageSpeed Insights test for: ${targetUrl}`);
  console.log(`Strategy: ${strategy}`);
  console.log('Fetching data... (this may take a few moments)\n');

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      let errorMsg = `API request failed with status: ${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.json();
        if (errorBody.error && errorBody.error.message) {
          errorMsg = errorBody.error.message;
        }
      } catch (e) { }
      throw new Error(errorMsg);
    }

    const data = await response.json();

    if (!data.lighthouseResult || !data.lighthouseResult.audits) {
      throw new Error('No Lighthouse results found in the API response.');
    }

    const { categories, audits } = data.lighthouseResult;

    const getScoreStatus = (score) => {
      if (score === null) return null;
      if (score >= 90) return 'Good';
      if (score >= 50) return 'Needs Improvement';
      return 'Poor';
    };

    const getLcpStatus = (value) => {
      if (value === null) return null;
      if (value <= 2500) return 'Good';
      if (value <= 4000) return 'Needs Improvement';
      return 'Poor';
    };

    const getInpStatus = (value) => {
      if (value === null) return null;
      if (value <= 200) return 'Good';
      if (value <= 500) return 'Needs Improvement';
      return 'Poor';
    };

    const getClsStatus = (value) => {
      if (value === null) return null;
      if (value <= 0.1) return 'Good';
      if (value <= 0.25) return 'Needs Improvement';
      return 'Poor';
    };

    const getRawMetric = (auditId) => {
      const audit = audits[auditId];
      if (audit && audit.numericValue !== undefined) {
        return audit.numericValue;
      }
      return null;
    };

    const rawScore = (categories?.performance?.score !== undefined)
      ? Math.round(categories.performance.score * 100)
      : null;

    const rawLcp = getRawMetric('largest-contentful-paint');
    const rawInp = getRawMetric('interactive');
    const rawCls = getRawMetric('cumulative-layout-shift');
    const rawFcp = getRawMetric('first-contentful-paint');
    const rawTtfb = getRawMetric('server-response-time');
    const rawTbt = getRawMetric('total-blocking-time');
    const rawSpeedIndex = getRawMetric('speed-index');

    const getMetricScoreVal = (auditId) => {
      const audit = audits[auditId];
      if (audit && audit.score !== undefined && audit.score !== null) {
        return audit.score;
      }
      return null;
    };

    const metricScores = {
      fcp: getMetricScoreVal('first-contentful-paint'),
      si: getMetricScoreVal('speed-index'),
      lcp: getMetricScoreVal('largest-contentful-paint'),
      cls: getMetricScoreVal('cumulative-layout-shift'),
      tbt: getMetricScoreVal('total-blocking-time')
    };

    const opps = Object.values(audits).filter(a => a.details && a.details.type === 'opportunity' && a.score !== null && a.score < 1);
    const opportunities = opps.sort((a, b) => a.score - b.score).map(opp => ({
      title: opp.title,
      savings: opp.displayValue || 'N/A'
    }));

    // --- Third-Party & GTM Analysis Extraction ---
    const normalizeUrl = (url) => {
      if (!url) return '';
      let norm = url.replace(/%20/g, '').replace(/ /g, '');
      if (norm.endsWith('/')) norm = norm.slice(0, -1);
      return norm;
    };

    const targetUrlObj = new URL(targetUrl);
    const targetDomain = targetUrlObj.hostname.replace(/^www\./, '');

    const thirdPartyAnalysis = {
      entities: [],
      bootupTimes: [],
      mainthreadBreakdown: []
    };

    const scriptMap = new Map();

    const addScriptInfo = (url, evidenceObj, entityInfo = null, transferSize = null) => {
      if (!url || url.startsWith('chrome-extension://')) return;

      const norm = normalizeUrl(url);
      let hostname = '';
      try {
        const urlObj = new URL(norm);
        hostname = urlObj.hostname;
      } catch (e) { return; }

      let isThirdParty = false;
      const cleanHostname = hostname.replace(/^www\./, '');
      if (!cleanHostname.includes(targetDomain)) {
        isThirdParty = true;
      }

      if (!scriptMap.has(norm)) {
        scriptMap.set(norm, {
          url: norm,
          originalUrl: url,
          hostname,
          isThirdParty,
          vendor: 'Unknown',
          transferSize: 0,
          mainThreadTimeMs: null,
          bootupTimeMs: null,
          evidence: []
        });
      }

      const entry = scriptMap.get(norm);
      if (entityInfo && entry.vendor === 'Unknown') {
        entry.vendor = typeof entityInfo === 'object' ? entityInfo.text : entityInfo;
      }
      if (transferSize !== null && entry.transferSize === 0) {
        entry.transferSize = transferSize;
      }
      if (evidenceObj) {
        const existing = entry.evidence.find(e => e.type === evidenceObj.type);
        if (!existing) {
          entry.evidence.push(evidenceObj);
        } else {
          if (evidenceObj.durationMs) existing.durationMs = (existing.durationMs || 0) + evidenceObj.durationMs;
          if (evidenceObj.totalCpuTimeMs) existing.totalCpuTimeMs = (existing.totalCpuTimeMs || 0) + evidenceObj.totalCpuTimeMs;
          if (evidenceObj.wastedMs) existing.wastedMs = (existing.wastedMs || 0) + evidenceObj.wastedMs;
        }
      }
    };

    const networkAudit = audits['network-requests'];
    if (networkAudit && networkAudit.details && networkAudit.details.items) {
      networkAudit.details.items.forEach(item => {
        if (item.resourceType === 'Script' || item.mimeType === 'application/javascript' || item.url.includes('.js') || item.url.includes('gtm') || item.url.includes('gtag')) {
          addScriptInfo(item.url, null, item.entity, item.transferSize);
        }
      });
    }

    const thirdPartyAudit = audits['third-party-summary'];
    if (thirdPartyAudit && thirdPartyAudit.details && thirdPartyAudit.details.items) {
      thirdPartyAudit.details.items.forEach(item => {
        const vendor = typeof item.entity === 'object' ? item.entity.text : (item.entity || 'Unknown');
        if (item.subItems && item.subItems.items) {
          item.subItems.items.forEach(sub => {
            addScriptInfo(sub.url, { type: 'third-party-summary', mainThreadTimeMs: sub.blockingTime || 0 }, vendor, sub.transferSize);
            const entry = scriptMap.get(normalizeUrl(sub.url));
            if (entry) entry.mainThreadTimeMs = sub.blockingTime || 0;
          });
        }
      });
    }

    const thirdPartiesInsight = audits['third-parties-insight'];
    if (thirdPartiesInsight && thirdPartiesInsight.details && thirdPartiesInsight.details.items) {
      thirdPartiesInsight.details.items.forEach(item => {
        const vendor = typeof item.entity === 'object' ? item.entity.text : (item.entity || 'Unknown');
        if (item.subItems && item.subItems.items) {
          item.subItems.items.forEach(sub => {
            addScriptInfo(sub.url, { type: 'third-parties-insight', mainThreadTimeMs: sub.mainThreadTime || 0 }, vendor, sub.transferSize);
            const entry = scriptMap.get(normalizeUrl(sub.url));
            if (entry && (entry.mainThreadTimeMs === null || sub.mainThreadTime > entry.mainThreadTimeMs)) {
              entry.mainThreadTimeMs = sub.mainThreadTime || 0;
            }
          });
        }
      });
    }

    const bootupTimeAudit = audits['bootup-time'];
    if (bootupTimeAudit && bootupTimeAudit.details && bootupTimeAudit.details.items) {
      thirdPartyAnalysis.bootupTimes = bootupTimeAudit.details.items.map(item => ({
        url: item.url,
        totalCpuTime: item.total || 0,
        scriptParseCompileTime: item.scripting || item.scriptParseCompile || 0
      }));
      bootupTimeAudit.details.items.forEach(item => {
        if (item.total > 0) {
          addScriptInfo(item.url, { type: 'bootup-time', totalCpuTimeMs: item.total });
          const entry = scriptMap.get(normalizeUrl(item.url));
          if (entry) entry.bootupTimeMs = item.total;
        }
      });
    }

    const mainthreadAudit = audits['mainthread-work-breakdown'];
    if (mainthreadAudit && mainthreadAudit.details && mainthreadAudit.details.items) {
      thirdPartyAnalysis.mainthreadBreakdown = mainthreadAudit.details.items.map(item => ({
        category: item.groupLabel || item.group || 'Unknown',
        timeSpentMs: item.duration || 0
      }));
    }

    const longTasksAudit = audits['long-tasks'];
    if (longTasksAudit && longTasksAudit.details && longTasksAudit.details.items) {
      longTasksAudit.details.items.forEach(item => {
        addScriptInfo(item.url, { type: 'long-task', durationMs: item.duration });
      });
    }

    const renderBlockingAudit = audits['render-blocking-resources'];
    if (renderBlockingAudit && renderBlockingAudit.details && renderBlockingAudit.details.items) {
      renderBlockingAudit.details.items.forEach(item => {
        addScriptInfo(item.url, { type: 'render-blocking', wastedMs: item.wastedMs });
      });
    }

    const allScripts = Array.from(scriptMap.values()).filter(s => s.isThirdParty);



    const getResourceType = (vendor, url) => {
      const v = vendor.toLowerCase();
      const u = url.toLowerCase();

      if (v.includes('google tag manager')) return 'TRACKING';
      if (v.includes('google tag') || u.includes('gtag')) return 'ANALYTICS';
      if (v.includes('google analytics') || v.includes('analytics')) return 'ANALYTICS';
      if (v.includes('facebook') || v.includes('meta / facebook') || u.includes('fbevents')) return 'ADVERTISING';
      if (v.includes('criteo')) return 'ADVERTISING';
      if (v.includes('clarity')) return 'ANALYTICS';
      if (v.includes('doubleclick') || v.includes('google ads') || u.includes('googleadservices')) return 'ADVERTISING';
      if (v.includes('contentsquare')) return 'ANALYTICS';
      if (v.includes('evergage')) return 'MARKETING';
      if (v.includes('new relic') || v.includes('mpulse')) return 'ANALYTICS';
      if (v.includes('vwo') || v.includes('optimizely')) return 'MARKETING';
      if (v.includes('marketing') || v.includes('hubspot')) return 'MARKETING';
      if (v.includes('advertising') || v.includes('adroll') || v.includes('ads')) return 'ADVERTISING';
      if (v.includes('tracking') || v.includes('pixel') || v.includes('hotjar')) return 'TRACKING';

      return 'OTHER_THIRD_PARTY';
    };

    thirdPartyAnalysis.entities = allScripts.map(script => {
      let isGtmRelated = false;
      let gtmRelationshipNotes = 'Could not reliably determine if triggered by GTM from available PageSpeed data.';
      let vendor = script.vendor;
      let urlLow = script.url.toLowerCase();

      if (urlLow.includes('googletagmanager.com/gtm.js')) {
        isGtmRelated = true;
        gtmRelationshipNotes = 'Identified as GTM script.';
        vendor = 'Google Tag Manager';
      } else if (urlLow.includes('googletagmanager.com/gtag/js')) {
        isGtmRelated = true;
        gtmRelationshipNotes = 'Contains Google Tag script URL.';
        vendor = 'Google Tag';
      } else if (urlLow.includes('facebook') || urlLow.includes('fbevents')) {
        vendor = vendor === 'Unknown' ? 'Meta / Facebook' : vendor;
      } else if (urlLow.includes('criteo')) {
        vendor = vendor === 'Unknown' ? 'Criteo' : vendor;
      } else if (urlLow.includes('clarity')) {
        vendor = vendor === 'Unknown' ? 'Microsoft Clarity' : vendor;
      } else if (urlLow.includes('googleadservices') || urlLow.includes('doubleclick') || vendor.includes('Doubleclick')) {
        vendor = vendor === 'Unknown' ? 'Google Ads' : vendor;
      } else if (vendor.includes('Analytics')) {
        vendor = vendor === 'Unknown' ? 'Analytics' : vendor;
      }

      let hasGtmTriggerEvidence = false; 
      // If we had initiator or call tree evidence from Lighthouse, we'd check it here.
      // E.g., if script.evidence.some(e => e.initiator === 'gtm.js') hasGtmTriggerEvidence = true;

      let attributionStatus = 'DIRECT_THIRD_PARTY';
      
      if (vendor === 'Google Tag Manager' || vendor === 'Google Tag') {
        attributionStatus = 'GTM_CORE';
        if (vendor === 'Google Tag Manager') gtmRelationshipNotes = 'Identified as GTM script.';
        if (vendor === 'Google Tag') gtmRelationshipNotes = 'Identified as Google Tag (GTM destination).';
        isGtmRelated = true;
      } else if (hasGtmTriggerEvidence) {
        attributionStatus = 'GTM_TRIGGERED_THIRD_PARTY';
        gtmRelationshipNotes = 'Evidence indicates resource was triggered by GTM.';
        isGtmRelated = true;
      } else {
        attributionStatus = 'DIRECT_THIRD_PARTY';
        gtmRelationshipNotes = 'No evidence found that GTM triggered this resource.';
        isGtmRelated = false;
      }

      return {
        vendor,
        url: script.originalUrl,
        hostname: script.hostname,
        isThirdParty: script.isThirdParty,
        attributionStatus,
        gtmRelationship: attributionStatus,
        resourceType: getResourceType(vendor, script.originalUrl),
        transferSize: script.transferSize,
        mainThreadTimeMs: script.mainThreadTimeMs,
        bootupTimeMs: script.bootupTimeMs,
        evidence: script.evidence,
        isGtmRelated,
        gtmRelationshipNotes
      };
    });

    // --- GTM Performance Baseline ---
    const gtmPerformanceBaseline = {
      gtmTransferSize: 0,
      gtmMainThreadTimeMs: 0,
      gtmBootupTimeMs: 0,
      gtmResourceCount: 0,
      gtmResources: []
    };

    thirdPartyAnalysis.entities.forEach(script => {
      if (script.attributionStatus === 'GTM_CORE' || script.attributionStatus === 'GTM_TRIGGERED_THIRD_PARTY') {
        gtmPerformanceBaseline.gtmResourceCount++;

        gtmPerformanceBaseline.gtmTransferSize += script.transferSize || 0;
        gtmPerformanceBaseline.gtmMainThreadTimeMs += script.mainThreadTimeMs || 0;
        gtmPerformanceBaseline.gtmBootupTimeMs += script.bootupTimeMs || 0;

        gtmPerformanceBaseline.gtmResources.push({
          url: script.url,
          attributionStatus: script.attributionStatus,
          gtmRelationshipNotes: script.gtmRelationshipNotes,
          transferSize: script.transferSize || 0,
          mainThreadTimeMs: script.mainThreadTimeMs || 0,
          bootupTimeMs: script.bootupTimeMs || 0
        });
      }
    });

    // --- Performance Report Generation ---
    const getAttribution = (rawUrl) => {
      if (!rawUrl) return { entity: 'Unknown', status: 'UNATTRIBUTED', gtmRelationship: 'UNKNOWN' };
      const url = normalizeUrl(rawUrl);

      const match = thirdPartyAnalysis.entities.find(ent => normalizeUrl(ent.url) === url);
      if (match) {
        return {
          entity: match.vendor,
          status: match.attributionStatus,
          gtmRelationship: match.gtmRelationship
        };
      }
      return { entity: 'Unknown', status: 'UNATTRIBUTED', gtmRelationship: 'UNKNOWN' };
    };

    const performanceReport = {
      platform: strategy,
      pageSpeedScore: rawScore !== null ? rawScore : 'N/A',
      metrics: {},
      affectedMetrics: [],
      gtmPerformanceBaseline: gtmPerformanceBaseline,
      thirdPartyInventory: thirdPartyAnalysis.entities.map(ent => ({
        vendor: ent.vendor,
        url: ent.url,
        hostname: ent.hostname,
        isThirdParty: ent.isThirdParty,
        resourceType: ent.resourceType,
        attributionStatus: ent.attributionStatus,
        gtmRelationship: ent.gtmRelationship,
        transferSize: ent.transferSize,
        mainThreadTimeMs: ent.mainThreadTimeMs,
        bootupTimeMs: ent.bootupTimeMs,
        evidence: ent.evidence
      }))
    };

    if (rawLcp !== null) performanceReport.metrics.LCP = { value: rawLcp, unit: "ms", source: "Lighthouse" };
    if (rawCls !== null) performanceReport.metrics.CLS = { value: rawCls, unit: "", source: "Lighthouse" };
    if (rawFcp !== null) performanceReport.metrics.FCP = { value: rawFcp, unit: "ms", source: "Lighthouse" };
    if (rawTbt !== null) performanceReport.metrics.TBT = { value: rawTbt, unit: "ms", source: "Lighthouse" };
    if (rawTtfb !== null) performanceReport.metrics.TTFB = { value: rawTtfb, unit: "ms", source: "Lighthouse" };
    if (rawSpeedIndex !== null) performanceReport.metrics.SpeedIndex = { value: rawSpeedIndex, unit: "ms", source: "Lighthouse" };

    let actualInpValue = null;
    let inpSource = null;
    if (data && data.loadingExperience && data.loadingExperience.metrics && data.loadingExperience.metrics.INTERACTION_TO_NEXT_PAINT) {
      actualInpValue = data.loadingExperience.metrics.INTERACTION_TO_NEXT_PAINT.percentile;
      inpSource = "CrUX";
    } else if (audits['interaction-to-next-paint'] && audits['interaction-to-next-paint'].numericValue !== undefined) {
      actualInpValue = audits['interaction-to-next-paint'].numericValue;
      inpSource = "Lighthouse";
    }
    if (actualInpValue !== null) {
      performanceReport.metrics.INP = { value: actualInpValue, unit: "ms", source: inpSource };
    }

    const mergeContributors = (existing, newContribs) => {
      const merged = [...existing];
      for (const nc of newContribs) {
        const match = merged.find(c => c.url === nc.url);
        if (match) {
          match.evidence.push(...nc.evidence);
        } else {
          merged.push(nc);
        }
      }
      return merged;
    };

    const addAffectedMetric = (metricName, impactClassification, issue, contributors) => {
      if (!performanceReport.metrics[metricName]) return;
      const existing = performanceReport.affectedMetrics.find(m => m.metric === metricName);
      if (existing) {
        existing.contributors = mergeContributors(existing.contributors, contributors);
      } else {
        performanceReport.affectedMetrics.push({
          metric: metricName,
          value: performanceReport.metrics[metricName].value,
          unit: performanceReport.metrics[metricName].unit,
          impactClassification: impactClassification,
          issue: issue,
          contributors: contributors
        });
      }
    };

    const longTasksAuditMetric = audits['long-tasks'];
    if (longTasksAuditMetric && longTasksAuditMetric.details && longTasksAuditMetric.details.items) {
      const trackingTasks = longTasksAuditMetric.details.items.map(item => {
        const attr = getAttribution(item.url);
        return { ...item, attr };
      }).filter(item => item.attr.status !== 'UNATTRIBUTED');

      if (trackingTasks.length > 0) {
        const contributors = trackingTasks.map(t => ({
          vendor: t.attr.entity,
          url: t.url,
          attributionStatus: t.attr.status,
          gtmRelationship: t.attr.gtmRelationship,
          evidence: [{ type: 'long-task', durationMs: t.duration }]
        }));

        addAffectedMetric('INP', 'OBSERVED_IMPACT', 'Tracking-related scripts are contributing to long main-thread tasks, which can increase the time required to process user interactions and create a responsiveness risk.', contributors);
        addAffectedMetric('TBT', 'OBSERVED_IMPACT', 'Tracking-related scripts are executing long tasks on the main thread, directly contributing to Total Blocking Time.', contributors);
      }
    }

    const renderBlockingAuditMetric = audits['render-blocking-resources'];
    if (renderBlockingAuditMetric && renderBlockingAuditMetric.details && renderBlockingAuditMetric.details.items) {
      const trackingBlockers = renderBlockingAuditMetric.details.items.map(item => {
        const attr = getAttribution(item.url);
        return { ...item, attr };
      }).filter(item => item.attr.status !== 'UNATTRIBUTED');

      if (trackingBlockers.length > 0) {
        const contributors = trackingBlockers.map(t => ({
          vendor: t.attr.entity,
          url: t.url,
          attributionStatus: t.attr.status,
          gtmRelationship: t.attr.gtmRelationship,
          evidence: [{ type: 'render-blocking', wastedMs: t.wastedMs }]
        }));

        addAffectedMetric('LCP', 'OBSERVED_IMPACT', 'Tracking-related scripts are render-blocking, which delays the initial rendering of the page and negatively impacts the Largest Contentful Paint.', contributors);
        addAffectedMetric('FCP', 'OBSERVED_IMPACT', 'Tracking-related scripts are render-blocking, which delays the First Contentful Paint.', contributors);
      }
    }

    const bootupAuditMetric = audits['bootup-time'];
    if (bootupAuditMetric && bootupAuditMetric.details && bootupAuditMetric.details.items) {
      const trackingBootup = bootupAuditMetric.details.items.map(item => {
        const attr = getAttribution(item.url);
        return { ...item, attr };
      }).filter(item => item.attr.status !== 'UNATTRIBUTED' && item.total > 50);

      if (trackingBootup.length > 0) {
        const contributors = trackingBootup.map(t => ({
          vendor: t.attr.entity,
          url: t.url,
          attributionStatus: t.attr.status,
          gtmRelationship: t.attr.gtmRelationship,
          evidence: [{ type: 'bootup-time', totalCpuTimeMs: t.total }]
        }));

        addAffectedMetric('SpeedIndex', 'POTENTIAL_IMPACT', 'Tracking-related scripts have high CPU bootup time, which can delay page painting and potentially impact Speed Index.', contributors);
      }
    }

    const thirdPartiesInsightAudit = audits['third-parties-insight'];

    const analyticsCount = thirdPartyAnalysis.entities.filter(e => e.resourceType === 'ANALYTICS').length;
    const advertisingCount = thirdPartyAnalysis.entities.filter(e => e.resourceType === 'ADVERTISING').length;
    const marketingCount = thirdPartyAnalysis.entities.filter(e => e.resourceType === 'MARKETING').length;
    const trackingCount = thirdPartyAnalysis.entities.filter(e => e.resourceType === 'TRACKING').length;
    const otherCount = thirdPartyAnalysis.entities.filter(e => e.resourceType === 'OTHER_THIRD_PARTY').length;

    const gtmResources = thirdPartyAnalysis.entities.filter(e => e.attributionStatus === 'GTM_CORE').length;
    const gtmTriggeredResources = thirdPartyAnalysis.entities.filter(e => e.attributionStatus === 'GTM_TRIGGERED_THIRD_PARTY').length;
    const directThirdPartyResources = thirdPartyAnalysis.entities.filter(e => e.attributionStatus === 'DIRECT_THIRD_PARTY').length;

    console.log('\n--- GTM Impact Debug Output ---');
    console.log('1. GTM Core Resources:');
    thirdPartyAnalysis.entities.filter(e => e.attributionStatus === 'GTM_CORE').forEach(r => {
      console.log(`   - ${r.url} | Size: ${r.transferSize} bytes | Main Thread: ${r.mainThreadTimeMs} ms`);
    });

    console.log('\n2. GTM-Triggered Third-Party Resources:');
    thirdPartyAnalysis.entities.filter(e => e.attributionStatus === 'GTM_TRIGGERED_THIRD_PARTY').forEach(r => {
      console.log(`   - ${r.url} | Size: ${r.transferSize} bytes | Main Thread: ${r.mainThreadTimeMs} ms`);
      console.log(`     Reason: ${r.gtmRelationshipNotes}`);
    });

    console.log('\n3. Direct Third-Party Resources:');
    thirdPartyAnalysis.entities.filter(e => e.attributionStatus === 'DIRECT_THIRD_PARTY').forEach(r => {
      console.log(`   - ${r.url} | Size: ${r.transferSize} bytes | Main Thread: ${r.mainThreadTimeMs} ms`);
    });

    console.log(`\nFinal GTM Impact Size: ${gtmPerformanceBaseline.gtmTransferSize} bytes`);
    console.log(`Final GTM Impact Main Thread: ${gtmPerformanceBaseline.gtmMainThreadTimeMs} ms`);
    console.log('-------------------------------\n');

    console.log(`Diagnostic: Third-party summary available: ${!!thirdPartyAudit}`);
    console.log(`Diagnostic: Third-parties-insight available: ${!!thirdPartiesInsightAudit}`);
    console.log(`Diagnostic: Total third-party resources: ${thirdPartyAnalysis.entities.length}`);
    console.log(`Diagnostic: Analytics resources: ${analyticsCount}`);
    console.log(`Diagnostic: Advertising resources: ${advertisingCount}`);
    console.log(`Diagnostic: Marketing resources: ${marketingCount}`);
    console.log(`Diagnostic: Tracking resources: ${trackingCount}`);
    console.log(`Diagnostic: Other third-party resources: ${otherCount}`);
    console.log(`Diagnostic: GTM Core resources: ${gtmResources}`);
    console.log(`Diagnostic: GTM-Triggered Third Party resources: ${gtmTriggeredResources}`);
    console.log(`Diagnostic: Direct Third Party resources: ${directThirdPartyResources}`);
    console.log(`Diagnostic: Final thirdPartyInventory:\n${JSON.stringify(performanceReport.thirdPartyInventory, null, 2)}`);

    let lcpDetails = null;
    if (audits['lcp-breakdown-insight'] && audits['lcp-breakdown-insight'].details && audits['lcp-breakdown-insight'].details.items) {
      const items = audits['lcp-breakdown-insight'].details.items;
      let nodeSnippet = null;
      let nodeSelector = null;
      let timings = null;
      for (const item of items) {
        if (item.type === 'node') {
          nodeSnippet = item.snippet;
          nodeSelector = item.selector;
        } else if (item.type === 'table' && item.items) {
          timings = item.items;
        }
      }
      lcpDetails = {
        snippet: nodeSnippet,
        selector: nodeSelector,
        timings: timings
      };
    } else if (audits['largest-contentful-paint-element'] && audits['largest-contentful-paint-element'].details && audits['largest-contentful-paint-element'].details.items) {
      const items = audits['largest-contentful-paint-element'].details.items;
      if (items.length > 0 && items[0].node) {
        lcpDetails = {
          snippet: items[0].node.snippet,
          selector: items[0].node.selector,
          timings: null
        };
      }
    }
    let clsDetails = null;
    if (audits['layout-shifts'] && audits['layout-shifts'].details && audits['layout-shifts'].details.items) {
      clsDetails = audits['layout-shifts'].details.items.map(item => ({
        score: item.score,
        snippet: item.node ? item.node.snippet : null,
        selector: item.node ? item.node.selector : null
      }));
    }

    const resultObj = {
      url: targetUrl,
      strategy: strategy,
      performanceScore: {
        value: rawScore,
        status: getScoreStatus(rawScore)
      },
      coreWebVitals: {
        lcp: {
          value: rawLcp,
          status: getLcpStatus(rawLcp)
        },
        inp: {
          value: rawInp,
          status: getInpStatus(rawInp)
        },
        cls: {
          value: rawCls,
          status: getClsStatus(rawCls)
        }
      },
      otherMetrics: {
        fcp: rawFcp,
        ttfb: rawTtfb,
        tbt: rawTbt,
        speedIndex: rawSpeedIndex
      },
      metricScores: metricScores,
      opportunities: opportunities,
      thirdPartyAnalysis: thirdPartyAnalysis,
      performanceReport: performanceReport,
      lcpDetails: lcpDetails,
      clsDetails: clsDetails
    };

    return resultObj;

  } catch (error) {
    console.error('--- Error running PageSpeed test ---');
    console.error(error.message);
    throw error;
  }
}

// Retain standalone execution logic
if (require.main === module) {
  const TARGET_URL = 'https://www.royalenfield.com/in/en/home/';
  const strategy = process.argv[2] || 'mobile';
  runPageSpeedTest(TARGET_URL, strategy)
    .then(resultObj => {
      const formatS = (val) => val !== null ? `${(val / 1000).toFixed(2)} s` : 'N/A';
      const formatMs = (val) => val !== null ? `${Math.round(val).toLocaleString('en-US')} ms` : 'N/A';
      const formatCls = (val) => val !== null ? `${val.toFixed(3)}` : 'N/A';
      const formatStatus = (status) => status ? ` [${status}]` : '';

      console.log('--- PageSpeed Insights Results ---');

      const ps = resultObj.performanceScore;
      console.log(`Overall Performance Score : ${ps.value !== null ? ps.value : 'N/A'}${formatStatus(ps.status)}`);

      const cwv = resultObj.coreWebVitals;
      console.log(`LCP (Largest Contentful Paint) : ${formatS(cwv.lcp.value)}${formatStatus(cwv.lcp.status)}`);
      console.log(`INP (Interactive)              : ${formatMs(cwv.inp.value)}${formatStatus(cwv.inp.status)}`);
      console.log(`CLS (Cumulative Layout Shift)  : ${formatCls(cwv.cls.value)}${formatStatus(cwv.cls.status)}`);

      const om = resultObj.otherMetrics;
      console.log(`FCP (First Contentful Paint)   : ${formatS(om.fcp)}`);
      console.log(`TTFB (Time to First Byte)      : ${formatMs(om.ttfb)}`);
      console.log(`TBT (Total Blocking Time)      : ${formatS(om.tbt)}`);
      console.log(`Speed Index                    : ${formatS(om.speedIndex)}`);
      console.log('----------------------------------\n');

      console.log('--- Third-Party & GTM Analysis ---');
      console.log(JSON.stringify(resultObj.thirdPartyAnalysis, null, 2));
      console.log('----------------------------------\n');

      console.log('--- Final Performance Report ---');
      console.log(JSON.stringify(resultObj.performanceReport, null, 2));
      console.log('----------------------------------\n');

      const mockGtmTagsResult = {
        summary: {
          totalTags: 350,
          migrationSummary: { 'Potentially Server-Side': 219, 'Client-Side Only / Keep Client-Side': 100, 'Needs Review': 31 },
          tagsByCategory: { 'Google Analytics / GA4': 50, 'Meta / Facebook': 20, 'Google Ads': 10 }
        },
        tags: {
          'Google Analytics / GA4': [{ migrationClassification: 'Potentially Server-Side' }],
          'Meta / Facebook': [{ migrationClassification: 'Potentially Server-Side' }],
          'Google Ads': [{ migrationClassification: 'Potentially Server-Side' }]
        }
      };
      
      const estimatedImpact = calculateMigrationEstimation(resultObj, mockGtmTagsResult);
      
      console.log('--- SERVER-SIDE MIGRATION IMPACT ESTIMATION ---');
      console.log('Server-Side Migration Impact\n');
      console.log('Metric | Current | Estimated Post-Migration | Estimated Change');
      console.log('------------------------------------------------------------');
      if (estimatedImpact.estimated.performanceScore !== 'Not estimated yet' && estimatedImpact.estimated.performanceScore !== null) {
        if (estimatedImpact.estimated.performanceScore === 'Not directly predictable') {
          console.log(`PageSpeed Score | ${estimatedImpact.current.performanceScore !== undefined ? estimatedImpact.current.performanceScore : 'Not available'} | Not directly predictable | —`);
        } else {
          console.log(`PageSpeed Score | ${estimatedImpact.current.performanceScore !== undefined ? estimatedImpact.current.performanceScore : 'Not available'} | ${estimatedImpact.estimated.performanceScore} | ${Math.abs(estimatedImpact.change.performanceScore.points)} points`);
        }
      }
      console.log(`GTM Transfer Size | ${estimatedImpact.current.gtmTransferSize} KB | ${estimatedImpact.estimated.gtmTransferSize} KB | ${Math.abs(estimatedImpact.change.gtmTransferSize.absolute)} KB (${Math.abs(estimatedImpact.change.gtmTransferSize.percentage)}%)`);
      console.log(`GTM Main-Thread Time | ${estimatedImpact.current.gtmMainThreadTime} ms | ${estimatedImpact.estimated.gtmMainThreadTime} ms | ${Math.abs(estimatedImpact.change.gtmMainThreadTime.absolute)} ms (${Math.abs(estimatedImpact.change.gtmMainThreadTime.percentage)}%)`);
      console.log(`GTM Bootup Time | ${estimatedImpact.current.gtmBootupTime} ms | ${estimatedImpact.estimated.gtmBootupTime} ms | ${Math.abs(estimatedImpact.change.gtmBootupTime.absolute)} ms (${Math.abs(estimatedImpact.change.gtmBootupTime.percentage)}%)`);
      if (estimatedImpact.estimated.tbt !== 'Not estimated yet') {
        if (estimatedImpact.estimated.tbt === 'Not directly predictable') {
          console.log(`TBT | ${estimatedImpact.current.tbt} ms | Not directly predictable | —`);
        } else {
          console.log(`TBT | ${estimatedImpact.current.tbt} ms | ${estimatedImpact.estimated.tbt} ms | ${Math.abs(estimatedImpact.change.tbt.absolute)} ms (${Math.abs(estimatedImpact.change.tbt.percentage)}%)`);
        }
      }

      if (estimatedImpact.estimated.inp !== 'Not estimated yet') {
        if (estimatedImpact.estimated.inp === 'Not directly predictable') {
          console.log(`INP | ${estimatedImpact.current.inp} ms | Not directly predictable | —`);
        } else {
          console.log(`INP | ${estimatedImpact.current.inp} ms | ${estimatedImpact.estimated.inp} ms | ${Math.abs(estimatedImpact.change.inp.absolute)} ms (${Math.abs(estimatedImpact.change.inp.percentage)}%)`);
        }
      }

      if (estimatedImpact.estimated.speedIndex !== 'Not estimated yet') {
        if (estimatedImpact.estimated.speedIndex === 'Not directly predictable') {
          console.log(`Speed Index | ${estimatedImpact.current.speedIndex !== undefined ? estimatedImpact.current.speedIndex : 'Not available'} ms | Not directly predictable | —`);
        } else {
          console.log(`Speed Index | ${estimatedImpact.current.speedIndex !== undefined ? estimatedImpact.current.speedIndex : 'Not available'} ms | ${estimatedImpact.estimated.speedIndex} ms | ${Math.abs(estimatedImpact.change.speedIndex.absolute)} ms (${Math.abs(estimatedImpact.change.speedIndex.percentage)}%)`);
        }
      }

      if (estimatedImpact.estimated.lcp !== 'Not estimated yet' && estimatedImpact.estimated.lcp !== null) {
        if (estimatedImpact.estimated.lcp === 'Not directly predictable') {
          console.log(`LCP | ${estimatedImpact.current.lcp !== undefined ? estimatedImpact.current.lcp : 'Not available'} ms | Not directly predictable | —`);
        } else {
          console.log(`LCP | ${estimatedImpact.current.lcp !== undefined ? estimatedImpact.current.lcp : 'Not available'} ms | ${estimatedImpact.estimated.lcp} ms | ${Math.abs(estimatedImpact.change.lcp.absolute)} ms (${Math.abs(estimatedImpact.change.lcp.percentage)}%)`);
        }
      }

      if (estimatedImpact.estimated.cls !== 'Not estimated yet' && estimatedImpact.estimated.cls !== null) {
        if (estimatedImpact.estimated.cls === 'Not directly predictable') {
          console.log(`CLS | ${estimatedImpact.current.cls !== undefined ? estimatedImpact.current.cls : 'Not available'} | Not directly predictable | —`);
        } else {
          console.log(`CLS | ${estimatedImpact.current.cls !== undefined ? estimatedImpact.current.cls : 'Not available'} | ${estimatedImpact.estimated.cls} | ${Math.abs(estimatedImpact.change.cls.absolute)} (${Math.abs(estimatedImpact.change.cls.percentage)}%)`);
        }
      }

      if (estimatedImpact.estimated.fcp !== 'Not estimated yet' && estimatedImpact.estimated.fcp !== null) {
        if (estimatedImpact.estimated.fcp === 'Not directly predictable') {
          console.log(`FCP | ${estimatedImpact.current.fcp !== undefined ? estimatedImpact.current.fcp : 'Not available'} ms | Not directly predictable | —`);
        } else {
          console.log(`FCP | ${estimatedImpact.current.fcp !== undefined ? estimatedImpact.current.fcp : 'Not available'} ms | ${estimatedImpact.estimated.fcp} ms | ${Math.abs(estimatedImpact.change.fcp.absolute)} ms (${Math.abs(estimatedImpact.change.fcp.percentage)}%)`);
        }
      }

      if (estimatedImpact.estimated.ttfb !== 'Not estimated yet' && estimatedImpact.estimated.ttfb !== null) {
        if (estimatedImpact.estimated.ttfb === 'Not directly predictable') {
          console.log(`TTFB | ${estimatedImpact.current.ttfb !== undefined ? estimatedImpact.current.ttfb : 'Not available'} ms | Not directly predictable | —`);
        } else {
          console.log(`TTFB | ${estimatedImpact.current.ttfb !== undefined ? estimatedImpact.current.ttfb : 'Not available'} ms | ${estimatedImpact.estimated.ttfb} ms | ${Math.abs(estimatedImpact.change.ttfb.absolute)} ms (${Math.abs(estimatedImpact.change.ttfb.percentage)}%)`);
        }
      }

      console.log('\nMigration Opportunity\n');
      console.log(`Total GTM Tags: ${estimatedImpact.migrationOpportunity.totalTags}`);
      console.log(`Potential Server-Side Tags: ${estimatedImpact.migrationOpportunity.migratableTags}`);
      console.log(`Migration Opportunity Coverage: ${estimatedImpact.migrationOpportunity.coverage}%`);

      console.log('\nEstimated Impact Summary\n');
      console.log(`* Estimated GTM browser-side transfer reduction: ${Math.abs(estimatedImpact.change.gtmTransferSize.absolute)} KB (${Math.abs(estimatedImpact.change.gtmTransferSize.percentage)}%)`);
      console.log(`* Estimated GTM main-thread reduction: ${Math.abs(estimatedImpact.change.gtmMainThreadTime.absolute)} ms (${Math.abs(estimatedImpact.change.gtmMainThreadTime.percentage)}%)`);
      console.log(`* Estimated GTM bootup reduction: ${Math.abs(estimatedImpact.change.gtmBootupTime.absolute)} ms (${Math.abs(estimatedImpact.change.gtmBootupTime.percentage)}%)`);
      if (estimatedImpact.estimated.tbt !== 'Not estimated yet' && estimatedImpact.estimated.tbt !== 'Not directly predictable') {
        console.log(`* Estimated TBT reduction: ${Math.abs(estimatedImpact.change.tbt.absolute)} ms (${Math.abs(estimatedImpact.change.tbt.percentage)}%)`);
      }
      if (estimatedImpact.estimated.inp !== 'Not estimated yet') {
        if (estimatedImpact.estimated.inp === 'Not directly predictable') {
          console.log(`* Estimated INP improvement: Not directly predictable from available trace attribution`);
        } else {
          console.log(`* Estimated INP reduction: ${Math.abs(estimatedImpact.change.inp.absolute)} ms (${Math.abs(estimatedImpact.change.inp.percentage)}%)`);
        }
      }
      if (estimatedImpact.estimated.speedIndex !== 'Not estimated yet') {
        if (estimatedImpact.estimated.speedIndex === 'Not directly predictable') {
          console.log(`* Estimated Speed Index improvement: Not directly predictable from available trace attribution`);
        } else {
          console.log(`* Estimated Speed Index reduction: ${Math.abs(estimatedImpact.change.speedIndex.absolute)} ms (${Math.abs(estimatedImpact.change.speedIndex.percentage)}%)`);
        }
      }
      console.log('-----------------------------------------------\n');
    })
    .catch(error => {
      // Error is already logged
    });
}

function generateFinalGtmMigrationResult(pageSpeedResult, gtmTagsResult) {
  const psData = pageSpeedResult.performanceReport.gtmPerformanceBaseline;
  const gtmSummary = gtmTagsResult.summary;
  
  const migrationOpportunities = [];
  
  if (gtmTagsResult.tags) {
    for (const category in gtmTagsResult.tags) {
      gtmTagsResult.tags[category].forEach(tag => {
        if (tag.migrationClassification === 'Potentially Server-Side') {
          let reason = '';
          const type = tag.type;
          if (['gaawe', 'gaawc', 'ua'].includes(type)) {
            reason = 'Google Analytics / GA4 tags are natively supported and optimized for Server-Side GTM.';
          } else if (['awct'].includes(type)) {
            reason = 'Google Ads Conversion tracking is natively supported via Server-Side GTM.';
          } else if (['flc', 'fls'].includes(type)) {
            reason = 'Floodlight tags are natively supported via Server-Side GTM.';
          } else {
            reason = 'This tag type is identified as a high-potential candidate for server-side migration.';
          }

          migrationOpportunities.push({
            tagName: tag.name,
            tagTypeVendor: tag.category,
            currentClientSideImplementation: tag.type,
            migrationClassification: tag.migrationClassification,
            migrationReason: reason
          });
        }
      });
    }
  }

  const finalGtmMigrationResult = {
    performanceImpact: {
      label: "VERIFIED GTM CORE impact",
      gtmCoreResourceCount: psData.gtmResourceCount || 0,
      gtmCoreTransferSize: psData.gtmTransferSize || 0,
      gtmCoreMainThreadTimeMs: psData.gtmMainThreadTimeMs || 0,
      gtmCoreBootupTimeMs: psData.gtmBootupTimeMs || 0
    },
    gtmMigration: {
      totalTags: gtmSummary ? gtmSummary.totalTags : 0,
      potentiallyServerSide: gtmSummary && gtmSummary.migrationSummary ? gtmSummary.migrationSummary['Potentially Server-Side'] || 0 : 0,
      keepClientSide: gtmSummary && gtmSummary.migrationSummary ? gtmSummary.migrationSummary['Client-Side Only / Keep Client-Side'] || 0 : 0,
      needsReview: gtmSummary && gtmSummary.migrationSummary ? gtmSummary.migrationSummary['Needs Review'] || 0 : 0,
      tagCategoryBreakdown: gtmSummary ? gtmSummary.tagsByCategory || {} : {}
    },
    migrationOpportunities: migrationOpportunities,
    estimatedImpact: calculateMigrationEstimation(pageSpeedResult, gtmTagsResult)
  };

  return finalGtmMigrationResult;
}
function erf_approx(x) {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  const t = 1.0/(1.0 + p*x);
  const y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-x*x);
  return sign * y;
}

function getLogNormalScore(value, median, p10) {
  if (value === 0) return 1;
  const location = Math.log(median);
  const logRatio = Math.log(p10) - location;
  const shape = Math.abs(logRatio / (Math.SQRT2 * -0.9061938));
  const standardizedX = (Math.log(value) - location) / (Math.SQRT2 * shape);
  return 0.5 - 0.5 * erf_approx(standardizedX);
}

function calculateMigrationEstimation(pageSpeedResult, gtmTagsResult) {
  const totalTags = gtmTagsResult.summary?.totalTags || 0;
  const potentiallyServerSide = gtmTagsResult.summary?.migrationSummary?.['Potentially Server-Side'] || 0;
  const migrationCoverage = totalTags > 0 ? Number(((potentiallyServerSide / totalTags) * 100).toFixed(2)) : 0;

  const migratableVendors = new Set();
  if (gtmTagsResult.tags) {
    for (const category in gtmTagsResult.tags) {
      const hasPotentiallyServerSide = gtmTagsResult.tags[category].some(t => t.migrationClassification === 'Potentially Server-Side');
      if (hasPotentiallyServerSide) {
        if (category === 'Google Analytics / GA4') { migratableVendors.add('Analytics'); migratableVendors.add('Google Tag'); }
        if (category === 'Google Ads' || category === 'Floodlight') migratableVendors.add('Google Ads');
        if (category === 'Meta / Facebook') migratableVendors.add('Meta / Facebook');
        if (category === 'Criteo') migratableVendors.add('Criteo');
      }
    }
  }

  let migratableTransferSize = 0;
  let migratableMainThreadTime = 0;
  let migratableBootupTime = 0;
  let migratableTbt = 0;
  let hasLongTaskData = false;

  const thirdPartyInventory = pageSpeedResult.performanceReport?.thirdPartyInventory || [];

  thirdPartyInventory.forEach(item => {
    let isMigratable = false;
    
    if (item.attributionStatus === 'GTM_CORE' || item.attributionStatus === 'GTM_TRIGGERED_THIRD_PARTY') {
      if (migratableVendors.has(item.vendor)) {
        isMigratable = true;
      }
    }

    if (item.evidence) {
      item.evidence.forEach(ev => {
        if (ev.type === 'long-task') {
          hasLongTaskData = true;
          if (isMigratable && ev.durationMs > 50) {
            migratableTbt += (ev.durationMs - 50);
          }
        }
      });
    }

    if (isMigratable) {
      migratableTransferSize += (item.transferSize || 0);
      migratableMainThreadTime += (item.mainThreadTimeMs || 0);
      migratableBootupTime += (item.bootupTimeMs || 0);
    }
  });

  const gtmBaseline = pageSpeedResult.performanceReport?.gtmPerformanceBaseline || {};
  const currentGtmTransferSize = gtmBaseline.gtmTransferSize || 0;
  const currentGtmMainThreadTime = gtmBaseline.gtmMainThreadTimeMs || 0;
  const currentGtmBootupTime = gtmBaseline.gtmBootupTimeMs || 0;
  
  const getMetric = (val) => val !== undefined && val !== null ? val : 'Not available';

  const currentTbtRaw = pageSpeedResult.otherMetrics?.tbt;
  const currentTbt = currentTbtRaw !== undefined && currentTbtRaw !== null ? currentTbtRaw : 'Not available';
  
  const estimatedTransferSize = Math.max(0, currentGtmTransferSize - migratableTransferSize);
  const estimatedMainThreadTime = Math.max(0, currentGtmMainThreadTime - migratableMainThreadTime);
  const estimatedBootupTime = Math.max(0, currentGtmBootupTime - migratableBootupTime);

  let estimatedTbt, tbtAbsChange, tbtPctChange;
  if (currentTbt === 'Not available') {
    estimatedTbt = 'Not directly predictable';
    tbtAbsChange = 'Not directly predictable';
    tbtPctChange = '—';
  } else if (currentTbt === 0) {
    estimatedTbt = 0;
    tbtAbsChange = 0;
    tbtPctChange = 0;
  } else if (!hasLongTaskData) {
    estimatedTbt = 'Not directly predictable';
    tbtAbsChange = 'Not directly predictable';
    tbtPctChange = '—';
  } else {
    estimatedTbt = Math.max(0, currentTbt - migratableTbt);
    tbtAbsChange = currentTbt - estimatedTbt;
    tbtPctChange = Number(((tbtAbsChange / currentTbt) * 100).toFixed(2));
  }

  const currentScoreRaw = pageSpeedResult.performanceScore?.value;
  const currentScore = getMetric(currentScoreRaw);
  
  const speedIndexRaw = pageSpeedResult.otherMetrics?.speedIndex;
  const speedIndex = getMetric(speedIndexRaw);
  
  const lcpRaw = pageSpeedResult.coreWebVitals?.lcp?.value;
  const lcp = getMetric(lcpRaw);
  
  const clsRaw = pageSpeedResult.coreWebVitals?.cls?.value;
  const cls = getMetric(clsRaw);
  
  const inpRaw = pageSpeedResult.coreWebVitals?.inp?.value;
  const inp = getMetric(inpRaw);
  
  const ttfbRaw = pageSpeedResult.otherMetrics?.ttfb;
  const ttfb = getMetric(ttfbRaw);

  const fcpRaw = pageSpeedResult.otherMetrics?.fcp;
  const fcp = getMetric(fcpRaw);

  const migratableImpacts = { LCP: 0, FCP: 0 };
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
            if (ev.type === 'render-blocking' && (am.metric === 'LCP' || am.metric === 'FCP')) {
              // For render-blocking, the savings is usually bound by the max blocked time in the critical path.
              migratableImpacts[am.metric] = Math.max(migratableImpacts[am.metric], ev.wastedMs || 0);
              affectedSet.add(am.metric);
            }
          });
        }
      });
    }
  });

  const getEstimated = (metricName, current) => {
    if (!affectedSet.has(metricName) || current === 'Not available' || current === null || current === 0) {
      return null;
    }
    return Math.max(0, current - migratableImpacts[metricName]);
  };

  let estimatedLcp = getEstimated('LCP', lcp);
  let estimatedInp = null; // Cannot logically subtract sum of GTM long tasks from the max interaction delay.
  let estimatedCls = null; // Trace doesn't provide pixel/score deduction, never subtract ms.
  let estimatedFcp = getEstimated('FCP', fcp);
  let estimatedSpeedIndex = null; // Cannot logically subtract CPU bootup time directly from visual progress integral.
  let estimatedTtfb = null; // GTM migration doesn't speed up initial backend response.

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

  const calcChange = (current, estimated) => {
    if (current === 0 || current === 'Not available') return 0;
    if (estimated === 'Not directly predictable' || estimated === 'Not estimated yet') return '—';
    return Number((((estimated - current) / current) * 100).toFixed(2));
  };
  
  const calcAbsChange = (current, estimated) => {
    if (estimated === 'Not directly predictable' || estimated === 'Not estimated yet') return 'Not directly predictable';
    return Number((estimated - current).toFixed(2));
  };

  let estimatedPerformanceScore = 'Not directly predictable';
  let estimatedScoreImprovement = '—';
  let scoreEstimationStatus = 'Not Estimated';
  let scoreEstimationMethod = 'Lighthouse 13.5.0 weighted scoring model using attributable TBT reduction';

  const mScores = pageSpeedResult.metricScores;
  if (mScores && mScores.fcp !== null && mScores.si !== null && mScores.lcp !== null && mScores.cls !== null && mScores.tbt !== null && typeof currentScore === 'number' && typeof estimatedTbt === 'number') {
    const reconstructed = (mScores.fcp * 0.10) + (mScores.si * 0.10) + (mScores.lcp * 0.25) + (mScores.cls * 0.25) + (mScores.tbt * 0.30);
    const reconstructedRounded = Math.round(reconstructed * 100);
    
    if (Math.abs(reconstructedRounded - currentScore) <= 1) {
      const strategy = pageSpeedResult.performanceReport?.platform || 'mobile';
      const tbtMedian = 600;
      const tbtP10 = strategy === 'desktop' ? 150 : 200;
      
      const newTbtScore = getLogNormalScore(estimatedTbt, tbtMedian, tbtP10);
      const newScoreCalc = (mScores.fcp * 0.10) + (mScores.si * 0.10) + (mScores.lcp * 0.25) + (mScores.cls * 0.25) + (newTbtScore * 0.30);
      
      estimatedPerformanceScore = Math.round(newScoreCalc * 100);
      estimatedScoreImprovement = estimatedPerformanceScore - currentScore;
      scoreEstimationStatus = 'Estimated';
    } else {
      scoreEstimationStatus = 'Failed Validation';
      scoreEstimationMethod = `Mismatch between reconstructed score (${reconstructedRounded}) and actual score (${currentScore})`;
    }
  } else {
    scoreEstimationStatus = 'Missing Inputs';
    scoreEstimationMethod = 'Missing metric scores or TBT estimation';
  }

  return {
    migrationOpportunity: {
      totalTags: totalTags,
      migratableTags: potentiallyServerSide,
      coverage: migrationCoverage
    },
    current: {
        performanceScore: currentScore,
        gtmTransferSize: Number((currentGtmTransferSize / 1024).toFixed(2)),
        gtmMainThreadTime: Number(currentGtmMainThreadTime.toFixed(2)),
        gtmBootupTime: Number(currentGtmBootupTime.toFixed(2)),
        tbt: currentTbt,
        speedIndex: speedIndex,
        lcp: lcp,
        cls: cls,
        inp: inp,
        ttfb: ttfb,
        fcp: pageSpeedResult.otherMetrics?.fcp ? getMetric(pageSpeedResult.otherMetrics.fcp) : 'Not available'
    },
    estimated: {
        performanceScore: estimatedPerformanceScore,
        gtmTransferSize: Number((estimatedTransferSize / 1024).toFixed(2)),
        gtmMainThreadTime: Number(estimatedMainThreadTime.toFixed(2)),
        gtmBootupTime: Number(estimatedBootupTime.toFixed(2)),
        tbt: estimatedTbt,
        speedIndex: estimatedSpeedIndex,
        lcp: estimatedLcp,
        cls: estimatedCls,
        inp: estimatedInp,
        ttfb: estimatedTtfb,
        fcp: estimatedFcp
    },
    change: {
        gtmTransferSize: {
            absolute: calcAbsChange(currentGtmTransferSize / 1024, estimatedTransferSize / 1024),
            percentage: calcChange(currentGtmTransferSize, estimatedTransferSize)
        },
        gtmMainThreadTime: {
            absolute: calcAbsChange(currentGtmMainThreadTime, estimatedMainThreadTime),
            percentage: calcChange(currentGtmMainThreadTime, estimatedMainThreadTime)
        },
        gtmBootupTime: {
            absolute: calcAbsChange(currentGtmBootupTime, estimatedBootupTime),
            percentage: calcChange(currentGtmBootupTime, estimatedBootupTime)
        },
        tbt: {
            absolute: tbtAbsChange,
            percentage: tbtPctChange
        },
        speedIndex: {
            absolute: speedIndexAbsChange,
            percentage: speedIndexPctChange
        },
        inp: {
            absolute: inpAbsChange,
            percentage: inpPctChange
        },
        lcp: {
            absolute: lcpAbsChange,
            percentage: lcpPctChange
        },
        cls: {
            absolute: clsAbsChange,
            percentage: clsPctChange
        },
        fcp: {
            absolute: fcpAbsChange,
            percentage: fcpPctChange
        },
        ttfb: {
            absolute: ttfbAbsChange,
            percentage: ttfbPctChange
        },
        performanceScore: {
            points: estimatedScoreImprovement,
            status: scoreEstimationStatus,
            method: scoreEstimationMethod,
            estimatedValue: estimatedPerformanceScore,
            currentValue: currentScore,
            reconstructedScore: typeof currentScore === 'number' && mScores && mScores.tbt !== null ? Math.round(((mScores.fcp * 0.10) + (mScores.si * 0.10) + (mScores.lcp * 0.25) + (mScores.cls * 0.25) + (mScores.tbt * 0.30)) * 100) : null
        }
    },
    methodology: {
        confidence: "Estimated",
        disclaimer: "Projected performance is a modeled estimate based on current GTM-related browser-side cost and identified server-side migration opportunities. Actual results require post-migration validation. PageSpeed provides total TBT, but if available data does not reliably attribute each blocking-time contribution to individual GTM tags/vendors, TBT improvement cannot be directly estimated from the available data. PageSpeed provides the observed INP value, but the available trace data does not reliably attribute interaction latency to individual GTM vendors or migratable tags. Therefore, a direct post-migration INP value is not estimated. Speed Index represents visual loading progress, but the available PageSpeed trace data does not reliably isolate the portion caused by migratable GTM resources. Therefore, a direct post-migration Speed Index value is not estimated. For LCP, the available Lighthouse data is inspected to identify the LCP element. If the LCP resource is not directly loaded or controlled by a migratable GTM tag, or if the trace cannot reliably measure a specific delay caused by migratable GTM execution during the LCP render phase, a direct post-migration LCP value is not estimated. For CLS, the layout-shifts audit is inspected. If layout shifts exist but are unrelated to GTM, or if there is no reliable attribution linking the shift to migratable GTM tag execution, a direct post-migration CLS value is not estimated. For FCP, the available Lighthouse data does not isolate specific GTM tags as the causal delay for the First Contentful Paint. While GTM executes on the page, temporal overlap does not automatically establish causation. Without measurable, causal delay attribution directly linked to migratable GTM work, a direct post-migration FCP value is not estimated. For TTFB, the metric represents the server response time. Browser-side GTM execution occurs after the page response is received. Since there is no evidence that the proposed GTM migration alters the origin server's backend response, a direct post-migration TTFB value is not estimated. Finally, for the PageSpeed Performance Score: the current score is directly provided by Lighthouse. However, because the required underlying score-driving metrics (FCP, Speed Index, LCP, CLS) cannot be reliably projected with the available data, recalculating the post-migration score would be mathematically unsupported and invalid. Note that a percentage reduction in GTM workload (e.g., Main-Thread time) does not translate directly to an equivalent percentage improvement in Web Vitals or the overall PageSpeed Score. Thus, a post-migration Performance Score is explicitly marked as 'Not directly predictable'."
    }
  };
}

module.exports = { runPageSpeedTest, generateFinalGtmMigrationResult };
