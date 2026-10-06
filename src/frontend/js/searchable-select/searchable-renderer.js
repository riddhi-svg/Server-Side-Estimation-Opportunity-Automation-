/**
 * Searchable Select HTML & Option Item Renderer
 */

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function highlightMatch(text, query) {
  if (!text) return '';
  const escapedText = escapeHtml(text);
  if (!query) return escapedText;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  return escapedText.replace(regex, '<span class="search-highlight">$1</span>');
}

export function renderInitialHtml(placeholder, emptyMessage) {
  return `
    <div class="searchable-select">
      <button type="button" class="searchable-trigger" disabled aria-haspopup="listbox" aria-expanded="false">
        <div class="searchable-trigger-content">
          <span class="searchable-trigger-text">${escapeHtml(placeholder)}</span>
          <span class="searchable-trigger-badge hidden"></span>
        </div>
        <svg class="searchable-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      <div class="searchable-dropdown hidden">
        <div class="searchable-search-wrapper">
          <svg class="searchable-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" class="searchable-input" placeholder="Search by name or ID..." autocomplete="off" spellcheck="false">
          <button type="button" class="searchable-clear-btn hidden" title="Clear search">&times;</button>
        </div>
        <div class="searchable-meta">
          <span class="searchable-count">0 items</span>
        </div>
        <ul class="searchable-options-list" role="listbox" tabindex="-1"></ul>
        <div class="searchable-empty-state hidden">${escapeHtml(emptyMessage)}</div>
      </div>
    </div>
  `;
}

export function renderOptionItemHtml(item, query, isSelected, isActive) {
  const highlightedName = highlightMatch(item.name || item.text, query);
  const highlightedId = item.id ? highlightMatch(String(item.id), query) : '';
  const highlightedPublicId = item.publicId ? highlightMatch(String(item.publicId), query) : '';

  return `
    <li class="searchable-option-item ${isSelected ? 'selected' : ''} ${isActive ? 'active' : ''}" role="option" data-value="${escapeHtml(item.value)}" aria-selected="${isSelected}">
      <div class="searchable-option-main">
        <span class="searchable-option-name">${highlightedName}</span>
        <div class="searchable-option-badges">
          ${item.publicId ? `<span class="searchable-badge badge-public">${highlightedPublicId}</span>` : ''}
          ${item.id ? `<span class="searchable-badge badge-id">ID: ${highlightedId}</span>` : ''}
        </div>
      </div>
      ${isSelected ? `
        <svg class="searchable-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      ` : ''}
    </li>
  `;
}
