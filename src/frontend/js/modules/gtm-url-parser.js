/**
 * GTM URL Parser & Feedback Helper
 */

export function parseGtmUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return null;
  const str = urlStr.trim();
  
  const accountMatch = str.match(/accounts\/(\d+)/i);
  const containerMatch = str.match(/containers\/(\d+)/i);
  const workspaceMatch = str.match(/workspaces\/(\d+)/i);

  if (!accountMatch && !containerMatch) return null;

  return {
    accountId: accountMatch ? accountMatch[1] : null,
    containerId: containerMatch ? containerMatch[1] : null,
    workspaceId: workspaceMatch ? workspaceMatch[1] : null
  };
}

export function showGtmUrlFeedback(feedbackEl, message, type = 'info') {
  if (!feedbackEl) return;
  feedbackEl.classList.remove('hidden');

  const styles = {
    info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
    error: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
    loading: { bg: '#f8fafc', border: '#e2e8f0', text: '#475569' }
  };

  const s = styles[type] || styles.info;
  feedbackEl.style.backgroundColor = s.bg;
  feedbackEl.style.borderColor = s.border;
  feedbackEl.style.color = s.text;
  feedbackEl.style.border = `1px solid ${s.border}`;
  feedbackEl.textContent = message;
}
