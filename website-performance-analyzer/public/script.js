document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('analyze-form');
  const urlInput = document.getElementById('url-input');
  const strategyInput = document.getElementById('strategy-input');
  const submitBtn = document.getElementById('submit-btn');
  const errorMsg = document.getElementById('error-message');
  const loadingDiv = document.getElementById('loading');
  const resultsDiv = document.getElementById('results');
  const urlContainer = document.getElementById('analyzed-url-container');
  const resUrl = document.getElementById('res-url');
  const template = document.getElementById('result-template');

  let currentGtmTagsResult = null;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();
    const strategy = strategyInput.value;

    if (!url) {
      showError('Please enter a website URL.');
      return;
    }

    try {
      new URL(url);
    } catch {
      showError('Please enter a valid website URL (e.g., https://example.com).');
      return;
    }

    const accountId = selectAccount.value;
    const containerId = selectContainer.value;
    const workspaceId = selectWorkspace.value;

    if (!accountId || !containerId || !workspaceId) {
      showError('Please select a GTM Account, Container and Workspace.');
      return;
    }
    
    if (!isAuthenticated) {
      showError('Google authentication is required before generating the report.');
      return;
    }

    // Reset UI state
    hideError();
    resultsDiv.classList.add('hidden');
    urlContainer.classList.add('hidden');
    resultsDiv.innerHTML = '';
    loadingDiv.classList.remove('hidden');
    
    // Disable inputs
    submitBtn.disabled = true;
    submitBtn.textContent = 'Generating Report...';
    urlInput.disabled = true;
    strategyInput.disabled = true;
    selectAccount.disabled = true;
    selectContainer.disabled = true;
    selectWorkspace.disabled = true;

    try {
      if (!currentGtmTagsResult) {
        loadingDiv.querySelector('p').textContent = 'Fetching GTM configuration...';
        const gtmResponse = await fetch(`/api/gtm/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/tags`);
        const gtmData = await gtmResponse.json();

        if (!gtmResponse.ok) {
          throw new Error('We couldn\'t retrieve the GTM configuration. Please try again.');
        }
        currentGtmTagsResult = gtmData;
      }

      loadingDiv.querySelector('p').textContent = 'Analyzing website performance...';
      
      // Create compact GTM payload to prevent 413 Payload Too Large
      let compactGtm = null;
      if (currentGtmTagsResult) {
        compactGtm = {
          summary: currentGtmTagsResult.summary,
          tags: {}
        };
        if (currentGtmTagsResult.tags) {
          for (const cat in currentGtmTagsResult.tags) {
            compactGtm.tags[cat] = currentGtmTagsResult.tags[cat]
              .filter(t => t.migrationClassification === 'Potentially Server-Side')
              .map(t => ({
                name: t.name,
                category: t.category,
                type: t.type,
                migrationClassification: t.migrationClassification
              }));
          }
        }
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url, strategy, gtmTagsResult: compactGtm })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Failed to generate report. Please try again.');
      }

      loadingDiv.querySelector('p').textContent = 'Combining GTM and PageSpeed results...';

      displayResults(data, url);
      
      submitBtn.textContent = 'Report Generated';
      setTimeout(() => {
        resultsDiv.scrollIntoView({ behavior: 'smooth' });
        submitBtn.textContent = 'Generate Report';
      }, 500);

    } catch (err) {
      showError(err.message);
      submitBtn.textContent = 'Generate Report';
    } finally {
      loadingDiv.classList.add('hidden');
      submitBtn.disabled = false;
      urlInput.disabled = false;
      strategyInput.disabled = false;
      selectAccount.disabled = false;
      selectContainer.disabled = false;
      selectWorkspace.disabled = false;
    }
  });

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
  }

  function hideError() {
    errorMsg.classList.add('hidden');
    errorMsg.textContent = '';
  }

  // Formatting helpers
  const formatS = (val) => val !== null ? `${(val / 1000).toFixed(2)} s` : 'N/A';
  const formatMs = (val) => val !== null ? `${Math.round(val).toLocaleString('en-US')} ms` : 'N/A';
  const formatCls = (val) => val !== null ? `${val.toFixed(3)}` : 'N/A';

  function displayResults(data, requestedUrl) {
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
        const formatChange = (absolute, percentage, unit) => {
           if (absolute === '—' || absolute === 'Not directly predictable') return '—';
           if (absolute === null || absolute === undefined) return '—';
           const absVal = Math.abs(absolute);
           const pctVal = percentage !== null && percentage !== '—' ? Math.abs(percentage) : 0;
           if (pctVal === 0) return `${formatNum(absVal)}${unit} reduction`;
           return `${formatNum(absVal)}${unit} reduction (${pctVal}%)`;
        };
        
        const finalResultSection = clone.querySelector('.final-result-section');
        
        const oppBody = finalResultSection.querySelector('.migration-opportunity-body');
        if (oppBody) {
          oppBody.innerHTML = `
            <tr style="border-bottom: 1px solid #bbf7d0;">
              <td style="padding: 0.75rem 1rem;">Total GTM Tags</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">${estimatedImpact.migrationOpportunity.totalTags}</td>
            </tr>
            <tr style="border-bottom: 1px solid #bbf7d0;">
              <td style="padding: 0.75rem 1rem;">Tags That Can Be Migrated to Server-Side</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">${estimatedImpact.migrationOpportunity.migratableTags}</td>
            </tr>
            <tr>
              <td style="padding: 0.75rem 1rem;">Migration Coverage</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">${estimatedImpact.migrationOpportunity.coverage}%</td>
            </tr>
          `;
        }

        const gtmBody = finalResultSection.querySelector('.gtm-workload-body');
        if (gtmBody) {
          gtmBody.innerHTML = `
            <tr style="border-bottom: 1px solid #bbf7d0;">
              <td style="padding: 0.75rem 1rem;">Data Downloaded by Browser</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">${formatNum(estimatedImpact.current.gtmTransferSize)} KB</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">${formatNum(estimatedImpact.estimated.gtmTransferSize)} KB</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">${formatNum(Math.abs(estimatedImpact.change.gtmTransferSize.absolute))} KB</td>
            </tr>
            <tr style="border-bottom: 1px solid #bbf7d0;">
              <td style="padding: 0.75rem 1rem;">Browser Processing Time</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">${formatNum(estimatedImpact.current.gtmMainThreadTime)} ms</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">${formatNum(estimatedImpact.estimated.gtmMainThreadTime)} ms</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">${formatNum(Math.abs(estimatedImpact.change.gtmMainThreadTime.absolute))} ms</td>
            </tr>
            <tr style="border-bottom: 1px solid #bbf7d0;">
              <td style="padding: 0.75rem 1rem;">JavaScript Loading & Setup Time</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">${formatNum(estimatedImpact.current.gtmBootupTime)} ms</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">${formatNum(estimatedImpact.estimated.gtmBootupTime)} ms</td>
              <td style="padding: 0.75rem 1rem; text-align: right;">${formatNum(Math.abs(estimatedImpact.change.gtmBootupTime.absolute))} ms</td>
            </tr>
          `;
        }

        const scoreDisplayContainer = finalResultSection.querySelector('.pagespeed-score-estimation');
        if (scoreDisplayContainer) {
          const perfChange = estimatedImpact.change.performanceScore;
          if (perfChange && perfChange.status === 'Estimated') {
             scoreDisplayContainer.innerHTML = `
               <div style="font-size: 3rem; font-weight: 700; color: #166534; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 1rem;">
                 <span>${perfChange.currentValue}</span>
                 <span style="color: #22c55e;">&rarr;</span>
                 <span>${perfChange.estimatedValue}</span>
               </div>
               <div style="font-size: 1.1rem; font-weight: 600; color: #15803d; background: #dcfce7; display: inline-block; padding: 0.5rem 1.5rem; border-radius: 9999px;">
                 +${perfChange.points} points potential improvement
               </div>
             `;
          } else {
             const statusTxt = perfChange ? perfChange.status : 'Not directly predictable';
             scoreDisplayContainer.innerHTML = `
               <div style="font-size: 1.25rem; font-weight: 600; color: #15803d; margin: 1rem 0;">
                 ${statusTxt}
               </div>
             `;
          }
        }

        const cwvDisplayContainer = finalResultSection.querySelector('.cwv-score-estimation');
        if (cwvDisplayContainer) {
          const vitals = ['LCP', 'INP', 'CLS', 'FCP', 'TBT', 'Speed Index', 'TTFB'];
          const metricsDict = {
            'LCP': { current: estimatedImpact.current.lcp, estimated: estimatedImpact.estimated.lcp, change: estimatedImpact.change.lcp, unit: 'ms' },
            'INP': { current: estimatedImpact.current.inp, estimated: estimatedImpact.estimated.inp, change: estimatedImpact.change.inp, unit: 'ms' },
            'CLS': { current: estimatedImpact.current.cls, estimated: estimatedImpact.estimated.cls, change: estimatedImpact.change.cls, unit: '' },
            'FCP': { current: estimatedImpact.current.fcp, estimated: estimatedImpact.estimated.fcp, change: estimatedImpact.change.fcp, unit: 'ms' },
            'TBT': { current: estimatedImpact.current.tbt, estimated: estimatedImpact.estimated.tbt, change: estimatedImpact.change.tbt, unit: 'ms' },
            'Speed Index': { current: estimatedImpact.current.speedIndex, estimated: estimatedImpact.estimated.speedIndex, change: estimatedImpact.change.speedIndex, unit: 'ms' },
            'TTFB': { current: estimatedImpact.current.ttfb, estimated: estimatedImpact.estimated.ttfb, change: estimatedImpact.change.ttfb, unit: 'ms' }
          };
          
          const affectedMetricNames = new Set((result.performanceReport && result.performanceReport.affectedMetrics) ? result.performanceReport.affectedMetrics.map(am => am.metric === 'SpeedIndex' ? 'Speed Index' : am.metric) : []);

          let rowsHtml = '';
          vitals.forEach(v => {
            const isAffected = affectedMetricNames.has(v);
            if (!isAffected) return;

            const m = metricsDict[v];
            const hasEstimate = m.estimated !== null && m.estimated !== undefined && m.estimated !== 'Not directly predictable' && m.estimated !== 'Not estimated yet';
            
            const estVal = hasEstimate ? `${formatNum(m.estimated)}${m.unit ? ' ' + m.unit : ''}` : '—';
            const changeVal = hasEstimate ? formatChange(m.change.absolute, m.change.percentage, m.unit ? ' ' + m.unit : '') : '—';

            rowsHtml += `
              <tr style="border-bottom: 1px solid #bbf7d0;">
                <td style="padding: 0.75rem 1rem;">${v}</td>
                <td style="padding: 0.75rem 1rem; text-align: right;">${formatNum(m.current)}${m.unit ? ' ' + m.unit : ''}</td>
                <td style="padding: 0.75rem 1rem; text-align: right;">${estVal}</td>
                <td style="padding: 0.75rem 1rem; text-align: right;">${changeVal}</td>
              </tr>
            `;
          });
          
          const cwvContainerElement = finalResultSection.querySelector('.cwv-section-container');
          if (rowsHtml === '') {
            if (cwvContainerElement) cwvContainerElement.style.display = 'none';
          } else {
            cwvDisplayContainer.innerHTML = rowsHtml;
            if (cwvContainerElement) cwvContainerElement.style.display = 'block';
          }
        }

        finalResultSection.classList.remove('hidden');
      }

      resultsDiv.appendChild(clone);
    });

    resultsDiv.classList.remove('hidden');
  }

  // --- New GTM & Auth Flow Logic ---
  const selectAccount = document.getElementById('gtm-account-select');
  const selectContainer = document.getElementById('gtm-container-select');
  const selectWorkspace = document.getElementById('gtm-workspace-select');
  const topAuthLink = document.getElementById('top-auth-link');
  const topAuthStatus = document.getElementById('top-auth-status');
  const gtmAuthMessage = document.getElementById('gtm-auth-message');

  let isAuthenticated = false;

  async function checkAuthAndLoadAccounts() {
    try {
      const response = await fetch('/api/gtm/accounts');
      if (response.status === 401) {
        // Not authenticated
        return;
      }
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load GTM accounts.');
      }

      // Success - user is authenticated
      isAuthenticated = true;
      topAuthLink.classList.add('hidden');
      topAuthStatus.classList.remove('hidden');
      gtmAuthMessage.classList.add('hidden');

      selectAccount.innerHTML = '<option value="">Select Account</option>';
      if (data.account && data.account.length > 0) {
        data.account.forEach(acc => {
          const opt = document.createElement('option');
          opt.value = acc.accountId;
          opt.textContent = acc.name;
          selectAccount.appendChild(opt);
        });
        selectAccount.disabled = false;
      } else {
        selectAccount.innerHTML = '<option value="">No accounts found</option>';
      }
      validateForm();
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  }

  function validateForm() {
    const isUrlFilled = urlInput.value.trim().length > 0;
    const isGtmConfigured = selectAccount.value && selectContainer.value && selectWorkspace.value;
    
    submitBtn.disabled = !(isAuthenticated && isUrlFilled && isGtmConfigured);
  }

  urlInput.addEventListener('input', validateForm);

  selectAccount.addEventListener('change', async (e) => {
    const accountId = e.target.value;
    currentGtmTagsResult = null;
    selectContainer.innerHTML = '<option value="">Select Container</option>';
    selectContainer.disabled = true;
    selectWorkspace.innerHTML = '<option value="">Select Workspace</option>';
    selectWorkspace.disabled = true;
    validateForm();

    if (!accountId) return;

    selectContainer.innerHTML = '<option value="">Loading containers...</option>';
    
    try {
      const response = await fetch(`/api/gtm/accounts/${accountId}/containers`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load GTM containers.');
      }

      selectContainer.innerHTML = '<option value="">Select Container</option>';
      if (data.container && data.container.length > 0) {
        data.container.forEach(cont => {
          const opt = document.createElement('option');
          opt.value = cont.containerId;
          opt.textContent = cont.name;
          selectContainer.appendChild(opt);
        });
        selectContainer.disabled = false;
      } else {
        selectContainer.innerHTML = '<option value="">No containers found</option>';
      }
    } catch (error) {
      selectContainer.innerHTML = '<option value="">Select Container</option>';
      showError(error.message);
    }
  });

  selectContainer.addEventListener('change', async (e) => {
    const accountId = selectAccount.value;
    const containerId = e.target.value;
    currentGtmTagsResult = null;
    selectWorkspace.innerHTML = '<option value="">Select Workspace</option>';
    selectWorkspace.disabled = true;
    validateForm();

    if (!containerId) return;

    selectWorkspace.innerHTML = '<option value="">Loading workspaces...</option>';

    try {
      const response = await fetch(`/api/gtm/accounts/${accountId}/containers/${containerId}/workspaces`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load GTM workspaces.');
      }

      selectWorkspace.innerHTML = '<option value="">Select Workspace</option>';
      if (data.workspace && data.workspace.length > 0) {
        data.workspace.forEach(ws => {
          const opt = document.createElement('option');
          opt.value = ws.workspaceId;
          opt.textContent = ws.name;
          selectWorkspace.appendChild(opt);
        });
        selectWorkspace.disabled = false;
      } else {
        selectWorkspace.innerHTML = '<option value="">No workspaces found</option>';
      }
    } catch (error) {
      selectWorkspace.innerHTML = '<option value="">Select Workspace</option>';
      showError(error.message);
    }
  });

  selectWorkspace.addEventListener('change', () => {
    currentGtmTagsResult = null;
    validateForm();
  });

  // Call on load
  checkAuthAndLoadAccounts();

  function setStatusBadge(el, status) {
    if (!el) return;
    if (!status) {
      el.style.display = 'none';
      return;
    }
    el.style.display = 'inline-block';
    el.textContent = status;
    el.className = 'status-badge'; // reset
    if (status === 'Good') el.classList.add('status-Good');
    if (status === 'Needs Improvement') el.classList.add('status-Needs');
    if (status === 'Poor') el.classList.add('status-Poor');
  }
});
